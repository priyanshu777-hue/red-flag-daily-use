Add "Meet Bella" to the home page on MOBILE ONLY: a hero button under "Partner With Us" and a Bella tab in the bottom tab bar. Desktop must stay exactly as it is now. Make exactly the edits below in the home page HTML and NOTHING else. Don't change any other page, element, style, script or file, and don't restyle anything.

## 1. Hero button (mobile only)
Inside `<div id="hero-actions">`, find this existing line:

```html
<a href="/franchise" class="btn-pill btn-outline">Partner With Us</a>
```

and add this new line directly after it:

```html
<a href="/bella/" class="btn-pill btn-outline hero-bella-btn">Meet Bella</a>
```

Then hide it on desktop by adding this rule at the end of an existing `<style>` block on the home page:

```css
@media (min-width: 768px) {
  #hero-actions .hero-bella-btn { display: none !important; }
}
```

## 2. Bottom tab bar: add the Bella tab (HTML)
Inside `<nav class="mtb" id="mtb">`, insert this block directly BEFORE the Sign in tab (`<a class="mtb-tab mtb-signin" href="#signin" id="mtbSignin" …>`), so the order becomes Home, Stay, Explore, Partner, **Bella**, Sign in:

```html
  <a class="mtb-tab mtb-bella" href="/bella/" aria-label="Meet Bella, your AI co-host">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2"/><rect x="3" y="13.5" width="4" height="6" rx="1.6"/><rect x="17" y="13.5" width="4" height="6" rx="1.6"/><path d="M19 19.5c0 1.5-1.8 2.2-4 2.2h-2.2"/></svg>
    <span>Bella</span>
  </a>
```

It is a normal link to `/bella/` (a full page load). Don't turn it into a router link or a button.

## 3. Tab bar tooltip text (JS)
In the tab-bar tooltip script, change:

```js
var TEXT = ['Home', 'Book a stay', 'Explore homes', 'Partner with us', 'Sign in'];
```

to:

```js
var TEXT = ['Home', 'Book a stay', 'Explore homes', 'Partner with us', 'Meet Bella', 'Sign in'];
```

## 4. Sign-in tooltip index (JS)
The Sign in tab moves from position 4 to 5, so change both existing calls:
- `setMtbTipText(4, 'Sign in')` → `setMtbTipText(5, 'Sign in')`
- `setMtbTipText(4, 'Sign out')` → `setMtbTipText(5, 'Sign out')`

Don't change anything else in those scripts (the sliding pip and the section map stay as they are).

## 5. Small phones (CSS)
Add this rule at the end of the existing tab-bar `<style>` block, so 6 tabs fit comfortably on 320–400px wide screens:

```css
@media (max-width: 400px) {
  .mtb { gap: 0.2rem; padding: 0.45rem 0.6rem; }
  .mtb-tab, .mtb-pip { width: 2.6rem; }
}
```

## Check before you finish
- **Phone (390px wide):**
  - The hero shows three stacked buttons of equal width: Book a Stay, Partner With Us, Meet Bella.
  - The bottom bar shows 6 icons: Home, Stay, Explore, Partner, Bella (a headset), Sign in. It still fits at 320px.
- **Desktop (768px and wider):**
  - The hero shows only Book a Stay and Partner With Us, exactly as before.
  - No bottom bar, and no other change.
- Meet Bella and the Bella tab both open `/bella/`.
- The tooltips read "Meet Bella" on the Bella tab and "Sign in" / "Sign out" on the Google icon.
- The sliding highlight in the tab bar still follows the sections while scrolling.
- List the one file you changed.
