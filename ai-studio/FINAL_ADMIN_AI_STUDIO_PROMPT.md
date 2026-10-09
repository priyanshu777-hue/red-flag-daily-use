Make exactly the changes below and NOTHING else. Strictly do not change, restyle, reformat or "improve" any existing page, component, style, form, script, route or file that is not named here: home page, /franchise and every other page stay exactly as they are.

What this does:
- Adds the admin panel at /admin (email + password sign-in).
- Fixes the /bella page. You rewrote its JavaScript last time, which broke the "How it works" envelope and 60-second timer, the price route, Bella's greetings, the calculator and the plan cards.
- Adds the Journal pages.

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

```js
// Red Flag Homes: serve the Bella, Admin and Journal pages byte for byte from GitHub (via the jsDelivr CDN).
// Paste as-is into the Express server, right after `const app = express()` and BEFORE express.static and the
// single-page-app catch-all. Do not edit the files' code; to update the pages, only change RF_VERSION.
const RF_VERSION = 'abc7ff507e4b80eb47d2a807988510fd48bee9d5';
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
- The home page and every other page look and behave exactly as before.
- These calls fail as expected:
  - A webhook POST with a wrong signature returns 400.
  - `/api/admin/write-post` without a token returns 401 or 403.
- List every file you created, changed or deleted. It must only be: the server file, the home page (one line), `public/admin-config.json`, and the deleted copies from step 1.
