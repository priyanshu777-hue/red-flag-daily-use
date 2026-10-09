// Red Flag Homes: serve the Bella, Admin and Journal pages byte for byte from GitHub (via the jsDelivr CDN).
// Paste as-is into the Express server, right after `const app = express()` and BEFORE express.static and the
// single-page-app catch-all. Do not edit the files' code; to update the pages, only change RF_VERSION.
const RF_VERSION = 'ad111c201c132ffe20106c1293fa19bb9571bbf4';
const RF_CDN = 'https://cdn.jsdelivr.net/gh/priyanshu777-hue/red-flag-daily-use@' + RF_VERSION + '/';
const RF_PAGES = [
  { match: (p) => p === '/bella' || p === '/bella/' || p === '/bella/index.html', file: 'bella-redflaghomes.html', type: 'text/html; charset=utf-8' },
  { match: (p) => p === '/admin' || p === '/admin/' || p === '/admin/index.html', file: 'admin.html', type: 'text/html; charset=utf-8' },
  { match: (p) => p === '/journal.js', file: 'journal/journal.js', type: 'application/javascript; charset=utf-8' },
  { match: (p) => p === '/journal' || p.startsWith('/journal/'), file: 'journal/index.html', type: 'text/html; charset=utf-8' },
];
const rfCache = new Map();
app.use(async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const page = RF_PAGES.find((x) => x.match(req.path));
  if (!page) return next();
  const send = (body) => res.set('Content-Type', page.type).set('Cache-Control', 'public, max-age=300').send(body);
  try {
    let hit = rfCache.get(page.file);
    if (!hit || Date.now() - hit.at > 10 * 60 * 1000) {
      const r = await fetch(RF_CDN + page.file);
      if (!r.ok) throw new Error('CDN ' + r.status);
      hit = { at: Date.now(), body: await r.text() };
      rfCache.set(page.file, hit);
    }
    send(hit.body);
  } catch (err) {
    const old = rfCache.get(page.file);
    if (old) return send(old.body);
    res.status(502).type('text/plain').send('This page is temporarily unavailable. Please refresh in a moment.');
  }
});
