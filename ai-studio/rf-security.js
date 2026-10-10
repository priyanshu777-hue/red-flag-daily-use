// ============================================================================================================
// Red Flag Homes: security hardening, in three parts. Paste each part exactly where its comment says. Do not edit.
// ============================================================================================================

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
