The /admin page shows "Email/password sign-in is turned off in Firebase". Fix the Firebase setup for the admin login. Make exactly the changes below and NOTHING else. Don't change any page, component, style or the code that serves /admin, /bella or /journal.

## 1. One-time admin setup on server start
Add this block exactly as written to the Express server file, after `firebase-admin` is initialized (the same place the webhooks use it). If `firebase-admin` isn't initialized yet, initialize it with default credentials and the `projectId` from `firebase-applet-config.json`. If `google-auth-library` isn't installed, add it as a dependency (it usually comes with `firebase-admin`).

```js
// One-time admin setup: turns on email/password sign-in and creates (or updates) the admin login.
// It only runs when the ADMIN_PASSWORD secret is set. Remove that secret after the admin can log in.
async function rfAdminSetup() {
  const email = 'priyanshu@redflaghomes.in';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return;
  try {
    const cfg = await (await fetch('https://redflaghomes.in/firebase-applet-config.json')).json();
    const { GoogleAuth } = await import('google-auth-library');
    const token = await new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] }).getAccessToken();
    const r = await fetch('https://identitytoolkit.googleapis.com/admin/v2/projects/' + cfg.projectId + '/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired', {
      method: 'PATCH',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'X-Goog-User-Project': cfg.projectId },
      body: JSON.stringify({ signIn: { email: { enabled: true, passwordRequired: true } } })
    });
    console.log('[admin-setup] email/password sign-in:', r.ok ? 'enabled' : 'FAILED ' + r.status + ' ' + (await r.text()).slice(0, 300));
    const { getAuth } = await import('firebase-admin/auth');
    const auth = getAuth();
    try {
      const user = await auth.getUserByEmail(email);
      await auth.updateUser(user.uid, { password, emailVerified: true });
      console.log('[admin-setup] admin login updated for', email);
    } catch (e) {
      if (e && e.code === 'auth/user-not-found') { await auth.createUser({ email, password, emailVerified: true }); console.log('[admin-setup] admin login created for', email); }
      else throw e;
    }
  } catch (e) {
    console.error('[admin-setup] failed:', e && e.message);
  }
}
rfAdminSetup();
```

- Never print, store or hard-code the password anywhere. It only comes from the `ADMIN_PASSWORD` secret.
- If the file is TypeScript, you may type `e` as `any`. Change nothing else.

## 2. Secret
Add a secret named `ADMIN_PASSWORD` in AI Studio's secrets / environment settings. I will paste the value myself. Don't put the value in code or in this chat.

## 3. Firestore rules for the admin
In this project's Firestore rules (`firestore.rules` for the database in `firebase-applet-config.json`), keep every existing rule exactly as it is. Add the block below inside `match /databases/{database}/documents { … }`, then deploy the rules the same way this project already deploys them:

```
function isRfAdmin() {
  return request.auth != null
    && (request.auth.token.email_verified == true || request.auth.token.firebase.sign_in_provider == 'password')
    && request.auth.token.email in ['priyanshu@redflaghomes.in'];
}
match /applications/{id}  { allow read, update, delete: if isRfAdmin(); }
match /inquiries/{id}     { allow read, update, delete: if isRfAdmin(); }
match /users/{id}         { allow read: if isRfAdmin(); }
match /posts/{id}         { allow read: if resource.data.status == 'published' || isRfAdmin();
                            allow create, update, delete: if isRfAdmin(); }
match /bellaPayments/{id} { allow read, update: if isRfAdmin(); }
```

These rules only ADD access for the admin email. Don't remove or loosen any existing rule.

## 4. Check before you finish
- The server log shows `[admin-setup] email/password sign-in: enabled` and `[admin-setup] admin login created` (or `updated`).
  - If it shows `FAILED 403` or another error, stop and tell me the exact log line. Don't work around it.
- The rules are deployed, and the existing rules are unchanged apart from the added block.
- List every file you changed.
