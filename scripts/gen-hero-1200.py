# scripts/gen-hero-1200.py  (one-off; pode ser descartado após a fase)
from PIL import Image

SRC = "assets/home/hero-ampulheta-1600.webp"
OUT = "assets/home/hero-ampulheta-1200.webp"
TARGET_W = 1200

src = Image.open(SRC)
w, h = src.size                       # 1600 x 2070
assert (w, h) == (1600, 2070), f"master inesperado: {w}x{h}"

th = round(h * TARGET_W / w)          # 1553  (2070 * 0.75 = 1552.5, arredonda p/ cima)
out = src.convert("RGB").resize((TARGET_W, th), Image.LANCZOS)
out.save(OUT, "WEBP", quality=82, method=6)

import os
print(f"{OUT}: {TARGET_W}x{th}, {os.path.getsize(OUT)} bytes")
