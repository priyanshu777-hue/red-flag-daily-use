Add the Bella setup guide to the payment confirmation email and the payment confirmation screen. STRICT RULES:
- Make exactly the changes below and NOTHING else.
- Don't redesign, restyle, reword or "improve" anything, and don't touch any other page, component, style, route, API, webhook logic or database rule.
- The pages (`/bella/thank-you` and the new `/bella/setup`) are already built and hosted. The server serves them from the CDN. Don't copy, rewrite or recreate their HTML, and don't create any page or component for the setup guide.
- Never put a password or secret in code, config files or chat.
- If a step can't be done exactly as written, stop and tell me which step and why. Don't improvise.

## 1. Server: replace the Red Flag pages block
In the Express server file, find the block that starts with the comment `// Red Flag Homes: serve the Bella, Admin` and contains `const RF_VERSION =` and `const RF_PAGES = [`. Replace that whole block with the block below, exactly as written.
- Keep it in the same place (BEFORE `express.static` and the single-page-app catch-all).
- If the security code's "PART A" is in the file, keep it above this block.

```js
// Red Flag Homes: serve the Bella, Admin, Journal, legal (/privacy, /terms, /cancellation) and /signin pages byte for byte from GitHub (via the jsDelivr CDN),
// and give the Journal real SEO: each story's title, description, social preview image and full text are in the
// HTML Google receives, plus /sitemap.xml and /robots.txt, and /api/geo (visitor country for INR/USD pricing).
// Paste as-is into the Express server, right after `const app = express()` and BEFORE express.static and the
// single-page-app catch-all. Do not edit; to update the pages, only change RF_VERSION.
const RF_VERSION = '1e61fc580c0903ae3a347f4a204eab57cf8a9c7f';
const RF_CDN = 'https://cdn.jsdelivr.net/gh/priyanshu777-hue/red-flag-daily-use@' + RF_VERSION + '/';
const RF_SITE = 'https://redflaghomes.in';
const RF_PAGES = [
  { match: (p) => p === '/bella/thank-you' || p === '/bella/thank-you/', file: 'bella-thanks.html', type: 'text/html; charset=utf-8' },
  { match: (p) => p === '/bella/setup' || p === '/bella/setup/', file: 'bella-setup.html', type: 'text/html; charset=utf-8' },
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
// Visitor's country for local pricing: /bella shows INR in India and USD everywhere else.
// Country only. The IP address is not stored (a short in-memory cache avoids repeat lookups).
const rfGeoCache = new Map();
async function rfGeoLookup(ip) {
  const urls = ['https://get.geojs.io/v1/ip/country/' + encodeURIComponent(ip) + '.json', 'https://api.country.is/' + encodeURIComponent(ip)];
  for (const u of urls) {
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(2000) });
      const j = await r.json();
      if (j && /^[A-Z]{2}$/.test(j.country)) return j.country;
    } catch (e) {}
  }
  return '';
}
app.get('/api/geo', async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  const h = req.headers;
  let country = String(h['cf-ipcountry'] || h['x-country-code'] || h['x-vercel-ip-country'] || h['cloudfront-viewer-country'] || h['x-appengine-country'] || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(country) || country === 'XX') country = '';
  const ip = String(h['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || '';
  if (!country && ip && !/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|::ffff:127\.|f[cd])/i.test(ip)) {
    const hit = rfGeoCache.get(ip);
    if (hit && Date.now() - hit.at < 6 * 3600 * 1000) country = hit.country;
    else {
      country = await rfGeoLookup(ip);
      if (rfGeoCache.size > 5000) rfGeoCache.clear();
      rfGeoCache.set(ip, { country, at: Date.now() });
    }
  }
  res.json({ country });
});
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

## 2. Server: replace the Bella checkout block
Find the block that starts with the comment `// Red Flag Homes: Bella checkout return.` and contains `app.get('/api/bella/receipt'`. Replace that whole block with the block below, exactly as written.
- If the server has no such block yet, add it directly after the pages block from step 1, after `firebase-admin` is initialized.
- If the file is TypeScript, you may add `: any` types to parameters and caught errors. Change nothing else.

```js
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
```

## 3. Install one package
Add `nodemailer` to the dependencies (`npm install nodemailer`). Don't add any other package.

## 4. Webhooks: send the setup email for paid payments
In `POST /api/webhooks/razorpay` and `POST /api/webhooks/stripe`, change nothing except this: in the branch that saves a payment with `status: 'paid'`, add ONE call right after the existing `bellaPayments` save. Use the same document ID and values that branch already saved.

Razorpay (`payment.captured` / `payment_link.paid`):
```js
rfBellaSendSetupEmail({ id: 'rzp_' + paymentId, email, name, plan, period, amount, currency, paymentId, txnId: paymentId, paidAt: createdAt }).catch(() => {});
```

Stripe (`checkout.session.completed` with `payment_status` 'paid'):
```js
rfBellaSendSetupEmail({ id: 'stripe_' + sessionId, email, name, plan, period, amount, currency, paymentId: sessionId, txnId: sessionId, paidAt: createdAt }).catch(() => {});
```

- Rename `paymentId`, `sessionId`, `email`, `name`, `plan`, `period`, `amount`, `currency` and `createdAt` to whatever the existing webhook code calls those values.
- The webhook still replies 200 right away. Don't `await` the email.
- The webhooks must be in the same server file as the checkout block, so `rfBellaSendSetupEmail` is available. If they're in another file, export the function from the checkout block's file and import it.
- The email is sent only once per payment, even if both the webhook and the return page call it.

## 5. Secrets
Add two secrets in Settings → Secrets. I will paste the values myself:
- `SMTP_USER`: the Hostinger mailbox the email is sent from (`bella@redflaghomes.in`).
- `SMTP_PASS`: that mailbox's password.

Don't add `SMTP_HOST` or `SMTP_PORT`. The code already uses `smtp.hostinger.com` and port 465.

## 6. Check before you finish
- `/bella/setup` shows "Setup guide" with 5 numbered steps and `bella@redflaghomes.in` with a Copy button.
- `/bella/thank-you` still shows "Confirming your payment…". After a successful payment, the "Setup guide" appears below the bill and the account panel.
- `GET /api/bella/receipt?gw=stripe&session_id=bad` returns 400.
- The server starts with no errors, and `nodemailer` is in `package.json`.
- A webhook POST with a wrong signature still returns 400.
- `/bella/`, `/admin/`, `/journal/`, `/privacy`, `/signin` and every other page are unchanged.
- List every file you changed. It should only be the server file (plus the webhook file if separate), `package.json` and `package-lock.json`.
