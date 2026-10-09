Add a "Bella" button to the mobile bottom tab bar on the home page. Make exactly the 4 edits below in the home page HTML and NOTHING else. Don't change any other page, element, style, script or file, and don't restyle the tab bar.

## 1. Add the Bella tab (HTML)
Inside `<nav class="mtb" id="mtb">`, insert this block directly BEFORE the Sign in tab (`<a class="mtb-tab mtb-signin" href="#signin" id="mtbSignin" …>`), so the order becomes Home, Stay, Explore, Partner, **Bella**, Sign in:

```html
  <a class="mtb-tab mtb-bella" href="/bella/" aria-label="Meet Bella, your AI co-host">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2"/><rect x="3" y="13.5" width="4" height="6" rx="1.6"/><rect x="17" y="13.5" width="4" height="6" rx="1.6"/><path d="M19 19.5c0 1.5-1.8 2.2-4 2.2h-2.2"/></svg>
    <span>Bella</span>
  </a>
```

It is a normal link to `/bella/` (a full page load). Don't turn it into a router link or a button.

## 2. Tooltip text (JS)
In the tab-bar tooltip script, change:

```js
var TEXT = ['Home', 'Book a stay', 'Explore homes', 'Partner with us', 'Sign in'];
```

to:

```js
var TEXT = ['Home', 'Book a stay', 'Explore homes', 'Partner with us', 'Meet Bella', 'Sign in'];
```

## 3. Sign-in tooltip index (JS)
The Sign in tab moves from position 4 to 5, so change both existing calls:
- `setMtbTipText(4, 'Sign in')` → `setMtbTipText(5, 'Sign in')`
- `setMtbTipText(4, 'Sign out')` → `setMtbTipText(5, 'Sign out')`

Don't change anything else in those scripts (the sliding pip and the section map stay as they are).

## 4. Small phones (CSS)
Add this rule at the end of the existing tab-bar `<style>` block, so 6 tabs fit comfortably on 320–400px wide screens:

```css
@media (max-width: 400px) {
  .mtb { gap: 0.2rem; padding: 0.45rem 0.6rem; }
  .mtb-tab, .mtb-pip { width: 2.6rem; }
}
```

## Check before you finish
- On a 390px-wide phone the bar shows 6 icons in this order: Home, Stay, Explore, Partner, Bella (a headset), Sign in. The bar fits on screen at 320px too.
- Tapping Bella opens `/bella/`.
- The tooltips read "Meet Bella" on the Bella icon and "Sign in" / "Sign out" on the Google icon.
- The sliding highlight still follows the sections while scrolling.
- Desktop navigation, the menu, the footer and every other page are unchanged.
- List the one file you changed.
