Make exactly the changes below and NOTHING else. Strictly do not change, restyle, reformat or "improve" any existing page, component, style, form, script, route or file that is not named here: home page, /franchise and every other page stay exactly as they are.

What this does:
- Adds the admin panel at /admin (email + password sign-in).
- Fixes the /bella page. You rewrote its JavaScript last time, which broke the "How it works" envelope and 60-second timer, the price route, Bella's greetings, the calculator and the plan cards.
- Adds the Journal pages, with search-engine details (title, description, social preview, full story text) built into each story page, plus `/sitemap.xml` and `/robots.txt`.

The Bella, Admin and Journal pages are now served byte for byte from my GitHub repo by a small piece of server code. Their HTML/JS must never be copied into this project, rewritten or edited.

## 1. Remove the copies you made earlier
- Delete these if they exist: `public/bella/`, `public/admin/`, `public/journal/`, `public/journal.js`, and any `bella.html` / `admin.html` you created.
- Delete any React component, page or route you created for Bella, Admin or Journal (remove only those). Nothing else.

## 2. Add this server code exactly as written
- Paste the block below into the Express server file (e.g. `server.ts` or `server.js`).
- Put it right after `const app = express()` and BEFORE the Vite dev middleware, `express.static(...)` and the single-page-app catch-all.
- Don't change the URL, `RF_VERSION`, file names or logic.
- If the file is TypeScript, only add types: `(p: string)`, `(req: any, res: any, next: any)`, `(body: string)`, `(err: any)`. Nothing else.
- It uses Node's built-in `fetch` (Node 18+), so don't add a package for it.
- It also serves `/sitemap.xml` and `/robots.txt`. If the project already has its own `sitemap.xml` or `robots.txt` file, delete those files so these are used.
- If the file is TypeScript, you may also type the helper parameters as `any` (e.g. `(v: any)`, `(p: any)`, `(html: any, meta: any, mainHtml: any, kind: any)`). Change nothing else.

```js
// Red Flag Homes: serve the Bella, Admin and Journal pages byte for byte from GitHub (via the jsDelivr CDN),
// and give the Journal real SEO: each story's title, description, social preview image and full text are in the
// HTML Google receives, plus /sitemap.xml and /robots.txt.
// Paste as-is into the Express server, right after `const app = express()` and BEFORE express.static and the
// single-page-app catch-all. Do not edit; to update the pages, only change RF_VERSION.
const RF_VERSION = 'e90aba18ac93044370ab97ed4dec1f880f8e3d17';
const RF_CDN = 'https://cdn.jsdelivr.net/gh/priyanshu777-hue/red-flag-daily-use@' + RF_VERSION + '/';
const RF_SITE = 'https://redflaghomes.in';
const RF_PAGES = [
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
  res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ' + RF_SITE + '/sitemap.xml\n');
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

## 3. Home page: one line only
In the home page HTML, add this one line right before the final closing `</body>` tag at the very end of the file:

```html
<script src="/journal.js" defer></script>
```

- The file also contains the text `</body>` inside a script earlier. Don't put the line there.
- Change nothing else on the home page: not the Explore section, not its `articles` array, not `renderArticleCard()`.

## 4. Admin settings file
Create `public/admin-config.json` (it must be served at `/admin-config.json`) with exactly:

```json
{ "adminEmails": ["priyanshu@redflaghomes.in"] }
```

## 5. Admin sign-in
- The admin page signs in with Firebase Authentication email + password, using the project in `/firebase-applet-config.json`.
- Don't write any password into code, config or this project. The admin account is created in the Firebase console by the owner.
- Don't add sign-up pages or change the site's existing Google sign-in.

## 6. Bella payment webhooks (Razorpay + Stripe → Firestore `bellaPayments`)
Add two webhook endpoints to the existing Express server. Each one saves every Bella payment (paid, failed or abandoned) to Firestore so the admin panel can show failed payments and resend the payment link.

General rules:
- Register both routes **before** `express.json()` with `express.raw({ type: 'application/json' })`, because signatures are checked on the raw body.
- Verify every request. Reply 400 on a bad signature, otherwise reply 200 within a few seconds. Never throw a 500 back to the gateway for an event you ignore.
- Write with `firebase-admin`:
  - Use the same Firebase project as `/firebase-applet-config.json`: `projectId`, and the named database from `firestoreDatabaseId`, e.g. `getFirestore(app, config.firestoreDatabaseId)`.
  - Use the server's default credentials.
  - If the server cannot get Firestore credentials, stop and tell me instead of storing the data somewhere else.
- Save to collection `bellaPayments` with `set(doc, { merge: true })`, so the admin's `followUp`, `adminNotes`, `updatedAt` and `updatedBy` fields are never overwritten.
- Each document has these fields:
  `gateway` ('razorpay' | 'stripe'), `status` ('paid' | 'failed' | 'abandoned'), `amount` (number in rupees or dollars, not paise/cents), `currency` ('INR' | 'USD'), `email`, `phone`, `name`, `plan` ('solo' | 'growth' | 'pro' | ''), `period` ('monthly' | 'yearly' | ''), `reason` (human-readable failure text, '' when paid), `paymentId`, `event` (the gateway event type), `createdAt` (ISO time of the payment), `receivedAt` (ISO now).
- Work out `plan` and `period` from amount + currency with this table. If nothing matches, leave both empty.
  - INR monthly: solo 999, growth 1699, pro 2499. INR yearly: solo 10190, growth 17330, pro 25490.
  - USD monthly: solo 23, growth 39, pro 57. USD yearly: solo 235, growth 398, pro 581.
- Never log full card details or secrets.

**`POST /api/webhooks/razorpay`**
- Verify `X-Razorpay-Signature`. It must equal the hex HMAC-SHA256 of the raw body using secret `process.env.RAZORPAY_WEBHOOK_SECRET`. Use a timing-safe compare.
- Events:
  - `payment.failed` → status `failed`. `reason` = `payload.payment.entity.error_description` (fallback `error_reason`).
  - `payment.captured` and `payment_link.paid` → status `paid`.
- From `payload.payment.entity`: `id` → `paymentId`, `amount/100`, `currency`, `email`, `contact` → `phone`, `created_at` (unix seconds) → `createdAt`.
- `name`: use `notes.name`, or `payload.payment_link.entity.customer.name` when present.
- Document ID: `rzp_<payment id>`.

**`POST /api/webhooks/stripe`**
- Verify the `Stripe-Signature` header (`t=…,v1=…`) yourself:
  - The expected `v1` is the hex HMAC-SHA256 of `${t}.${rawBody}` using `process.env.STRIPE_WEBHOOK_SECRET`.
  - Reject if no `v1` matches (timing-safe) or `t` is more than 5 minutes old.
- Events:
  - `checkout.session.completed` with `payment_status` 'paid' → `paid`. Use `id`, `amount_total/100`, `currency` in upper case, and `customer_details.email`, `name`, `phone`. Document ID `stripe_<session id>`.
  - `checkout.session.async_payment_failed` → `failed`, same fields, reason "Payment failed after checkout".
  - `checkout.session.expired` → `abandoned`, reason "Checkout opened but not completed". Save it only if there is an email or phone.
  - `payment_intent.payment_failed` → `failed`. Use `id`, `amount/100`, `currency`, `reason` = `last_payment_error.message`, and email/name/phone from `last_payment_error.payment_method.billing_details` (fallback `receipt_email`). Document ID `stripe_<payment intent id>`.
  - `invoice.payment_failed` (failed subscription renewals) → `failed`. Use `id`, `amount_due/100`, `currency`, `customer_email`, `customer_name`, reason "Renewal payment failed". Document ID `stripe_<invoice id>`.
  - Use the event's `created` (unix seconds) → `createdAt`.

## 7. AI writer for the Journal: `POST /api/admin/write-post`
- **Auth:** read `Authorization: Bearer <Firebase ID token>`.
  - Verify it with `firebase-admin` `auth().verifyIdToken`.
  - Allow only if the token's email is in `process.env.ADMIN_EMAILS` (comma separated, case-insensitive), AND either `email_verified` is true or `firebase.sign_in_provider` is `'password'`.
  - Otherwise reply 403 `{ "error": "Not an admin" }`.
- **Request body:** `{ topic, tone, length: 'short' | 'medium' | 'long', notes, brand }`.
- **Generation:** generate with the Gemini SDK and API key the app already uses (`process.env.GEMINI_API_KEY`).
  - Ask for JSON output (response schema) with: `title` (max 90 chars), `excerpt` (max 160 chars), `tag` (one of Design, Operations, Hosting, Investing, Destinations, Franchise, Bella), `body` (Markdown), `seoDescription` (max 155 chars).
  - Word count: short ≈ 400 words, medium ≈ 800, long ≈ 1200.
- **Writing rules for the model:**
  - Write for Red Flag Homes Network, which runs AI-managed holiday homes ("Outposts") and franchises in India.
  - Plain, confident British-Indian English, with short paragraphs.
  - Use `##` section headings, never `#` and never HTML.
  - Use the facts in `notes`. Don't invent statistics, prices, guarantees or client names.
  - Never write the word "Airbnb"; say "bnb" or "short-term rentals".
  - End with a line linking to `/franchise`.
