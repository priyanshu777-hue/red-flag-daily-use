# Bella on Instagram: research and content plan

Account: [@redflag.homes](https://www.instagram.com/redflag.homes/). On 11 Oct 2026 it had 184 followers and 10 posts. The two Bella launch posts from 10 Oct had no likes or comments yet.

## What we're selling

Bella is an AI co-host for Indian short-term rental hosts (Airbnb, homestays, villas). She works over WhatsApp. Claims we can use, all from the Bella brochure:

- She replies to guests in about 3 seconds, 24/7, in 50+ languages, including Hinglish.
- She sets nightly prices for weekends, festivals and demand.
- She sends check-in details and blocks the calendar so nothing gets double-booked.
- She talks to bnb support for the host.
- Bella takes 0% commission. A property manager takes a cut.

Don't claim any of these: a commission figure for a specific competitor, Bella's price, or user and booking numbers. We have no sources for them.

## Competitors

| Who | What they are | Gap Bella can use |
|---|---|---|
| **The Blue Kite** ([@staywiththebluekite](https://www.thebluekite.com/)) | A full-service manager, part of Vianaar, running since 2016. It manages 250+ homes in Goa, Delhi, Nainital, Kasauli and Shimla, and is a Superhost on many listings ([Airbtics](https://airbtics.com/airbnb-management-companies/the-blue-kite-195764429)). Its Instagram is about guest-facing villa content. | They take over the property and charge for it. Bella keeps the host in charge and takes nothing. Their content speaks to guests; ours speaks to hosts. |
| Goa and Delhi managers (Alaya Stays, SelectStays, Getaway Villas, and others) | Commission-based managers. Fees are negotiated per contract and not published ([Airbtics directory](https://airbtics.com/airbnb-management-companies/selectstays-443217578)). | The same "keep 100%" angle. |
| Global AI tools (Hospitable, Hostaway AI, Conduit, PriceLabs) | Priced in dollars or euros, built for Western hosts. None are WhatsApp-first or speak Hinglish ([overview](https://www.hostfully.com/blog/ai-tools-for-airbnb-hosts/)). | Bella is built for India: WhatsApp, Hinglish, Diwali and long-weekend pricing. |
| Airbnb's own AI | Airbnb's fall 2026 update adds suggested price ranges and AI earnings summaries ([Airbnb](https://news.airbnb.com/airbnb-2026-fall-update)). | It only covers Airbnb. It doesn't handle WhatsApp guests or messages at 2 AM. |

### What works for vacation-rental accounts in 2026

- Reels drive reach to non-followers, and shares, saves and DM sends count for more than likes ([Houfy](https://www.houfy.com/blog/instagram-for-vacation-rentals-whats-working-in-2026)).
- Content led by the host's own voice beats polished ads.
- Posting consistently matters more than chasing one viral hit.

## Content pillars

1. **Normal or relatable (40%).** Host pain humour: messages at 2 AM, "Wi-Fi password?" for the 40th time, festival pricing panic, a guest who arrives 5 hours early. These are built to be shared to a host friend.
2. **Engagement (30%).** Questions, "this or that", "tag a host who…", and "reply with your worst guest message" stories. These are built to get comments and DMs.
3. **Marketing (30%).** Bella demos: inbox before and after, 0% against a manager's cut, a pricing tune-up for Diwali, a Hinglish reply. Each ends with **Comment "BELLA"**.

Avoid the couple and "red flag" relationship reels from September. They don't reach hosts.

## Cadence

**From 15 Oct 2026, the owner asked for stories only.** On 21 Oct they added feed carousels twice a week, in the same chat-screenshot style as the stories. The automation still posts no reels. Other feed posts are made by hand.

| Format | How often | When (IST) |
|---|---|---|
| Stories | 3 a day | about 9 AM, 1:30 PM and 8 PM |
| Feed carousels (8 to 10 slides, 1080x1350) | 2 a week, Tuesday and Friday | with the morning run, about 9 AM |
| Threads text posts | 2 a day | about 11 AM and 6:30 PM |

## Threads

The owner asked for Threads posting on 16 Oct 2026. Composio has no Threads connector, so Threads posts go out through Orshot. Orshot holds the scheduled post and sends it even if this session is offline. Nothing posts until a Threads account is connected in Orshot.

- Posts are text, under 500 characters. Threads rewards conversation, so most posts end on a question.
- Each day: one relatable or engagement post, plus one soft or marketing post. Never post two marketing posts on the same day.
- Draw from `threads/bank.json` and set `used` to the date each post went out. Once fewer than 4 unused posts remain, write new ones under the same claim rules and check them with ig-human's `detect.py`.
- Don't post the same hook on Threads and in a story on the same day.
- Marketing CTAs point to Instagram DMs (@redflag.homes), since that inbox is the one we check.

## The CTA loop

Stories ask for a reply or a DM, and replies land in the inbox. Answer each one within the day; Meta only allows replies within 24 hours. Rotate the three daily stories between relatable, engagement and soft Bella mentions, and keep at least one that asks for a reply.

Check every week: story replies, DMs, "BELLA" comments on the owner's own posts, and follower growth.

## Production

The templates are in `templates/`. Stories are rendered from HTML at 1080x1920. Reels are frames rendered from HTML, joined with ffmpeg and given a synthesized notification sound. Everything posted lives in a dated folder, such as `2026-10-11/`. Canva and Adobe Express are connected and can be used for photo-led posts.

## Feed carousels

Started 21 Oct 2026 with "Every guest's favourite word: chhota sa" (`carousels/2026-10-21-chhota-sa/`).

- 8 to 10 slides: a cover slide with a hook and "Swipe", 6 to 8 chat-screenshot slides (a guest bubble, the host's reply, and a punchline reveal), and a last slide with a soft Bella CTA ("Comment BELLA").
- Build them with `templates/carousel_tpl.html` and `render_carousel.js`. Alternate dark and blush slides. Fix any LAYOUT WARN before posting.
- One theme per carousel, a series of mini-scenes. Don't reuse a story hook from the same week.
- Caption: a hook line, an ask for a comment (a number or a word), one line about Bella using allowed claims only, Comment "BELLA", and 5 hashtags. Check it with ig-human `detect.py`.
- Post with INSTAGRAM_CREATE_CAROUSEL_CONTAINER (`child_image_urls`, pinned raw.githubusercontent URLs, no `share_to_feed`), then INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH.

## Languages (owner's request, 21 Oct 2026)

Content goes out in both English and Hinglish.
- Carousels: the Tuesday one is in English (chats, headlines and reveals). The Friday one is in Hinglish (chats in Roman Hinglish, with short English labels such as "ACTUAL SIZE"). Every carousel caption has an English part and a Hinglish line.
- Stories: each day, at least one story is fully in English and at least one is in Hinglish.
