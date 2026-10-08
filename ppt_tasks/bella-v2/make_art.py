"""Original art for Bella v2: the Bella AI-avatar orb (an original mark, not a copy of any other brand), the gold
'Sol' glow, thin gold line icons, and grain backgrounds. SVG rendered with headless Chromium. Run: python make_art.py"""
from pathlib import Path

from PIL import Image, ImageFilter
from playwright.sync_api import sync_playwright

ART = Path(__file__).resolve().parent / "art"
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
GOLD = "#C9A66B"

ORB = """<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
<defs>
 <radialGradient id="halo"><stop offset=".45" stop-color="#C9A66B" stop-opacity=".35"/><stop offset=".7" stop-color="#C8102E" stop-opacity=".12"/>
  <stop offset="1" stop-color="#C8102E" stop-opacity="0"/></radialGradient>
 <radialGradient id="core" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#FFF4DC"/><stop offset=".22" stop-color="#E9C88E"/>
  <stop offset=".5" stop-color="#C8102E"/><stop offset=".78" stop-color="#4A0812"/><stop offset="1" stop-color="#140306"/></radialGradient>
 <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3DFAE"/><stop offset=".5" stop-color="#C9A66B"/>
  <stop offset="1" stop-color="#7C5C2A"/></linearGradient>
 <linearGradient id="silk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE9C2" stop-opacity=".0"/>
  <stop offset=".5" stop-color="#FFE9C2" stop-opacity=".55"/><stop offset="1" stop-color="#FFE9C2" stop-opacity="0"/></linearGradient>
 <clipPath id="c"><circle cx="500" cy="500" r="300"/></clipPath>
 <filter id="b18" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="22"/></filter>
 <filter id="b6" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="9"/></filter>
 <radialGradient id="iri" cx=".7" cy=".75" r=".6"><stop offset="0" stop-color="#8E5CF6" stop-opacity=".45"/>
  <stop offset="1" stop-color="#8E5CF6" stop-opacity="0"/></radialGradient>
</defs>
<circle cx="500" cy="500" r="490" fill="url(#halo)"/>
<circle cx="500" cy="500" r="300" fill="url(#core)"/>
<g clip-path="url(#c)">
 <circle cx="500" cy="500" r="300" fill="url(#iri)"/>
 <ellipse cx="520" cy="560" rx="330" ry="46" fill="#FFE3B8" opacity=".38" transform="rotate(-18 520 560)" filter="url(#b18)"/>
 <ellipse cx="540" cy="650" rx="300" ry="20" fill="#FFE3B8" opacity=".35" transform="rotate(-12 540 650)" filter="url(#b6)"/>
 <ellipse cx="410" cy="350" rx="120" ry="70" fill="#FFFFFF" opacity=".45" filter="url(#b18)"/>
</g>
<text x="500" y="575" font-family="Cormorant Garamond" font-style="italic" font-size="230" fill="#FFF6E4" fill-opacity=".92"
 text-anchor="middle">B</text>
<circle cx="500" cy="500" r="318" fill="none" stroke="url(#ring)" stroke-width="5"/>
<circle cx="500" cy="500" r="340" fill="none" stroke="#C9A66B" stroke-opacity=".35" stroke-width="1.5"/>
<circle cx="818" cy="500" r="9" fill="#F3DFAE"/>
</svg>"""

GLOW = """<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
<defs><radialGradient id="g"><stop offset="0" stop-color="#E9C88E" stop-opacity=".85"/><stop offset=".45" stop-color="#C9A66B" stop-opacity=".35"/>
<stop offset="1" stop-color="#C9A66B" stop-opacity="0"/></radialGradient></defs>
<circle cx="500" cy="500" r="490" fill="url(#g)"/>
<circle cx="500" cy="500" r="250" fill="none" stroke="#C9A66B" stroke-opacity=".6" stroke-width="2"/></svg>"""

S = f'fill="none" stroke="{GOLD}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"'
ICONS = {
    "i_reply": f'<path {S} d="M40 50 h120 a14 14 0 0 1 14 14 v56 a14 14 0 0 1 -14 14 h-64 l-34 26 v-26 h-22 a14 14 0 0 1 -14 -14 v-56 a14 14 0 0 1 14 -14z"/><path {S} d="M66 92 h68 M66 112 h40"/>',
    "i_price": f'<path {S} d="M40 150 L80 104 L112 126 L160 60"/><path {S} d="M130 60 h30 v30"/><path {S} d="M36 170 h132"/>',
    "i_key": f'<circle {S} cx="72" cy="100" r="30"/><path {S} d="M102 100 h66 M146 100 v24 M166 100 v18"/>',
    "i_cal": f'<rect {S} x="36" y="48" width="128" height="116" rx="14"/><path {S} d="M36 84 h128 M70 34 v28 M130 34 v28"/><path {S} d="M70 112 l20 20 l40 -40"/>',
    "i_audit": f'<circle {S} cx="88" cy="88" r="44"/><path {S} d="M120 120 L166 166"/><path {S} d="M70 88 l12 12 l24 -26"/>',
    "i_cohost": f'<path {S} d="M100 36 l14 40 l40 14 l-40 14 l-14 40 l-14 -40 l-40 -14 l40 -14z"/><path {S} d="M150 136 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 l16 -6z"/>',
}


def grain(name, base, delta):
    size = (2400, 1350)
    noise = Image.effect_noise(size, 40).convert("L").filter(ImageFilter.GaussianBlur(.5))
    img = Image.new("RGB", size, base)
    shade = Image.new("RGB", size, tuple(max(0, min(255, c + delta)) for c in base))
    Image.composite(shade, img, noise.point(lambda v: 60 if v > 150 else 0)).save(ART / f"{name}.jpg", quality=90)


def main():
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME)
        pg = b.new_page(device_scale_factor=2)
        jobs = {"orb": (ORB, 1000), "glow": (GLOW, 1000)}
        jobs.update({k: (f'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">{v}</svg>', 200)
                     for k, v in ICONS.items()})
        for name, (svg, sz) in jobs.items():
            pg.set_viewport_size({"width": sz, "height": sz})
            pg.set_content(f'<html><body style="margin:0;background:transparent">{svg}</body></html>')
            pg.wait_for_timeout(100)
            pg.screenshot(path=str(ART / f"{name}.png"), omit_background=True)
        b.close()
    grain("grain_black", (11, 10, 12), 12)
    grain("grain_cream", (244, 239, 232), -7)
    print(sorted(x.name for x in ART.iterdir()))


if __name__ == "__main__":
    main()
