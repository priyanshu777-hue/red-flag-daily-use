Apply the Red Flag Homes update below in one go. STRICT RULES:
- Make exactly the changes listed and NOTHING else.
- Don't redesign, restyle, reword, reorder, rename or "improve" anything.
- Don't change any page, section, component, style, text, image, route, API, webhook, database or config unless a step below names it.
- Don't copy, rewrite or recreate the HTML of `/bella`, `/bella/thank-you`, `/admin`, `/journal`, `/privacy`, `/terms`, `/cancellation` or `/signin`. The server serves them from the CDN.
- Never put a key, password or secret in code, config files or chat. Secrets go only in Settings → Secrets.
- If a step can't be done exactly as written, stop and tell me which step and why. Don't improvise a different solution.

There are 10 steps. The server file gets three blocks, in this order from the top:
1. Security Part A, right after `const app = express()`.
2. The Red Flag pages block.
3. The Bella checkout block.

## 1. Server: replace the Red Flag pages block
In the Express server file, find the existing Red Flag pages block. It starts with the comment `// Red Flag Homes: serve the Bella, Admin` and contains `const RF_VERSION =`, `const RF_PAGES = [`, `/sitemap.xml` and `/robots.txt`. Replace that whole block, from its first comment line to its last line, with the block below, exactly as written.
- Keep it in the same place: right after `const app = express()`, and BEFORE `express.static` and the single-page-app catch-all.
- If the server file has no such block yet, add this one in that place.
- Don't touch the Bella checkout block (`/api/bella/receipt`), the webhooks or the admin setup code.

```js
// Red Flag Homes: serve the Bella, Admin, Journal, legal (/privacy, /terms, /cancellation) and /signin pages byte for byte from GitHub (via the jsDelivr CDN),
// and give the Journal real SEO: each story's title, description, social preview image and full text are in the
// HTML Google receives, plus /sitemap.xml and /robots.txt.
// Paste as-is into the Express server, right after `const app = express()` and BEFORE express.static and the
// single-page-app catch-all. Do not edit; to update the pages, only change RF_VERSION.
const RF_VERSION = 'e8bdc0b1b577fe11910c8c99a8df3f1b2fd67b89';
const RF_CDN = 'https://cdn.jsdelivr.net/gh/priyanshu777-hue/red-flag-daily-use@' + RF_VERSION + '/';
const RF_SITE = 'https://redflaghomes.in';
const RF_PAGES = [
  { match: (p) => p === '/bella/thank-you' || p === '/bella/thank-you/', file: 'bella-thanks.html', type: 'text/html; charset=utf-8' },
  { match: (p) => p === '/bella' || p === '/bella/' || p === '/bella/index.html', file: 'bella-redflaghomes.html', type: 'text/html; charset=utf-8' },
  { match: (p) => p === '/admin' || p === '/admin/' || p === '/admin/index.html', file: 'admin.html', type: 'text/html; charset=utf-8' },
  { match: (p) => p === '/journal.js', file: 'journal/journal.js', type: 'application/javascript; charset=utf-8' },
  { match: (p) => p === '/journal' || p.startsWith('/journal/'), file: 'journal/index.html', type: 'text/html; charset=utf-8', journal: true },
  { match: (p) => ['/privacy', '/terms', '/cancellation', '/privacy/', '/terms/', '/cancellation/'].includes(p), file: 'site-legal.html', type: 'text/html; charset=utf-8' },
  { match: (p) => p === '/signin' || p === '/signin/', file: 'signin.html', type: 'text/html; charset=utf-8' },
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
  const urls = [['/', ''], ['/franchise', ''], ['/bella/', ''], ['/journal/', posts[0] ? day(posts[0].updatedAt || posts[0].publishedAt) : ''], ['/privacy', ''], ['/terms', ''], ['/cancellation', '']]
    .concat(posts.map((p) => ['/journal/' + encodeURIComponent(p.slug), day(p.updatedAt || p.publishedAt)]));
  res.set('Content-Type', 'application/xml; charset=utf-8').set('Cache-Control', 'public, max-age=600').send(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(([u, d]) => '  <url><loc>' + rfEsc(RF_SITE + u) + '</loc>' + (d ? '<lastmod>' + d + '</lastmod>' : '') + '</url>').join('\n') + '\n</urlset>\n');
});
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nDisallow: /bella/thank-you\nDisallow: /signin\n\nSitemap: ' + RF_SITE + '/sitemap.xml\n');
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

## 2. Server: add (or replace) the Bella checkout block
Put this block directly after the Red Flag pages block from step 1, and after `firebase-admin` is initialized.
- If the server already has an `app.get('/api/bella/receipt', …)` block, replace that whole block with this one.
- If `firebase-admin` isn't initialized yet, initialize it once with default credentials and the `projectId` from `firebase-applet-config.json`.
- Don't add any other route or page for `/bella/thank-you`.

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

## 3. Server security code (three parts)
These parts are already tested. Paste each one exactly as written, in the place its comment says, in the Express server file.

**Part A:** right after `const app = express()`, BEFORE every other `app.use`, every route, and the Red Flag pages block from step 1.
- It hides the "Express" server name.
- It adds HSTS and the other security headers, and makes every cookie Secure, HttpOnly and SameSite=Lax.
- It refuses oversized requests, rate-limits each visitor (payment webhooks are never limited), and publishes `/.well-known/security.txt`.

```js
// ---- PART A: paste right after `const app = express()`, BEFORE every other app.use, route and the RF pages block ----
app.disable('x-powered-by');
// Visitors reach this server through Hostinger's CDN and web server. Two proxy hops are trusted, so req.ip is
// the visitor's own address (used by the rate limits below and by /api/bella/receipt).
app.set('trust proxy', 2);
const RF_PROD_HOSTS = ['redflaghomes.in', 'www.redflaghomes.in'];
const rfIsProd = (req) => RF_PROD_HOSTS.includes(String(req.hostname || '').toLowerCase());
const rfIsWebhook = (p) => p.startsWith('/api/webhooks/');

