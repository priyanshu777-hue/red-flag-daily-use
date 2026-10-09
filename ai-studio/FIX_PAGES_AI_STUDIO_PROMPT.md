The /bella page on my site is broken. You rewrote its JavaScript instead of copying my file: 16 of its scripts were replaced, so the "How it works" envelope and 60-second timer, the price route, Bella's greetings, the calculator and the plan cards don't work.

Fix it like this. From now on the Bella, Admin and Journal pages are served straight from my GitHub repo by a small piece of server code, so their HTML/JS must never be copied into this project or edited.

## 1. Remove the copies you made
- Delete these if they exist: `public/bella/`, `public/admin/`, `public/journal/`, `public/journal.js`, `bella.html`, `admin.html`.
- Delete any React component, page or route you created for Bella, Admin or Journal. If a route exists for `/bella`, `/admin` or `/journal`, remove it.
- Don't touch anything else.

## 2. Add this server code exactly as written
- Paste the block below into the Express server file (e.g. `server.ts` or `server.js`).
- Put it right after `const app = express()` and BEFORE the Vite dev middleware, `express.static(...)` and the single-page-app catch-all.
- Don't change the URL, `RF_VERSION`, file names or logic.
- If the file is TypeScript, only add types: `(p: string)`, `(req: any, res: any, next: any)`, `(body: string)`, `(err: any)`. Nothing else.
- It uses Node's built-in `fetch` (Node 18+), so don't add a package for it.

```js
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
```

## 3. Home page
In the home page HTML, add this one line right before the final closing `</body>` tag at the very end of the file:

```html
<script src="/journal.js" defer></script>
```

- The file also contains the text `</body>` inside a script earlier. Don't put the line there.
- Don't change the Explore section, its `articles` array or `renderArticleCard()`.

## 4. Admin settings file
Create `public/admin-config.json` (it must be served at `/admin-config.json`) with exactly:

```json
{ "adminEmails": [] }
```

I will put my email in it myself.

## 5. Check before you finish
- `/bella/`, `/admin/`, `/journal/` and `/journal.js` all return 200, with no site header or React wrapper.
- Each response must be exactly the same text as the matching file at `RF_CDN` (compare the response of `/bella/` with `fetch(RF_CDN + 'bella-redflaghomes.html')`, and so on). If anything differs, the code was changed. Fix that.
- On `/bella/`, all of these work:
  - The hero chameleon walks and Bella greets in different languages.
  - The price route shows 4 stations (Pricing, Check-in, Commission, Emergencies) with a moving pin as you scroll.
  - In "How it works", the envelope opens with a letter and a timer counts down from 60.
  - The plan buttons open the questions popup.
- The home page looks exactly as before.
- Every other page is unchanged.
- List every file you changed or deleted.
