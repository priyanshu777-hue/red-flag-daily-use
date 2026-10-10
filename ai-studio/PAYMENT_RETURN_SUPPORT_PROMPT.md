Update the Bella payment return page so buyers see a confirmation with the invoice, transaction ID and support details. Make exactly the change below and NOTHING else. Don't change any page, component, style, webhook, or other route.

## 1. Update the pinned page version
In the Express server file, find the line in the Red Flag pages block that starts with `const RF_VERSION =`. Change it to exactly this (keep the quotes and semicolon):

```js
const RF_VERSION = '5413101362ffc378bda11e3ce8145dbd302b3fbf';
```

Change nothing else in that block or in the checkout block.

## 2. Keep the webhook and receipt code as is
Don't change the webhook routes, `/api/bella/receipt`, the Razorpay or Stripe keys, or the account creation. They already capture every payment and return the bill details.

## 3. Secrets (check only)
Confirm these secrets exist in AI Studio. If one is missing, tell me which one; don't invent a value:
- `RAZORPAY_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY` (the restricted `rk_…` key), `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `ADMIN_EMAILS`

## 4. Check before you finish
- `https://redflaghomes.in/bella/thank-you` loads and shows "Confirming your payment…".
- After a successful test payment, the page shows:
  - "Payment successful" and "Welcome to Bella, <first name>."
  - An invoice with the Red Flag Homes details, invoice number, billed-to name, email and phone, the plan, the total paid, the transaction ID (with a Copy button), and the payment method.
  - Buttons: "Download / print bill", "Email support" (opens an email to hello@redflaghomes.in with the transaction ID filled in), and "WhatsApp us".
  - A support line with hello@redflaghomes.in.
- After a failed or unfinished payment, the page shows "Your payment didn't go through", with "Try again", "Send us a WhatsApp", and the support line hello@redflaghomes.in.
- `/bella/`, `/admin/`, `/journal/`, `/sitemap.xml` and `/robots.txt` still work.
- Every other page is unchanged.
- List the one file you changed.