// Security headers on every response. (Hostinger already redirects every http:// request to https://, so
// there is no redirect here; adding one behind the CDN can cause a redirect loop.)
app.use((req, res, next) => {
  if (rfIsProd(req)) {
    res.set('Strict-Transport-Security', 'max-age=31536000');
    res.set('X-Frame-Options', 'SAMEORIGIN');
    res.set('Content-Security-Policy', "upgrade-insecure-requests; frame-ancestors 'self'; base-uri 'self'; object-src 'none'");
  }
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()');
  // Lets the Google, Apple and sign-in pop-ups talk back to the page that opened them.
  res.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
  // Any cookie this server sets is HTTPS-only, hidden from page scripts, and not sent on cross-site requests.
  const rfCookie = res.cookie.bind(res);
  res.cookie = (name, value, opts) => rfCookie(name, value, Object.assign({ path: '/', sameSite: 'lax' }, opts || {}, { httpOnly: true, secure: rfIsProd(req) || req.secure }));
  next();
});

// Refuse oversized requests early (webhooks are exempt: Stripe and Razorpay send their own sizes).
app.use((req, res, next) => {
  const len = Number(req.headers['content-length'] || 0);
  if (!rfIsWebhook(req.path) && len > 1024 * 1024) return res.status(413).json({ ok: false, error: 'Request too large.' });
  next();
});

