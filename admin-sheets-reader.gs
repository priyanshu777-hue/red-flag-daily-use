/**
 * Red Flag Homes – Admin sheet reader
 *
 * Lets redflaghomes.in/admin show the rows of your Google Sheets (website form leads, Bella leads)
 * to signed-in admins only. It never writes anything and does not touch your existing form script.
 *
 * Setup (5 minutes):
 *  1. Go to https://script.new to create a NEW, separate Apps Script project. Name it "Red Flag admin reader".
 *  2. Paste this whole file in place of the sample code. Save.
 *  3. Project Settings (gear) → Script properties → add:
 *       SHEET_IDS        the IDs of the spreadsheets to show, comma separated
 *                        (the long part of each sheet URL: docs.google.com/spreadsheets/d/<THIS PART>/edit)
 *       ADMIN_EMAILS     the Google emails allowed to read, comma separated
 *       FIREBASE_API_KEY the "apiKey" value from https://redflaghomes.in/firebase-applet-config.json
 *  4. Deploy → New deployment → type "Web app" → Execute as: Me → Who has access: Anyone → Deploy.
 *     Approve the permissions it asks for (it only reads your sheets).
 *  5. Copy the web app URL (ends with /exec) into SHEETS_READER_URL in the admin panel config.
 *
 * Security: every request must carry the admin's Firebase sign-in token. The script checks the token
 * with Google and only answers if the email is verified and listed in ADMIN_EMAILS.
 */

var MAX_ROWS = 1000; // newest rows returned per tab

function doGet(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var email = verifyAdmin_((e && e.parameter && e.parameter.idToken) || '', props);
    var ids = String(props.getProperty('SHEET_IDS') || '').split(',').map(trim_).filter(String);
    var out = [];
    ids.forEach(function (id) {
      var book = SpreadsheetApp.openById(id);
      book.getSheets().forEach(function (sh) {
        var values = sh.getDataRange().getDisplayValues();
        if (!values.length) return;
        var headers = values[0].map(function (h, i) { return String(h || ('Column ' + (i + 1))); });
        var rows = values.slice(1).filter(function (r) { return r.some(function (c) { return c !== ''; }); });
        out.push({
          book: book.getName(), sheet: sh.getName(), headers: headers,
          total: rows.length, rows: rows.slice(-MAX_ROWS).reverse() // newest first
        });
      });
    });
    return json_({ ok: true, admin: email, sources: out, at: new Date().toISOString() });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

// Checks the Firebase ID token with Google Identity Toolkit and returns the admin's email.
function verifyAdmin_(idToken, props) {
  if (!idToken) throw new Error('Not signed in');
  var key = props.getProperty('FIREBASE_API_KEY');
  if (!key) throw new Error('FIREBASE_API_KEY is not set');
  var res = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(key), {
    method: 'post', contentType: 'application/json', payload: JSON.stringify({ idToken: idToken }), muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error('Sign-in expired. Please sign in again.');
  var user = (JSON.parse(res.getContentText()).users || [])[0] || {};
  var email = String(user.email || '').toLowerCase();
  var allowed = String(props.getProperty('ADMIN_EMAILS') || '').toLowerCase().split(',').map(trim_);
  if (!email || !user.emailVerified || allowed.indexOf(email) === -1) throw new Error('This Google account is not an admin');
  return email;
}

function trim_(s) { return String(s).trim(); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
