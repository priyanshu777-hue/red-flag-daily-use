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
- Design system: sand #D8C2A4 (hero and hosts background), paper #FBF8F3, black #0B0A0C, cream #F4EFE8, champagne gold #C9A66B, red #C8102E for buttons only. Fonts: Outfit (headings, buttons, numbers; a geometric face in the style of Surgena, weights 500–600, tight letter-spacing) and DM Sans (body) from Google Fonts. The wordmark is lowercase "bella" followed by a red dot.
- BUTTONS AND CONTROLS (tactile, glossy, glass):
  - Primary button: red pill with a vertical gradient (#E5324A → #C8102E → #A40B24), a soft white highlight on the top half, inner shadow at the bottom and a red glow below; lifts 1px on hover and presses in on tap.
  - Secondary button: frosted-glass pill (white gradient, backdrop blur, bright top edge, soft drop shadow); on dark sections, a translucent glass pill.
  - Header: brand pill on the left and a centred-right frosted-glass pill nav (Features, Pricing, FAQ) with a black glossy "Get Bella" button inside, floating over the page.
  - Toggles (Monthly/Yearly, INR/USD): dark inset track with a glossy white glass knob that slides behind the active option with a slight springy overshoot.
  - "Turn Bella on" switch: dark inset track with a large glass knob showing a moon when off and a glowing sun when on; the track turns green.
  - Listings in the savings calculator: a tactile number roller (orange glossy window with a rolling digit, up/down arrows; also works with arrow keys, mouse wheel and swiping).
- RECEIPT ON THE WAY TO PAYMENT: after the last question, a gold printer slot "prints" a paper receipt (Bella by Red Flag Homes, Plan, Billing, Listings, Commission: None, Total, "Cancel anytime · Setup guide by email") for about 1.5 seconds, with "Thanks, <first name>! Printing your plan…", then redirect automatically (keep the "Tap here to pay" fallback link).
- FOOTER: a dark section with large rounded top corners, a short line "Your bnb never sleeps. Now neither does Bella.", a Get Bella button, three link columns (Bella, Contact, Legal), a huge "bella" wordmark with a red dot fading out downwards, and a small glowing purple orb that slides along the footer's top edge following the pointer.
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
- HERO EXTRAS: the chameleon's eye has a live pupil (a small dark circle over the painted-out eye in the artwork, at 17.6% from the left and 51.4% from the top of the image) that follows the visitor's pointer and blinks every few seconds. Tapping the chameleon makes it hop and switches to the next guest moment and colour.
- NIGHT-SHIFT INBOX (in the problem section): a dark phone-style "Guest inbox" at 2:04 AM. When it scrolls into view, five guest messages slide in one by one (Delhi, London, Tokyo in Japanese, Dubai, Mumbai flight cancellation), each with a red "waiting X min" counter that keeps rising while the clock ticks. A sleepy Bella face says "5 guests waiting. You're asleep." A switch "Turn Bella on": when switched on, each message turns green with "replied in 3 s" and Bella's reply under it, the face becomes happy, and the status says "All 5 guests answered while you slept." Switching off resets the demo. Use the exact messages from the file.
- CO-HOST CHAT DEMO (languages section): a small chat where the visitor can tap example requests or type their own; Bella shows a typing indicator, then "✓ Done. …" with a reply matched to keywords (dates, prices, check-in, Wi-Fi, reviews, cleaning). Label it "Demo. In your account, Bella does this on your real listing."
- SAVINGS CALCULATOR ("See what you keep.", just before pricing): sliders for nightly rate, nights booked a month and listings (1–5). Show what a 20% property manager would take a month, the matching Bella monthly plan price (Solo for 1, Growth for 2–3, Pro for 4–5) and "You keep" the difference, in the currency chosen in the pricing switch (INR range ₹1,000–₹20,000, USD $30–$600). The button "Get Bella <plan>" opens the same pre-payment questions for that plan. Note: "An estimate from the numbers you enter. Your real earnings depend on your bookings."
- SMALL MOTION: the three host characters sway gently; the final "Hosted by Bella" picture tilts slightly towards the pointer. Turn all of this off when the visitor prefers reduced motion.
- BELLA WAVES AND TALKS: Bella's raised hand is a separate layer (bella-assets/bella-hand.webp, same size as bella-chameleon.webp) that rotates around her wrist (55.88% from the left, 22.69% from the top) in a short wave. She waves when the page opens, every 7 seconds, when the pointer moves over her, and when she is tapped; on hover or tap a white speech bubble next to her head says hello in the current guest moment's language (for example "Namaste! Main Bella hoon.", "Bonjour ! Je suis Bella.", "こんにちは！ベラです。").
- FAQ (blue-violet 3D style): a section with a blue-to-violet gradient background. Above a dark navy rounded card, a floating scene: a large extruded 3D question mark (layered shadows plus a glossy highlight) standing on a teal "goo" blob, glossy teal, violet and blue orbs and a white chat bubble with three dots. The scene floats gently and shifts in depth with the pointer; opening a question makes the question mark bounce and the chat bubble's dots blink. The card has a small "FAQ" chip, the title "Frequently asked questions", a striped divider, a short line, a search box that filters the questions as you type (with a "No question matches…" message), and accordion items as glassy rows with a round blue + button that turns into ×. Only one answer is open at a time.
- A DAY WITH BELLA (pinned scroll story, on phones too): the section stays pinned while the visitor scrolls through 7 moments (2:04 AM guest replies, 6:30 AM smart pricing, 11:00 AM automatic check-in, 2:15 PM calendar blocking, 5:40 PM listing audit, 9:20 PM Co-Host chat, 11:50 PM Airbnb support). A wide rounded illustrated landscape (built from layered inline SVG, like an eco-tourism parallax site): a big mountain with a snowy peak and mist, rolling hills, an A-frame cabin whose windows glow warmer after dark, a path, pine trees that slide in from both sides as the section scrolls into view, and foreground bushes. Every layer moves at a different speed as you scroll (parallax), and the landscape colours change with the time of day (green by day, golden at sunset, blue-black at night). On desktop the time buttons and card float over the scene in a frosted-glass panel on the right. In the foreground stands full-body Bella in a matching pose (pose-typing, bella-phone, pose-key, pose-calendar). The sky colour follows the time of day (night navy, dawn peach, midday blue, sunset orange, dusk purple, night) with stars at night, and a sun or moon moves along an arc behind her. Each moment holds its colours, then blends into the next. When a moment arrives, Bella says what she did in a white speech bubble (e.g. "Replied in 3 seconds. Go back to sleep!", "Festival weekend! Raising your rate."), and a white card slides in with her small expression avatar, the time, the title and the text. A row of 7 time buttons jumps to each moment, a thin progress bar shows how far through the day you are, and tapping Bella makes her hop and repeat her line.
- HOSTS: a sand section "Bella works for every kind of host." with the three host characters standing on a line (bella-assets/host-lady-tea.webp, host-man-key.webp, host-cowboy.webp — the cowboy is the villa host). Tapping a host lifts it, shows it in full colour and changes the text card below: Homestay host / City apartment host / Villa host with the exact copy from the file. These are example hosts, never present them as testimonials or quotes.
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
- PLAN CARDS (travel-app style): three tall cards with very rounded corners (about 36px). The top of each card is an illustrated landscape (inline SVG: mountain, hills, pine trees and A-frame cabins: 1 cabin for Solo, 3 for Growth, 5 for Pro) that fades into the card's tinted background: deep teal for Solo, olive for Growth (raised slightly, with a white "Most popular" tag), plum for Pro. Three small dots under the picture switch it between dawn, midday and dusk (swipe on phones). Below: plan name on the left and a dark translucent price pill on the right (e.g. "₹1,699 / month"), a short grey description, the billed-yearly line, rounded chips (listings, key features, "Airbnb claims for you [YEARLY]", greyed out on monthly), and a big white pill button "Get Bella <plan>" at the bottom. Cards lift a little on hover.
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