// Rate limits per visitor, to stop floods and runaway AI costs. Payment webhooks are never limited.
const RF_LIMITS = [
  { name: 'chat', test: (p) => p === '/api/chat', max: 20, windowMs: 5 * 60 * 1000 },
  { name: 'chat-day', test: (p) => p === '/api/chat', max: 200, windowMs: 24 * 60 * 60 * 1000 },
  { name: 'forms', test: (p) => p === '/api/applications' || p === '/api/inquiries', max: 10, windowMs: 10 * 60 * 1000 },
  { name: 'writer', test: (p) => p === '/api/admin/write-post', max: 30, windowMs: 60 * 60 * 1000 },
  { name: 'api', test: (p) => p.startsWith('/api/'), max: 300, windowMs: 15 * 60 * 1000 },
  { name: 'site', test: () => true, max: 900, windowMs: 60 * 1000 },
];
const rfHits = new Map();
setInterval(() => { const now = Date.now(); for (const [k, v] of rfHits) if (v.reset < now) rfHits.delete(k); }, 60 * 1000).unref();
app.use((req, res, next) => {
  if (rfIsWebhook(req.path) || req.method === 'OPTIONS') return next();
  // The visitor's own address as reported by the CDN. Never lumps different visitors together, whatever the proxy setup.
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown', now = Date.now();
  for (const rule of RF_LIMITS) {
    if (!rule.test(req.path)) continue;
    const key = rule.name + '|' + ip;
    let hit = rfHits.get(key);
    if (!hit || hit.reset < now) { hit = { count: 0, reset: now + rule.windowMs }; rfHits.set(key, hit); }
    hit.count += 1;
    if (hit.count > rule.max) {
      res.set('Retry-After', String(Math.ceil((hit.reset - now) / 1000)));
      return res.status(429).json({ ok: false, error: 'Too many requests. Please wait a few minutes and try again.', text: 'You are sending messages too quickly. Please wait a few minutes and try again.' });
    }
  }
  next();
});

// Shows a visitor the address this server sees for them, to confirm the rate limits count each visitor separately.
app.get('/api/rf-ip', (req, res) => res.json({ ip: req.ip, visitor: String(req.headers['x-forwarded-for'] || '').split(',')[0].trim(), hops: (req.ips || []).length }));

// Security contact for researchers (https://securitytxt.org).
app.get('/.well-known/security.txt', (req, res) => {
  res.type('text/plain').set('Cache-Control', 'public, max-age=86400').send('Contact: mailto:hello@redflaghomes.in\nExpires: ' + new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString() + '\nPreferred-Languages: en, hi\nCanonical: https://redflaghomes.in/.well-known/security.txt\n');
});
```

**Part B:** right AFTER the existing `app.use(express.json(...))` line, and BEFORE the `/api/...` routes. It checks and cleans what visitors send to `/api/applications`, `/api/inquiries`, `/api/users/sync` and `/api/chat`.

```js
// ---- PART B: paste right AFTER the existing `app.use(express.json(...))` line, and BEFORE the /api routes ----
// Checks and cleans what visitors send to the form and chat APIs before any route uses it.
function rfClean(v, max) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'number' || typeof v === 'boolean') v = String(v);
  if (typeof v !== 'string') return null;
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[<>]/g, '').trim().slice(0, max);
}
function rfBad(res, msg) { return res.status(400).json({ ok: false, error: msg, text: msg }); }
const RF_FIELDS = {
  '/api/applications': { tier: 80, location: 120, capital: 60, notes: 600, phone: 25, userName: 120 },
  '/api/inquiries': { destination: 120, guests: 10, dates: 60 },
  '/api/users/sync': { uid: 128, email: 254, displayName: 120, photoURL: 1000 },
};
app.use((req, res, next) => {
  if (req.method !== 'POST') return next();
  const fields = RF_FIELDS[req.path];
  if (fields) {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return rfBad(res, 'Invalid request.');
    const clean = {};
    for (const [k, max] of Object.entries(fields)) {
      const v = rfClean(body[k], max);
      if (v === null) return rfBad(res, 'Invalid value for ' + k + '.');
      clean[k] = v;
    }
    if (clean.phone && !/^[+\d][\d\s()-]{5,24}$/.test(clean.phone)) return rfBad(res, 'Please enter a valid phone number.');
    if (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean.email)) return rfBad(res, 'Please enter a valid email address.');
    if (clean.photoURL && !/^https:\/\//i.test(clean.photoURL)) clean.photoURL = '';
    req.body = clean;
    return next();
  }
  if (req.path === '/api/chat') {
    const body = req.body || {};
    const message = rfClean(body.message, 2000);
    if (!message) return rfBad(res, 'Please type a message.');
    const history = (Array.isArray(body.history) ? body.history : []).slice(-20)
      .filter((m) => m && (m.role === 'user' || m.role === 'model') && Array.isArray(m.parts))
      .map((m) => ({ role: m.role, parts: m.parts.slice(0, 4).map((p) => ({ text: String((p && p.text) || '').slice(0, 4000) })) }));
    req.body = { message, history, useSearch: body.useSearch === true };
    return next();
  }
  next();
});
```

**Part C:** at the very end, after every route and after the single-page-app catch-all, but BEFORE `app.listen(...)`. It makes sure visitors never see stack traces.

```js
// ---- PART C: paste at the very END of the routes: after every app.get/app.post/app.use, after the single-page-app
// catch-all, and BEFORE app.listen(...) ----
// Never show visitors stack traces or internal errors.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err && (err.status || err.statusCode);
  if (status === 413) return res.status(413).json({ ok: false, error: 'Request too large.' });
  if (status === 400 && err.type === 'entity.parse.failed') return res.status(400).json({ ok: false, error: 'Invalid request.' });
  console.error('[server error]', req.method, req.path, err && err.message);
  res.status(500).json({ ok: false, error: 'Something went wrong. Please try again.' });
});
```

If the server file is TypeScript, you may add `: any` types to parameters (for example `(req: any, res: any, next: any)`) so it compiles. Change nothing else in these parts.

## 4. Small server settings
- **Body size:** change the existing `app.use(express.json())` to `app.use(express.json({ limit: '100kb' }))`. Leave the webhook routes' `express.raw(...)` exactly as they are, and keep them registered BEFORE `express.json`.
- **Timeouts:** store the result of `app.listen(...)` in a constant, for example `const server = app.listen(PORT, ...)`. Right after it, add:
  ```js
  server.headersTimeout = 20000;
  server.requestTimeout = 60000;
  server.keepAliveTimeout = 5000;
  ```
- **CORS:** if the server uses the `cors` package or sets `Access-Control-Allow-Origin` itself, allow only `https://redflaghomes.in` and `https://www.redflaghomes.in`. If it doesn't use CORS at all, leave it that way.
- **Errors:** no route may send `err.stack`, `err.message` from the database, or raw Gemini/Stripe/Razorpay error text to visitors. Log it with `console.error` and send a short friendly message.
- **Dependencies:** run `npm audit`, then `npm audit fix`. Never use `--force`. Then make sure the app still builds and starts. Report anything `npm audit` still lists.

