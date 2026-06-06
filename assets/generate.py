# -*- coding: utf-8 -*-
"""
Generator materiałów promo dla Wolfie Font Swapper (PNG-i do Chrome Web Store
+ animowany GIF z podmianą fontów). Wymaga: Pillow. Fonty z C:\\Windows\\Fonts.
Uruchom: python assets/generate.py  (z katalogu projektu)

Mockup odzwierciedla AKTUALNY popup: nagłówek z przyciskami, wiersz Edit text /
Reset, pasek reguły domeny (per-domain), 5 sekcji (Whole page / Headings /
Paragraphs / Navigation / Buttons), chipy (Bold · S M L XL · Spacing · 1.8 · Aa),
presety z kropką "persistent per-domain", taby snippetu CSS/SCSS/JS.
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets")
FONTS = r"C:\Windows\Fonts"

# ---- Marka (kolory z popup.css :root) ----
BG        = (30, 30, 36)     # #1e1e24
SURFACE   = (42, 42, 51)     # #2a2a33
SURFACE2  = (52, 52, 63)     # #34343f
TEXT      = (242, 242, 245)  # #f2f2f5
MUTED     = (154, 154, 168)  # #9a9aa8
ACCENT    = (255, 61, 174)   # #ff3dae  (primary)
CYAN      = (0, 224, 255)    # #00e0ff  (accent-2)
BORDER    = (60, 60, 71)     # #3c3c47
GREEN     = (76, 217, 100)   # #4cd964
GREENB    = (46, 107, 62)    # #2e6b3e
GOLD      = (255, 184, 74)   # #ffb84a
GOLDB     = (106, 90, 30)    # #6a5a1e
RED       = (255, 107, 107)  # #ff6b6b
PAGE      = (244, 244, 247)
PAGETX    = (34, 34, 42)


def F(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


UI   = lambda s: F("segoeui.ttf", s)
UIB  = lambda s: F("seguisb.ttf", s)
UIBD = lambda s: F("segoeuib.ttf", s)

# Logo: głowa wilka (jak w popupie), wyciągnięta z icons/wolfie-logo.svg
_wolf = os.path.join(OUT, "wolf-head.png")
ICON = Image.open(_wolf if os.path.exists(_wolf)
                  else os.path.join(ROOT, "icons", "icon128.png")).convert("RGBA")


def tw(draw, text, font):
    return draw.textlength(text, font=font)


def rrect(draw, box, r, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def hgradient(w, h, c1, c2):
    g = Image.new("RGB", (w, h))
    dg = ImageDraw.Draw(g)
    for x in range(w):
        t = x / max(1, w - 1)
        dg.line([(x, 0), (x, h)], fill=tuple(int(c1[k] + (c2[k] - c1[k]) * t) for k in range(3)))
    return g


def round_top_mask(w, h, r):
    m = Image.new("L", (w, h), 0)
    dm = ImageDraw.Draw(m)
    dm.rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=255)
    dm.rectangle([0, h - r, w, h], fill=255)
    return m


def tag(draw, x, y, label, kind):
    """kind: 'green' (Web-safe/Free) | 'gold' (Premium/System)."""
    col, bd = (GREEN, GREENB) if kind == "green" else (GOLD, GOLDB)
    f = UI(14)
    pad = 8
    w = tw(draw, label, f) + pad * 2
    rrect(draw, [x, y, x + w, y + 22], 5, outline=bd, width=1)
    draw.text((x + pad, y + 3), label, font=f, fill=col)
    return w


def chip(d, x, y, label, active=False, h=26, font=None):
    f = font or UI(13)
    pad = 10
    w = tw(d, label, f) + pad * 2
    bd = ACCENT if active else BORDER
    fg = ACCENT if active else MUTED
    rrect(d, [x, y, x + w, y + h], 13, fill=SURFACE2, outline=bd, width=1)
    d.text((x + pad, y + (h - 16) // 2), label, font=f, fill=fg)
    return w


# Wiersze listy: (nazwa, plik_fonta, etykieta, rodzaj)
ROWS = [
    ("Inter",          "segoeui.ttf", "Free",      "green"),
    ("Playfair Display", "georgia.ttf", "Free",    "green"),
    ("Georgia",        "georgia.ttf", "Web-safe",  "green"),
    ("Helvetica",      "arial.ttf",   "Premium $", "gold"),
    ("Candara",        "Candara.ttf", "System",    "gold"),
]


def icon_btn(d, x, y, kind, s=22):
    """Mały przycisk nagłówka. kind: pick|gear|min|close."""
    rrect(d, [x, y, x + s, y + s], 6, fill=(0, 0, 0, 0))
    cx, cy = x + s / 2, y + s / 2
    col = (255, 255, 255)
    if kind == "close":
        d.line([x + 6, y + 6, x + s - 6, y + s - 6], fill=col, width=2)
        d.line([x + s - 6, y + 6, x + 6, y + s - 6], fill=col, width=2)
    elif kind == "min":
        d.line([x + 6, y + s - 7, x + s - 6, y + s - 7], fill=col, width=2)
    elif kind == "gear":
        d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], outline=col, width=2)
        d.ellipse([cx - 1.5, cy - 1.5, cx + 1.5, cy + 1.5], fill=col)
    elif kind == "pick":  # mały eyedropper / "Aa"
        d.text((x + 3, y + 2), "Aa", font=UIB(14), fill=col)


def draw_panel(base, px, py, pw, *, font_name="Inter", open_list=True,
               show_rule=True, selected=0, compact=False, list_rows=5):
    """Rysuje aktualny panel Wolfie Font Swapper. Zwraca wysokość."""
    d = ImageDraw.Draw(base)
    pad = 18
    inx0, inx1 = px + pad, px + pw - pad

    # --- policz wysokość ---
    y = py
    HEADER = 54
    y += HEADER + 14
    y += 30          # top row (Edit text / Reset)
    if show_rule:
        y += 34      # rule bar
    rows = ROWS[:list_rows]
    # WHOLE PAGE
    y += 20 + 38     # label + input
    if open_list:
        y += len(rows) * 44 + 12
    if not compact:
        # HEADINGS (input + chips)
        y += 20 + 38 + 8 + 28
        # chips row
        y += 8 + 30
        # presets
        y += 22 + 32
        # snippet (tabs + code)
        y += 12 + 26 + 8 + 32
    else:
        y += 8 + 30  # chips only
    y += 16
    ph = y - py

    # --- tło panelu ---
    rrect(d, [px, py, px + pw, py + ph], 16, fill=BG, outline=BORDER, width=2)

    # --- nagłówek (gradient cyan -> pink) ---
    hg = hgradient(pw, HEADER, CYAN, ACCENT)
    base.paste(hg, (px, py), round_top_mask(pw, HEADER, 16))
    d = ImageDraw.Draw(base)
    ic = ICON.resize((28, 28)); base.paste(ic, (px + 16, py + 13), ic)
    d = ImageDraw.Draw(base)
    d.text((px + 52, py + 16), "Wolfie Font Swapper", font=UIB(18), fill=(255, 255, 255))
    bx = px + pw - 16 - 22
    for k in ["close", "min", "gear", "pick"]:
        icon_btn(d, bx, py + 16, k)
        bx -= 28

    cy = py + HEADER + 14

    # --- top row: Edit text / Reset ---
    rrect(d, [inx0, cy, inx0 + 96, cy + 26], 8, fill=None, outline=CYAN, width=1)
    d.text((inx0 + 12, cy + 5), "Edit text", font=UIB(13), fill=CYAN)
    rrect(d, [inx0 + 104, cy, inx0 + 104 + 70, cy + 26], 8, fill=SURFACE, outline=BORDER, width=1)
    d.text((inx0 + 116, cy + 5), "Reset", font=UI(13), fill=MUTED)
    cy += 30

    # --- rule bar (per-domain) ---
    if show_rule:
        rrect(d, [inx0, cy, inx1, cy + 28], 8, fill=(46, 26, 32), outline=(120, 50, 60), width=1)
        d.ellipse([inx0 + 10, cy + 10, inx0 + 18, cy + 18], fill=GREEN)
        d.text((inx0 + 26, cy + 6), "Domain rule active", font=UIB(13), fill=(255, 200, 205))
        rmw = tw(d, "Remove rule", UI(13)) + 20
        d.line([inx1 - rmw + 6, cy + 10, inx1 - rmw + 12, cy + 16], fill=RED, width=2)
        d.line([inx1 - rmw + 12, cy + 10, inx1 - rmw + 6, cy + 16], fill=RED, width=2)
        d.text((inx1 - rmw + 18, cy + 6), "Remove rule", font=UI(13), fill=RED)
        cy += 34

    # --- WHOLE PAGE section ---
    d.text((inx0, cy), "WHOLE PAGE", font=UIB(12), fill=MUTED)
    cy += 20
    rrect(d, [inx0, cy, inx1, cy + 38], 9, fill=SURFACE, outline=ACCENT, width=2)
    d.text((inx0 + 12, cy + 9), font_name, font=UIB(16), fill=TEXT)
    d.text((inx1 - 22, cy + 9), "x", font=UI(16), fill=MUTED)
    cy += 38

    if open_list:
        cy += 6
        rrect(d, [inx0, cy, inx1, cy + len(rows) * 44 + 2], 10, fill=(36, 36, 44), outline=BORDER, width=1)
        for i, (name, ff, label, kind) in enumerate(rows):
            ry = cy + 4 + i * 44
            if i == selected:
                rrect(d, [inx0 + 4, ry, inx1 - 4, ry + 40], 8, fill=SURFACE2, outline=ACCENT, width=1)
            try:
                nf = F(ff, 21)
            except Exception:
                nf = UI(21)
            d.text((inx0 + 14, ry + 8), name, font=nf, fill=TEXT)
            lblw = tw(d, label, UI(14)) + 16
            tag(d, inx1 - 14 - lblw, ry + 9, label, kind)
        cy += len(rows) * 44 + 12

    if not compact:
        # --- HEADINGS section (chosen + chips) ---
        d.text((inx0, cy), "HEADINGS  (h1-h6)", font=UIB(12), fill=MUTED)
        cy += 20
        rrect(d, [inx0, cy, inx1, cy + 38], 9, fill=SURFACE, outline=BORDER, width=1)
        d.text((inx0 + 12, cy + 9), "Playfair Display", font=UIB(16), fill=TEXT)
        d.text((inx1 - 22, cy + 9), "x", font=UI(16), fill=MUTED)
        cy += 38 + 8
        x = inx0
        for lab, act in [("Bold", True), ("S", False), ("M", True), ("L", False), ("XL", False), ("1.8", True)]:
            x += chip(d, x, cy, lab, active=act) + 8
        cy += 30

    # --- chips row (whole-page controls) ---
    cy += 0 if compact else 0
    x = inx0
    for lab, act in [("Bold", False), ("S", False), ("M", True), ("L", False), ("XL", False), ("Spacing", False), ("1.8", False), ("Aa", False)]:
        nx = chip(d, x, cy, lab, active=act)
        if x + nx > inx1:
            break
        x += nx + 8
    cy += 30

    if not compact:
        # --- presets (z kropką persistent per-domain) ---
        d.text((inx0, cy + 2), "PRESETS", font=UIB(12), fill=MUTED)
        dotx = inx0 + tw(d, "PRESETS", UIB(12)) + 12
        d.ellipse([dotx, cy + 4, dotx + 10, cy + 14], fill=CYAN)  # per-domain dot
        d.text((inx1 - tw(d, "+ Save", UIB(13)) - 4, cy + 1), "+ Save", font=UIB(13), fill=CYAN)
        cy += 22
        x = inx0
        for lab, act in [("Editorial", False), ("Mono", True), ("Brand", False)]:
            x += chip(d, x, cy, lab, active=act, h=28) + 8
        cy += 32

        # --- snippet tabs + copy ---
        x = inx0
        for lab, act in [("CSS", True), ("SCSS", False), ("JS", False)]:
            w = tw(d, lab, UIB(13)) + 22
            rrect(d, [x, cy, x + w, cy + 26], 7, fill=(SURFACE2 if act else SURFACE),
                  outline=(ACCENT if act else BORDER), width=1)
            d.text((x + 11, cy + 5), lab, font=UIB(13), fill=(ACCENT if act else MUTED))
            x += w + 6
        cwb = 96
        rrect(d, [inx1 - cwb, cy, inx1, cy + 26], 8, fill=ACCENT)
        d.text((inx1 - cwb + 20, cy + 5), "Copy CSS", font=UIB(13), fill=(255, 255, 255))
        cy += 26 + 8
        rrect(d, [inx0, cy, inx1, cy + 30], 8, fill=(24, 24, 30), outline=BORDER, width=1)
        d.text((inx0 + 12, cy + 7), "font-family: '%s', sans-serif;" % font_name, font=UI(13), fill=CYAN)
        cy += 32
    else:
        cwb = 110
        rrect(d, [inx1 - cwb, cy, inx1, cy + 28], 8, fill=ACCENT)
        d.text((inx1 - cwb + 26, cy + 6), "Copy CSS", font=UIB(13), fill=(255, 255, 255))
        cy += 30

    return ph


def article(base, x, y, w, heading, hfont_file, body_col=PAGETX):
    d = ImageDraw.Draw(base)
    try:
        hf = F(hfont_file, 52)
    except Exception:
        hf = UIBD(52)
    d.text((x, y), heading, font=hf, fill=body_col)
    bf = F("georgia.ttf", 19)
    lines = [
        "Typography sets the tone of a page. With Wolfie Font Swapper you",
        "preview any font live, target headings and body separately, and",
        "copy production-ready CSS in one click — Google + system fonts.",
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
    d.rectangle([0, 0, W, 56], fill=(225, 225, 230))
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse([24 + i * 26, 22, 38 + i * 26, 36], fill=c)
    rrect(d, [120, 16, W - 24, 40], 12, fill=(248, 248, 250), outline=(210, 210, 216), width=1)
    d.text((140, 20), "example.com/article", font=UI(15), fill=(120, 120, 130))
    article(img, 70, 130, 700, "The quick brown fox", "georgia.ttf")
    d.text((70, 690), "Target headings & body separately.",
           font=UIB(24), fill=PAGETX)
    d.text((70, 726), "Preview live, then copy the CSS.",
           font=UI(20), fill=(90, 90, 102))
    draw_panel(img, 762, 86, 478, font_name="Inter", selected=0, open_list=True,
               show_rule=True, list_rows=5)
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
        ("Free", "green", "Free to embed / self-host",
         "Inter, JetBrains Mono, Playfair — open source (OFL / Apache)."),
        ("Premium $", "gold", "Buy a license to use",
         "Helvetica, Gotham, Univers — linked to the foundry to purchase."),
        ("System", "gold", "Check the license first",
         "Locally installed, unknown origin — verify before using on the web."),
    ]
    y = 190
    for label, kind, title, desc in items:
        rrect(d, [70, y, 1210, y + 96], 14, fill=SURFACE, outline=BORDER, width=1)
        w = tag(d, 100, y + 36, label, kind)
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
    for i in range(H):
        t = i / H
        d.line([(0, i), (W, i)], fill=(int(30 + 10 * t), int(30 + 2 * t), int(36 + 18 * t)))
    ic = ICON.resize((120, 120)); img.paste(ic, (90, 80), ic)
    d.text((240, 96), "Wolfie Font Swapper", font=UIBD(58), fill=TEXT)
    d.text((242, 168), "Preview, swap & copy fonts on any website", font=UI(30), fill=CYAN)
    feats = [
        "Live preview & swap on any page",
        "Headings, body, nav & buttons — targeted separately",
        "Google Fonts + system fonts, with license tags",
        "One-click CSS / SCSS / JS snippets",
        "Presets + persistent per-domain rules · 9 languages",
    ]
    for i, ftxt in enumerate(feats):
        fy = 256 + i * 46
        d.ellipse([242, fy + 7, 256, fy + 21], fill=ACCENT)
        d.text((276, fy), ftxt, font=UIB(22), fill=TEXT)
    # kompaktowy panel po prawej
    draw_panel(img, 980, 70, 360, font_name="Inter", selected=0, open_list=True,
               show_rule=True, compact=True, list_rows=4)
    img.save(os.path.join(OUT, "promo-marquee-1400x560.png"))

    # mały kafelek
    t = Image.new("RGB", (440, 280), BG)
    dt = ImageDraw.Draw(t)
    grad = hgradient(440, 280, (24, 26, 40), BG)
    t.paste(grad, (0, 0))
    dt = ImageDraw.Draw(t)
    ic2 = ICON.resize((92, 92)); t.paste(ic2, (28, 30), ic2)
    dt.text((140, 40), "Wolfie", font=UIBD(40), fill=TEXT)
    dt.text((140, 86), "Font Swapper", font=UIBD(32), fill=ACCENT)
    dt.text((30, 168), "Preview · swap · copy CSS", font=UIB(20), fill=CYAN)
    dt.text((30, 204), "on any website", font=UI(18), fill=MUTED)
    t.save(os.path.join(OUT, "promo-tile-440x280.png"))


# =========================================================================
# 4) ANIMOWANY GIF — podmiana fontu nagłówka (960x600)
# =========================================================================
def animated_gif():
    W, H = 960, 600
    cycle = [
        ("Inter",            "segoeui.ttf", 0),
        ("Playfair Display", "georgia.ttf", 1),
        ("Impact",           "impact.ttf",  2),
        ("Helvetica",        "arial.ttf",   3),
        ("Candara",          "Candara.ttf", 4),
    ]
    frames = []
    for name, ff, sel in cycle:
        img = Image.new("RGB", (W, H), PAGE)
        d = ImageDraw.Draw(img)
        d.rectangle([0, 0, W, 44], fill=(225, 225, 230))
        for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
            d.ellipse([20 + i * 22, 16, 32 + i * 22, 28], fill=c)
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
        bw = tw(d, "font-family: " + name, UIB(16)) + 24
        rrect(d, [48, 240, 48 + bw, 274], 8, fill=BG)
        d.text((60, 247), "font-family: " + name, font=UIB(16), fill=CYAN)
        draw_panel(img, 556, 64, 372, font_name=name, selected=sel, open_list=True,
                   show_rule=True, compact=True, list_rows=5)
        frames.append(img.convert("P", palette=Image.ADAPTIVE, colors=160))
    frames[0].save(
        os.path.join(OUT, "demo-font-swap.gif"),
        save_all=True, append_images=frames[1:],
        duration=1000, loop=0, disposal=2, optimize=True,
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
