Add one "Meet Bella" button to the home page hero, directly below "Partner With Us". Make exactly this one edit in the home page HTML and NOTHING else. Don't change any other element, style, script, page or file.

Inside `<div id="hero-actions">`, find this existing line:

```html
<a href="/franchise" class="btn-pill btn-outline">Partner With Us</a>
```

and add this new line directly after it:

```html
<a href="/bella/" class="btn-pill btn-outline">Meet Bella</a>
```

- Use the existing `btn-pill btn-outline` classes only. Don't add new CSS.
- It is a normal link to `/bella/` (a full page load). Don't make it a router link.

Check before you finish:
- On a phone the hero shows three stacked buttons: Book a Stay, Partner With Us, Meet Bella. All three are the same width.
- On desktop the three buttons sit side by side.
- Tapping Meet Bella opens `/bella/`.
- Nothing else on the page changed.
- List the one file you changed.