## 5. `firebase-client.js`: open the new sign-in page
This is the file served at `/firebase-client.js`. Make only these four edits.

**2a.** Replace the whole `signInWithGoogle` function, from `export async function signInWithGoogle() {` up to (not including) `export async function signOutUser()`, with the function below.
- Keep the function NAME `signInWithGoogle` and its export, so every existing caller keeps working unchanged: the header button, the mobile tab, `submitAllocationApplication`, `submitBookingInquiry` and `window.signInWithGoogle`.
- `onAuthStateChanged` is already imported in this file. Leave every import as it is.

```js
export async function signInWithGoogle() {
  // Opens the Red Flag sign-in page (email, Google, Apple or phone; sign in or create an account).
  // The name stays the same so every existing button and form keeps working.
  if (!auth) await initFirebase();
  if (auth.currentUser) return auth.currentUser;
  const next = location.pathname + location.search + location.hash;
  const w = 460, h = 760;
  const left = Math.max(0, Math.round((screen.width - w) / 2));
  const top = Math.max(0, Math.round((screen.height - h) / 2));
  const win = window.open('/signin?popup=1&next=' + encodeURIComponent(next), 'rf-signin', `width=${w},height=${h},left=${left},top=${top}`);
  if (!win) {
    location.href = '/signin?next=' + encodeURIComponent(next);
    return null;
  }
  return new Promise((resolve) => {
    let done = false;
    let unsub = () => {};
    let timer = null;
    const finish = (user) => {
      if (done) return;
      done = true;
      clearInterval(timer);
      unsub();
      if (user) currentUser = user;
      resolve(user || null);
    };
    unsub = onAuthStateChanged(auth, (user) => { if (user) finish(user); });
    timer = setInterval(() => {
      if (win.closed) {
        clearInterval(timer);
        // Give this tab a moment to pick up the new session saved by the sign-in window.
        setTimeout(() => finish(auth.currentUser), 2500);
      }
    }, 500);
  });
}
```

