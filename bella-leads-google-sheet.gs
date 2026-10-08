/**
 * Bella pre-checkout answers -> Google Sheet
 *
 * 1. Create a Google Sheet. Extensions > Apps Script. Paste this file and save.
 * 2. Deploy > New deployment > type "Web app".
 *    Execute as: Me. Who has access: Anyone. Deploy and copy the web app URL.
 * 3. In bella.html, paste that URL into LEAD_ENDPOINT.
 *
 * Every time a host answers the questions and taps "Continue to payment"
 * (or asks for a custom 6+ listings plan), one row is added to the sheet.
 */
var HEADERS = ['time', 'name', 'email', 'city', 'phone', 'listings', 'plan', 'period', 'currency', 'price', 'outcome', 'page'];

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) {}
  sheet.appendRow(HEADERS.map(function (h) { return d[h] == null ? '' : String(d[h]).slice(0, 300); }));
  return ContentService.createTextOutput('ok');
}
