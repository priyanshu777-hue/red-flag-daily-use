Add the attached file `bella-redflaghomes.html` to my existing website as a new page at **redflaghomes.in/bella**, exactly as it is.

RULES
1. Do not redesign, rewrite, convert or "improve" the page. Do not turn it into React or JSX, split it into components, rename classes, change text, or remove any CSS or JavaScript. It is a finished, self-contained page (inline CSS and JS, Google Fonts, images from cdn.jsdelivr.net). It must look and behave exactly like the attached file.
2. Copy the file byte for byte to `public/bella/index.html`. Create the folders if they don't exist. Do not add anything around it, such as my site's header, footer, layout wrapper, global CSS or Tailwind. The page has its own header and footer.
3. Do not change any existing page, route, style or component except for the navigation link and routing described below.

ROUTING
4. Both `/bella` and `/bella/` must show this page as a full, standalone page.
   - If the app uses React Router or another client-side router, add one route for exactly `/bella` that does a full page load to the static file: `window.location.replace('/bella/')`. Use a full reload, not client-side navigation. Never redirect `/bella/` itself, so there is no loop.
   - If there is a server file (for example Express for Cloud Run), make sure static files in `public` (or the build output, `dist`) are served before the single-page-app catch-all route. Also add `/bella` and `/bella/` routes that send `bella/index.html`.
   - If the hosting has its own rewrite settings (firebase.json, vercel.json, netlify `_redirects`), add a rule so `/bella` and `/bella/` serve `/bella/index.html` before the catch-all to `/index.html`.
5. Only if none of the above is possible: render the page in a full-screen `<iframe src="/bella/index.html">` (100vw × 100dvh, no border, no site header) with `sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-top-navigation-by-user-activation allow-modals"`, so payment links can open.

NAVIGATION
6. Add a "Bella" item to the site's main navigation, after the existing items, on desktop and in the mobile menu. Use the same style as the other items. Link it with a plain `<a href="/bella/">` (full page load, not a router Link). If the footer has a link list, add "Bella" there too.

DON'T BREAK THESE (they must still work after deployment)
7. The page's own features must keep working:
   - The pinned hero: Bella rides a walking, colour-changing chameleon, greets in many languages and does gestures.
   - All scroll stories and the INR/USD and Monthly/Yearly switches.
   - The pre-checkout questions, which redirect to Stripe (USD) or Razorpay (INR).
   - The FAQ.
   - The legal box (footer → Legal).
   - Language detection: Hinglish for India, the browser language otherwise.
8. Keep the hash links `/bella#terms`, `/bella#privacy`, `/bella#refunds`, `/bella#delivery`, `/bella#cookies` and `/bella#disclaimer`. They open the legal documents and are used for payment-gateway verification. Don't let the router strip the `#…` part.
9. Don't add a Content-Security-Policy that blocks fonts.googleapis.com, fonts.gstatic.com, cdn.jsdelivr.net, buy.stripe.com, rzp.io or wa.me.

CHECK BEFORE YOU FINISH
- Opening /bella and /bella/ shows the page with no extra site header and no layout changes. All images load, there are no console errors, and the mobile layout works at 390px wide.
- The "Bella" nav link appears on desktop and mobile and opens the page.
- Every other page of the site is unchanged.
- Tell me which files you created or changed.