**2b.** In `mountAuthNavigation`, in the signed-out button HTML:
- Change `<button class="rf-auth-btn" id="rf-signin-btn" title="Sign in with Google">` to `<button class="rf-auth-btn" id="rf-signin-btn" title="Sign in">`.
- Replace the coloured Google "G" `<svg …>…</svg>` inside that button (the one with the four `<path fill="#4285F4"…>`, `#34A853`, `#FBBC05` and `#EA4335` paths) with this person icon:

```html
<svg width="12" height="12" viewBox="0 0 24 24" style="opacity: 0.8; flex-shrink: 0;" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>
```

- Keep `<span>Sign In</span>` and the click handler exactly as they are.

**2c.** Change the text `'Please sign in with Google to submit and track your franchise allocation.'` to `'Please sign in to submit and track your franchise allocation.'`.

**2d.** Change the text `'Please sign in with Google to record and track your booking inquiry.'` to `'Please sign in to record and track your booking inquiry.'`.

## 6. Home page (`/`): sign-in tab icon and footer links
Make only these edits on the home page.

**3a.** In the mobile bottom tab bar, inside `<a class="mtb-tab mtb-signin" href="#signin" id="mtbSignin" aria-label="Sign in">`, replace the coloured Google "G" `<svg viewBox="0 0 24 24" aria-hidden="true">…</svg>` (four coloured `<path fill="#…">` elements) with this person icon. Keep `<span>Sign in</span>`.

```html
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>
```

**3b.** In the script below it, the `defaultIconHtml` template string contains the same Google "G" `<svg>`. Replace that `<svg>…</svg>` with the same person icon from 3a. Keep `<span>Sign in</span>`.

**3c.** In the same script, change `mtbSignin.title = 'Sign in with Google';` to `mtbSignin.title = 'Sign in';`.
- Keep everything else in that script as it is: the profile photo, initials and sign-out behaviour, and the click handler calling `signInWithGoogle()` / `signOutUser()`.

**3d.** In the footer, inside `<span class="ft-legal-links">`, change only the three links:
- `<a href="#privacy">Privacy</a>` → `<a href="/privacy">Privacy</a>`
- `<a href="#terms">Terms</a>` → `<a href="/terms">Terms</a>`
- `<a href="#cancellation">Cancellation</a>` → `<a href="/cancellation">Cancellation</a>`

Don't change the footer text, styles or anything else.

## 7. Firestore rules: validate new form entries
In this project's Firestore rules (the database named in `firebase-applet-config.json`):
1. Search the codebase for every `addDoc`/`setDoc` into `applications` and `inquiries`. If any of them writes a field missing from the lists below, add that field name to the matching `hasOnly([...])` list.
2. Add these two helper functions inside `match /databases/{database}/documents { … }`:
```
function rfStr(v, n) { return v is string && v.size() <= n; }
function rfVal(v, n) { return (v is string && v.size() <= n) || v is int || v is float || v is bool; }
```
3. For `applications` and `inquiries`, REPLACE the existing `allow create` rule (or the create part of an `allow write`) with the rules below. If the existing rule is `allow write`, split it: keep its old condition for `update, delete`. Keep every read, update and delete rule exactly as it is, and keep the `isRfAdmin()` admin rules.
```
match /applications/{id} {
  allow create: if request.auth != null
    && request.resource.data.userId == request.auth.uid
    && request.resource.data.status == 'Under Review'
    && request.resource.data.keys().hasOnly(['userId','userEmail','userName','phone','city','capital','propertyIntent','existingClient','tier','status','createdAt'])
    && rfStr(request.resource.data.userEmail, 254) && rfVal(request.resource.data.userName, 120)
    && rfVal(request.resource.data.phone, 25) && rfVal(request.resource.data.city, 120)
    && rfVal(request.resource.data.capital, 60) && rfVal(request.resource.data.propertyIntent, 80)
    && rfVal(request.resource.data.existingClient, 20) && rfVal(request.resource.data.tier, 80)
    && rfStr(request.resource.data.createdAt, 40);
}
match /inquiries/{id} {
  allow create: if request.auth != null
    && request.resource.data.userId == request.auth.uid
    && request.resource.data.status == 'Inquiry Received'
    && request.resource.data.keys().hasOnly(['userId','userEmail','userName','phone','destination','checkin','checkout','guests','intent','status','createdAt'])
    && rfStr(request.resource.data.userEmail, 254) && rfVal(request.resource.data.userName, 120)
    && rfVal(request.resource.data.phone, 25) && rfVal(request.resource.data.destination, 120)
    && rfVal(request.resource.data.checkin, 40) && rfVal(request.resource.data.checkout, 40)
    && rfVal(request.resource.data.guests, 10) && rfVal(request.resource.data.intent, 40)
    && rfStr(request.resource.data.createdAt, 40);
}
```
4. Check that `users/{uid}` can only be written by that same signed-in user (`request.auth.uid == uid`). If it is already like that, leave it. Don't loosen any rule.
5. Deploy the rules the way this project already deploys them.

