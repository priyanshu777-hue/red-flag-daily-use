Update the Bella checkout so buyers come back to our site after paying. Make exactly the changes below and NOTHING else. Don't change any page, component, style or file not named here.

## 1. Replace the Red Flag pages block
In the Express server file, find the block that starts with `// Red Flag Homes: serve the Bella, Admin and Journal pages` (the one with `RF_VERSION`, `RF_PAGES` and `rfCache`). Replace that whole block, up to and including its last `app.use(...)` handler, with this new version, exactly as written:

```js
// Red Flag Homes: serve the Bella, Admin and Journal pages byte for byte from GitHub (via the jsDelivr CDN),
// and give the Journal real SEO: each story's title, description, social preview image and full text are in the
// HTML Google receives, plus /sitemap.xml and /robots.txt.
// Paste as-is into the Express server, right after `const app = express()` and BEFORE express.static and the
// single-page-app catch-all. Do not edit; to update the pages, only change RF_VERSION.
const RF_VERSION = '290fe9d7427c34f904aa14f803f8af72c6188b07';
const RF_CDN = 'https://cdn.jsdelivr.net/gh/priyanshu777-hue/red-flag-daily-use@' + RF_VERSION + '/';
const RF_SITE = 'https://redflaghomes.in';
const RF_PAGES = [
  { match: (p) => p === '/bella/thank-you' || p === '/bella/thank-you/', file: 'bella-thanks.html', type: 'text/html; charset=utf-8' },
  { match: (p) => p === '/bella' || p === '/bella/' || p === '/bella/index.html', file: 'bella-redflaghomes.html', type: 'text/html; charset=utf-8' },
  { match: (p) => p === '/admin' || p === '/admin/' || p === '/admin/index.html', file: 'admin.html', type: 'text/html; charset=utf-8' },
  { match: (p) => p === '/journal.js', file: 'journal/journal.js', type: 'application/javascript; charset=utf-8' },
  { match: (p) => p === '/journal' || p.startsWith('/journal/'), file: 'journal/index.html', type: 'text/html; charset=utf-8', journal: true },
];
const rfCache = new Map();
async function rfFile(file) {
  const hit = rfCache.get(file);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.body;
  try {
    const r = await fetch(RF_CDN + file);
    if (!r.ok) throw new Error('CDN ' + r.status);
    const body = await r.text();
    rfCache.set(file, { at: Date.now(), body });
    return body;
  } catch (err) {
    if (hit) return hit.body;
    throw err;
  }
}

// ---- Published Journal stories (read with the site's public Firebase config; only status "published") ----
let rfFirebase = null;
let rfPostCache = { at: 0, list: null };
function rfVal(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return v.timestampValue;
  return null;
}
async function rfPosts() {
  if (rfPostCache.list && Date.now() - rfPostCache.at < 3 * 60 * 1000) return rfPostCache.list;
  try {
    if (!rfFirebase) rfFirebase = await (await fetch(RF_SITE + '/firebase-applet-config.json')).json();
    const c = rfFirebase;
    const url = 'https://firestore.googleapis.com/v1/projects/' + c.projectId + '/databases/' + encodeURIComponent(c.firestoreDatabaseId || '(default)') + '/documents:runQuery?key=' + encodeURIComponent(c.apiKey);
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'posts' }], where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'published' } } }, limit: 500 } }) });
    if (!r.ok) throw new Error('posts ' + r.status);
    const rows = await r.json();
    const list = rows.filter((x) => x.document).map((x) => {
      const o = {}; const f = x.document.fields || {};
      Object.keys(f).forEach((k) => { o[k] = rfVal(f[k]); });
      return o;
    }).filter((p) => p.slug).sort((a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0));
    rfPostCache = { at: Date.now(), list };
    return list;
  } catch (err) {
    return rfPostCache.list || [];
  }
}

// ---- HTML helpers (same safe Markdown as the Journal page: everything escaped first) ----
const rfEsc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const rfDate = (v) => { const t = Date.parse(v); return t ? new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : ''; };
const rfMins = (s) => (s && s >= 60 ? Math.ceil(s / 60) + ' min read' : 'Less than 1 min read');
function rfMd(src) {
  const lines = rfEsc(src || '').replace(/\r/g, '').split('\n'); const out = []; let para = []; let list = null; let quote = []; let code = null;
  const inline = (t) => t.replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/|#|mailto:)[^\s)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>').replace(/(^|\W)_([^_]+)_(?=\W|$)/g, '$1<em>$2</em>');
  const flush = () => {
    if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; }
    if (list) { out.push('<' + list.t + '>' + list.items.map((i) => '<li>' + inline(i) + '</li>').join('') + '</' + list.t + '>'); list = null; }
    if (quote.length) { out.push('<blockquote>' + inline(quote.join(' ')) + '</blockquote>'); quote = []; }
  };
  lines.forEach((l) => {
    if (code !== null) { if (/^```/.test(l)) { out.push('<pre><code>' + code.join('\n') + '</code></pre>'); code = null; } else code.push(l); return; }
    let m;
    if (/^```/.test(l)) { flush(); code = []; }
    else if ((m = l.match(/^(#{1,3})\s+(.*)$/))) { flush(); const lv = m[1].length === 3 ? 3 : 2; out.push('<h' + lv + '>' + inline(m[2]) + '</h' + lv + '>'); }
    else if (/^(-{3,}|\*{3,})$/.test(l.trim())) { flush(); out.push('<hr>'); }
    else if ((m = l.match(/^!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^\s)]+)\)$/))) { flush(); out.push('<figure><img src="' + m[2] + '" alt="' + m[1] + '" loading="lazy">' + (m[1] ? '<figcaption>' + m[1] + '</figcaption>' : '') + '</figure>'); }
    else if ((m = l.match(/^&gt;\s?(.*)$/))) { if (para.length || list) flush(); quote.push(m[1]); }
    else if ((m = l.match(/^\s*[-*]\s+(.*)$/))) { if (para.length || quote.length || (list && list.t !== 'ul')) flush(); list = list || { t: 'ul', items: [] }; list.items.push(m[1]); }
    else if ((m = l.match(/^\s*\d+[.)]\s+(.*)$/))) { if (para.length || quote.length || (list && list.t !== 'ol')) flush(); list = list || { t: 'ol', items: [] }; list.items.push(m[1]); }
    else if (!l.trim()) flush();
    else { if (list || quote.length) flush(); para.push(l.trim()); }
  });
  if (code !== null) out.push('<pre><code>' + code.join('\n') + '</code></pre>');
  flush();
  return out.join('\n');
}
function rfCard(p) {
  return '<a class="card" href="/journal/' + encodeURIComponent(p.slug) + '">' +
    (p.cover ? '<div class="cv"><img src="' + rfEsc(p.cover) + '" alt="" loading="lazy"></div>' : '') +
    '<div class="ct"><div class="meta">' + (p.tag ? '<span class="tag">' + rfEsc(p.tag) + '</span><span>•</span>' : '') + '<span>' + rfMins(p.readSeconds) + '</span></div>' +
    '<h2>' + rfEsc(p.title) + '</h2><p>' + rfEsc(p.excerpt) + '</p></div>' +
    '<div class="ft"><span>By<b>' + rfEsc(p.author || 'Red Flag Homes') + '</b></span><span style="text-align:right">Published<b>' + rfDate(p.publishedAt) + '</b></span></div></a>';
}
// Swap the Journal page's generic <head> tags for page-specific ones, and pre-fill <main> with the real text.
function rfSeo(html, meta, mainHtml, kind) {
  const set = (re, tag) => (re.test(html) ? (html = html.replace(re, tag)) : (html = html.replace('</head>', tag + '\n</head>')));
  set(/<title>[^<]*<\/title>/, '<title>' + rfEsc(meta.title) + '</title>');
  set(/<meta name="description"[^>]*>/, '<meta name="description" content="' + rfEsc(meta.description) + '">');
  set(/<meta property="og:title"[^>]*>/, '<meta property="og:title" content="' + rfEsc(meta.title) + '">');
  set(/<meta property="og:description"[^>]*>/, '<meta property="og:description" content="' + rfEsc(meta.description) + '">');
  set(/<meta property="og:type"[^>]*>/, '<meta property="og:type" content="' + meta.type + '">');
  const extra = ['<link rel="canonical" href="' + rfEsc(meta.url) + '">', '<meta property="og:url" content="' + rfEsc(meta.url) + '">',
    '<meta property="og:site_name" content="Red Flag Homes Network">', '<meta name="twitter:card" content="' + (meta.image ? 'summary_large_image' : 'summary') + '">',
    '<meta name="twitter:title" content="' + rfEsc(meta.title) + '">', '<meta name="twitter:description" content="' + rfEsc(meta.description) + '">']
    .concat(meta.image ? ['<meta property="og:image" content="' + rfEsc(meta.image) + '">', '<meta name="twitter:image" content="' + rfEsc(meta.image) + '">'] : [])
    .concat(meta.robots ? ['<meta name="robots" content="' + meta.robots + '">'] : [])
    .concat(meta.ld ? ['<script type="application/ld+json">' + JSON.stringify(meta.ld).replace(/</g, '\\u003c') + '</script>'] : []);
  html = html.replace('</head>', extra.join('\n') + '\n</head>');
  return html.replace(/<main id="main">[\s\S]*?<\/main>/, '<main id="main" data-ssr="' + kind + '">' + mainHtml + '</main>');
}
async function rfJournal(path, html) {
  const posts = await rfPosts();
  const m = path.match(/^\/journal\/([^\/?#]+)/);
  const slug = m && m[1] !== 'index.html' ? decodeURIComponent(m[1]) : '';
  if (!slug) {
    return { status: 200, html: rfSeo(html, { title: 'Journal · Red Flag Homes Network', description: 'Stories on design, hosting, AI-run operations and investing from Red Flag Homes Network.', url: RF_SITE + '/journal/', type: 'website',
      ld: { '@context': 'https://schema.org', '@type': 'Blog', name: 'Red Flag Homes Journal', url: RF_SITE + '/journal/', blogPost: posts.slice(0, 20).map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: RF_SITE + '/journal/' + encodeURIComponent(p.slug), datePublished: p.publishedAt })) } },
      '<section class="wrap"><div class="head"><h1>Journal</h1><p>Design, hosting, AI-run operations and the numbers behind them, from the Red Flag team.</p></div><div class="grid">' +
      (posts.length ? posts.map(rfCard).join('') : '<p class="empty" style="grid-column:1/-1">No stories yet. Check back soon.</p>') + '</div></section>', 'list') };
  }
  const p = posts.find((x) => x.slug === slug);
  if (!p) return { status: 404, html: rfSeo(html, { title: 'Story not found · Red Flag Homes', description: 'This story may have been moved or unpublished.', url: RF_SITE + '/journal/', type: 'website', robots: 'noindex' }, '<section class="story"><a class="back" href="/journal/">← All stories</a><h1>Story not found</h1><p class="lede">It may have been moved or unpublished.</p></section>', 'missing') };
  const url = RF_SITE + '/journal/' + encodeURIComponent(p.slug);
  const desc = p.seoDescription || p.excerpt || '';
  return { status: 200, html: rfSeo(html, { title: p.seoTitle || (p.title + ' · Red Flag Homes'), description: desc, url, image: p.cover, type: 'article',
    ld: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: desc, image: p.cover || undefined, url, mainEntityOfPage: url, datePublished: p.publishedAt, dateModified: p.updatedAt || p.publishedAt, articleSection: p.tag || undefined, author: { '@type': 'Organization', name: p.author || 'Red Flag Homes' }, publisher: { '@type': 'Organization', name: 'Red Flag Homes Network', url: RF_SITE } } },
    '<article class="story"><a class="back" href="/journal/">← All stories</a><div class="meta">' + (p.tag ? '<span class="tag">' + rfEsc(p.tag) + '</span><span>•</span>' : '') + '<span>' + rfMins(p.readSeconds) + '</span></div>' +
    '<h1>' + rfEsc(p.title) + '</h1>' + (p.excerpt ? '<p class="lede">' + rfEsc(p.excerpt) + '</p>' : '') +
    '<div class="by"><span>By<b>' + rfEsc(p.author || 'Red Flag Homes') + '</b></span><span>Published<b>' + rfDate(p.publishedAt) + '</b></span></div>' +
    (p.cover ? '<figure class="cover"><img src="' + rfEsc(p.cover) + '" alt="' + rfEsc(p.title) + '"></figure>' : '') +
    '<div class="body">' + rfMd(p.body) + '</div></article>', 'story') };
}

// ---- Routes ----
app.get('/sitemap.xml', async (req, res) => {
  const posts = await rfPosts();
  const day = (v) => { const t = Date.parse(v); return t ? new Date(t).toISOString().slice(0, 10) : ''; };
  const urls = [['/', ''], ['/franchise', ''], ['/bella/', ''], ['/journal/', posts[0] ? day(posts[0].updatedAt || posts[0].publishedAt) : '']]
    .concat(posts.map((p) => ['/journal/' + encodeURIComponent(p.slug), day(p.updatedAt || p.publishedAt)]));
  res.set('Content-Type', 'application/xml; charset=utf-8').set('Cache-Control', 'public, max-age=600').send(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(([u, d]) => '  <url><loc>' + rfEsc(RF_SITE + u) + '</loc>' + (d ? '<lastmod>' + d + '</lastmod>' : '') + '</url>').join('\n') + '\n</urlset>\n');
});
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /bella/thank-you\n\nSitemap: ' + RF_SITE + '/sitemap.xml\n');
});
app.use(async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const page = RF_PAGES.find((x) => x.match(req.path));
  if (!page) return next();
  try {
    let body = await rfFile(page.file);
    let status = 200;
    if (page.journal) {
      try { const out = await rfJournal(req.path, body); body = out.html; status = out.status; } catch (e) { /* serve the plain page */ }
    }
    res.status(status).set('Content-Type', page.type).set('Cache-Control', page.journal ? 'public, max-age=120' : 'public, max-age=300').send(body);
  } catch (err) {
    res.status(502).type('text/plain').send('This page is temporarily unavailable. Please refresh in a moment.');
  }
});
```

## 2. Add the checkout-return block
Directly after the block from step 1, and after `firebase-admin` is initialized, add this block exactly as written. If `firebase-admin` isn't initialized yet, initialize it once with default credentials and the `projectId` from `firebase-applet-config.json`.

```js
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
    rec.receiptNo = 'RF-BELLA-' + rec.paidAt.slice(0, 10).replace(/-/g, '') + '-' + String(rec.paymentId).replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase();
    if (rec.status === 'paid' && rec.email) rec.account = await rfBellaAccount(rec);
    return res.json({ ok: true, ...rec });
  } catch (err) {
    console.error('[bella-receipt]', err && err.message);
    return res.status(502).json({ ok: false, error: 'Could not confirm the payment right now.' });
  }
});
```

- If the file is TypeScript, you may add `: any` types to parameters and caught errors in both blocks. Change nothing else.
- Don't add any other route for `/bella/thank-you`, and don't create a page for it in this project. The server code above serves it.

## 3. Secrets
Add these names to AI Studio's secrets / environment settings. I will paste the values myself:
- `STRIPE_SECRET_KEY`: a Stripe restricted key with read access to Checkout Sessions, Payment Intents, Charges and Invoices.
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Never print or log these values.

## 4. Check before you finish
- `/bella/thank-you` returns 200 and shows "Confirming your payment…" for a moment. Without payment details it then shows "We couldn’t confirm your payment" with **Try again** and **Send us a WhatsApp**.
- `GET /api/bella/receipt?gw=stripe&session_id=bad` returns 400 `{"ok":false,...}`.
- `/bella/`, `/admin/`, `/journal/`, `/sitemap.xml` and `/robots.txt` still work. `/robots.txt` now also has `Disallow: /bella/thank-you`.
- Every other page is unchanged.
- List every file you changed.
