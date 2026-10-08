# Google AI Studio prompt: add a "Bella" tab to redflaghomes.in

Upload `bella.html` from this repo together with the prompt below. It is the finished page, so AI Studio only has to move it into your site instead of designing it again.

---

```
Add a new page to my existing website (redflaghomes.in) called "Bella". Do not change any other page, section, style or behaviour of the site.

1. NAVIGATION
- Add a new tab "Bella" to the main navigation, after the existing tabs, on desktop and in the mobile menu.
- It opens a new route: /bella
- Keep my existing header, logo and footer on the rest of the site. On the /bella page, use the page's own header and footer from the attached file.

2. PAGE CONTENT AND DESIGN
- Use the attached file bella.html as the exact design, copy and behaviour for the /bella page. Convert it to the same framework and file structure my site already uses (components, routing, styling). Keep the text, sections, colours, fonts, spacing and animations exactly as in the file.
- Design system: black #0B0A0C, cream #F4EFE8, champagne gold #C9A66B, red #C8102E for buttons only. Fonts: Cormorant Garamond (headings) and DM Sans (body) from Google Fonts.
- Sections, top to bottom: header, hero with phone chat demo, highlights strip, problem, features (6 cards), languages + Co-Host chat, how it works (3 steps), pricing, FAQ, final call to action with WhatsApp and email contact, footer, floating WhatsApp button.
- It is a single landing page. All "Get Bella" buttons scroll to the pricing section.
- HERO 3D CHARACTER: keep the animated 3D Bella exactly as in the file (built with three.js 0.149.0 from primitives, no model files): a friendly female co-host with a gold headset, black blazer and a phone, who waves every few seconds, blinks, follows the mouse with her head and nods when she replies. Tapping her makes her wave. Pause the animation when it is off screen, and show a still pose when the visitor prefers reduced motion.
- LIVE LANGUAGE DEMO: the guest question and Bella's reply in the hero (and the chat in the languages section) change with the visitor:
  - Visitors in India (timezone Asia/Kolkata) see Hinglish: Guest "India Gate kitni door hai?" / Bella "Sirf 10 min door."
  - Everyone else sees their browser language if available, otherwise English: Guest "How far is the nearest metro station?" / Bella "Just a 5-minute walk. I'll send you the directions now."
  - The language buttons (hero: English, Hinglish, العربية, Français, 日本語, All 50+; languages section: 13 languages) are tappable. Tapping one shows a typing indicator for about 1 second, then Bella's reply in that language. Arabic is shown right-to-left. Use the exact translations from the file.

3. PRICING SECTION (most important)
- Above the plan cards, show two switches: "Monthly / Yearly" and "₹ INR / $ USD".
- Next to the period switch, show a flashing red badge "Save 15% on yearly". When Yearly is selected it turns green and says "You save 15%".
- The currency switch on this page offers ONLY INR and USD. My site's global currency changer must not affect this page. Default: INR for visitors in India, USD for everyone else. Remember the visitor's choice in the browser.
- Plans and prices:
  Solo (1 listing):      ₹999 / month, ₹10,190 / year  |  $23 / month, $235 / year
  Growth (up to 3, "Most popular"): ₹1,699 / month, ₹17,330 / year  |  $39 / month, $398 / year
  Pro (up to 5):         ₹2,499 / month, ₹25,490 / year  |  $57 / month, $581 / year
- Under a yearly price, show the monthly equivalent and the full price struck through, for example "About ₹849/mo · ~~₹11,988~~ billed yearly".
- Each plan's button opens that plan's payment link in a new tab:
  USD monthly: Solo https://buy.stripe.com/3cI6oJfHdgnt6Qn9yZ6EU0b
               Growth https://buy.stripe.com/aFacN7gLh1szcaH3aB6EU0d
               Pro https://buy.stripe.com/6oU28t66Ddbh1w38uV6EU0e
  USD yearly:  Solo https://buy.stripe.com/eVq6oJ1Qn5IPfmT4eF6EU0f
               Growth https://buy.stripe.com/8x2fZj1Qn9Z5fmT7qR6EU0g
               Pro https://buy.stripe.com/8x27sN3YvfjpeiP5iJ6EU0h
  INR monthly: Solo https://rzp.io/rzp/3Zsqj85
               Growth https://rzp.io/rzp/9umNXlPX
               Pro https://rzp.io/rzp/HEfRz13h
  INR yearly:  Solo https://rzp.io/rzp/fX36cAf
               Growth https://rzp.io/rzp/O4yuwWqY
               Pro https://rzp.io/rzp/VcOfpiv
- Below the three plans, add a full-width card "More than 5 listings?" titled "Bella for portfolios and property managers", with two buttons: "WhatsApp us" and "Email us".
- AIRBNB SUPPORT AND CLAIMS: add a cream section after the features titled "Bella even talks to Airbnb support for you." with two cards: "Airbnb customer support" (emergencies, cancellations and urgent guest issues, so the host is less likely to be penalised for a missed response; all plans) and "Airbnb claims, filed for you" with a red "Yearly plans" tag (included with every yearly plan, up to 5 listings). Small note: "Bella works as your co-host with the access you give her. Airbnb makes the final decision on every claim."
- Under the pricing switches: "Yearly plans also include Airbnb claims filed on your behalf." In every plan card, list "Talks to Airbnb support for you" and "Airbnb claims for you [Yearly]". When Monthly is selected, the claims line turns grey and reads "Airbnb claims: switch to yearly".
- Add the two matching FAQ entries from the file, and the extra pain point "Miss an emergency or cancellation and Airbnb can penalise your listing for not responding."
- Line under pricing: "No free trial. Pay monthly, or pay yearly and save 15%. Cancel anytime, and your access continues until the end of the period you paid for."

4. CONTACT
- WhatsApp number: [YOUR NUMBER, e.g. 919876543210]. All WhatsApp buttons open https://wa.me/<number>?text=<prefilled message>.
- Email: bella@redflaghomes.in (mailto link with a subject).
- Floating round green WhatsApp button at the bottom right on every screen size.

5. QUALITY
- Mobile first; no horizontal scrolling at 360px width. On mobile, show the Growth card first.
- Buttons at least 44px tall, visible keyboard focus, respect "reduce motion".
- Page title: "Bella by Red Flag Homes". Meta description: "Bella is your next-gen AI Co-Host. Guest replies in 50+ languages, smart pricing, check-ins and calendar blocking, 24/7. No commission. Cancel anytime."
- Footer links to Terms, Privacy and Refund and cancellation pages (create simple placeholder pages if they do not exist yet).
```
