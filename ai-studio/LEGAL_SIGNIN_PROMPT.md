Add Privacy, Terms and Cancellation pages, and replace "Sign in with Google" with one Red Flag sign-in page (email, Google, Apple or phone, for both signing in and creating an account). Make exactly the changes below and NOTHING else. Don't change any other page, section, component, style, text, route, webhook or API.

The two new pages (`/privacy`, `/terms`, `/cancellation` and `/signin`) are already built and hosted. The server serves them byte for byte from the CDN, the same way it already serves `/bella`, `/admin` and `/journal`. Don't create, copy, rewrite or "improve" their HTML.

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
const RF_VERSION = '8d519e1cb0ae82ac3940363d94ac7c373fa7b73f';
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

## 2. `firebase-client.js`: open the new sign-in page
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

## 3. Home page (`/`): sign-in tab icon and footer links
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

## 4. Don't do these
- Don't add a sign-in modal, a new React component, or any other copy of the sign-in form. The form lives only on `/signin`.
- Don't change the Firebase config, Firestore rules, `syncUserProfile`, or the `/api/users/sync` route.
- Don't change the franchise page, `/bella`, `/admin`, `/journal` or any other page.
- Don't put any keys or passwords in code.

## 5. Check before you finish
- `https://redflaghomes.in/privacy`, `/terms` and `/cancellation` each open the legal page with that tab selected.
- `https://redflaghomes.in/signin` shows "Welcome back", with:
  - Sign in / Create account tabs.
  - "Continue with Google" and "Continue with Apple" buttons.
  - Email and Phone options, and "Forgot password?".
- On the home page, the header "Sign In" button and the mobile Sign in tab show a person icon (no Google "G"). Clicking either opens the `/signin` window. After signing in, the window closes and the home page shows the signed-in avatar as before.
- The footer Privacy, Terms and Cancellation links open the new pages.
- `/sitemap.xml` lists `/privacy`, `/terms` and `/cancellation`. `/robots.txt` contains `Disallow: /signin`.
- `/bella/`, `/bella/thank-you`, `/admin/` and `/journal/` still work, and every other page is unchanged.
- List every file you changed. It should only be the server file, `firebase-client.js` and the home page file.

---

## What I need to do in Firebase (not AI Studio)
Firebase console, project **plucky-block-8n96h**, then **Authentication → Sign-in method**:
1. **Email/Password:** already on. Nothing to do.
2. **Google:** already on. Nothing to do.
3. **Phone:** click **Add new provider → Phone → Enable → Save**. SMS codes need the **Blaze (pay as you go)** plan. Firebase charges per SMS, and India is one of the pricier regions, so set a budget alert in Google Cloud Billing. Under **Authentication → Settings → SMS region policy**, you can allow only India (and any other countries you serve) to block SMS fraud.
4. **Apple:** click **Add new provider → Apple → Enable**. This needs a paid Apple Developer account:
   - In Apple Developer → Certificates, IDs & Profiles, create a **Services ID** (for example `in.redflaghomes.signin`), turn on **Sign in with Apple**, and add:
     - Domain: `plucky-block-8n96h.firebaseapp.com`
     - Return URL: the callback URL Firebase shows on the Apple provider screen.
   - Create a **Key** with "Sign in with Apple" enabled, and download the `.p8` file.
   - In Firebase, enter the Services ID, Apple **Team ID**, **Key ID** and the private key from the `.p8` file, then Save.
5. **Authentication → Settings → Authorized domains:** make sure `redflaghomes.in` and `www.redflaghomes.in` are listed.

Until Apple or Phone is switched on, those buttons show a polite "This sign-in method isn't available yet. Please use another option." message. Email and Google work straight away.
