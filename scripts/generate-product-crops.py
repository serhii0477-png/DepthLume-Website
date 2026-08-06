"""Generate safe, deterministic website crops from the approved source screenshot.

This script only crops and encodes existing pixels. It performs no generative,
inpainting, text replacement, or synthetic image operation.
"""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source-assets" / "depthlume-terminal-original.png"
OUTPUT = ROOT / "public" / "images" / "product"

# Pixel coordinates are (left, top, right, bottom) in the 2561 x 1373 source.
# Unsafe Signal Journal content is entirely left of x=1220 and above y=780.
CROPS = {
    "depthlume-chart.webp": (1260, 165, 2250, 995),
    "depthlume-delta-cvd.webp": (1265, 995, 2250, 1348),
    "depthlume-heatmap.webp": (5, 1008, 1215, 1312),
    "depthlume-market-context.webp": (1558, 84, 1921, 162),
}

# Additional safe product captures supplied for the layered hero composition.
# 12.png is cropped below its analytical-score/confidence copy. 14.png is
# intentionally excluded because it contains Signal Journal outcome values.
EXTRA_CROPS = {
    "depthlume-chart-clean.webp": ("11.png", (0, 0, 1040, 762)),
    "depthlume-watchlist.webp": ("13.png", (0, 0, 860, 362)),
    "depthlume-depth-map.webp": ("12.png", (0, 226, 858, 680)),
}


def save_webp(image: Image.Image, destination: Path) -> None:
    image.convert("RGB").save(destination, "WEBP", quality=94, method=6)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    if SOURCE.exists():
        with Image.open(SOURCE) as source:
            if source.size != (2561, 1373):
                raise ValueError(f"Unexpected source dimensions: {source.size}")

            for filename, region in CROPS.items():
                crop = source.crop(region)
                save_webp(crop, OUTPUT / filename)

            chart = source.crop(CROPS["depthlume-chart.webp"])
            chart_small = chart.resize((640, round(chart.height * 640 / chart.width)), Image.Resampling.LANCZOS)
            save_webp(chart_small, OUTPUT / "depthlume-chart-640.webp")
    elif not all((OUTPUT / filename).exists() for filename in CROPS):
        raise FileNotFoundError(f"Missing original screenshot and its generated derivatives: {SOURCE}")

    for filename, (source_name, region) in EXTRA_CROPS.items():
        source_path = ROOT / "source-assets" / source_name
        if not source_path.exists():
            raise FileNotFoundError(f"Missing additional screenshot: {source_path}")
        with Image.open(source_path) as source:
            save_webp(source.crop(region), OUTPUT / filename)

    print(f"Generated {len(CROPS) + len(EXTRA_CROPS) + 1} safe derivatives in {OUTPUT}")


if __name__ == "__main__":
    main()
