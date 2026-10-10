// Red Flag Homes: Bella checkout return. GET /api/bella/receipt confirms a Stripe or Razorpay payment with the
// gateway's own API (secret keys never reach the browser), returns the bill, and on a successful payment
// creates (or links) the buyer's Red Flag account, records the payment for the admin panel, and emails the
// payment confirmation with the Bella setup guide (once per payment).
// Paste as-is into the Express server, after firebase-admin is initialized and after the RF pages block.
const RF_BELLA_PRICES = { INR: { monthly: { solo: 999, growth: 1699, pro: 2499 }, yearly: { solo: 10190, growth: 17330, pro: 25490 } }, USD: { monthly: { solo: 23, growth: 39, pro: 57 }, yearly: { solo: 235, growth: 398, pro: 581 } } };
function rfBellaPlan(amount, currency) {
  const table = RF_BELLA_PRICES[currency] || {};
  for (const period of ['monthly', 'yearly']) for (const plan of ['solo', 'growth', 'pro']) if (table[period] && Math.round(table[period][plan] * 100) === Math.round(Number(amount) * 100)) return { plan, period };
  return { plan: '', period: '' };
}
const rfBellaHits = new Map();
function rfBellaLimited(ip) {
  const now = Date.now(); const list = (rfBellaHits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now); rfBellaHits.set(ip, list);
  return list.length > 40;
}
async function rfBellaStripe(path) {
  const r = await fetch('https://api.stripe.com/v1/' + path, { headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY } });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || 'Stripe ' + r.status);
  return j;
}
async function rfBellaRazorpay(path) {
  const auth = Buffer.from(process.env.RAZORPAY_KEY_ID + ':' + process.env.RAZORPAY_KEY_SECRET).toString('base64');
  const r = await fetch('https://api.razorpay.com/v1/' + path, { headers: { Authorization: 'Basic ' + auth } });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.description) || 'Razorpay ' + r.status);
  return j;
}
let rfBellaDbCache = null;
async function rfBellaDb() {
  if (rfBellaDbCache) return rfBellaDbCache;
  const cfg = await (await fetch('https://redflaghomes.in/firebase-applet-config.json')).json();
  const { getFirestore } = await import('firebase-admin/firestore');
  const { getApp } = await import('firebase-admin/app');
  rfBellaDbCache = getFirestore(getApp(), cfg.firestoreDatabaseId || '(default)');
  return rfBellaDbCache;
}
async function rfBellaAccount(rec) {
  // Create or find the Red Flag account for this email, and save the purchase. Never fails the receipt.
  try {
    const { getAuth } = await import('firebase-admin/auth');
    const auth = getAuth();
    const db = await rfBellaDb();
    let user; let created = false;
    try { user = await auth.getUserByEmail(rec.email); }
    catch (e) {
      if (e && e.code === 'auth/user-not-found') { user = await auth.createUser({ email: rec.email, displayName: rec.name || undefined }); created = true; }
      else throw e;
    }
    const now = new Date().toISOString();
    const profile = { uid: user.uid, email: rec.email, displayName: user.displayName || rec.name || rec.email.split('@')[0], bellaCustomer: true, bellaPlan: rec.plan, bellaPeriod: rec.period, bellaSince: now };
    if (created) { profile.createdAt = now; profile.source = 'bella-checkout'; profile.photoURL = ''; }
    await db.collection('users').doc(user.uid).set(profile, { merge: true });
    const id = (rec.gateway === 'stripe' ? 'stripe_' : 'rzp_') + rec.paymentId;
    await db.collection('bellaPayments').doc(id).set({ gateway: rec.gateway, status: 'paid', amount: rec.amount, currency: rec.currency, email: rec.email, phone: rec.phone || '', name: rec.name || '', plan: rec.plan, period: rec.period, reason: '', paymentId: rec.paymentId, txnId: rec.txnId, receiptNo: rec.receiptNo, accountUid: user.uid, event: 'checkout.return', createdAt: rec.paidAt, receivedAt: now }, { merge: true });
    rfBellaSendSetupEmail({ id, email: rec.email, name: rec.name, plan: rec.plan, period: rec.period, amount: rec.amount, currency: rec.currency, paymentId: rec.paymentId, txnId: rec.txnId, receiptNo: rec.receiptNo, paidAt: rec.paidAt }).catch(() => {});
    return { email: rec.email, created };
  } catch (err) {
    console.error('[bella-receipt] account step failed:', err && err.message);
    return { email: rec.email, created: false, error: true };
  }
}
// ---- Payment confirmation email with the Bella setup guide ----
// Sent once per payment (the bellaPayments document remembers it), from the return page and from the webhooks,
// whichever comes first. Uses the Hostinger mailbox in the SMTP_USER / SMTP_PASS secrets.
const RF_BELLA_PLAN_NAMES = { solo: 'Solo', growth: 'Growth', pro: 'Pro' };
const RF_BELLA_IMG = 'https://cdn.jsdelivr.net/gh/priyanshu777-hue/red-flag-daily-use@87bfd22d27321db2eb471e9599e801e6721cf07b/bella-assets/';
function rfBellaEsc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function rfBellaMoney(a, c) { return (c === 'USD' ? '$' : '₹') + Number(a || 0).toLocaleString(c === 'USD' ? 'en-US' : 'en-IN', { minimumFractionDigits: c === 'USD' ? 2 : 0, maximumFractionDigits: 2 }); }
function rfBellaSetupEmailHtml(p) {
  const e = rfBellaEsc, first = String(p.name || '').trim().split(/\s+/)[0];
  const plan = p.plan ? 'Bella ' + (RF_BELLA_PLAN_NAMES[p.plan] || '') + ' · ' + (p.period === 'yearly' ? 'Yearly' : 'Monthly') : 'Bella by Red Flag Homes';
  const row = (k, v) => '<tr><td style="padding:6px 0;color:#6B635A;font-size:14px;width:140px;vertical-align:top">' + k + '</td><td style="padding:6px 0;font-size:14px;color:#141217;word-break:break-all">' + v + '</td></tr>';
  const step = (n, color, title, text) => '<tr><td style="padding:0 0 16px;vertical-align:top;width:44px"><div style="width:32px;height:32px;border-radius:16px;background:' + color + ';color:#ffffff;font:700 15px/32px Arial,sans-serif;text-align:center">' + n + '</div></td><td style="padding:2px 0 16px;vertical-align:top"><div style="font:700 16px/1.3 Arial,sans-serif;color:#141217">' + title + '</div><div style="font:400 14px/1.5 Arial,sans-serif;color:#6B635A;margin-top:3px">' + text + '</div></td></tr>';
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome to Bella</title></head>'
    + '<body style="margin:0;padding:0;background:#F6F1EC"><div style="display:none;max-height:0;overflow:hidden">Payment confirmed. Add Bella as your co-host in 5 simple steps.</div>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F1EC"><tr><td align="center" style="padding:24px 12px">'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;font-family:Arial,Helvetica,sans-serif">'
    + '<tr><td style="padding:28px 28px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:middle"><div style="font:700 26px/1 Arial,sans-serif;color:#0B0A0C;letter-spacing:-1px">Bella<span style="color:#C8102E">.</span></div><div style="font:400 13px Arial,sans-serif;color:#6B635A;margin-top:4px">by Red Flag Homes</div></td>'
    + '<td align="right" style="vertical-align:middle"><img src="' + RF_BELLA_IMG + 'bella-face-email.jpg" width="72" height="72" alt="Bella" style="display:block;border-radius:36px;border:3px solid #F6F1EC"></td></tr></table></td></tr>'
    + '<tr><td style="padding:12px 28px 4px"><div style="display:inline-block;padding:5px 12px;border-radius:999px;background:#E3F2EA;color:#1D6B41;font:700 13px Arial,sans-serif">✓ Payment successful</div>'
    + '<h1 style="margin:14px 0 8px;font:700 28px/1.15 Arial,sans-serif;color:#0B0A0C;letter-spacing:-.5px">Welcome to Bella' + (first ? ', ' + e(first) : '') + '.</h1>'
    + '<p style="margin:0;font:400 15px/1.55 Arial,sans-serif;color:#6B635A">Thank you for your payment. Your receipt is below. To start, add Bella as a co-host on your bnb listing using the setup guide. It takes about 60 seconds.</p></td></tr>'
    + '<tr><td style="padding:18px 28px 6px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EEE6DF;border-radius:14px"><tr><td style="padding:14px 18px">'
    + '<div style="font:700 12px Arial,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#6B635A;margin-bottom:6px">Payment confirmation</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
    + row('Plan', e(plan)) + row('Amount paid', '<b>' + e(rfBellaMoney(p.amount, p.currency)) + '</b>') + row('Transaction ID', e(p.txnId || p.paymentId)) + (p.receiptNo ? row('Invoice no.', e(p.receiptNo)) : '') + row('Date', e(new Date(p.paidAt || Date.now()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })))
    + '</table></td></tr></table></td></tr>'
    + '<tr><td style="padding:22px 28px 6px"><div style="font:700 24px/1.2 Arial,sans-serif;color:#0B0A0C">Setup <span style="color:#E8335B">guide</span></div><div style="font:400 14px/1.5 Arial,sans-serif;color:#6B635A;margin:4px 0 16px">Add Bella as a co-host to your bnb listing in 5 simple steps.</div>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
    + step(1, '#E8335B', 'Copy Bella’s email', 'Use this email to add Bella as your co-host:<br><span style="display:inline-block;margin-top:6px;padding:8px 12px;border-radius:10px;background:#F4F1EF;font:700 15px Arial,sans-serif;color:#141217">bella@redflaghomes.in</span>')
    + step(2, '#8B4FE0', 'Open your listing', 'Go to your bnb host dashboard, open <b>Listings</b>, choose the listing you want Bella to manage and click <b>Co-hosts</b>.')
    + step(3, '#E5A53A', 'Add Bella', 'Click <b>Add co-host</b> (or <b>Invite a co-host</b>) and paste <b>bella@redflaghomes.in</b>.')
    + step(4, '#3E9B5B', 'Give full permission', 'Choose <b>full access</b>, so Bella can manage the listing, reply to guests, manage reservations, calendar and pricing, and handle cancellations and support.')
    + step(5, '#8B4FE0', 'Save', 'Click <b>Save</b> or <b>Send invite</b>. We accept the invite and Bella goes live, usually within a few hours.')
    + '</table></td></tr>'
    + '<tr><td style="padding:4px 28px 8px"><img src="' + RF_BELLA_IMG + 'setup-guide-email.jpg" width="544" alt="Bella setup guide: 1 copy bella@redflaghomes.in, 2 open your listing and click Co-hosts, 3 add co-host, 4 give full access, 5 save" style="display:block;width:100%;max-width:544px;height:auto;border-radius:16px;border:1px solid #EEE6DF"></td></tr>'
    + '<tr><td align="center" style="padding:18px 28px 8px"><a href="https://redflaghomes.in/bella/setup" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#C8102E;color:#ffffff;font:700 15px Arial,sans-serif;text-decoration:none">Open the setup guide</a></td></tr>'
    + '<tr><td style="padding:16px 28px 28px;font:400 13px/1.6 Arial,sans-serif;color:#6B635A">Have more than one listing? Repeat steps 2 to 5 for each listing your plan covers.<br>Need help? WhatsApp <a href="https://wa.me/918881306632" style="color:#141217">+91 88813 06632</a> or email <a href="mailto:hello@redflaghomes.in" style="color:#141217">hello@redflaghomes.in</a>, quoting your transaction ID.<br><br>Red Flag World Holdings Ltd. · <a href="https://redflaghomes.in/terms" style="color:#6B635A">Terms</a> · <a href="https://redflaghomes.in/privacy" style="color:#6B635A">Privacy</a> · <a href="https://redflaghomes.in/cancellation" style="color:#6B635A">Cancellation</a></td></tr>'
    + '</table></td></tr></table></body></html>';
}
function rfBellaSetupEmailText(p) {
  return 'Welcome to Bella' + (p.name ? ', ' + String(p.name).trim().split(/\s+/)[0] : '') + '.\n\n'
    + 'Payment confirmed: ' + rfBellaMoney(p.amount, p.currency) + '\nTransaction ID: ' + (p.txnId || p.paymentId) + (p.receiptNo ? '\nInvoice no.: ' + p.receiptNo : '') + '\n\n'
    + 'SETUP GUIDE: add Bella as a co-host to your bnb listing\n'
    + '1. Copy Bella\'s email: bella@redflaghomes.in\n2. Open your listing: bnb host dashboard > Listings > your listing > Co-hosts\n3. Add Bella: click Add co-host and paste bella@redflaghomes.in\n4. Give full permission: choose full access\n5. Save: click Save or Send invite. We accept the invite and Bella goes live, usually within a few hours.\n\n'
    + 'Full guide: https://redflaghomes.in/bella/setup\nHelp: WhatsApp +91 88813 06632 or hello@redflaghomes.in\n';
}
async function rfBellaSendSetupEmail(p) {
  // p: { id (bellaPayments document id, e.g. rzp_pay_… or stripe_cs_…), email, name, plan, period, amount, currency, paymentId, txnId, receiptNo, paidAt }
  if (!p || !p.id || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(p.email || ''))) return false;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) { console.warn('[bella-email] SMTP_USER / SMTP_PASS not set; setup email not sent.'); return false; }
  const db = await rfBellaDb();
  const ref = db.collection('bellaPayments').doc(p.id);
  const claimed = await db.runTransaction(async (t) => {
    const d = await t.get(ref); const x = d.exists ? d.data() : {};
    if (x.setupEmailSentAt) return false;
    if (x.setupEmailClaimAt && Date.now() - Date.parse(x.setupEmailClaimAt) < 10 * 60 * 1000) return false;
    t.set(ref, { setupEmailClaimAt: new Date().toISOString() }, { merge: true });
    return true;
  });
  if (!claimed) return false;
  if (!p.receiptNo && p.paymentId) p.receiptNo = 'RF-BELLA-' + new Date(p.paidAt || Date.now()).toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(p.paymentId).replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase();
  try {
    const nodemailer = (await import('nodemailer')).default;
    const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.hostinger.com', port: Number(process.env.SMTP_PORT || 465), secure: Number(process.env.SMTP_PORT || 465) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    await transport.sendMail({
      from: { name: 'Bella by Red Flag Homes', address: process.env.SMTP_USER },
      replyTo: 'hello@redflaghomes.in',
      to: p.email,
      subject: 'Payment confirmed: your Bella setup guide' + (p.receiptNo ? ' (' + p.receiptNo + ')' : ''),
      text: rfBellaSetupEmailText(p),
      html: rfBellaSetupEmailHtml(p),
    });
    await ref.set({ setupEmailSentAt: new Date().toISOString(), setupEmailTo: p.email, setupEmailError: '' }, { merge: true });
    console.log('[bella-email] setup guide sent for', p.id);
    return true;
  } catch (err) {
    console.error('[bella-email] send failed:', err && err.message);
    await ref.set({ setupEmailClaimAt: '', setupEmailError: String((err && err.message) || 'send failed').slice(0, 200) }, { merge: true }).catch(() => {});
    return false;
  }
}
app.get('/api/bella/receipt', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (rfBellaLimited(req.ip)) return res.status(429).json({ ok: false, error: 'Too many requests. Please try again in a few minutes.' });
  try {
    const gw = String(req.query.gw || '');
    let rec; let lookup = false;
    if (gw === 'stripe') {
      const id = String(req.query.session_id || '');
      if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return res.status(400).json({ ok: false, error: 'Missing payment reference' });
      const s = await rfBellaStripe('checkout/sessions/' + encodeURIComponent(id) + '?expand[]=payment_intent&expand[]=invoice');
      const pi = s.payment_intent && typeof s.payment_intent === 'object' ? s.payment_intent : null;
      const inv = s.invoice && typeof s.invoice === 'object' ? s.invoice : null;
      const isPaid = s.payment_status === 'paid' || s.payment_status === 'no_payment_required';
      const d = s.customer_details || {};
      rec = { gateway: 'stripe', status: isPaid ? 'paid' : (s.status === 'expired' ? 'failed' : 'pending'),
        paymentId: s.id, txnId: (pi && (typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.id)) || (inv && (inv.charge || inv.payment_intent || inv.number)) || s.id,
        amount: (s.amount_total || 0) / 100, currency: String(s.currency || 'usd').toUpperCase(), email: d.email || s.customer_email || '', name: d.name || '', phone: d.phone || '',
        method: 'Card', paidAt: new Date((s.created || Date.now() / 1000) * 1000).toISOString(), reason: isPaid ? '' : ((pi && pi.last_payment_error && pi.last_payment_error.message) || (s.status === 'expired' ? 'Checkout expired' : '')) };
    } else if (gw === 'razorpay') {
      let p = null; const pid = String(req.query.razorpay_payment_id || '');
      if (/^pay_[A-Za-z0-9]+$/.test(pid)) p = await rfBellaRazorpay('payments/' + pid);
      else {
        // No payment ID in the return link: find this buyer's newest payment from the last 3 hours.
        const email = String(req.query.email || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, error: 'Missing payment reference' });
        const list = await rfBellaRazorpay('payments?count=100&from=' + Math.floor(Date.now() / 1000 - 3 * 3600));
        p = (list.items || []).filter((x) => String(x.email || '').toLowerCase() === email).sort((a, b) => b.created_at - a.created_at)[0] || null;
        lookup = true;
        if (!p) return res.json({ ok: true, status: 'pending' });
      }
      const a = p.acquirer_data || {};
      rec = { gateway: 'razorpay', status: p.status === 'captured' ? 'paid' : (p.status === 'failed' ? 'failed' : 'pending'),
        paymentId: p.id, txnId: a.rrn || a.upi_transaction_id || a.bank_transaction_id || a.auth_code || p.id,
        amount: (p.amount || 0) / 100, currency: p.currency || 'INR', email: p.email || '', name: (p.notes && (p.notes.name || p.notes.full_name)) || '', phone: lookup ? '' : (p.contact || ''),
        method: p.method ? String(p.method).toUpperCase() : '', paidAt: new Date((p.created_at || Date.now() / 1000) * 1000).toISOString(), reason: p.error_description || '' };
    } else {
      return res.status(400).json({ ok: false, error: 'Missing payment reference' });
    }
    Object.assign(rec, rfBellaPlan(rec.amount, rec.currency));
    rec.receiptNo = 'RF-BELLA-' + rec.paidAt.slice(0, 10).replace(/-/g, '') + '-' + String(rec.paymentId).replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase();
    if (rec.status === 'paid' && rec.email) rec.account = await rfBellaAccount(rec);
    return res.json({ ok: true, ...rec });
  } catch (err) {
    console.error('[bella-receipt]', err && err.message);
    return res.status(502).json({ ok: false, error: 'Could not confirm the payment right now.' });
  }
});