- **Response:** reply `{ title, excerpt, tag, body, seoDescription }`. On error, reply `{ "error": "<short message>" }` with a 4xx/5xx status.

## 8. Secrets
Add these names to AI Studio's secrets / environment settings. I will paste the values myself:
- `RAZORPAY_WEBHOOK_SECRET`
- `STRIPE_WEBHOOK_SECRET`
- `ADMIN_EMAILS` (value: `priyanshu@redflaghomes.in`)

## 9. Check before you finish
- `/bella/`, `/admin/`, `/journal/` and `/journal.js` all return 200, with no site header or React wrapper.
- Each response must be exactly the same text as the matching file at `RF_CDN` (compare `/bella/` with `fetch(RF_CDN + 'bella-redflaghomes.html')`, and so on). If anything differs, the code was changed. Fix that.
- On `/bella/`, all of these work:
  - The hero chameleon walks and Bella greets in different languages.
  - The price route shows 4 stations (Pricing, Check-in, Commission, Emergencies) with a moving pin as you scroll.
  - In "How it works", the envelope opens with a letter and a timer counts down from 60.
  - The plan buttons open the questions popup.
- `/admin/` shows the "Admin" card with Email, Password, "Sign in", "Forgot password?" and "Preview with sample data".
- `/journal/` loads.
- `/sitemap.xml` returns an XML sitemap listing `/`, `/franchise`, `/bella/`, `/journal/` and every published story.
- `/robots.txt` returns the robots file with the `Sitemap:` line and `Disallow: /admin`.
- A published story's page source contains its own `<title>`, `<meta name="description">`, `og:image` and story text.
- The home page and every other page look and behave exactly as before.
- These calls fail as expected:
  - A webhook POST with a wrong signature returns 400.
  - `/api/admin/write-post` without a token returns 401 or 403.
- List every file you created, changed or deleted. It must only be: the server file, the home page (one line), `public/admin-config.json`, and the deleted copies from step 1 (plus any old `sitemap.xml` / `robots.txt` you removed).
