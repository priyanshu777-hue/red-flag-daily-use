Add the attached file `admin.html` to my website as an admin panel at **redflaghomes.in/admin**, exactly as it is.

1. Copy the file byte for byte to `public/admin/index.html`.
   - Don't convert it to React or JSX, don't wrap it in the site's layout, header, footer or global CSS, and don't change its code.
   - It is a finished, standalone page. It uses the site's existing `/firebase-applet-config.json` and Firebase project, so add no new Firebase setup.
2. Routing: `/admin` and `/admin/` must load `/admin/index.html` as a full standalone page.
   - In the React router, the only thing allowed for `/admin` is `window.location.replace('/admin/')`. Never redirect `/admin/` itself.
   - On the server or hosting, serve static files before the single-page-app catch-all, and map `/admin` and `/admin/` to `admin/index.html`.
   - Right now `/admin` shows the home page. That must stop.
3. Don't add an "Admin" link to the public navigation, sitemap or footer. The page already has `noindex, nofollow`.
4. Don't change `firebase-client.js`, `form-handler.js`, the forms, or any other page.
5. Sign-in: the panel uses Google sign-in with `signInWithPopup` on the same Firebase project as the site. Make sure `redflaghomes.in` is in Firebase Authentication → Settings → Authorized domains (it should be already, because the site's sign-in uses it).
6. Check before you finish:
   - `/admin/` shows the "Admin" sign-in card with no site header.
   - "Preview with sample data" opens the dashboard.
   - There are no console errors on load.
   - Every other page is unchanged.
   - List the files you changed.

I will add the Firestore admin rules myself (the panel's Setup page shows them). Don't change `firestore.rules` unless I ask.