## 8. Secrets check (report only, no new values)
- Search the whole project (server, client, `vite.config.*` `define`, `.env*`, built `dist/` files) for API keys, passwords and secrets. The only key allowed in browser code is the public Firebase `apiKey` in `firebase-applet-config.json`.
- The Gemini key must only be read on the server (`process.env...`). If `vite.config` `define` puts `GEMINI_API_KEY` (or any secret) into the client bundle, remove it from `define`, and make sure the browser only calls `/api/chat`.
- Don't add HTTP-referrer restrictions to the Firebase API key. The server uses it to render Journal stories.

## 9. Passwords
- Don't add SHA-256 password hashing. Plain SHA-256 is too fast to be safe for passwords.
- All Red Flag passwords (customers on `/signin` and the admin) are handled by **Firebase Authentication**. It never gives the app the password, and stores it salted and hashed with scrypt, which is stronger than SHA-256.
- Check that no code, database table (including Cloud SQL `users`), Firestore document, log or form stores a password or password hash. If you find any custom password storage, tell me where. Don't build your own.
- `ADMIN_PASSWORD` must only be read from AI Studio secrets.

## 10. Check before you finish
- Server headers: `curl -sI https://redflaghomes.in/` shows `strict-transport-security`, `x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN`, `referrer-policy` and `permissions-policy`, and NO `x-powered-by`.
- These load correctly:
  - `/privacy`, `/terms` and `/cancellation` open the legal page with that tab selected.
  - `/signin` shows "Welcome back", with Google, Apple, Email and Phone options.
  - `/sitemap.xml` lists `/privacy`, `/terms` and `/cancellation`.
  - `/robots.txt` contains `Disallow: /admin` and `Disallow: /signin`.
  - `/.well-known/security.txt` shows `Contact: mailto:hello@redflaghomes.in`.
- `/bella/thank-you` shows "Confirming your payment…".
- `GET /api/bella/receipt?gw=stripe&session_id=bad` returns 400.
- A POST to `/api/chat` with `{}` returns 400 "Please type a message.", and the home page chat still answers normally.
- A webhook POST with a wrong signature to `/api/webhooks/razorpay` or `/api/webhooks/stripe` still returns 400 (not 429 or 413).
- On the home page:
  - The header "Sign In" button and the mobile Sign in tab show a person icon. Clicking either opens the `/signin` window.
  - The footer Privacy, Terms and Cancellation links open the new pages.
- A franchise application and a booking inquiry still submit while signed in.
- The home page, `/franchise`, `/bella/`, `/admin/` and `/journal/` look and work exactly as before.
- Secrets: confirm these exist in Settings → Secrets, without showing their values: `RAZORPAY_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `ADMIN_EMAILS`. List any that are missing. Don't invent values.
- Tell me the `ip` and `visitor` values shown at `/api/rf-ip`.
- List every file you changed. It should only be:
  - the server file
  - `firebase-client.js`
  - the home page file
  - `package-lock.json`, only if `npm audit fix` changed it
  - the Firestore rules file
- Also list anything from steps 4, 8 and 9 that you found and could not fix.
