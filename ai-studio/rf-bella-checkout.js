// Red Flag Homes: Bella checkout return. GET /api/bella/receipt confirms a Stripe or Razorpay payment with the
// gateway's own API (secret keys never reach the browser), returns the bill, and on a successful payment
// creates (or links) the buyer's Red Flag account and records the payment for the admin panel.
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
async function rfBellaAccount(rec) {
  // Create or find the Red Flag account for this email, and save the purchase. Never fails the receipt.
  try {
    const cfg = await (await fetch('https://redflaghomes.in/firebase-applet-config.json')).json();
    const { getAuth } = await import('firebase-admin/auth');
    const { getFirestore } = await import('firebase-admin/firestore');
    const { getApp } = await import('firebase-admin/app');
    const auth = getAuth();
    const db = getFirestore(getApp(), cfg.firestoreDatabaseId || '(default)');
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
    return { email: rec.email, created };
  } catch (err) {
    console.error('[bella-receipt] account step failed:', err && err.message);
    return { email: rec.email, created: false, error: true };
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
    rec.receiptNo = 'RF-BELLA-' + rec.paidAt.slice(0, 10).replace(/-/g, '') + '-' + String(rec.paymentId).slice(-6).toUpperCase();
    if (rec.status === 'paid' && rec.email) rec.account = await rfBellaAccount(rec);
    return res.json({ ok: true, ...rec });
  } catch (err) {
    console.error('[bella-receipt]', err && err.message);
    return res.status(502).json({ ok: false, error: 'Could not confirm the payment right now.' });
  }
});
