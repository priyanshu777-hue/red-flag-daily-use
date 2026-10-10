Run a security check on this app and apply the hardening below. Make exactly these changes and NOTHING else. Don't change any page's look, text or behaviour. Don't touch the code that serves `/bella`, `/admin`, `/journal`, `/privacy`, `/terms`, `/cancellation` or `/signin`, the Bella webhooks, or `/api/bella/receipt`. Never put a key, password or secret in code. Secrets stay in AI Studio secrets only.

What this covers:
1. Sitewide SSL
2. SSL certificate check
3. Password protection
4. HSTS
5. Secure cookies
6. Hardened server
7. Input validation
8. DoS protection
9. Regular checks

## 1. Server security code (three parts)
These parts are already tested. Paste each one exactly as written, in the place its comment says, in the Express server file.

**Part A:** right after `const app = express()`, BEFORE every other `app.use`, every route, and the Red Flag pages block.
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

## 2. Small server settings
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

## 3. Secrets check (report only, no new values)
- Search the whole project (server, client, `vite.config.*` `define`, `.env*`, built `dist/` files) for API keys, passwords and secrets. The only key allowed in browser code is the public Firebase `apiKey` in `firebase-applet-config.json`.
- The Gemini key must only be read on the server (`process.env...`). If `vite.config` `define` puts `GEMINI_API_KEY` (or any secret) into the client bundle, remove it from `define`, and make sure the browser only calls `/api/chat`.
- Don't add HTTP-referrer restrictions to the Firebase API key. The server uses it to render Journal stories.

## 4. Passwords (item 3 of the list)
- Don't add SHA-256 password hashing. Plain SHA-256 is too fast to be safe for passwords.
- All Red Flag passwords (customers on `/signin` and the admin) are handled by **Firebase Authentication**. It never gives the app the password, and stores it salted and hashed with scrypt, which is stronger than SHA-256.
- Check that no code, database table (including Cloud SQL `users`), Firestore document, log or form stores a password or password hash. If you find any custom password storage, tell me where. Don't build your own.
- `ADMIN_PASSWORD` must only be read from AI Studio secrets.

## 5. Firestore rules: validate new form entries (item 7)
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

## 6. Check before you finish
- `curl -sI https://redflaghomes.in/` shows `strict-transport-security`, `x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN`, `referrer-policy` and `permissions-policy`, and NO `x-powered-by`.
- `https://redflaghomes.in/.well-known/security.txt` shows `Contact: mailto:hello@redflaghomes.in`.
- `https://redflaghomes.in/api/rf-ip` shows a JSON `ip` and `visitor`. Tell me both values.
- A POST to `/api/chat` with `{}` returns 400 "Please type a message."
- The chat on the home page still answers normally.
- A franchise application and a booking inquiry still submit while signed in.
- The home page, `/franchise`, `/bella/`, `/bella/thank-you`, `/admin/`, `/journal/`, `/privacy`, `/signin`, `/sitemap.xml` and `/robots.txt` still load and look the same.
- Google sign-in still works.
- A webhook POST with a wrong signature still returns 400 (not 429 or 413).
- List every file you changed, and anything from sections 2–4 that you found and could not fix.

---

## What I need to do outside AI Studio (items 1, 2, 8 and 9)
**Sitewide SSL and certificate check (Hostinger hPanel):**
- Go to **Websites → redflaghomes.in → Security → SSL**. The certificate should be **Active** for both `redflaghomes.in` and `www.redflaghomes.in`, with auto-renewal on. Turn on **Force HTTPS**.
- Test the certificate at **ssllabs.com/ssltest** with `redflaghomes.in`. Aim for grade **A**. It should show TLS 1.2 and 1.3 only, and no expiry warnings.

**HSTS:** the server now sends a one-year HSTS header for `redflaghomes.in` and `www`. After a month with no SSL problems, you can extend it to subdomains and submit the site at hstspreload.org. Tell me first, because every subdomain must then have working HTTPS.

**Firebase password settings:** in the Firebase console, go to **Authentication → Settings**:
- Under **Password policy**, require at least 8 characters.
- Keep **Email enumeration protection** on.

**DoS:** in hPanel, keep the **CDN** on, and switch on any bot or DDoS protection it offers. If the site is ever flooded, use the CDN's "under attack" option. The server's own rate limits handle the rest.

**Regular checks (monthly, 5 minutes):**
1. Open **redflaghomes.in/admin → Site health → Run checks**. The new **Security** card should be all green.
2. **securityheaders.com** → `redflaghomes.in`. Aim for A.
3. **ssllabs.com/ssltest** → `redflaghomes.in`. Aim for A, and check the certificate expiry date.
4. Firebase console → **Authentication → Users**: remove accounts you don't recognise. **Firestore → Rules**: unchanged.
5. AI Studio: run `npm audit` and fix anything high or critical.
6. Rotate a key immediately if it was ever shared in chat or a screenshot (the admin password, Stripe and Razorpay keys).
