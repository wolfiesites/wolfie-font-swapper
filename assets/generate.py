# -*- coding: utf-8 -*-
"""
Generator materiałów promo dla Wolfie Font Swapper (PNG-i do Chrome Web Store
+ animowany GIF z podmianą fontów). Wymaga: Pillow. Fonty z C:\\Windows\\Fonts.
Uruchom: python assets/generate.py  (z katalogu projektu)
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets")
FONTS = r"C:\Windows\Fonts"

# ---- Marka (kolory z popup.css) ----
BG       = (30, 30, 36)     # #1e1e24
SURFACE  = (42, 42, 51)     # #2a2a33
SURFACE2 = (52, 52, 63)     # #34343f
TEXT     = (242, 242, 245)  # #f2f2f5
MUTED    = (154, 154, 168)  # #9a9aa8
PINK     = (255, 61, 174)   # #ff3dae
CYAN     = (0, 224, 255)    # #00e0ff
BORDER   = (60, 60, 71)     # #3c3c47
GREEN    = (76, 217, 100)   # #4cd964
GREENB   = (46, 107, 62)    # #2e6b3e
GOLD     = (255, 184, 74)   # #ffb84a
GOLDB    = (106, 90, 30)    # #6a5a1e
PAGE     = (244, 244, 247)
PAGETX   = (34, 34, 42)


def F(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


UI   = lambda s: F("segoeui.ttf", s)
UIB  = lambda s: F("seguisb.ttf", s)
UIBD = lambda s: F("segoeuib.ttf", s)

ICON = Image.open(os.path.join(ROOT, "icons", "icon128.png")).convert("RGBA")


def tw(draw, text, font):
    return draw.textlength(text, font=font)


def rrect(draw, box, r, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def tag(draw, x, y, label, kind):
    """kind: 'green' (Web-safe/Free) lub 'gold' (Premium/System)."""
    col, bd = (GREEN, GREENB) if kind == "green" else (GOLD, GOLDB)
    f = UI(15)
    pad = 8
    w = tw(draw, label, f) + pad * 2
    rrect(draw, [x, y, x + w, y + 24], 5, fill=None, outline=bd, width=1)
    draw.text((x + pad, y + 4), label, font=f, fill=col)
    return w


# Wiersze listy: (nazwa, plik_fonta, etykieta, rodzaj)
ROWS = [
    ("Georgia",        "georgia.ttf", "Web-safe",  "green"),
    ("Verdana",        "verdana.ttf", "Web-safe",  "green"),
    ("Impact",         "impact.ttf",  "Web-safe",  "green"),
    ("Consolas",       "consola.ttf", "Premium $", "gold"),
    ("Comic Sans MS",  "comic.ttf",   "Web-safe",  "green"),
    ("Candara",        "Candara.ttf", "Premium $", "gold"),
    ("Trebuchet MS",   "trebuc.ttf",  "Web-safe",  "green"),
]


def draw_panel(base, px, py, pw, selected=0, search_text="Georgia", open_list=True):
    """Rysuje panel Wolfie Font Swapper. Zwraca wysokość."""
    d = ImageDraw.Draw(base)
    rows_n = len(ROWS) if open_list else 0
    ph = (188 + rows_n * 46 + 16) if open_list else 150
    # tło panelu
    rrect(d, [px, py, px + pw, py + ph], 16, fill=BG, outline=BORDER, width=2)
    # nagłówek: ikona + tytuł
    ic = ICON.resize((30, 30))
    base.paste(ic, (px + 18, py + 18), ic)
    d.text((px + 56, py + 20), "WOLFIE FONT SWAPPER", font=UIB(17), fill=TEXT)
    d.text((px + 56, py + 42), "preview · swap · copy CSS", font=UI(13), fill=MUTED)
    # input
    iy = py + 74
    rrect(d, [px + 18, iy, px + pw - 18, iy + 38], 9, fill=SURFACE, outline=PINK, width=2)
    d.text((px + 30, iy + 9), search_text, font=UIB(16), fill=TEXT)
    # marker $ / klawisz
    if open_list:
        ly = iy + 50
        rrect(d, [px + 18, ly, px + pw - 18, ly + rows_n * 46 + 8], 10,
              fill=(36, 36, 44), outline=BORDER, width=1)
        for i, (name, ff, label, kind) in enumerate(ROWS):
            ry = ly + 6 + i * 46
            if i == selected:
                rrect(d, [px + 22, ry, px + pw - 22, ry + 42], 8,
                      fill=SURFACE2, outline=PINK, width=1)
            try:
                nf = F(ff, 22)
            except Exception:
                nf = UI(22)
            d.text((px + 34, ry + 7), name, font=nf, fill=TEXT)
            lblw = tw(d, label, UI(15)) + 16
            tag(d, px + pw - 34 - lblw, ry + 9, label, kind)
    # przyciski / chipy
    by = py + ph - 52
    for j, (lbl, w) in enumerate([("Bold", 56), ("Size M", 70), ("1.8", 48)]):
        bx = px + 18 + sum([56, 70, 48][:j]) + j * 8
        rrect(d, [bx, by, bx + w, by + 28], 14, fill=SURFACE2, outline=BORDER, width=1)
        d.text((bx + 12, by + 6), lbl, font=UI(13), fill=MUTED)
    # Copy (akcent)
    cw = 150
    rrect(d, [px + pw - 18 - cw, by, px + pw - 18, by + 28], 8, fill=PINK)
    d.text((px + pw - 18 - cw + 30, by + 6), "Copy CSS", font=UIB(14), fill=(255, 255, 255))
    return ph


def article(base, x, y, w, heading, hfont_file, body_col=PAGETX):
    """Rysuje fragment 'strony' (artykuł) z nagłówkiem w danym foncie."""
    d = ImageDraw.Draw(base)
    try:
        hf = F(hfont_file, 52)
    except Exception:
        hf = UIBD(52)
    d.text((x, y), heading, font=hf, fill=body_col)
    bf = F("georgia.ttf", 19)
    lines = [
        "Typography sets the tone of a page. With Wolfie Font Swapper you",
        "preview any font live, compare options, and copy production-ready",
        "CSS in one click — Google Fonts and system fonts, side by side.",
    ]
    for i, ln in enumerate(lines):
        d.text((x, y + 78 + i * 30), ln, font=bf, fill=(90, 90, 102))


# =========================================================================
# 1) SCREENSHOT 1 — panel z listą na tle strony (1280x800)
# =========================================================================
def screenshot_main():
    W, H = 1280, 800
    img = Image.new("RGB", (W, H), PAGE)
    d = ImageDraw.Draw(img)
    # pasek przeglądarki
    d.rectangle([0, 0, W, 56], fill=(225, 225, 230))
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse([24 + i * 26, 22, 38 + i * 26, 36], fill=c)
    rrect(d, [120, 16, W - 24, 40], 12, fill=(248, 248, 250), outline=(210, 210, 216), width=1)
    d.text((140, 20), "example.com/article", font=UI(15), fill=(120, 120, 130))
    # artykuł
    article(img, 70, 130, 700, "The quick brown fox", "georgia.ttf")
    # panel po prawej
    draw_panel(img, 760, 96, 480, selected=0, search_text="Search a font…", open_list=True)
    # podpis
    d.text((70, 720), "Live font preview & swap on any page — with copyable CSS.",
           font=UIB(22), fill=PAGETX)
    img.save(os.path.join(OUT, "screenshot-1-search.png"))


# =========================================================================
# 2) SCREENSHOT 2 — tagi licencji (1280x800)
# =========================================================================
def screenshot_tags():
    W, H = 1280, 800
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    ic = ICON.resize((44, 44)); img.paste(ic, (70, 60), ic)
    d.text((128, 64), "Know what you can use on the web", font=UIBD(30), fill=TEXT)
    d.text((128, 104), "Every font is tagged — no guessing about licenses.", font=UI(20), fill=MUTED)
    items = [
        ("Web-safe", "green", "No license needed — use it directly",
         "Arial, Georgia, Times — preinstalled on every device."),
        ("Free", "green", "Free to self-host",
         "Hack, Fira Code, JetBrains Mono — open source (OFL / MIT)."),
        ("Premium $", "gold", "Needs a webfont license",
         "Calibri, Tahoma, Helvetica, Gotham — proprietary fonts."),
        ("System", "gold", "Check the license first",
         "Locally installed, unknown origin — verify before using on the web."),
    ]
    y = 190
    for label, kind, title, desc in items:
        rrect(d, [70, y, 1210, y + 96], 14, fill=SURFACE, outline=BORDER, width=1)
        w = tag(d, 100, y + 34, label, kind)
        d.text((100 + w + 30, y + 24), title, font=UIB(21), fill=TEXT)
        d.text((100 + w + 30, y + 54), desc, font=UI(17), fill=MUTED)
        y += 116
    d.text((70, 690), "Premium fonts are never redistributed — we link you to license them legally.",
           font=UI(18), fill=MUTED)
    img.save(os.path.join(OUT, "screenshot-2-tags.png"))


# =========================================================================
# 3) MARQUEE promo (1400x560) i mały kafelek (440x280)
# =========================================================================
def promo_marquee():
    W, H = 1400, 560
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    # gradient-ish akcent
    for i in range(H):
        t = i / H
        c = (int(30 + 8 * t), int(30 + 2 * t), int(36 + 14 * t))
        d.line([(0, i), (W, i)], fill=c)
    ic = ICON.resize((120, 120)); img.paste(ic, (90, 80), ic)
    d.text((240, 96), "Wolfie Font Swapper", font=UIBD(58), fill=TEXT)
    d.text((242, 168), "Preview, swap & copy fonts on any website", font=UI(30), fill=CYAN)
    feats = ["Live font preview & swap on any page",
             "Google Fonts + system fonts, side by side",
             "License tags: Web-safe / Free / Premium",
             "One-click CSS & @font-face snippets",
             "Presets & per-domain rules · 9 languages"]
    for i, ftxt in enumerate(feats):
        fy = 256 + i * 46
        d.ellipse([242, fy + 7, 256, fy + 21], fill=PINK)
        d.text((276, fy), ftxt, font=UIB(23), fill=TEXT)
    # kompaktowa karta po prawej (header + input + przykładowe kroje + Copy)
    cx, cy, cw, ch = 968, 150, 372, 286
    rrect(d, [cx, cy, cx + cw, cy + ch], 16, fill=BG, outline=BORDER, width=2)
    ic2 = ICON.resize((28, 28)); img.paste(ic2, (cx + 18, cy + 18), ic2)
    d.text((cx + 54, cy + 19), "WOLFIE FONT SWAPPER", font=UIB(16), fill=TEXT)
    iy = cy + 60
    rrect(d, [cx + 18, iy, cx + cw - 18, iy + 36], 9, fill=SURFACE, outline=PINK, width=2)
    d.text((cx + 30, iy + 8), "Inter", font=UIB(16), fill=TEXT)
    samples = [("Montserrat", "georgiab.ttf", "Google", "gold"),
               ("JetBrains Mono", "consola.ttf", "Free", "green"),
               ("Helvetica", "arial.ttf", "Premium $", "gold")]
    for i, (nm, ff, lb, kd) in enumerate(samples):
        ry = iy + 50 + i * 40
        try:
            nf = F(ff, 20)
        except Exception:
            nf = UI(20)
        d.text((cx + 30, ry), nm, font=nf, fill=TEXT)
        lw = tw(d, lb, UI(15)) + 16
        tag(d, cx + cw - 30 - lw, ry + 2, lb, kd)
    by = cy + ch - 46
    cwb = 150
    rrect(d, [cx + cw - 18 - cwb, by, cx + cw - 18, by + 30], 8, fill=PINK)
    d.text((cx + cw - 18 - cwb + 28, by + 7), "Copy CSS", font=UIB(14), fill=(255, 255, 255))
    img.save(os.path.join(OUT, "promo-marquee-1400x560.png"))

    # mały kafelek
    t = Image.new("RGB", (440, 280), BG)
    dt = ImageDraw.Draw(t)
    ic2 = ICON.resize((96, 96)); t.paste(ic2, (28, 28), ic2)
    dt.text((140, 40), "Wolfie", font=UIBD(40), fill=TEXT)
    dt.text((140, 86), "Font Swapper", font=UIBD(34), fill=PINK)
    dt.text((30, 170), "Preview · swap · copy CSS", font=UIB(20), fill=CYAN)
    dt.text((30, 206), "on any website", font=UI(18), fill=MUTED)
    t.save(os.path.join(OUT, "promo-tile-440x280.png"))


# =========================================================================
# 4) ANIMOWANY GIF — podmiana fontu nagłówka (960x600)
# =========================================================================
def animated_gif():
    W, H = 960, 600
    cycle = [
        ("Georgia",       "georgia.ttf", 0),
        ("Impact",        "impact.ttf",  2),
        ("Comic Sans MS", "comic.ttf",   4),
        ("Consolas",      "consola.ttf", 3),
        ("Verdana",       "verdana.ttf", 1),
        ("Trebuchet MS",  "trebuc.ttf",  6),
    ]
    frames = []
    for name, ff, sel in cycle:
        img = Image.new("RGB", (W, H), PAGE)
        d = ImageDraw.Draw(img)
        # pasek
        d.rectangle([0, 0, W, 44], fill=(225, 225, 230))
        for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
            d.ellipse([20 + i * 22, 16, 32 + i * 22, 28], fill=c)
        # artykuł z nagłówkiem w danym foncie
        try:
            hf = F(ff, 46)
        except Exception:
            hf = UIBD(46)
        d.text((48, 92), "The quick brown fox", font=hf, fill=PAGETX)
        bf = F("georgia.ttf", 17)
        for i, ln in enumerate([
            "Wolfie Font Swapper changes the font live, right on the page,",
            "so you can compare options and copy the CSS in one click.",
        ]):
            d.text((48, 168 + i * 26), ln, font=bf, fill=(90, 90, 102))
        # badge aktualnego fonta
        rrect(d, [48, 240, 48 + tw(d, "font-family: " + name, UIB(16)) + 24, 274], 8,
              fill=BG)
        d.text((60, 247), "font-family: " + name, font=UIB(16), fill=CYAN)
        # panel po prawej (z podświetlonym wierszem)
        draw_panel(img, 560, 70, 360, selected=sel, search_text=name, open_list=True)
        frames.append(img.convert("P", palette=Image.ADAPTIVE, colors=128))
    frames[0].save(
        os.path.join(OUT, "demo-font-swap.gif"),
        save_all=True, append_images=frames[1:],
        duration=950, loop=0, disposal=2, optimize=True,
    )


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    screenshot_main()
    screenshot_tags()
    promo_marquee()
    animated_gif()
    print("Done. Files in:", OUT)
    for f in sorted(os.listdir(OUT)):
        if f.lower().endswith((".png", ".gif")):
            p = os.path.join(OUT, f)
            print(f"  {f}  ({os.path.getsize(p)//1024} KB)")
