from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "hemsida" / "ai-produktfixare-hero-v2.png"
OUT = ROOT / "hemsida" / "ai-produktfixare-hero-animated.webp"


def cubic(p0, p1, p2, p3, t):
    u = 1 - t
    return (
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    )


def draw_wisp(draw, base_x, base_y, height, sway, phase, alpha, width):
    lift = 20 * math.sin(phase * math.tau)
    drift = 18 * math.sin((phase + 0.25) * math.tau)
    p0 = (base_x + drift * 0.2, base_y + lift)
    p1 = (base_x - sway, base_y - height * 0.32 + lift * 0.4)
    p2 = (base_x + sway * 1.25 + drift, base_y - height * 0.62)
    p3 = (base_x - sway * 0.42 + drift * 1.3, base_y - height)

    pts = [cubic(p0, p1, p2, p3, i / 46) for i in range(47)]
    color = (255, 255, 255, max(0, min(255, int(alpha))))
    draw.line(pts, fill=color, width=width, joint="curve")


def make_frame(base, frame, total):
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    t = frame / total

    # The cup is fixed in the generated hero image, so smoke can be composited
    # directly over the cup instead of positioned with responsive CSS.
    cup_x = int(base.width * 0.458)
    cup_y = int(base.height * 0.665)

    specs = [
        (-30, 2, 185, 30, 0.00, 44, 3),
        (-8, 0, 238, 42, 0.12, 56, 4),
        (18, -6, 205, 34, 0.27, 48, 3),
        (38, 6, 168, 26, 0.39, 30, 2),
        (-48, 10, 150, 22, 0.51, 24, 2),
        (4, -14, 260, 52, 0.63, 28, 3),
        (58, 18, 132, 18, 0.77, 18, 2),
        (-16, 18, 128, 20, 0.88, 20, 2),
    ]

    for dx, dy, height, sway, offset, alpha, width in specs:
        phase = (t + offset) % 1
        fade = math.sin(phase * math.pi)
        draw_wisp(
            draw,
            cup_x + dx,
            cup_y + dy,
            height,
            sway,
            phase,
            alpha * fade,
            width,
        )

    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=2.6))
    glow = overlay.filter(ImageFilter.GaussianBlur(radius=10))
    frame_img = Image.alpha_composite(base.convert("RGBA"), glow)
    frame_img = Image.alpha_composite(frame_img, overlay)
    return frame_img.convert("RGB")


def main():
    base = Image.open(SOURCE).convert("RGB")
    total = 120
    frames = [make_frame(base, i, total) for i in range(total)]
    frames[0].save(
        OUT,
        save_all=True,
        append_images=frames[1:],
        duration=55,
        loop=0,
        quality=76,
        method=6,
        minimize_size=True,
    )
    print(OUT)


if __name__ == "__main__":
    main()
