from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from pypdf import PdfReader

from revise_explanatory_note import TOC_ENTRIES


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def main() -> None:
    pdf_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    pages = [normalize(page.extract_text() or "") for page in PdfReader(pdf_path).pages]
    result: dict[str, int] = {}
    search_from = 6
    for title, _ in TOC_ENTRIES:
        needle = normalize(title)
        for index in range(search_from, len(pages)):
            if needle in pages[index]:
                result[title] = index + 1
                search_from = index
                break
        else:
            raise ValueError(f"Heading not found in rendered PDF: {title}")
    output_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(output_path)


if __name__ == "__main__":
    main()
