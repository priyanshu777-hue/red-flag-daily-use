Attach these 3 files: `admin.html`, `journal.js` and `journal-index.html` (the Journal page; it is `journal/index.html` in the repo). Then paste everything below.

---

Update my website with three things: the new admin panel, a Journal for the homepage "Explore" section, and Bella payment tracking. Copy attached files byte for byte. Don't convert them to React, don't wrap them in the site layout and don't change their code. Don't change any other page, form or script unless a step below says so.

## 1. Admin panel
- Replace `public/admin/index.html` with the attached `admin.html`.
- `/admin` and `/admin/` must load it as a full standalone page.

## 2. Journal (homepage "Explore" + story pages)
- Save the attached `journal.js` as `public/journal.js`. It must be served at `/journal.js`.
- Save the attached `journal-index.html` as `public/journal/index.html`.
- Routing: `/journal`, `/journal/` and every `/journal/<anything>` must serve `journal/index.html`. That one page shows the story list and each story by reading the URL.
  - Add these to the server and hosting rewrites before the single-page-app catch-all.
  - In the React router, `/journal` paths must do a full page load, not client-side routing.
- On the home page, add exactly one line right before the final closing `</body>` tag at the very end of the file (the file also contains the text "</body>" inside a script earlier; don’t put it there): `<script src="/journal.js" defer></script>`.
  - Don't change the Explore section's HTML, CSS, `articles` array or `renderArticleCard()`. `journal.js` reuses them.
  - When stories are published in /admin, the Explore cards show them and link to `/journal/<slug>`. Until then the page looks exactly as it does now.
- Add `/journal/` to `sitemap.xml` if the site has one.

## 3. Bella payment webhooks (Razorpay + Stripe → Firestore `bellaPayments`)
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

## 4. AI writer for the Journal: `POST /api/admin/write-post`
- **Auth:** read `Authorization: Bearer <Firebase ID token>`.
  - Verify it with `firebase-admin` `auth().verifyIdToken`.
  - Allow only if `email_verified` is true and the email is in `process.env.ADMIN_EMAILS` (comma separated, case-insensitive). Otherwise reply 403 `{ "error": "Not an admin" }`.
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

## 5. Secrets
Add these in AI Studio's secrets / environment settings. I will paste the values myself:
`RAZORPAY_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`, `ADMIN_EMAILS`.

## 6. Check before you finish
- `/admin/` loads with no console errors, and "Preview with sample data" shows the Bella payments and Journal sections.
- `/journal/` loads and says "No stories yet" until something is published.
- The home page Explore section looks exactly as before.
- These calls fail as expected:
  - A POST to each webhook with a wrong signature returns 400.
  - `/api/admin/write-post` without a token returns 401 or 403.
- No other page changed.
- List every file you created or changed.
