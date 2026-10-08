# Google AI Studio prompt: add a "Bella" tab to redflaghomes.in

Upload `bella.html` and every image in the `bella-assets/` folder from this repo together with the prompt below. Keep the images in a folder called `bella-assets` next to the page (the page loads them from there). It is the finished page, so AI Studio only has to move it into your site instead of designing it again.

---

```
Add a new page to my existing website (redflaghomes.in) called "Bella". Do not change any other page, section, style or behaviour of the site.

1. NAVIGATION
- Add a new tab "Bella" to the main navigation, after the existing tabs, on desktop and in the mobile menu.
- It opens a new route: /bella
- Keep my existing header, logo and footer on the rest of the site. On the /bella page, use the page's own header and footer from the attached file.

2. PAGE CONTENT AND DESIGN
- Use the attached file bella.html as the exact design, copy and behaviour for the /bella page. Convert it to the same framework and file structure my site already uses (components, routing, styling). Keep the text, sections, colours, fonts, spacing and animations exactly as in the file.
- Design system: sand #D8C2A4 (hero and hosts background), paper #FBF8F3, black #0B0A0C, cream #F4EFE8, champagne gold #C9A66B, red #C8102E for buttons only. Fonts: Cormorant Garamond (headings) and DM Sans (body) from Google Fonts.
- Sections, top to bottom: light header, hero scroll story, highlights strip, problem, "a day with Bella" timeline, hosts, Airbnb support and claims, languages + Co-Host chat, how it works, pricing, FAQ, final call to action with the "Hosted by Bella" house picture and WhatsApp/email contact, footer, floating WhatsApp button.
- It is a single landing page. All "Get Bella" buttons scroll to the pricing section.
- HERO SCROLL STORY (inspired by a colour-changing chameleon site): the hero is pinned while the visitor scrolls through about 3.4 screen heights.
  - Headline: "Hi, I'm Bella, your next-gen AI co-host." Lede: "I reply to your guests, set your prices, send check-in details and block your calendar. 24/7, in 50+ languages." Buttons: Get Bella, Chat on WhatsApp.
  - Behind everything, a giant cream "BELLA" in the serif font that drifts slightly sideways as you scroll.
  - Bella sits on a big friendly chameleon (bella-assets/bella-chameleon.webp). On top of it sits bella-assets/chameleon-tint.webp, which contains only the chameleon's skin; recolour it with CSS filter hue-rotate so the chameleon changes colour while Bella stays the same. While the visitor scrolls, Bella and the chameleon move slowly from right to left and bob gently like walking.
  - Four guest moments, one per quarter of the scroll. Each sets the chameleon colour, a matching soft background colour, and a chat card (bottom left) with the guest's question and Bella's reply, plus four tappable time tabs that jump to each moment:
    1. 2:04 AM, guest from Delhi (Hinglish: "India Gate kitni door hai?" / "Sirf 10 min door.") for visitors in India; for everyone else their browser language or English ("How far is the nearest metro station?" / "Just a 5-minute walk. I'll send you the directions now.") — rose chameleon, background #E7C9C1
    2. 7:30 AM, guest from Paris, French — teal chameleon, background #C3D5CB
    3. 1:15 PM, guest from Dubai, Arabic (right-to-left) — saffron chameleon, background #EBCD9E
    4. 9:40 PM, guest from Tokyo, Japanese — violet chameleon, background #D4C6D9
  - When a moment changes, Bella's reply shows a typing indicator for about 1 second first. Use the exact translations from the file.
  - Hide the floating WhatsApp button while the hero is on screen (the hero has its own WhatsApp button).
- A DAY WITH BELLA: a timeline of one day (2:04 AM guest replies, 6:30 AM smart pricing, 11:00 AM automatic check-in, 2:15 PM calendar blocking, 5:40 PM listing audit, 9:20 PM Co-Host chat, 11:50 PM Airbnb support), times in large serif numerals on a thin gold line, each item with a small round Bella expression (bella-assets/face-*.webp). On desktop a sticky full-body Bella on the left changes pose to match the item being read (pose-typing, bella-phone, pose-key, pose-calendar), with the active item at full opacity and the rest dimmed. Do not turn it into a card grid.
- HOSTS: a sand section "Bella works for every kind of host." with the three host characters standing on a line (bella-assets/host-lady-tea.webp, host-man-key.webp, host-man-cake.webp). Tapping a host lifts it, shows it in full colour and changes the text card below: Homestay host / City apartment host / Villa host with the exact copy from the file. These are example hosts, never present them as testimonials or quotes.
- FINAL CTA: show bella-assets/hosted-by-bella.webp (Bella with the two hosts outside a house with a "Hosted by Bella" sign) above "Your guests don't wait. Neither should your bnb."
- STYLE RULES: no small all-caps labels above headings, no single coloured/italic word inside headlines, no arrows appended to buttons, no fade-in animation on every section.
- LIVE LANGUAGE DEMO in the languages section: 13 tappable language buttons; tapping one shows a typing indicator, then Bella's reply in that language (Arabic right-to-left). Visitors in India start in Hinglish, everyone else in their browser language or English.

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
- QUESTIONS BEFORE PAYMENT: when a visitor taps any plan button, do NOT go to the payment link straight away. Open a full-screen (mobile) / centred (desktop) popup that asks one question at a time, rapid-fire, with a gold progress bar ("Question 1 of 5"), Back button and Enter-to-continue:
  1. "First, what's your name?"
  2. "Hi <first name>! What email do you use on Airbnb?" (helper: "Your 60-second setup guide will be sent here.")
  3. "Which city is your listing in?"
  4. "And your phone number?" (prefill +91 for India visitors; helper: "We only use it for WhatsApp updates about your setup.")
  5. "Last one: how many listings do you have?" with buttons 1 / 2–3 / 4–5 / 6+.
  Validate each answer inline. If their listings exceed the chosen plan, show a tip with a "Switch to Growth/Pro" button. If they pick 6+, show WhatsApp us / Email us for a custom plan instead of payment. Otherwise, as soon as they tap their listings answer, save the answers (POST to the LEAD_ENDPOINT Google Apps Script URL, see bella-leads-google-sheet.gs), show "Thanks, <first name>! Taking you to secure payment…" with a spinner, and after about 1 second redirect automatically in the same tab to the plan's payment link. Under the spinner show: "Not redirected automatically? Tap here to pay" linking to the same payment link. If the plan is too small for their listings, show "Switch to <bigger plan>" and "Keep <plan>"; either button then redirects the same way. For Stripe links, add ?prefilled_email=<their email>.
- SETUP COPY: never show the co-host email or setup steps on the page. The "How it works" section says: "No new app. No new sign-up. Just 60 seconds." Steps: Choose your plan → Check your inbox (setup guide arrives at your registered email right after payment) → Bella goes live (finish the single 60-second step). Under it: "No new app to install · No new account or sign-up · Works with your existing Airbnb account". Hero fine print says "60-second setup".
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
