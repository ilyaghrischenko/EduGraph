from __future__ import annotations

import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw


def page_number(path: Path) -> int:
    return int(re.search(r"\d+", path.stem).group())


def main() -> None:
    source = Path(sys.argv[1])
    target = Path(sys.argv[2])
    target.mkdir(parents=True, exist_ok=True)
    pages = sorted(source.glob("page-*.png"), key=page_number)
    thumb_width, thumb_height = 260, 368
    columns, rows = 4, 3
    for batch_start in range(0, len(pages), columns * rows):
        batch = pages[batch_start : batch_start + columns * rows]
        sheet = Image.new(
            "RGB",
            (columns * thumb_width, rows * (thumb_height + 24)),
            "white",
        )
        draw = ImageDraw.Draw(sheet)
        for index, page in enumerate(batch):
            image = Image.open(page).convert("RGB")
            image.thumbnail((thumb_width, thumb_height))
            left = (index % columns) * thumb_width + (thumb_width - image.width) // 2
            top = (index // columns) * (thumb_height + 24)
            sheet.paste(image, (left, top))
            draw.text(
                ((index % columns) * thumb_width + 6, top + thumb_height + 3),
                str(page_number(page)),
                fill="black",
            )
        output = target / f"contact-{batch_start // (columns * rows) + 1}.png"
        sheet.save(output)


if __name__ == "__main__":
    main()
