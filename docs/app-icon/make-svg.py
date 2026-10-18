# Writes the app icon SVGs (glyphs outlined from Kiwi Maru 500, so they render
# without the font) in the style of docs/social-preview/a-sunrise.html.
# Usage: python3 docs/app-icon/make-svg.py <outDir>   (needs: pip install fonttools brotli)
# Then: node docs/app-icon/render.mjs <outDir>   to rasterize the PNGs and favicon.ico
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
FONT = TTFont(
    ROOT
    / "node_modules/@fontsource/kiwi-maru/files/kiwi-maru-japanese-500-normal.woff2"
)
GLYPHS = FONT.getGlyphSet()
CMAP = FONT.getBestCmap()
UPM = FONT["head"].unitsPerEm

BG = "#eaf2ff"
DARK_TEXT = "#14257f"
SHADOW = "rgba(20,37,127,.18)"
# (kanji, tile color, text color), row by row
TILES = [
    ("土", "#a9c4ff", DARK_TEXT),
    ("火", "#2f55e6", "#fff"),
    ("水", "#14257f", "#fff"),
    ("風", "#7c9fff", DARK_TEXT),
]

# Variants on a 512 canvas: grid = width of the tile grid, radius = background
# corner radius. Maskable keeps the grid inside the 80% safe-zone circle;
# apple-touch is full bleed because iOS rounds the corners itself. The tiny
# favicon.ico is just the 火 tile, edge to edge, with no background and a
# bigger glyph so it stays legible at 16px.
VARIANTS = {
    "app-icon": {"grid": 416, "radius": 112},
    "app-icon-maskable": {"grid": 312, "radius": 0},
    "apple-touch-icon": {"grid": 384, "radius": 0},
    "favicon": {"grid": 512, "radius": 0, "tiles": [TILES[1]], "bg": None, "font": 0.72},
}


def glyph_path(ch, x, y, size):
    """Path for ch with its em box centered at (x, y), size px tall."""
    name = CMAP[ord(ch)]
    s = size / UPM
    adv = GLYPHS[name].width
    pen = SVGPathPen(GLYPHS, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
    # Ideographic em box spans -120..880 font units around the baseline.
    tx = x - adv * s / 2
    ty = y + 380 * s
    GLYPHS[name].draw(TransformPen(pen, (s, 0, 0, -s, tx, ty)))
    return pen.getCommands()


def svg(grid, radius, tiles=TILES, bg=BG, font=0.54):
    size = 512
    cols = 2 if len(tiles) == 4 else 1
    gap = grid * 0.06 if cols == 2 else 0
    tile = (grid - gap) / cols
    shadow = tile * 0.065 if bg else 0
    tile_r = tile * 0.196
    font = tile * font
    x0 = (size - grid) / 2
    y0 = (size - grid - shadow) / 2
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">']
    if bg:
        out.append(f'<rect width="{size}" height="{size}" rx="{radius}" fill="{bg}"/>')
    for i, (ch, fill, color) in enumerate(tiles):
        x = x0 + (i % cols) * (tile + gap)
        y = y0 + (i // cols) * (tile + gap)
        box = f'x="{x:.1f}" width="{tile:.1f}" height="{tile:.1f}" rx="{tile_r:.1f}"'
        if shadow:
            out.append(f'<rect {box} y="{y + shadow:.1f}" fill="{SHADOW}"/>')
        out.append(f'<rect {box} y="{y:.1f}" fill="{fill}"/>')
        d = glyph_path(ch, x + tile / 2, y + tile / 2, font)
        out.append(f'<path fill="{color}" d="{d}"/>')
    out.append("</svg>")
    return "\n".join(out) + "\n"


out_dir = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
out_dir.mkdir(parents=True, exist_ok=True)
for name, v in VARIANTS.items():
    (out_dir / f"{name}.svg").write_text(svg(**v))
    print(name)
