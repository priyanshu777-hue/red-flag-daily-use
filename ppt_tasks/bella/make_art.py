"""Art for the Bella deck: arch- and circle-cropped Bella portraits from the supplied mascot image, plus film-grain
backgrounds. Run: python make_art.py"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ART = Path(__file__).resolve().parent / "art"
BLACK, CREAM = (20, 18, 20), (244, 239, 232)


def arch():
    src = Image.open(ART / "bella_source.png").convert("RGB")
    box = (470, 120, 1690, 1400)                     # above the baked-in name label
    im = src.crop(box)
    w, h = im.size
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.rectangle((0, w / 2, w, h), fill=255)
    d.ellipse((0, 0, w, w), fill=255)
    out = Image.new("RGBA", (w, h))
    out.paste(im, (0, 0), mask)
    out.save(ART / "bella_arch.png")


def avatar():
    src = Image.open(ART / "bella_source.png").convert("RGB")
    im = src.crop((660, 180, 1500, 1020)).resize((600, 600), Image.LANCZOS)
    mask = Image.new("L", (600, 600), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 599, 599), fill=255)
    out = Image.new("RGBA", (600, 600))
    out.paste(im, (0, 0), mask)
    out.save(ART / "bella_avatar.png")


def grain(name, base, strength=14, size=(2400, 1350)):
    noise = Image.effect_noise(size, 40).convert("L").filter(ImageFilter.GaussianBlur(.5))
    img = Image.new("RGB", size, base)
    lighter = Image.new("RGB", size, tuple(min(255, c + strength) for c in base))
    img = Image.composite(lighter, img, noise.point(lambda v: 70 if v > 150 else 0))
    img.save(ART / f"{name}.jpg", quality=90)


if __name__ == "__main__":
    arch()
    avatar()
    grain("grain_black", BLACK)
    grain("grain_cream", CREAM, strength=-8)
    print(sorted(p.name for p in ART.iterdir()))
