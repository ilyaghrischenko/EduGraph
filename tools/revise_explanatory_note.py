from __future__ import annotations

import argparse
import json
import re
from copy import deepcopy
from pathlib import Path
from typing import Iterable, Sequence

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import (
    WD_ALIGN_PARAGRAPH,
    WD_BREAK,
    WD_TAB_ALIGNMENT,
    WD_TAB_LEADER,
)
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
INPUT_DOCX = Path(
    "/Users/admin/Documents/University/Диплом/"
    "Пояснювальна_записка_EduGraph_Грищенко_Ілля_КІ_22_1_вдосконалена.docx"
)
OUTPUT_DOCX = (
    ROOT
    / "outputs"
    / "Пояснювальна_записка_EduGraph_Грищенко_Ілля_КІ_22_1_після_правок.docx"
)
ASSET_DIR = ROOT / "outputs" / "edugraph_note_assets" / "revision"
SCREENSHOT_DIR = ROOT / "outputs" / "edugraph_note_assets" / "screenshots_clean"
DB_SCREENSHOT = Path(
    "/Users/admin/Library/Group Containers/group.com.apple.notes/Accounts/"
    "A019DBD9-2581-4E7F-86EB-37927C18EA4B/Media/"
    "0C02E30D-1617-43DE-A997-4A8DEE2CD68F/"
    "1_2530B5CB-BE89-4136-A4C3-501CE35F09DA/"
    "Снимок экрана — 2026-06-06 в 17.29.53.png"
)
FONT_REGULAR = Path("/System/Library/Fonts/Supplemental/Times New Roman.ttf")
FONT_BOLD = Path("/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf")

TITLE = (
    "AI-система семантичного пошуку в корпусі освітніх документів на основі "
    "LLM з інтерактивною графовою навігацією результатів"
)

TOC_ENTRIES = [
    ("ВСТУП", 0),
    ("1 АНАЛІТИЧНА ЧАСТИНА", 0),
    ("1.1 Аналіз існуючих типів застосунків для пошуку в освітніх документах", 1),
    ("1.2 Аналіз типової архітектури веб-системи семантичного пошуку", 1),
    ("1.3 Огляд існуючих комплексних рішень", 1),
    ("1.4 Аналіз середовищ створення застосунку", 1),
    ("1.5 Огляд ОС, мов програмування та платформ", 1),
    ("1.6 Постановка задачі", 1),
    ("1.7 Попередній вибір проєктних рішень", 1),
    ("2 ФУНКЦІОНАЛЬНА ЧАСТИНА", 0),
    ("2.1 Проєктування варіантів використання системи", 1),
    ("2.2 Специфікації основних сценаріїв", 1),
    ("2.3 Діаграми сценаріїв та взаємодії", 1),
    ("3 ПРОЄКТНА ЧАСТИНА", 0),
    ("3.1 Вибір базових технологій, платформ і стандартів", 1),
    ("3.2 Визначення функціональних залежностей", 1),
    ("3.3 Проєктування бази даних", 1),
    ("3.3.1 Вибір СУБД", 2),
    ("3.3.2 Опис логічної структури БД", 2),
    ("3.3.3 Опис фізичної структури БД", 2),
    ("3.3.4 Підтримка цілісності даних", 2),
    ("3.4 Реалізація підсистеми семантичного пошуку", 1),
    ("3.4.1 HTTP-контракти та моделі", 2),
    ("3.4.2 Підготовка тексту та індексація", 2),
    ("3.4.3 Фізична структура LanceDB", 2),
    ("3.4.4 Алгоритм пошуку та reranking", 2),
    ("3.4.5 Обмеження поточної реалізації", 2),
    ("3.5 Модель графового подання результатів пошуку", 1),
    ("3.5.1 Формування вузлів і зв’язків", 2),
    ("3.5.2 Адаптивне розміщення і Canvas-рендеринг", 2),
    ("3.5.3 Взаємодія з результатом", 2),
    ("3.6 Проєктування серверної частини та синхронізації", 1),
    ("3.6.1 Маршрути API та політики доступу", 2),
    ("3.6.2 Реєстрація та заявки", 2),
    ("3.6.3 Алгоритм синхронізації Google Drive", 2),
    ("3.6.4 Парсинг документів і обмеження форматів", 2),
    ("3.6.5 Життєвий цикл індексації документа", 2),
    ("3.7 Структура та екрани інтерфейсу користувача", 1),
    ("3.8 Експериментальне тестування застосунку", 1),
    ("3.9 Інструкція користувача", 1),
    ("ВИСНОВКИ", 0),
    ("ПЕРЕЛІК ВИКОРИСТАНИХ ДЖЕРЕЛ", 0),
    ("ДОДАТКИ", 0),
    ("Додаток А. Специфікації основних сценаріїв", 1),
    ("Додаток Б. Текстова специфікація API та моделей даних", 1),
    ("Додаток В. Матриця ролей, вимог і сценаріїв перевірки", 1),
    ("Додаток Г. Розгорнута інструкція та чек-лист супроводу", 1),
    ("Додаток Д. Глосарій термінів і технічних понять", 1),
]


def ensure_document_styles(doc: Document) -> None:
    for level in (1, 2, 3):
        name = f"Heading {level}"
        try:
            style = doc.styles[name]
        except KeyError:
            style = doc.styles.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
            style.base_style = doc.styles["Normal"]
        style.font.name = "Times New Roman"
        style.font.size = Pt(14)
        style.font.bold = True
        paragraph_properties = style._element.get_or_add_pPr()
        outline_level = paragraph_properties.find(qn("w:outlineLvl"))
        if outline_level is None:
            outline_level = OxmlElement("w:outlineLvl")
            paragraph_properties.append(outline_level)
        outline_level.set(qn("w:val"), str(level - 1))


def pil_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_BOLD if bold else FONT_REGULAR), size=size)


def set_run_font(run, size: float = 14, bold: bool | None = None) -> None:
    run.font.name = "Times New Roman"
    run.font.size = Pt(size)
    if bold is not None:
        run.font.bold = bold
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.rFonts
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    for attr in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
        rfonts.set(qn(attr), "Times New Roman")


def set_cell_width(cell, width_cm: float) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_w = tc_pr.first_child_found_in("w:tcW")
    if tc_w is None:
        tc_w = OxmlElement("w:tcW")
        tc_pr.append(tc_w)
    tc_w.set(qn("w:w"), str(int(width_cm * 567)))
    tc_w.set(qn("w:type"), "dxa")


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top: int = 80, start: int = 100, bottom: int = 80, end: int = 100) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for edge, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{edge}"))
        if node is None:
            node = OxmlElement(f"w:{edge}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def prevent_row_split(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    if tr_pr.find(qn("w:cantSplit")) is None:
        tr_pr.append(OxmlElement("w:cantSplit"))


def repeat_table_header(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    if tr_pr.find(qn("w:tblHeader")) is None:
        tr_pr.append(OxmlElement("w:tblHeader"))


def set_table_borders(table) -> None:
    tbl_pr = table._tbl.tblPr
    borders = tbl_pr.find(qn("w:tblBorders"))
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        border = borders.find(qn(f"w:{edge}"))
        if border is None:
            border = OxmlElement(f"w:{edge}")
            borders.append(border)
        border.set(qn("w:val"), "single")
        border.set(qn("w:sz"), "4")
        border.set(qn("w:space"), "0")
        border.set(qn("w:color"), "000000")


def format_table(
    table,
    widths_cm: Sequence[float] | None = None,
    font_size: float = 10.5,
    header_fill: str = "E2F0D9",
) -> None:
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table)
    table.autofit = False
    for row_index, row in enumerate(table.rows):
        prevent_row_split(row)
        if row_index == 0:
            repeat_table_header(row)
        for col_index, cell in enumerate(row.cells):
            if widths_cm and col_index < len(widths_cm):
                set_cell_width(cell, widths_cm[col_index])
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            if row_index == 0:
                set_cell_shading(cell, header_fill)
            for paragraph in cell.paragraphs:
                paragraph.paragraph_format.first_line_indent = None
                paragraph.paragraph_format.line_spacing = 1.0
                paragraph.paragraph_format.space_before = Pt(0)
                paragraph.paragraph_format.space_after = Pt(0)
                paragraph.alignment = (
                    WD_ALIGN_PARAGRAPH.CENTER if row_index == 0 else WD_ALIGN_PARAGRAPH.LEFT
                )
                for run in paragraph.runs:
                    set_run_font(run, font_size, bold=row_index == 0)


def body(doc: Document):
    return doc._body._element


def body_children(doc: Document) -> list:
    return list(body(doc))


def paragraph_text(element) -> str:
    return " ".join("".join(node.text or "" for node in element.xpath(".//w:t")).split())


def find_block(doc: Document, text: str, occurrence: int = 1, start: int = 0) -> int:
    count = 0
    for index, element in enumerate(body_children(doc)[start:], start=start):
        if paragraph_text(element) == text:
            count += 1
            if count == occurrence:
                return index
    raise ValueError(f"Block not found: {text!r}, occurrence={occurrence}")


def remove_range(doc: Document, start: int, end: int) -> None:
    target = body(doc)
    for element in body_children(doc)[start:end]:
        target.remove(element)


def fragment_start(doc: Document) -> int:
    children = body_children(doc)
    if children and children[-1].tag.endswith("sectPr"):
        return len(children) - 1
    return len(children)


def collect_fragment(doc: Document, start: int) -> list:
    target = body(doc)
    children = body_children(doc)
    end = len(children) - 1 if children and children[-1].tag.endswith("sectPr") else len(children)
    fragment = children[start:end]
    for element in fragment:
        target.remove(element)
    return fragment


def insert_fragment(doc: Document, index: int, fragment: Iterable) -> None:
    target = body(doc)
    for offset, element in enumerate(fragment):
        target.insert(index + offset, element)


def add_paragraph(
    doc: Document,
    text: str = "",
    *,
    align=WD_ALIGN_PARAGRAPH.JUSTIFY,
    indent: bool = True,
    size: float = 14,
    bold: bool | None = None,
    italic: bool = False,
    before: float = 0,
    after: float = 0,
):
    paragraph = doc.add_paragraph()
    paragraph.alignment = align
    fmt = paragraph.paragraph_format
    fmt.first_line_indent = Cm(1.25) if indent and text else None
    fmt.line_spacing = 1.5
    fmt.space_before = Pt(before)
    fmt.space_after = Pt(after)
    if text:
        run = paragraph.add_run(text)
        set_run_font(run, size, bold)
        run.font.italic = italic
    return paragraph


def add_heading(doc: Document, text: str, level: int):
    paragraph = doc.add_paragraph(style=f"Heading {level}")
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER if level == 1 else WD_ALIGN_PARAGRAPH.LEFT
    fmt = paragraph.paragraph_format
    fmt.first_line_indent = None
    fmt.line_spacing = 1.5
    fmt.space_before = Pt(12 if level == 1 else 6)
    fmt.space_after = Pt(6)
    if level == 1:
        fmt.page_break_before = True
    run = paragraph.add_run(text)
    set_run_font(run, 14, True)
    return paragraph


def add_page_break(doc: Document) -> None:
    paragraph = doc.add_paragraph()
    paragraph.paragraph_format.first_line_indent = None
    paragraph.paragraph_format.space_after = Pt(0)
    run = paragraph.add_run()
    run.add_break(WD_BREAK.PAGE)


def add_caption(doc: Document, text: str) -> None:
    add_paragraph(
        doc,
        text,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        indent=False,
        size=14,
        before=3,
        after=6,
    )


def add_image(doc: Document, path: Path, caption: str, width_cm: float = 16.0) -> None:
    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.first_line_indent = None
    paragraph.paragraph_format.space_after = Pt(0)
    run = paragraph.add_run()
    run.add_picture(str(path), width=Cm(width_cm))
    add_caption(doc, caption)


def add_table(
    doc: Document,
    caption: str,
    headers: Sequence[str],
    rows: Sequence[Sequence[str]],
    widths_cm: Sequence[float],
    *,
    font_size: float = 10.5,
) -> None:
    add_caption(doc, caption)
    table = doc.add_table(rows=1, cols=len(headers))
    for index, value in enumerate(headers):
        table.rows[0].cells[index].text = value
    for values in rows:
        cells = table.add_row().cells
        for index, value in enumerate(values):
            cells[index].text = value
    format_table(table, widths_cm, font_size)
    add_paragraph(doc, "", indent=False, size=4)


def add_placeholder(doc: Document, text: str) -> None:
    paragraph = add_paragraph(
        doc,
        f"[МІСЦЕ ДЛЯ СКРИНШОТА: {text}]",
        align=WD_ALIGN_PARAGRAPH.CENTER,
        indent=False,
        size=12,
        italic=True,
        before=6,
        after=6,
    )
    paragraph.paragraph_format.keep_together = True


def add_static_toc(doc: Document, page_map: dict[str, int]) -> None:
    for title, level in TOC_ENTRIES:
        paragraph = doc.add_paragraph()
        paragraph.paragraph_format.first_line_indent = Cm(level * 0.65)
        paragraph.paragraph_format.left_indent = None
        paragraph.paragraph_format.line_spacing = 1.0
        paragraph.paragraph_format.space_before = Pt(0)
        paragraph.paragraph_format.space_after = Pt(0)
        paragraph.paragraph_format.tab_stops.add_tab_stop(
            Cm(16.0),
            WD_TAB_ALIGNMENT.RIGHT,
            WD_TAB_LEADER.DOTS,
        )
        run = paragraph.add_run(f"{title}\t{page_map.get(title, 0):02d}")
        set_run_font(run, 11.5, bold=level == 0)


def append_field(run, instruction_text: str) -> None:
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instruction = OxmlElement("w:instrText")
    instruction.set(qn("xml:space"), "preserve")
    instruction.text = instruction_text
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.extend([begin, instruction, separate, end])


def add_page_number_footer(doc: Document) -> None:
    statement_index = find_block(doc, "ВІДОМІСТЬ РОБОТИ")
    section_break_paragraph = None
    for element in reversed(body_children(doc)[:statement_index]):
        if element.tag.endswith("}p") and element.xpath(".//w:br[@w:type='page']"):
            section_break_paragraph = element
            break
    if section_break_paragraph is None:
        raise ValueError("Page break before work statement not found")

    for page_break in section_break_paragraph.xpath(".//w:br[@w:type='page']"):
        page_break.getparent().remove(page_break)
    paragraph_properties = section_break_paragraph.get_or_add_pPr()
    first_section_properties = deepcopy(body(doc).sectPr)
    for tag in ("w:headerReference", "w:footerReference", "w:pgNumType"):
        for node in first_section_properties.findall(qn(tag)):
            first_section_properties.remove(node)
    section_type = first_section_properties.find(qn("w:type"))
    if section_type is None:
        section_type = OxmlElement("w:type")
        first_section_properties.insert(0, section_type)
    section_type.set(qn("w:val"), "nextPage")
    paragraph_properties.append(first_section_properties)

    final_section_properties = body(doc).sectPr
    page_number_type = final_section_properties.find(qn("w:pgNumType"))
    if page_number_type is None:
        page_number_type = OxmlElement("w:pgNumType")
        final_section_properties.append(page_number_type)
    page_number_type.set(qn("w:start"), "5")

    final_section = doc.sections[-1]
    final_section.footer.is_linked_to_previous = False
    paragraph = final_section.footer.paragraphs[0]
    paragraph.clear()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.first_line_indent = None
    run = paragraph.add_run()
    set_run_font(run, 12)
    append_field(run, " PAGE ")


def draw_wrapped(
    draw: ImageDraw.ImageDraw,
    text: str,
    xy: tuple[int, int, int, int],
    font: ImageFont.FreeTypeFont,
    *,
    fill: str = "#172033",
    align: str = "center",
    line_gap: int = 6,
) -> None:
    x1, y1, x2, y2 = xy
    max_width = x2 - x1
    lines: list[str] = []
    for source_line in text.split("\n"):
        words = source_line.split()
        if not words:
            lines.append("")
            continue
        current = words[0]
        for word in words[1:]:
            candidate = f"{current} {word}"
            if draw.textbbox((0, 0), candidate, font=font)[2] <= max_width:
                current = candidate
            else:
                lines.append(current)
                current = word
        lines.append(current)
    line_height = font.size + line_gap
    y = y1 + max(0, ((y2 - y1) - line_height * len(lines)) // 2)
    for line in lines:
        width = draw.textbbox((0, 0), line, font=font)[2]
        x = x1 if align == "left" else x1 + (max_width - width) // 2
        draw.text((x, y), line, font=font, fill=fill)
        y += line_height


def draw_box(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int, int, int],
    text: str,
    *,
    fill: str = "#f3f6fa",
    outline: str = "#24466f",
    font_size: int = 27,
) -> None:
    draw.rounded_rectangle(xy, radius=18, fill=fill, outline=outline, width=3)
    x1, y1, x2, y2 = xy
    draw_wrapped(
        draw,
        text,
        (x1 + 18, y1 + 12, x2 - 18, y2 - 12),
        pil_font(font_size),
    )


def draw_arrow(
    draw: ImageDraw.ImageDraw,
    start: tuple[int, int],
    end: tuple[int, int],
    *,
    fill: str = "#24466f",
    width: int = 4,
) -> None:
    draw.line([start, end], fill=fill, width=width)
    sx, sy = start
    ex, ey = end
    dx, dy = ex - sx, ey - sy
    length = max((dx * dx + dy * dy) ** 0.5, 1)
    ux, uy = dx / length, dy / length
    px, py = -uy, ux
    size = 16
    points = [
        (ex, ey),
        (ex - ux * size + px * size * 0.55, ey - uy * size + py * size * 0.55),
        (ex - ux * size - px * size * 0.55, ey - uy * size - py * size * 0.55),
    ]
    draw.polygon(points, fill=fill)


def draw_actor(draw: ImageDraw.ImageDraw, x: int, y: int, label: str) -> None:
    draw.ellipse((x - 22, y, x + 22, y + 44), outline="#111111", width=3)
    draw.line((x, y + 44, x, y + 112), fill="#111111", width=3)
    draw.line((x - 38, y + 70, x + 38, y + 70), fill="#111111", width=3)
    draw.line((x, y + 112, x - 32, y + 160), fill="#111111", width=3)
    draw.line((x, y + 112, x + 32, y + 160), fill="#111111", width=3)
    draw_wrapped(draw, label, (x - 85, y + 165, x + 85, y + 220), pil_font(24, True))


def create_architecture(path: Path) -> None:
    image = Image.new("RGB", (1600, 900), "white")
    draw = ImageDraw.Draw(image)
    boxes = {
        "react": (80, 175, 410, 345),
        "api": (635, 150, 1015, 365),
        "fastapi": (1190, 175, 1520, 345),
        "sqlite": (635, 575, 1015, 755),
        "drive": (1190, 575, 1520, 755),
    }
    draw_box(draw, boxes["react"], "React SPA\nTypeScript, Vite,\nрольові маршрути, граф")
    draw_box(draw, boxes["api"], "ASP.NET Core API\nMinimal API, VSA, JWT,\nIdentity, синхронізація")
    draw_box(draw, boxes["fastapi"], "FastAPI\nembeddings, LanceDB,\nCrossEncoder reranking")
    draw_box(draw, boxes["sqlite"], "SQLite\nкористувачі, заявки,\nпапки, документи")
    draw_box(draw, boxes["drive"], "Google Drive\nджерело документів\nі посилань")
    draw_arrow(draw, (410, 260), (635, 260))
    draw.text((470, 220), "HTTP / JSON", font=pil_font(23), fill="#24466f")
    draw_arrow(draw, (1015, 260), (1190, 260))
    draw.text((1025, 220), "search / upsert / delete", font=pil_font(21), fill="#24466f")
    draw_arrow(draw, (825, 365), (825, 575))
    draw.text((845, 455), "EF Core", font=pil_font(23), fill="#24466f")
    draw_arrow(draw, (1015, 665), (1190, 665))
    draw_arrow(draw, (1190, 715), (1015, 715))
    draw.text((1045, 625), "Drive API", font=pil_font(22), fill="#24466f")
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)


def create_use_cases(path: Path) -> None:
    image = Image.new("RGB", (1700, 1080), "white")
    draw = ImageDraw.Draw(image)
    boundary = (360, 55, 1650, 1020)
    draw.rounded_rectangle(boundary, radius=22, outline="#24466f", width=4)
    draw.text((390, 75), "EduGraph", font=pil_font(28, True), fill="#24466f")
    actor_data = [
        (120, 70, "Неавторизований\nкористувач"),
        (120, 305, "Студент"),
        (120, 535, "Викладач"),
        (120, 765, "Адміністратор /\nсуперадміністратор"),
    ]
    for x, y, label in actor_data:
        draw_actor(draw, x, y, label)
    cases = {
        "login": (470, 125, 825, 215, "Увійти до системи"),
        "signup": (1030, 125, 1450, 215, "Подати заявку на реєстрацію"),
        "search": (470, 345, 825, 445, "Виконати семантичний пошук"),
        "graph": (1030, 345, 1450, 445, "Переглянути граф результатів"),
        "open": (735, 505, 1180, 605, "Відкрити фрагмент і оригінал"),
        "apps": (470, 690, 825, 790, "Опрацювати заявки"),
        "users": (1030, 690, 1450, 790, "Керувати користувачами"),
        "sync": (735, 870, 1180, 970, "Запустити синхронізацію"),
    }
    for x1, y1, x2, y2, text in cases.values():
        draw.ellipse((x1, y1, x2, y2), fill="#f3f6fa", outline="#24466f", width=3)
        draw_wrapped(draw, text, (x1 + 20, y1 + 8, x2 - 20, y2 - 8), pil_font(25))
    draw_arrow(draw, (170, 155), (470, 170))
    draw_arrow(draw, (170, 165), (1030, 170))
    draw_arrow(draw, (170, 390), (470, 395))
    draw_arrow(draw, (170, 400), (1030, 395))
    draw_arrow(draw, (170, 415), (735, 555))
    draw_arrow(draw, (170, 620), (470, 740))
    draw_arrow(draw, (170, 630), (1030, 740))
    draw_arrow(draw, (170, 650), (735, 920))
    draw_arrow(draw, (170, 850), (470, 740))
    draw_arrow(draw, (170, 865), (1030, 740))
    draw_arrow(draw, (170, 880), (735, 920))
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)


def create_application_state(path: Path) -> None:
    image = Image.new("RGB", (1500, 760), "white")
    draw = ImageDraw.Draw(image)
    pending = (120, 285, 485, 445)
    approved = (640, 115, 1060, 275)
    rejected = (640, 475, 1060, 635)
    user = (1160, 115, 1435, 275)
    draw_box(draw, pending, "Pending\nочікує рішення", fill="#fff7c2", outline="#c78a00")
    draw_box(draw, approved, "Approved\nзаявку схвалено", fill="#d9f7e4", outline="#16954b")
    draw_box(draw, rejected, "Rejected\nзаявку відхилено", fill="#ffe0e0", outline="#cf2d2d")
    draw_box(draw, user, "User\nобліковий запис", fill="#dceeff", outline="#0878bd")
    draw_arrow(draw, (485, 335), (640, 205), fill="#16954b")
    draw_arrow(draw, (485, 400), (640, 555), fill="#cf2d2d")
    draw_arrow(draw, (1060, 195), (1160, 195), fill="#0878bd")
    draw.text((515, 225), "схвалити", font=pil_font(24), fill="#176b38")
    draw.text((515, 495), "відхилити", font=pil_font(24), fill="#9b2020")
    draw.text((1080, 155), "Identity", font=pil_font(23), fill="#0878bd")
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)


def create_logical_db(path: Path) -> None:
    image = Image.new("RGB", (1600, 900), "white")
    draw = ImageDraw.Draw(image)
    boxes = [
        (80, 125, 520, 330, "AspNetUsers\nId, FullName, Type, Group,\nLastLoginDate та поля Identity"),
        (80, 530, 520, 735, "SignUpApplications\nId, FullName, Type, Group,\nLogin, PasswordHash, Status"),
        (610, 125, 1090, 360, "UniversityDocuments\nId, Name, Content, Link,\nGoogleDriveId, FolderName,\nContentHash, SearchIndexStatus"),
        (610, 530, 1090, 735, "UniversityFolders\nId, GoogleDriveId,\nName, Link, IsMain"),
        (1190, 125, 1530, 735, "Технічні таблиці Identity\n\nAspNetRoles\nAspNetUserRoles\nAspNetUserClaims\nAspNetRoleClaims\nAspNetUserLogins\nAspNetUserTokens\n\nМіж ними наявні FK."),
    ]
    for box in boxes:
        draw_box(draw, box[:4], box[4], font_size=25)
    draw.rounded_rectangle((80, 790, 1530, 860), radius=15, fill="#fff7c2", outline="#c78a00", width=3)
    draw_wrapped(
        draw,
        "Між прикладними сутностями зовнішні ключі та навігаційні зв'язки не визначені.",
        (105, 800, 1505, 850),
        pil_font(27, True),
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)


def create_semantic_flow(path: Path) -> None:
    image = Image.new("RGB", (1700, 1000), "white")
    draw = ImageDraw.Draw(image)
    top = [
        (55, 135, 295, 270, "Текст документа\nз ASP.NET"),
        (340, 135, 600, 270, "Нормалізація\nі chunking\n1000 / 150"),
        (645, 135, 920, 270, "passage:\nmultilingual-e5-base\nвектор 768"),
        (965, 135, 1225, 270, "LanceDB\ndocument_chunks"),
    ]
    for box in top:
        draw_box(draw, box[:4], box[4], font_size=24)
    for left, right in zip(top, top[1:]):
        draw_arrow(draw, (left[2], 202), (right[0], 202))
    bottom = [
        (55, 615, 300, 750, "Запит\nкористувача"),
        (345, 615, 600, 750, "query:\nembedding"),
        (645, 615, 900, 750, "Cosine retrieval\nmax(top_k×8, 30)"),
        (945, 615, 1195, 750, "Фільтр\nscore ≥ 0,75"),
        (1240, 615, 1490, 750, "CrossEncoder\nreranking"),
        (1240, 825, 1490, 950, "Один chunk\nна документ,\ntop-5"),
    ]
    for box in bottom:
        draw_box(draw, box[:4], box[4], font_size=23)
    for left, right in zip(bottom[:5], bottom[1:5]):
        draw_arrow(draw, (left[2], 682), (right[0], 682))
    draw_arrow(draw, (1490, 682), (1490, 825))
    draw_arrow(draw, (1095, 270), (775, 615))
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)


def create_graph_model(path: Path) -> None:
    image = Image.new("RGB", (1650, 960), "white")
    draw = ImageDraw.Draw(image)
    root = (60, 380, 300, 520)
    trunks = [
        (380, 150, 560, 270),
        (380, 380, 560, 500),
        (380, 610, 560, 730),
    ]
    folders = [
        (680, 105, 1050, 270),
        (680, 335, 1050, 500),
        (680, 565, 1050, 730),
    ]
    documents = [
        (1180, 105, 1560, 270),
        (1180, 335, 1560, 500),
        (1180, 565, 1560, 730),
    ]
    draw_box(draw, root, "root\ng7", fill="#d9f7e4", outline="#16954b")
    for index, box in enumerate(trunks, start=1):
        draw_box(draw, box, f"trunk:{index}\nневидимий вузол", font_size=22)
    for index, box in enumerate(folders, start=1):
        draw_box(draw, box, f"folder {index}\nid, title, url, type", fill="#d9f7e4", outline="#16954b", font_size=23)
    for index, box in enumerate(documents, start=1):
        draw_box(
            draw,
            box,
            f"document {index}\nid із chunkId, title,\nurl, content, parentId",
            fill="#dceeff",
            outline="#0878bd",
            font_size=22,
        )
    draw.line((300, 450, 380, 210), fill="#43566f", width=4)
    draw.line((470, 270, 470, 380), fill="#43566f", width=4)
    draw.line((470, 500, 470, 610), fill="#43566f", width=4)
    for trunk, folder, document in zip(trunks, folders, documents):
        draw.line((trunk[2], (trunk[1] + trunk[3]) // 2, folder[0], (folder[1] + folder[3]) // 2), fill="#16954b", width=4)
        draw.line((folder[2], (folder[1] + folder[3]) // 2, document[0], (document[1] + document[3]) // 2), fill="#0878bd", width=4)
    draw.rounded_rectangle((80, 820, 1560, 910), radius=16, fill="#fff7c2", outline="#c78a00", width=3)
    draw_wrapped(
        draw,
        "Документ приєднується до папки за точним folderName; якщо відповідності немає, parentId вказує на root.",
        (110, 830, 1530, 895),
        pil_font(25),
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)


def create_sync_flow(path: Path) -> None:
    image = Image.new("RGB", (1700, 1120), "white")
    draw = ImageDraw.Draw(image)
    boxes = [
        (620, 35, 1080, 135, "Старт: фоновий цикл або ручна черга"),
        (620, 180, 1080, 280, "Захопити спільний SemaphoreSlim"),
        (620, 325, 1080, 425, "Оновити кореневу та папки першого рівня"),
        (620, 470, 1080, 570, "Обійти дерево Google Drive через BFS"),
        (620, 615, 1080, 715, "Завантажити й розібрати файли batch 15"),
        (620, 760, 1080, 860, "Обчислити SHA-256; створити або оновити SQLite"),
        (80, 930, 510, 1045, "Відсутні syncedIds:\nвидалити з FastAPI,\nпотім із SQLite"),
        (635, 930, 1065, 1045, "NotIndexed:\nPOST /documents/upsert\nbatch 15"),
        (1190, 930, 1620, 1045, "Завершити спробу;\nфоновий цикл чекає\n4 години"),
    ]
    for box in boxes:
        draw_box(draw, box[:4], box[4], font_size=23)
    for current, following in zip(boxes[:6], boxes[1:6]):
        draw_arrow(draw, ((current[0] + current[2]) // 2, current[3]), ((following[0] + following[2]) // 2, following[1]))
    draw_arrow(draw, (760, 860), (295, 930))
    draw_arrow(draw, (850, 860), (850, 930))
    draw_arrow(draw, (940, 860), (1405, 930))
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)


def create_assets() -> dict[str, Path]:
    assets = {
        "architecture": ASSET_DIR / "architecture.png",
        "usecases": ASSET_DIR / "usecases.png",
        "application_state": ASSET_DIR / "application_state.png",
        "logical_db": ASSET_DIR / "logical_db.png",
        "semantic_flow": ASSET_DIR / "semantic_flow.png",
        "graph_model": ASSET_DIR / "graph_model.png",
        "sync_flow": ASSET_DIR / "sync_flow.png",
    }
    create_architecture(assets["architecture"])
    create_use_cases(assets["usecases"])
    create_application_state(assets["application_state"])
    create_logical_db(assets["logical_db"])
    create_semantic_flow(assets["semantic_flow"])
    create_graph_model(assets["graph_model"])
    create_sync_flow(assets["sync_flow"])
    return assets


def build_front_matter(
    doc: Document,
    page_count: str,
    toc_pages: dict[str, int],
) -> list:
    start = fragment_start(doc)

    add_paragraph(
        doc,
        "Форма № Н-9.02у",
        align=WD_ALIGN_PARAGRAPH.RIGHT,
        indent=False,
        bold=True,
        after=6,
    )
    for text in (
        "Кременчуцький національний університет імені Михайла Остроградського",
        "Навчально-науковий інститут електричної інженерії та інформаційних технологій",
        "Кафедра комп’ютерної інженерії та електроніки",
    ):
        paragraph = add_paragraph(
            doc,
            text,
            align=WD_ALIGN_PARAGRAPH.CENTER,
            indent=False,
            after=2,
        )
        for run in paragraph.runs:
            run.font.underline = True
    add_paragraph(doc, "", indent=False, size=6, after=42)
    add_paragraph(
        doc,
        "ПОЯСНЮВАЛЬНА ЗАПИСКА",
        align=WD_ALIGN_PARAGRAPH.CENTER,
        indent=False,
        size=18,
        bold=True,
        after=2,
    )
    add_paragraph(
        doc,
        "до кваліфікаційної роботи",
        align=WD_ALIGN_PARAGRAPH.CENTER,
        indent=False,
        after=0,
    )
    add_paragraph(
        doc,
        "бакалавр",
        align=WD_ALIGN_PARAGRAPH.CENTER,
        indent=False,
        after=18,
    )
    add_paragraph(
        doc,
        f"на тему: «{TITLE}»",
        align=WD_ALIGN_PARAGRAPH.CENTER,
        indent=False,
        after=24,
    )
    for text in (
        "Виконав: студент 4 курсу групи КІ-22-1",
        "ступінь вищої освіти бакалавр",
        "спеціальність 123 «Комп’ютерна інженерія»",
        "освітня програма «Комп’ютерна інженерія»",
        "Ілля ГРИЩЕНКО",
        "Керівник ______________________________",
        "Рецензент _____________________________",
    ):
        add_paragraph(
            doc,
            text,
            align=WD_ALIGN_PARAGRAPH.RIGHT,
            indent=False,
            after=1,
        )
    add_paragraph(doc, "", indent=False, size=6, after=20)
    add_paragraph(
        doc,
        "м. Кременчук 2026 року",
        align=WD_ALIGN_PARAGRAPH.CENTER,
        indent=False,
    )
    add_page_break(doc)

    add_paragraph(
        doc,
        "РЕФЕРАТ",
        align=WD_ALIGN_PARAGRAPH.CENTER,
        indent=False,
        bold=True,
        after=4,
    )
    add_paragraph(
        doc,
        f"Грищенко І. В. {TITLE}.",
        align=WD_ALIGN_PARAGRAPH.JUSTIFY,
        indent=False,
        bold=True,
        size=12,
    )
    add_paragraph(
        doc,
        "Спеціальність 123 – Комп’ютерна інженерія, освітньо-професійна "
        "програма – Комп’ютерна інженерія – КрНУ. – Кременчук, 2026.",
        indent=False,
        size=12,
    )
    add_paragraph(
        doc,
        "Об’єктом розробки є програмна система пошуку та навігації в корпусі "
        "освітніх документів.",
        size=12,
    )
    add_paragraph(
        doc,
        "Метою роботи є розроблення веб-системи EduGraph, яка синхронізує "
        "документи з Google Drive, виконує семантичний пошук за змістом і "
        "відображає результати у вигляді інтерактивного графу.",
        size=12,
    )
    add_paragraph(
        doc,
        "У роботі проаналізовано альтернативні технологічні рішення, спроєктовано "
        "рольові сценарії та модель даних, реалізовано ASP.NET Core API, FastAPI-сервіс "
        "із multilingual-e5, LanceDB і CrossEncoder, а також React-клієнт із графовою "
        "візуалізацією. Описано синхронізацію Google Drive, парсинг документів, "
        "індексацію, пошук, перевірку сценаріїв та порядок роботи користувача.",
        size=12,
    )
    add_paragraph(
        doc,
        f"Робота містить {page_count} сторінок, 3 основні розділи, "
        "[[FIGURE_COUNT]] рисунків, [[TABLE_COUNT]] таблиць, 20 джерел і 5 додатків.",
        size=12,
    )
    add_paragraph(
        doc,
        "Ключові слова: семантичний пошук, embeddings, reranking, ASP.NET Core, "
        "React, FastAPI, Google Drive, LanceDB, графова навігація.",
        indent=False,
        size=12,
        bold=True,
        after=5,
    )
    add_paragraph(
        doc,
        "ABSTRACT",
        align=WD_ALIGN_PARAGRAPH.CENTER,
        indent=False,
        bold=True,
        size=12,
        after=2,
    )
    add_paragraph(
        doc,
        "The object of development is a software system for searching and navigating "
        "a corpus of educational documents. The purpose is to develop EduGraph, a web "
        "system that synchronizes documents from Google Drive, performs semantic "
        "retrieval, and presents results as an interactive graph. The work covers "
        "technology selection, data design, ASP.NET Core API, a FastAPI retrieval "
        "service with multilingual-e5, LanceDB and CrossEncoder reranking, and a React "
        "client with graph visualization.",
        size=11.5,
    )
    add_paragraph(
        doc,
        "Keywords: semantic search, embeddings, reranking, ASP.NET Core, React, "
        "FastAPI, Google Drive, LanceDB, graph navigation.",
        indent=False,
        size=11.5,
        bold=True,
    )
    add_page_break(doc)

    add_paragraph(
        doc,
        "Форма № Н-9.01у.1",
        align=WD_ALIGN_PARAGRAPH.RIGHT,
        indent=False,
        bold=True,
    )
    add_paragraph(
        doc,
        "ЗАВДАННЯ НА КВАЛІФІКАЦІЙНУ РОБОТУ",
        align=WD_ALIGN_PARAGRAPH.CENTER,
        indent=False,
        bold=True,
        after=8,
    )
    for text in (
        "Студент: Грищенко Ілля Володимирович.",
        f"Тема кваліфікаційної роботи: «{TITLE}».",
        "Керівник кваліфікаційної роботи: ________________________________.",
        "Затверджено наказом від ____________ 2026 року № __________.",
        "Строк подання студентом кваліфікаційної роботи: __________________.",
        "Вихідні дані: монорепозиторій EduGraph, корпус освітніх документів у "
        "Google Drive, вимоги до функціональності й оформлення роботи.",
        "Зміст роботи: аналіз предметної області; функціональна модель; "
        "проєктування БД; реалізація семантичного пошуку; графове подання; "
        "ASP.NET Core API; синхронізація Google Drive; інтерфейс; тестування; "
        "інструкція користувача.",
        "Перелік графічного матеріалу: архітектура системи; діаграма варіантів "
        "використання; логічна й фізична схеми БД; алгоритми семантичного пошуку "
        "та синхронізації; модель графового подання; екрани інтерфейсу.",
        "Дата видачі завдання: __________________.",
        "Студент __________________ Ілля ГРИЩЕНКО",
        "Керівник роботи __________________ __________________",
    ):
        add_paragraph(doc, text, after=2)
    add_page_break(doc)

    add_paragraph(
        doc,
        "КАЛЕНДАРНИЙ ПЛАН",
        align=WD_ALIGN_PARAGRAPH.CENTER,
        indent=False,
        bold=True,
        after=6,
    )
    table = doc.add_table(rows=1, cols=4)
    headers = ["№", "Назва етапу", "Строк виконання", "Примітка"]
    for index, value in enumerate(headers):
        table.rows[0].cells[index].text = value
    calendar_rows = [
        ("1", "Отримання завдання", "__________", ""),
        ("2", "Аналіз предметної області та альтернатив", "__________", ""),
        ("3", "Проєктування архітектури, БД і сценаріїв", "__________", ""),
        ("4", "Реалізація ASP.NET Core API та Google Drive інтеграції", "__________", ""),
        ("5", "Реалізація FastAPI-сервісу семантичного пошуку", "__________", ""),
        ("6", "Реалізація React-клієнта та графового подання", "__________", ""),
        ("7", "Функціональна перевірка системи", "__________", ""),
        ("8", "Оформлення записки й графічних матеріалів", "__________", ""),
        ("9", "Подання роботи на перевірку та захист", "__________", ""),
    ]
    for values in calendar_rows:
        cells = table.add_row().cells
        for index, value in enumerate(values):
            cells[index].text = value
    format_table(table, [1.0, 9.0, 3.0, 3.0], 11)
    add_paragraph(doc, "Студент __________________ Ілля ГРИЩЕНКО", indent=False, after=3)
    add_paragraph(doc, "Керівник роботи __________________ __________________", indent=False)
    add_page_break(doc)

    add_paragraph(
        doc,
        "ВІДОМІСТЬ РОБОТИ",
        align=WD_ALIGN_PARAGRAPH.CENTER,
        indent=False,
        bold=True,
        after=8,
    )
    table = doc.add_table(rows=1, cols=5)
    for index, value in enumerate(("Формат", "Позначення", "Найменування", "Аркушів", "Примітка")):
        table.rows[0].cells[index].text = value
    cells = table.add_row().cells
    for index, value in enumerate(
        (
            "А4",
            "КрНУ.26.ІЕЛІІТ.123.____.001.ПЗ",
            "Записка пояснювальна",
            page_count,
            "",
        )
    ):
        cells[index].text = value
    format_table(table, [1.4, 5.0, 5.0, 2.0, 2.6], 11)
    add_page_break(doc)

    add_heading(doc, "ЗМІСТ", 1)
    add_static_toc(doc, toc_pages)
    add_page_break(doc)
    return collect_fragment(doc, start)


def build_introduction(doc: Document) -> list:
    start = fragment_start(doc)
    add_heading(doc, "ВСТУП", 1)
    paragraphs = [
        (
            "Цифрове освітнє середовище університету містить освітні програми, "
            "методичні рекомендації, робочі програми дисциплін, інструкції, звіти "
            "та допоміжні матеріали. Наявність файла у сховищі не гарантує, що "
            "користувач швидко знайде потрібний фрагмент."
        ),
        (
            "Пошук за точним збігом слів обмежений різними формулюваннями одного "
            "поняття та великим обсягом документів. Семантичний пошук порівнює "
            "векторні подання запиту й текстових фрагментів, що дозволяє враховувати "
            "змістову близькість [2, 3]."
        ),
        (
            f"Тема роботи – «{TITLE}». Реалізація EduGraph не генерує відповідь "
            "чат-моделлю. Transformer-моделі використовуються для побудови embeddings "
            "і повторного ранжування знайдених фрагментів; користувач отримує уривок "
            "та посилання на оригінальний документ [1, 4]."
        ),
        (
            "Метою роботи є розроблення веб-системи EduGraph, яка забезпечує "
            "синхронізацію корпусу з Google Drive, збереження метаданих у SQLite, "
            "побудову векторного індексу, семантичний пошук і графове подання результатів."
        ),
        (
            "Об’єктом розробки є процес пошуку та навігації в корпусі освітніх "
            "документів. Предметом розробки є програмні засоби синхронізації, "
            "витягування тексту, індексації, ранжування та клієнтської візуалізації."
        ),
        (
            "Для досягнення мети необхідно проаналізувати альтернативні рішення; "
            "сформувати вимоги; спроєктувати ролі, БД і взаємодію компонентів; "
            "описати реалізацію ASP.NET Core API, FastAPI-сервісу й React-клієнта; "
            "перевірити основні сценарії та підготувати інструкцію користувача."
        ),
        (
            "Практична цінність EduGraph полягає у використанні наявного Google Drive "
            "як джерела документів без перенесення офіційних матеріалів до нового "
            "сховища. Система додає до чинної структури семантичний пошук і графову "
            "навігацію."
        ),
    ]
    for text in paragraphs:
        add_paragraph(doc, text)
    return collect_fragment(doc, start)


def build_section_1_3_to_1_7(doc: Document) -> list:
    start = fragment_start(doc)
    add_heading(doc, "1.3 Огляд існуючих комплексних рішень", 2)
    add_paragraph(
        doc,
        "Для вибору підходу зіставлено файловий пошук, повнотекстові системи, "
        "керовані векторні сервіси та локальні векторні сховища. Порівняння "
        "наведено в таблиці 1.2.",
    )
    add_table(
        doc,
        "Таблиця 1.2 – Порівняння комплексних рішень пошуку",
        ["Рішення", "Можливості", "Розгортання", "Переваги", "Обмеження для EduGraph"],
        [
            ["Google Drive Search", "Назви, метадані, текстовий пошук", "Хмарне", "Готове джерело документів", "Немає керованого двоетапного semantic retrieval"],
            ["Elasticsearch / OpenSearch", "Повнотекстовий і vector search", "Окремий сервер або кластер", "Гнучкі фільтри й індекси", "Надлишкова інфраструктура для локального прототипу"],
            ["Pinecone / Weaviate Cloud", "Кероване векторне сховище", "Хмарне", "Масштабування й готовий API", "Зовнішня залежність і потенційні витрати"],
            ["Qdrant / Milvus", "Векторний пошук і фільтри", "Окремий сервіс", "Розвинені можливості пошуку", "Потрібне додаткове розгортання"],
            ["LanceDB", "Локальне зберігання vectors і метаданих", "У процесі FastAPI", "Проста інтеграція з Python [13]", "Потрібно окремо вирішувати резервування і масштабування"],
            ["Генеративна RAG-система", "Retrieval і формування відповіді", "Кілька моделей і сервісів", "Зручна синтезована відповідь", "Виходить за межі реалізованого retrieval-прототипу"],
        ],
        [3.0, 3.7, 3.0, 3.5, 4.0],
        font_size=9.5,
    )
    add_paragraph(
        doc,
        "Для поточного масштабу обрано Google Drive як джерело та LanceDB як "
        "локальний vector store. Генеративний шар не включено, щоб зберегти прямий "
        "зв’язок результату з першоджерелом.",
    )

    add_heading(doc, "1.4 Аналіз середовищ створення застосунку", 2)
    add_paragraph(
        doc,
        "Середовища оцінювалися за підтримкою мов, налагодження, пакетних менеджерів "
        "і роботи з монорепозиторієм. Результат наведено в таблиці 1.3.",
    )
    add_table(
        doc,
        "Таблиця 1.3 – Порівняння середовищ розроблення",
        ["Частина", "Розглянуті середовища", "Придатні можливості", "Прийняте рішення"],
        [
            ["ASP.NET Core", "JetBrains Rider; Visual Studio", "C#, NuGet, EF Core, профілі запуску, debugger", "Будь-яке з двох; код не залежить від IDE"],
            ["React / TypeScript", "Visual Studio Code; WebStorm", "TSX, ESLint, npm scripts, навігація типів", "VS Code або WebStorm"],
            ["FastAPI / Python", "PyCharm; Visual Studio Code", "venv, Python debugger, HTTP-запити", "PyCharm або VS Code"],
            ["API", "Scalar; OpenAPI-файл; HTTP-клієнт", "Перегляд контрактів і ручні виклики", "OpenAPI/Scalar для ASP.NET; test HTTP для FastAPI"],
            ["БД", "EF Core migrations; SQLite CLI/браузер", "Еволюція схеми та перевірка таблиць", "Міграції як джерело структури"],
        ],
        [3.0, 4.0, 5.0, 4.2],
        font_size=10,
    )

    add_heading(doc, "1.5 Огляд ОС, мов програмування та платформ", 2)
    add_paragraph(
        doc,
        "Варіанти платформ зіставлено за відповідністю фактичним задачам системи. "
        "Порівняння наведено в таблиці 1.4.",
    )
    add_table(
        doc,
        "Таблиця 1.4 – Вибір мов, платформ і сховищ",
        ["Зона", "Альтернативи", "Обране рішення", "Причина вибору"],
        [
            ["Основний API", "ASP.NET Core; NestJS; Django", "ASP.NET Core Minimal API", "Identity, DI, фонові служби, OpenAPI та типізована доменна логіка [5]"],
            ["Клієнт", "React; Vue; Angular", "React + TypeScript + Vite", "Фактична компонентна реалізація, хуки й швидке складання SPA [8, 9]"],
            ["ML/NLP API", "FastAPI; Flask; інтеграція в .NET", "FastAPI", "Pydantic-контракти та Python-екосистема моделей [11]"],
            ["Реляційна БД", "SQLite; PostgreSQL; SQL Server", "SQLite", "Достатня для локального прототипу, підтримується EF Core provider [6]"],
            ["Векторне сховище", "LanceDB; Qdrant; Milvus; Pinecone", "LanceDB", "Локальна робота без окремого search cluster [13]"],
            ["Джерело документів", "Власне сховище; OneDrive; Google Drive", "Google Drive API", "Корпус і структура папок уже існують у зовнішньому сховищі [12]"],
        ],
        [3.0, 4.5, 4.0, 5.0],
        font_size=9.7,
    )

    add_heading(doc, "1.6 Постановка задачі", 2)
    add_paragraph(
        doc,
        "Функціональні вимоги згруповано в таблиці 1.5, нефункціональні – у "
        "таблиці 1.6.",
    )
    add_table(
        doc,
        "Таблиця 1.5 – Функціональні вимоги до EduGraph",
        ["ID", "Вимога", "Результат"],
        [
            ["F1", "Автентифікація та рольовий доступ", "Доступ до маршрутів згідно з Student, Teacher, Admin, SuperAdmin"],
            ["F2", "Подання й оброблення заявки", "Створення Pending-заявки, approve або reject"],
            ["F3", "Синхронізація Google Drive", "Оновлення папок, документів і локального стану"],
            ["F4", "Витягування тексту", "DOCX, PDF, TXT, CSV та підтримувані Google Workspace exports"],
            ["F5", "Семантична індексація", "Chunks, embeddings і записи LanceDB"],
            ["F6", "Семантичний пошук", "Vector retrieval, фільтрація, reranking, top-k"],
            ["F7", "Графове подання", "Root, trunk, folder і document вузли"],
            ["F8", "Перегляд джерела", "Фрагмент у modal і безпечне посилання Google Drive"],
        ],
        [1.2, 7.2, 8.0],
        font_size=10,
    )
    add_table(
        doc,
        "Таблиця 1.6 – Нефункціональні вимоги до EduGraph",
        ["Категорія", "Вимога", "Критерій"],
        [
            ["Безпека", "Backend перевіряє JWT і політики незалежно від UI", "Заборонений прямий HTTP-запит відхиляється"],
            ["Модульність", "Frontend, ASP.NET API і FastAPI розділені", "Компоненти взаємодіють через HTTP-контракти"],
            ["Зрозумілість", "Пошук не вимагає знання embeddings", "Користувач працює із запитом, графом і фрагментом"],
            ["Відтворюваність", "Схема БД визначена migrations, параметри пошуку зафіксовані", "Опис відповідає коду [1]"],
            ["Розширюваність", "Модель embeddings і СУБД можна замінити", "Контракти компонентів не залежать від UI"],
            ["Обмеження якості", "Не заявляти кількісну точність без benchmark", "Результати оцінюються функціональними сценаріями"],
        ],
        [3.0, 7.0, 6.4],
        font_size=10,
    )

    add_heading(doc, "1.7 Попередній вибір проєктних рішень", 2)
    add_paragraph(
        doc,
        "Підсумкові рішення та відхилені альтернативи наведено в таблиці 1.7. "
        "Вибір відповідає фактичній структурі монорепозиторію [1].",
    )
    add_table(
        doc,
        "Таблиця 1.7 – Обґрунтування проєктних рішень",
        ["Компонент", "Розглянуті варіанти", "Обрано", "Обґрунтування"],
        [
            ["Архітектура", "Моноліт; два компоненти; окремий ML-сервіс", "React + ASP.NET API + FastAPI", "Розділення UI, доменної логіки та NLP"],
            ["API", "Controllers; Minimal API", "Minimal API + VSA", "Локалізація request, validator і handler"],
            ["Авторизація", "Власні таблиці; Identity", "Identity + JWT", "Користувачі, ролі й стандартне хешування паролів [7, 17]"],
            ["Пошук", "Keyword; embeddings; embeddings + reranking", "Двоетапний retrieval", "Швидкий vector candidate search і уточнення порядку [14, 15]"],
            ["Граф", "Список; SVG; Canvas force graph", "react-force-graph-2d", "Canvas-рендеринг і кероване розміщення вузлів [10]"],
            ["API-контракт", "Неформальні DTO; OpenAPI", "OpenAPI", "Машиночитаний опис endpoint-ів [18]"],
        ],
        [3.0, 4.8, 4.0, 5.0],
        font_size=9.8,
    )
    return collect_fragment(doc, start)


def build_section_2(doc: Document, assets: dict[str, Path]) -> list:
    start = fragment_start(doc)
    add_heading(doc, "2 ФУНКЦІОНАЛЬНА ЧАСТИНА", 1)
    add_heading(doc, "2.1 Проєктування варіантів використання системи", 2)
    add_paragraph(
        doc,
        "Функціональна модель визначає акторів і доступні їм сценарії без "
        "опису внутрішньої реалізації. Акторів наведено в таблиці 2.1.",
    )
    add_table(
        doc,
        "Таблиця 2.1 – Актори системи EduGraph",
        ["Актор", "Основні дії", "Обмеження"],
        [
            ["Неавторизований користувач", "Вхід, подання заявки", "Немає доступу до корпусу"],
            ["Student", "Пошук, граф, фрагмент, оригінал", "Немає адміністративних дій"],
            ["Teacher", "Пошук, заявки, студенти, викладачі, синхронізація", "Не керує адміністраторами"],
            ["Admin", "Пошук, заявки, студенти, викладачі, синхронізація", "Не керує адміністраторами"],
            ["SuperAdmin", "Усі сценарії, зокрема адміністратори", "Найширші права"],
        ],
        [3.8, 8.0, 4.6],
        font_size=10,
    )
    add_paragraph(
        doc,
        "Матриця доступу наведена в таблиці 2.2. Остаточна перевірка ролей "
        "виконується ASP.NET Core API, а не клієнтським маршрутом.",
    )
    add_table(
        doc,
        "Таблиця 2.2 – Матриця доступу до сценаріїв",
        ["Сценарій", "Student", "Teacher", "Admin", "SuperAdmin"],
        [
            ["Семантичний пошук", "+", "+", "+", "+"],
            ["Перегляд графу й документа", "+", "+", "+", "+"],
            ["Опрацювання заявок", "–", "+", "+", "+"],
            ["Керування студентами", "–", "+", "+", "+"],
            ["Керування викладачами", "–", "+", "+", "+"],
            ["Керування адміністраторами", "–", "–", "–", "+"],
            ["Запуск синхронізації", "–", "+", "+", "+"],
        ],
        [7.0, 2.2, 2.4, 2.2, 2.6],
        font_size=10,
    )
    add_paragraph(
        doc,
        "Зв’язки акторів із варіантами використання показано стрілками на "
        "рисунку 2.1.",
    )
    add_image(doc, assets["usecases"], "Рисунок 2.1 – Загальна діаграма варіантів використання EduGraph", 16.5)

    add_heading(doc, "2.2 Специфікації основних сценаріїв", 2)
    add_paragraph(
        doc,
        "Для перевірки функціональних вимог визначено шість основних сценаріїв. "
        "Їх перелік наведено в таблиці 2.3, а повні специфікації з передумовами, "
        "основним потоком, альтернативами й постумовами винесено до додатка А.",
    )
    add_table(
        doc,
        "Таблиця 2.3 – Перелік основних сценаріїв",
        ["Код", "Сценарій", "Актор"],
        [
            ["UC-01", "Увійти до системи", "Користувач"],
            ["UC-02", "Подати заявку на реєстрацію", "Неавторизований користувач"],
            ["UC-03", "Опрацювати заявку", "Teacher, Admin, SuperAdmin"],
            ["UC-04", "Виконати семантичний пошук", "Авторизований користувач"],
            ["UC-05", "Переглянути фрагмент і оригінал", "Авторизований користувач"],
            ["UC-06", "Запустити синхронізацію", "Teacher, Admin, SuperAdmin або фонова служба"],
        ],
        [2.0, 8.0, 6.4],
        font_size=10,
    )

    add_heading(doc, "2.3 Діаграми сценаріїв та взаємодії", 2)
    add_paragraph(
        doc,
        "Заявка має три збережені стани. Перехід до Approved супроводжується "
        "створенням користувача, а Rejected не створює облікового запису. "
        "Діаграму станів наведено на рисунку 2.2.",
    )
    add_image(doc, assets["application_state"], "Рисунок 2.2 – Діаграма станів заявки на реєстрацію", 16.0)
    return collect_fragment(doc, start)


DB_TABLES = [
    (
        "SignUpApplications",
        [
            ("Id", "INTEGER", "ні", "PK, autoincrement", "Ідентифікатор заявки"),
            ("CreatedAtUtc", "TEXT", "ні", "–", "Дата й час створення UTC"),
            ("FullName", "TEXT", "ні", "–", "ПІБ заявника"),
            ("Group", "TEXT", "так", "–", "Навчальна група"),
            ("Login", "TEXT", "ні", "UNIQUE", "Логін майбутнього користувача"),
            ("PasswordHash", "TEXT", "ні", "–", "Хеш пароля"),
            ("Status", "TEXT", "ні", "–", "Pending, Approved або Rejected"),
            ("Type", "TEXT", "ні", "–", "Тип майбутнього користувача"),
        ],
    ),
    (
        "UniversityDocuments",
        [
            ("Id", "INTEGER", "ні", "PK, autoincrement", "Локальний ідентифікатор"),
            ("Content", "TEXT", "ні", "–", "Витягнутий лінійний текст"),
            ("ContentHash", "TEXT", "ні", "–", "SHA-256 тексту"),
            ("FolderName", "TEXT", "так", "–", "Денормалізована назва папки"),
            ("GoogleDriveId", "TEXT", "ні", "UNIQUE", "Ідентифікатор файла Google Drive"),
            ("Link", "TEXT", "ні", "–", "Посилання на оригінал"),
            ("Name", "TEXT", "ні", "–", "Назва документа"),
            ("SearchIndexError", "TEXT", "так", "–", "Текст останньої помилки індексації"),
            ("SearchIndexStatus", "TEXT", "ні", "–", "Стан індексації"),
            ("SearchIndexedAt", "TEXT", "так", "–", "Дата останньої позначки Indexed"),
        ],
    ),
    (
        "UniversityFolders",
        [
            ("Id", "INTEGER", "ні", "PK, autoincrement", "Локальний ідентифікатор"),
            ("GoogleDriveId", "TEXT", "ні", "UNIQUE", "Ідентифікатор папки або службового root"),
            ("IsMain", "INTEGER", "ні", "UNIQUE WHERE IsMain=1", "Ознака головного вузла"),
            ("Link", "TEXT", "ні", "–", "Посилання Google Drive"),
            ("Name", "TEXT", "ні", "–", "Назва папки"),
        ],
    ),
    (
        "AspNetUsers",
        [
            ("Id", "INTEGER", "ні", "PK", "Ідентифікатор користувача"),
            ("UserName", "TEXT", "так", "–", "Ім’я входу"),
            ("NormalizedUserName", "TEXT", "так", "UNIQUE index", "Нормалізоване ім’я входу"),
            ("Email", "TEXT", "так", "index", "Електронна пошта"),
            ("NormalizedEmail", "TEXT", "так", "index", "Нормалізована пошта"),
            ("EmailConfirmed", "INTEGER", "ні", "–", "Ознака підтвердження пошти"),
            ("PasswordHash", "TEXT", "так", "–", "Хеш пароля Identity"),
            ("SecurityStamp", "TEXT", "так", "–", "Маркер безпеки"),
            ("ConcurrencyStamp", "TEXT", "так", "–", "Маркер конкурентних змін"),
            ("PhoneNumber", "TEXT", "так", "–", "Номер телефону"),
            ("PhoneNumberConfirmed", "INTEGER", "ні", "–", "Підтвердження телефону"),
            ("TwoFactorEnabled", "INTEGER", "ні", "–", "Ознака 2FA"),
            ("LockoutEnd", "TEXT", "так", "–", "Завершення блокування"),
            ("LockoutEnabled", "INTEGER", "ні", "–", "Дозвіл блокування"),
            ("AccessFailedCount", "INTEGER", "ні", "–", "Кількість невдалих входів"),
            ("FullName", "TEXT", "ні", "–", "ПІБ користувача"),
            ("Type", "TEXT", "ні", "index", "Student, Teacher, Admin, SuperAdmin"),
            ("Group", "TEXT", "так", "–", "Навчальна група"),
            ("LastLoginDate", "TEXT", "так", "–", "Дата останнього входу"),
        ],
    ),
    (
        "AspNetRoles",
        [
            ("Id", "INTEGER", "ні", "PK", "Ідентифікатор ролі"),
            ("Name", "TEXT", "так", "–", "Назва ролі"),
            ("NormalizedName", "TEXT", "так", "UNIQUE index", "Нормалізована назва"),
            ("ConcurrencyStamp", "TEXT", "так", "–", "Маркер конкурентних змін"),
        ],
    ),
    (
        "AspNetRoleClaims",
        [
            ("Id", "INTEGER", "ні", "PK", "Ідентифікатор claim"),
            ("RoleId", "INTEGER", "ні", "FK → AspNetRoles", "Роль"),
            ("ClaimType", "TEXT", "так", "–", "Тип claim"),
            ("ClaimValue", "TEXT", "так", "–", "Значення claim"),
        ],
    ),
    (
        "AspNetUserClaims",
        [
            ("Id", "INTEGER", "ні", "PK", "Ідентифікатор claim"),
            ("UserId", "INTEGER", "ні", "FK → AspNetUsers", "Користувач"),
            ("ClaimType", "TEXT", "так", "–", "Тип claim"),
            ("ClaimValue", "TEXT", "так", "–", "Значення claim"),
        ],
    ),
    (
        "AspNetUserLogins",
        [
            ("LoginProvider", "TEXT", "ні", "PK (частина)", "Провайдер входу"),
            ("ProviderKey", "TEXT", "ні", "PK (частина)", "Ключ у провайдера"),
            ("ProviderDisplayName", "TEXT", "так", "–", "Назва провайдера"),
            ("UserId", "INTEGER", "ні", "FK → AspNetUsers", "Користувач"),
        ],
    ),
    (
        "AspNetUserRoles",
        [
            ("UserId", "INTEGER", "ні", "PK, FK → AspNetUsers", "Користувач"),
            ("RoleId", "INTEGER", "ні", "PK, FK → AspNetRoles", "Роль"),
        ],
    ),
    (
        "AspNetUserTokens",
        [
            ("UserId", "INTEGER", "ні", "PK, FK → AspNetUsers", "Користувач"),
            ("LoginProvider", "TEXT", "ні", "PK (частина)", "Провайдер"),
            ("Name", "TEXT", "ні", "PK (частина)", "Назва токена"),
            ("Value", "TEXT", "так", "–", "Значення токена"),
        ],
    ),
    (
        "__EFMigrationsHistory",
        [
            ("MigrationId", "TEXT", "ні", "PK", "Ідентифікатор застосованої міграції"),
            ("ProductVersion", "TEXT", "ні", "–", "Версія EF Core"),
        ],
    ),
    (
        "__EFMigrationsLock",
        [
            ("Id", "INTEGER", "ні", "PK", "Ідентифікатор блокування"),
            ("Timestamp", "TEXT", "ні", "–", "Час блокування міграції"),
        ],
    ),
]


def build_section_3(doc: Document, assets: dict[str, Path]) -> list:
    start = fragment_start(doc)
    add_heading(doc, "3 ПРОЄКТНА ЧАСТИНА", 1)
    add_heading(doc, "3.1 Вибір базових технологій, платформ і стандартів", 2)
    add_paragraph(
        doc,
        "Аналітична частина обґрунтовує вибір, тому тут зафіксовано тільки "
        "фактичний стек і його роль у реалізації. Версії наведено в таблиці 3.1 [1].",
    )
    add_table(
        doc,
        "Таблиця 3.1 – Фактичний технологічний стек EduGraph",
        ["Компонент", "Технології та версії", "Призначення"],
        [
            ["Frontend", "React 19.2.0; TypeScript 5.9.3; Vite 7.3.3; React Router 7.15.1", "SPA, рольові маршрути й інтерфейс [8, 9]"],
            ["Граф", "react-force-graph-2d 1.29.1", "Canvas-візуалізація вузлів і зв’язків [10]"],
            ["Backend", ".NET 9; ASP.NET Core Minimal API; JWT Bearer 9.0.11", "HTTP API, політики, фонові служби [5]"],
            ["Дані", "EF Core SQLite 9.0.11; Identity 9.0.11", "Реляційний стан, користувачі й ролі [6, 7]"],
            ["Google Drive", "Google Drive API 1.72.0.3970; OpenXML 3.3.0; PdfPig 0.1.12", "Синхронізація та витягування тексту [12, 19, 20]"],
            ["Semantic search", "FastAPI; SentenceTransformers; LanceDB; CrossEncoder", "Індексація, vector retrieval і reranking [11, 13–15]"],
        ],
        [3.2, 7.5, 5.7],
        font_size=9.5,
    )

    add_heading(doc, "3.2 Визначення функціональних залежностей", 2)
    add_paragraph(
        doc,
        "Залежності визначають необхідні взаємодії компонентів, а не відношення "
        "успадкування чи фізичні зв’язки таблиць. Їх наведено в таблиці 3.2.",
    )
    add_table(
        doc,
        "Таблиця 3.2 – Функціональні залежності компонентів",
        ["Компонент", "Залежить від", "Наслідок недоступності"],
        [
            ["React-клієнт", "ASP.NET Core API", "Не виконує авторизацію, пошук і синхронізацію"],
            ["Реалізація бекенду", "SQLite", "Не зберігає користувачів, заявки й метадані"],
            ["Реалізація бекенду", "Google Drive API", "Не оновлює корпус, але може працювати з наявним індексом"],
            ["Реалізація бекенду", "FastAPI", "Не виконує semantic search та upsert/delete vector chunks"],
            ["FastAPI-сервіс", "SentenceTransformers і CrossEncoder", "Не створює embeddings і не уточнює порядок"],
            ["FastAPI-сервіс", "LanceDB", "Не зберігає й не шукає vector chunks"],
        ],
        [4.0, 5.5, 6.9],
        font_size=10,
    )

    add_heading(doc, "3.3 Проєктування бази даних", 2)
    add_heading(doc, "3.3.1 Вибір СУБД", 3)
    add_paragraph(
        doc,
        "SQLite відповідає масштабу локального прототипу й використовується через "
        "офіційний EF Core provider [6]. Файли зберігаються в Google Drive, embeddings – "
        "у LanceDB, тому реляційна БД містить користувачів, заявки та метадані.",
    )
    add_heading(doc, "3.3.2 Опис логічної структури БД", 3)
    add_paragraph(
        doc,
        "Логічна структура містить прикладні сутності User, SignUpApplication, "
        "UniversityDocument і UniversityFolder. Між ними не визначено EF Core "
        "зовнішніх ключів або navigation properties. Папка документа зберігається "
        "денормалізовано в FolderName, а зв’язок із LanceDB є логічним через "
        "GoogleDriveId/document_id [1]. Схему наведено на рисунку 3.1.",
    )
    add_image(doc, assets["logical_db"], "Рисунок 3.1 – Логічна структура даних EduGraph", 16.2)
    add_heading(doc, "3.3.3 Опис фізичної структури БД", 3)
    add_paragraph(
        doc,
        "Фізична схема на рисунку 3.2 підтверджує відсутність зв’язків між "
        "прикладними таблицями. Стрілки на схемі належать тільки технічним таблицям "
        "ASP.NET Identity, де FK пов’язують користувачів, ролі, claims, logins і tokens.",
    )
    add_image(doc, DB_SCREENSHOT, "Рисунок 3.2 – Фізична схема SQLite бази даних EduGraph", 16.4)
    add_paragraph(
        doc,
        "Поля всіх прикладних, Identity та службових таблиць наведено в таблицях "
        "3.3–3.14. Тип TEXT використовується також для дат і enum-значень відповідно "
        "до поточного EF Core mapping.",
    )
    table_number = 3
    for table_name, fields in DB_TABLES:
        add_table(
            doc,
            f"Таблиця 3.{table_number} – Поля таблиці {table_name}",
            ["Поле", "Тип SQLite", "NULL", "Ключ / індекс", "Призначення"],
            fields,
            [3.0, 2.3, 1.4, 4.2, 5.5],
            font_size=9.2,
        )
        table_number += 1
    add_heading(doc, "3.3.4 Підтримка цілісності даних", 3)
    add_paragraph(
        doc,
        "Цілісність прикладних сутностей підтримують фабричні й доменні методи, "
        "NOT NULL, унікальні індекси GoogleDriveId і Login та стандартні FK Identity. "
        "Окремої транзакційної гарантії між SQLite і LanceDB немає: це два сховища, "
        "узгодження яких виконує сервіс синхронізації [1].",
    )

    add_heading(doc, "3.4 Реалізація підсистеми семантичного пошуку", 2)
    add_paragraph(
        doc,
        "Підсистема є retrieval-сервісом, а не генеративною чат-LLM. FastAPI приймає "
        "документи й запити, SentenceTransformers створює embeddings, LanceDB виконує "
        "cosine retrieval, а CrossEncoder уточнює порядок кандидатів [3, 4, 11, 13–15].",
    )
    add_heading(doc, "3.4.1 HTTP-контракти та моделі", 3)
    add_table(
        doc,
        f"Таблиця 3.{table_number} – Контракти FastAPI-сервісу",
        ["Метод і маршрут", "Модель запиту", "Результат"],
        [
            ["GET /health", "–", '{"status": "ok"}'],
            ["POST /documents/upsert", "UpsertRequest", "inserted_chunks, skipped_documents"],
            ["POST /documents/delete", "DeleteRequest", "deleted_documents"],
            ["POST /search", "SearchRequest", "Масив SearchResult"],
        ],
        [4.2, 5.0, 7.2],
        font_size=10,
    )
    table_number += 1
    add_table(
        doc,
        f"Таблиця 3.{table_number} – Параметри семантичного пошуку",
        ["Параметр", "Фактичне значення", "Призначення"],
        [
            ["Embedding model", "intfloat/multilingual-e5-base", "Вектори документів і запиту"],
            ["Reranker", "cross-encoder/mmarco-mMiniLMv2-L12-H384-v1", "Повторне ранжування"],
            ["chunk_size / overlap", "1000 / 150 символів", "Поділ великих документів [16]"],
            ["Embedding dimension", "768", "Розмір vector у LanceDB"],
            ["Embedding batch", "8", "Пакетне кодування chunks"],
            ["top_k", "5, максимум 50", "Кількість фінальних документів"],
            ["Candidate count", "max(top_k × 8, 30)", "Кандидати до reranking"],
            ["min_score", "0,75", "Поріг cosine score"],
            ["min_rerank_score", "–1,0", "Поріг raw CrossEncoder score"],
        ],
        [4.0, 5.0, 7.4],
        font_size=9.8,
    )
    table_number += 1
    add_heading(doc, "3.4.2 Підготовка тексту та індексація", 3)
    add_paragraph(
        doc,
        "Перед поділом стискаються послідовності пробілів і табуляцій. "
        "RecursiveCharacterTextSplitter ділить текст за абзацами, рядками, "
        "розділовими знаками, пробілами й, за потреби, посимвольно [16]. Для chunks "
        "використовується префікс passage:, для запиту – query:. Нормалізовані "
        "embeddings мають розмірність 768 [4].",
    )
    add_heading(doc, "3.4.3 Фізична структура LanceDB", 3)
    add_table(
        doc,
        f"Таблиця 3.{table_number} – Поля таблиці LanceDB document_chunks",
        ["Поле", "Тип", "Призначення"],
        [
            ["document_id", "string", "Google Drive ID документа"],
            ["chunk_id", "string", "Ідентифікатор document_id:index"],
            ["chunk_index", "int64", "Порядковий номер фрагмента"],
            ["title", "string", "Назва документа"],
            ["content", "string", "Текст фрагмента"],
            ["url", "string", "Посилання на оригінал"],
            ["folder_name", "string", "Назва папки"],
            ["content_hash", "string", "Хеш документа; не використовується FastAPI для порівняння"],
            ["vector", "float[768]", "Нормалізований embedding"],
        ],
        [4.0, 3.2, 9.2],
        font_size=9.8,
    )
    table_number += 1
    add_heading(doc, "3.4.4 Алгоритм пошуку та reranking", 3)
    add_paragraph(
        doc,
        "Послідовність індексації та пошуку наведено на рисунку 3.3. Після cosine "
        "retrieval результати нижче min_score відкидаються, пари query і "
        "title+content оцінюються CrossEncoder, сортуються за raw score, після чого "
        "залишається один найкращий chunk на документ.",
    )
    add_image(doc, assets["semantic_flow"], "Рисунок 3.3 – Алгоритм індексації та семантичного пошуку", 16.5)
    add_heading(doc, "3.4.5 Обмеження поточної реалізації", 3)
    add_paragraph(
        doc,
        "Upsert видаляє старі chunks до побудови нових і не є атомарним. Окремий "
        "ANN-індекс у коді не створюється. Result помилки upsert/delete на рівні "
        "синхронізації не перевіряється перед зміною локального стану, тому текст "
        "не стверджує гарантовану узгодженість SQLite і LanceDB. Кількісна перевага "
        "reranking також не заявляється без benchmark-набору [1].",
    )

    add_heading(doc, "3.5 Модель графового подання результатів пошуку", 2)
    add_paragraph(
        doc,
        "Граф є runtime-моделлю React-клієнта, а не графовою БД, онтологією або "
        "алгоритмом кластеризації. ForceGraph2D відображає дані через Canvas, а "
        "підготовку вузлів, фіксовані координати та hit-testing виконує код сторінки [1, 8, 10].",
    )
    add_heading(doc, "3.5.1 Формування вузлів і зв’язків", 3)
    add_table(
        doc,
        f"Таблиця 3.{table_number} – Вузли графового подання",
        ["Тип", "Створення", "Поля", "Зв’язки"],
        [
            ["root", "Один вузол root:g7", "id, title, type", "Початок trunk-ланцюга; fallback для document"],
            ["trunk", "По одному на folder і trunk:tail", "id, title, type", "Послідовний невидимий ланцюг"],
            ["folder", "Із FolderResponse", "id, title, url, type", "Зв’язок від відповідного trunk"],
            ["document", "Із SearchDocumentResponse", "id, title, url, content, parentId", "До folder за точним folderName або до root"],
        ],
        [2.8, 4.2, 4.8, 4.6],
        font_size=9.7,
    )
    table_number += 1
    add_paragraph(
        doc,
        "Фактичну структуру зв’язків показано на рисунку 3.4. Поле chunkId "
        "використовується у складі id вузла документа; score і chunkIndex у GraphNode "
        "не зберігаються.",
    )
    add_image(doc, assets["graph_model"], "Рисунок 3.4 – Модель побудови графу на клієнті", 16.5)
    add_heading(doc, "3.5.2 Адаптивне розміщення і Canvas-рендеринг", 3)
    add_paragraph(
        doc,
        "applyGraphLayout обчислює x, y, fx і fy для трьох діапазонів ширини: "
        "менше 768 px, 768–1279 px і від 1280 px. Папки чергуються зліва та справа "
        "від trunk-осі, документи групуються біля parent. paintNode малює вузли через "
        "CanvasRenderingContext2D, а paintPointerArea визначає клікабельну область. "
        "React-стан і перерахунок використовують useState, useEffect, useMemo, "
        "useCallback і useRef [8].",
    )
    add_heading(doc, "3.5.3 Взаємодія з результатом", 3)
    add_paragraph(
        doc,
        "Клік по folder відкриває перевірене посилання Google Drive. Клік по "
        "document передає title, folderName, content і url до DocumentModal. Modal "
        "закривається кнопкою, backdrop або Escape. Лінії графа задають source і "
        "target, але в поточному ForceGraph2D не мають візуальних arrowheads.",
    )

    add_heading(doc, "3.6 Проєктування серверної частини та синхронізації", 2)
    add_paragraph(
        doc,
        "ASP.NET Core API є координатором авторизації, реляційного стану, Google "
        "Drive і FastAPI. Endpoint-и організовані вертикальними функціональними "
        "зрізами; повний каталог маршрутів винесено до додатка Б [1, 5].",
    )
    add_heading(doc, "3.6.1 Маршрути API та політики доступу", 3)
    add_table(
        doc,
        f"Таблиця 3.{table_number} – Групи маршрутів і доступ",
        ["Група", "Доступ", "Призначення"],
        [
            ["auth", "Анонімний", "login і створення заявки"],
            ["google-drive/folders, search-documents", "Будь-яка авторизована роль", "Структура папок і пошук"],
            ["google-drive/root-folder-link, sync", "Teacher, Admin, SuperAdmin", "Посилання й постановка sync у чергу"],
            ["sign-up-applications", "Teacher, Admin, SuperAdmin", "Перегляд, approve, reject"],
            ["students, teachers", "Teacher, Admin, SuperAdmin", "Керування користувачами"],
            ["admins", "SuperAdmin", "Керування адміністраторами"],
        ],
        [5.5, 5.0, 5.9],
        font_size=9.7,
    )
    table_number += 1
    add_heading(doc, "3.6.2 Реєстрація та заявки", 3)
    add_paragraph(
        doc,
        "Signup створює SignUpApplication, а не користувача. Approve створює "
        "Identity User і призначає роль; reject змінює статус без створення облікового "
        "запису. JWT містить role claim відповідно до RFC 7519 [7, 17].",
    )
    add_heading(doc, "3.6.3 Алгоритм синхронізації Google Drive", 3)
    add_paragraph(
        doc,
        "Синхронізацію запускає фонова служба одразу після старту й далі після "
        "чотиригодинної паузи або ручний endpoint через bounded-чергу місткістю один. "
        "Спільний semaphore не допускає паралельних запусків. Алгоритм показано на "
        "рисунку 3.5 [1, 12].",
    )
    add_image(doc, assets["sync_flow"], "Рисунок 3.5 – Блок-схема алгоритму синхронізації Google Drive", 16.4)
    add_heading(doc, "3.6.4 Парсинг документів і обмеження форматів", 3)
    add_table(
        doc,
        f"Таблиця 3.{table_number} – Підтримувані формати та обмеження парсингу",
        ["Джерело / MIME", "Експорт", "Обробка", "Обмеження"],
        [
            ["DOCX", "–", "Open XML Body.InnerText [19]", "Втрачаються зображення, структура й частина складних елементів"],
            ["PDF", "–", "PdfPig page.Text [20]", "OCR відсутній; скан без text layer дає порожній текст"],
            ["TXT", "–", "StreamReader UTF-8 з BOM detection", "Інші кодування можуть бути прочитані некоректно"],
            ["CSV", "–", "Читання як звичайного тексту", "Стовпці не розбираються окремо"],
            ["Google Docs", "DOCX", "Далі Open XML", "Залежить від якості export"],
            ["Google Sheets", "CSV", "Далі текстове читання", "Структура аркушів не моделюється"],
            ["Google Slides", "PPTX", "Парсер відсутній", "Фактично не підтримується"],
        ],
        [3.5, 2.3, 4.8, 5.8],
        font_size=9.2,
    )
    table_number += 1
    add_heading(doc, "3.6.5 Життєвий цикл індексації документа", 3)
    add_paragraph(
        doc,
        "Новий або оновлений UniversityDocument переходить у NotIndexed. Такі записи "
        "надсилаються до FastAPI batch-ами по 15 і після виклику позначаються Indexed. "
        "Поточний Update не порівнює hash перед MarkAsNotIndexed, тому успішно прочитані "
        "документи можуть переіндексуватися після кожної синхронізації. Failed не є "
        "гарантованим результатом HTTP-помилки через неперевірений Result [1].",
    )

    add_heading(doc, "3.7 Структура та екрани інтерфейсу користувача", 2)
    add_paragraph(
        doc,
        "Проєктна частина фіксує реалізовані екрани, а не повторює функціональні "
        "специфікації. Сторінку входу, подання заявки та оброблення заявок перенесено "
        "сюди з функціональної частини.",
    )
    screenshots = [
        ("login.png", "Рисунок 3.6 – Сторінка входу користувача в EduGraph"),
        ("signup_student.png", "Рисунок 3.7 – Подання заявки на реєстрацію студентом"),
        ("applications.png", "Рисунок 3.8 – Перегляд і оброблення заявок на реєстрацію"),
        ("search_initial.png", "Рисунок 3.9 – Початковий стан графової навігації"),
        ("search_results.png", "Рисунок 3.10 – Граф результатів семантичного пошуку"),
        ("document_modal.png", "Рисунок 3.11 – Перегляд релевантного фрагмента документа"),
    ]
    for filename, caption in screenshots:
        add_paragraph(doc, f"Відповідний стан інтерфейсу наведено на {caption.split(' – ')[0].lower()}.")
        add_image(doc, SCREENSHOT_DIR / filename, caption, 16.2)

    add_heading(doc, "3.8 Експериментальне тестування застосунку", 2)
    add_paragraph(
        doc,
        "Перевірка має функціональний характер; кількісні метрики precision, recall, "
        "MRR або nDCG не заявляються без еталонного набору запитів. Основні сценарії "
        "наведено в таблиці 3.20.",
    )
    add_table(
        doc,
        f"Таблиця 3.{table_number} – Матриця функціональної перевірки",
        ["Сценарій", "Дія", "Очікуваний результат"],
        [
            ["Вхід", "Коректні й помилкові облікові дані", "JWT і рольовий маршрут або контрольована відмова"],
            ["Заявка", "Signup, approve, reject", "Pending; створення User тільки після approve"],
            ["Синхронізація", "Додати, змінити, видалити документ", "Оновлення локального стану відповідно до фактичного алгоритму"],
            ["Парсинг", "DOCX, PDF, TXT, CSV, scan PDF", "Текст або контрольована помилка; OCR не очікується"],
            ["Пошук", "Змістовий, порожній і нерелевантний запит", "Результати, [] або валідаційна відповідь без падіння UI"],
            ["Граф", "Папки, результати, довгі назви, resize", "Стабільні вузли, зв’язки та modal"],
            ["Ролі", "Прямі запити до заборонених endpoint-ів", "Backend повертає заборону незалежно від frontend"],
        ],
        [4.0, 6.0, 6.4],
        font_size=9.8,
    )

    add_heading(doc, "3.9 Інструкція користувача", 2)
    instruction_paragraphs = [
        (
            "Користувач відкриває EduGraph, вводить логін і пароль. Якщо облікового "
            "запису немає, він подає заявку та очікує рішення уповноваженого користувача."
        ),
        (
            "Після входу користувач відкриває сторінку пошуку, вводить змістовий "
            "запит і очікує появи document-вузлів. Клік по вузлу відкриває фрагмент; "
            "кнопка в modal переходить до оригіналу в Google Drive."
        ),
        (
            "Teacher, Admin або SuperAdmin може опрацювати заявки, керувати "
            "дозволеними типами користувачів і поставити синхронізацію в чергу. "
            "Відповідь 202 означає прийняття запиту, а не підтвердження завершення sync."
        ),
        (
            "Для ефективного використання EduGraph потрібно підтримувати впорядковану "
            "структуру Google Drive. Назви папок повинні бути змістовними, оскільки "
            "вони використовуються у графі. Якщо папки мають випадкові або технічні "
            "назви, графова навігація буде менш корисною для користувача."
        ),
        (
            "Документи мають бути у форматах, які система може прочитати. DOCX, PDF, "
            "TXT і CSV підтримуються, однак скановані PDF без текстового шару можуть "
            "не дати придатного вмісту. Якщо корпус містить багато сканів, потрібно "
            "додати OCR-етап або підготувати текстові версії документів."
        ),
    ]
    for text in instruction_paragraphs:
        add_paragraph(doc, text)
    add_paragraph(
        doc,
        "Для остаточного оформлення інструкції потрібно додати такі відсутні "
        "скриншоти:",
        indent=False,
    )
    add_placeholder(doc, "стан виконання пошуку з індикатором завантаження")
    add_placeholder(doc, "панель Teacher/Admin із кнопкою запуску Google Drive sync")
    add_placeholder(doc, "стан порожнього результату пошуку")
    add_placeholder(doc, "контрольоване повідомлення про помилку пошуку або синхронізації")
    return collect_fragment(doc, start)


def build_conclusions(doc: Document) -> list:
    start = fragment_start(doc)
    add_heading(doc, "ВИСНОВКИ", 1)
    paragraphs = [
        (
            "У кваліфікаційній роботі розроблено й описано EduGraph – веб-систему "
            "семантичного пошуку в корпусі освітніх документів з інтерактивною "
            "графовою навігацією."
        ),
        (
            "В аналітичній частині зіставлено файловий, повнотекстовий, векторний "
            "і генеративний підходи, сформовано вимоги та обґрунтовано поділ системи "
            "на React-клієнт, ASP.NET Core API і FastAPI-сервіс."
        ),
        (
            "Функціональна частина визначає ролі, варіанти використання й основні "
            "сценарії. Повні специфікації винесено до додатка, тому основний текст "
            "не перевантажено повторенням кроків."
        ),
        (
            "У проєктній частині описано SQLite-схему без зовнішніх ключів між "
            "прикладними сутностями та з технічними зв’язками Identity, FastAPI "
            "retrieval-процес, LanceDB, CrossEncoder reranking, клієнтську runtime-модель "
            "графу, ASP.NET Core API та алгоритм синхронізації Google Drive."
        ),
        (
            "Фактична реалізація підтримує витягування тексту з DOCX, PDF, TXT і CSV, "
            "індексацію chunks, пошук за embeddings, уточнення порядку результатів, "
            "відображення документів у графі та перехід до першоджерела."
        ),
        (
            "Окремо зафіксовано обмеження: відсутність OCR і PPTX-парсера, "
            "неатомарний upsert LanceDB, відсутність benchmark-оцінювання та "
            "неповна перевірка результатів vector-search під час синхронізації. "
            "Ці обмеження не приховуються й визначають напрями подальшого розвитку."
        ),
    ]
    for text in paragraphs:
        add_paragraph(doc, text)
    return collect_fragment(doc, start)


SOURCES = [
    "1. EduGraph: вихідний код проєкту. URL: https://github.com/ilyaghrischenko/EduGraph (дата звернення: 06.06.2026).",
    "2. Manning C. D., Raghavan P., Schütze H. Introduction to Information Retrieval. URL: https://nlp.stanford.edu/IR-book/ (дата звернення: 06.06.2026).",
    "3. Reimers N., Gurevych I. Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. URL: https://aclanthology.org/D19-1410/ (дата звернення: 06.06.2026).",
    "4. Wang L. et al. Text Embeddings by Weakly-Supervised Contrastive Pre-training. URL: https://arxiv.org/abs/2212.03533 (дата звернення: 06.06.2026).",
    "5. Microsoft Learn. Tutorial: Create a Minimal API with ASP.NET Core. URL: https://learn.microsoft.com/en-us/aspnet/core/tutorials/min-web-api?view=aspnetcore-9.0 (дата звернення: 06.06.2026).",
    "6. Microsoft Learn. SQLite EF Core Database Provider. URL: https://learn.microsoft.com/en-us/ef/core/providers/sqlite/ (дата звернення: 06.06.2026).",
    "7. Microsoft Learn. Introduction to Identity on ASP.NET Core. URL: https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity (дата звернення: 06.06.2026).",
    "8. React. React Reference Overview. URL: https://react.dev/reference/react (дата звернення: 06.06.2026).",
    "9. Vite. Getting Started. URL: https://vite.dev/guide/ (дата звернення: 06.06.2026).",
    "10. react-force-graph. React component for force-directed graphs. URL: https://github.com/vasturiano/react-force-graph (дата звернення: 06.06.2026).",
    "11. FastAPI Documentation. URL: https://fastapi.tiangolo.com/ (дата звернення: 06.06.2026).",
    "12. Google for Developers. Google Drive API overview. URL: https://developers.google.com/workspace/drive/api/guides/about-sdk (дата звернення: 06.06.2026).",
    "13. LanceDB Documentation. Vector Search. URL: https://docs.lancedb.com/search/vector-search (дата звернення: 06.06.2026).",
    "14. Sentence Transformers Documentation. Semantic Search. URL: https://www.sbert.net/examples/sentence_transformer/applications/semantic-search/README.html (дата звернення: 06.06.2026).",
    "15. Nogueira R., Cho K. Passage Re-ranking with BERT. URL: https://arxiv.org/abs/1901.04085 (дата звернення: 06.06.2026).",
    "16. LangChain. RecursiveCharacterTextSplitter. URL: https://docs.langchain.com/oss/python/integrations/splitters/recursive_text_splitter (дата звернення: 06.06.2026).",
    "17. Jones M., Bradley J., Sakimura N. JSON Web Token (JWT). RFC 7519. URL: https://www.rfc-editor.org/rfc/rfc7519 (дата звернення: 06.06.2026).",
    "18. OpenAPI Initiative. OpenAPI Specification. URL: https://spec.openapis.org/oas/latest.html (дата звернення: 06.06.2026).",
    "19. Microsoft Learn. Get the contents of a document part from a package. URL: https://learn.microsoft.com/en-us/office/open-xml/general/how-to-get-the-contents-of-a-document-part-from-a-package (дата звернення: 06.06.2026).",
    "20. UglyToad. PdfPig: read and extract text and other content from PDFs in C#. URL: https://github.com/UglyToad/PdfPig (дата звернення: 06.06.2026).",
]


def build_sources(doc: Document) -> list:
    start = fragment_start(doc)
    add_heading(doc, "ПЕРЕЛІК ВИКОРИСТАНИХ ДЖЕРЕЛ", 1)
    for source in SOURCES:
        add_paragraph(doc, source, indent=False, after=3)
    return collect_fragment(doc, start)


UC_SPECS = [
    (
        "UC-01 – Увійти до системи",
        "Користувач із наявним обліковим записом",
        "Відкрита сторінка входу.",
        "Користувач вводить логін і пароль; API перевіряє Identity; повертається JWT з role claim; frontend відкриває маршрут ролі.",
        "Порожні або неправильні дані; відсутній користувач; недійсний токен.",
        "Користувач отримує тільки дозволений доступ.",
    ),
    (
        "UC-02 – Подати заявку на реєстрацію",
        "Неавторизований користувач",
        "Відкрита сторінка реєстрації.",
        "Користувач заповнює форму; API перевіряє дані й створює SignUpApplication зі статусом Pending.",
        "Зайнятий логін; активна заявка з таким логіном; помилка валідації.",
        "Заявка доступна уповноваженим ролям.",
    ),
    (
        "UC-03 – Опрацювати заявку",
        "Teacher, Admin або SuperAdmin",
        "Існує Pending-заявка.",
        "Користувач обирає approve або reject. Approve створює Identity User і роль; reject змінює статус без створення User.",
        "Заявка відсутня або вже оброблена; помилка Identity.",
        "Статус стає Approved або Rejected.",
    ),
    (
        "UC-04 – Виконати семантичний пошук",
        "Авторизований користувач",
        "API і FastAPI доступні; vector store містить chunks.",
        "Frontend надсилає Query; backend викликає /search; FastAPI створює query embedding, виконує cosine retrieval, фільтрацію й reranking.",
        "Порожній запит; відсутні результати; помилка FastAPI.",
        "Frontend отримує документи й будує document-вузли.",
    ),
    (
        "UC-05 – Переглянути фрагмент і оригінал",
        "Авторизований користувач",
        "Граф містить document-вузол.",
        "Користувач натискає вузол; відкривається DocumentModal; безпечне посилання веде до Google Drive.",
        "URL не проходить перевірку; користувач закриває modal.",
        "Дані не змінюються; користувач отримує контекст результату.",
    ),
    (
        "UC-06 – Запустити синхронізацію",
        "Teacher, Admin, SuperAdmin або фонова служба",
        "Налаштовано Google Drive і service account.",
        "Запит потрапляє в чергу; сервіс оновлює папки й документи, видаляє відсутні записи та надсилає NotIndexed документи до FastAPI.",
        "Черга заповнена; помилка Drive, parsing або vector-search.",
        "Локальний стан оновлено відповідно до фактично виконаних операцій.",
    ),
]


def build_appendix_a(doc: Document) -> list:
    start = fragment_start(doc)
    add_heading(doc, "Додаток А. Специфікації основних сценаріїв", 2)
    add_paragraph(
        doc,
        "У додатку наведено специфікації сценаріїв, перелічених у підрозділі 2.2.",
    )
    for number, spec in enumerate(UC_SPECS, start=1):
        title, actor, precondition, flow, alternatives, postcondition = spec
        add_table(
            doc,
            f"Таблиця А.{number} – Специфікація {title}",
            ["Поле", "Зміст"],
            [
                ["Основний актор", actor],
                ["Передумови", precondition],
                ["Основний потік", flow],
                ["Альтернативи та помилки", alternatives],
                ["Постумова", postcondition],
            ],
            [4.0, 12.4],
            font_size=10,
        )
    return collect_fragment(doc, start)


def replace_section(
    doc: Document,
    start_text: str,
    end_text: str,
    fragment: list,
    *,
    start_occurrence: int = 1,
    end_occurrence: int = 1,
) -> None:
    start = find_block(doc, start_text, start_occurrence)
    end = find_block(doc, end_text, end_occurrence, start + 1)
    remove_range(doc, start, end)
    insert_fragment(doc, start, fragment)


def replace_figure_before_caption(doc: Document, caption: str, path: Path, width_cm: float) -> None:
    caption_index = find_block(doc, caption)
    children = body_children(doc)
    image_index = None
    for index in range(caption_index - 1, max(-1, caption_index - 5), -1):
        if children[index].xpath(".//w:drawing") or children[index].xpath(".//w:pict"):
            image_index = index
            break
    if image_index is None:
        raise ValueError(f"Image not found before caption: {caption}")
    body(doc).remove(body_children(doc)[image_index])
    start = fragment_start(doc)
    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.first_line_indent = None
    paragraph.add_run().add_picture(str(path), width=Cm(width_cm))
    image_fragment = collect_fragment(doc, start)
    caption_index = find_block(doc, caption)
    insert_fragment(doc, caption_index, image_fragment)


def insert_caption_before_table_by_header(
    doc: Document,
    first_header: str,
    caption: str,
) -> None:
    for table in doc.tables:
        if not table.rows or not table.rows[0].cells:
            continue
        if " ".join(table.rows[0].cells[0].text.split()) != first_header:
            continue
        previous = table._element.getprevious()
        if previous is not None and paragraph_text(previous).startswith("Таблиця"):
            continue
        paragraph = doc.add_paragraph()
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        paragraph.paragraph_format.first_line_indent = None
        paragraph.paragraph_format.space_before = Pt(3)
        paragraph.paragraph_format.space_after = Pt(6)
        run = paragraph.add_run(caption)
        set_run_font(run, 14)
        table._element.addprevious(paragraph._element)
        return
    raise ValueError(f"Table not found by header: {first_header}")


def replace_text_everywhere(doc: Document, replacements: dict[str, str]) -> None:
    for paragraph in doc.paragraphs:
        original = paragraph.text
        updated = original
        for old, new in replacements.items():
            updated = updated.replace(old, new)
        if updated != original:
            paragraph.text = updated
            for run in paragraph.runs:
                set_run_font(run, 14)
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    original = paragraph.text
                    updated = original
                    for old, new in replacements.items():
                        updated = updated.replace(old, new)
                    if updated != original:
                        paragraph.text = updated
                        for run in paragraph.runs:
                            set_run_font(run, 10.5)


def apply_document_format(doc: Document) -> None:
    for section in doc.sections:
        section.page_width = Cm(21)
        section.page_height = Cm(29.7)
        section.left_margin = Cm(3)
        section.right_margin = Cm(1.5)
        section.top_margin = Cm(2)
        section.bottom_margin = Cm(2)
    for style in doc.styles:
        if style.type != 1:
            continue
        if style.name in {"Normal", "Heading 1", "Heading 2", "Heading 3", "List Bullet"}:
            style.font.name = "Times New Roman"
            style.font.size = Pt(14)
            rpr = style._element.get_or_add_rPr()
            rfonts = rpr.rFonts
            if rfonts is None:
                rfonts = OxmlElement("w:rFonts")
                rpr.append(rfonts)
            rfonts.set(qn("w:ascii"), "Times New Roman")
            rfonts.set(qn("w:hAnsi"), "Times New Roman")
    for paragraph in doc.paragraphs:
        text = paragraph.text.strip()
        style_id = paragraph.style.style_id if paragraph.style else ""
        fmt = paragraph.paragraph_format
        if style_id == "Heading1":
            fmt.first_line_indent = None
            fmt.page_break_before = True
            fmt.keep_with_next = True
            fmt.space_before = Pt(12)
            fmt.space_after = Pt(6)
            fmt.line_spacing = 1.5
            paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        elif style_id in {"Heading2", "Heading3"}:
            fmt.first_line_indent = None
            fmt.keep_with_next = True
            fmt.space_before = Pt(6)
            fmt.space_after = Pt(6)
            fmt.line_spacing = 1.5
            paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
        elif text.startswith(("Рисунок ", "Таблиця ")):
            fmt.first_line_indent = None
            fmt.keep_with_next = True
            fmt.space_before = Pt(3)
            fmt.space_after = Pt(6)
            fmt.line_spacing = 1.5
            paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        elif not text:
            fmt.first_line_indent = None
        else:
            if fmt.first_line_indent is None:
                fmt.first_line_indent = Cm(1.25)
            if paragraph.alignment is None:
                paragraph.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            if fmt.line_spacing is None:
                fmt.line_spacing = 1.5
            fmt.space_after = Pt(0)
        for run in paragraph.runs:
            size = run.font.size.pt if run.font.size else 14
            set_run_font(run, size, bold=True if style_id.startswith("Heading") else None)


def count_caption_paragraphs(doc: Document, prefix: str) -> int:
    return sum(1 for paragraph in doc.paragraphs if paragraph.text.strip().startswith(prefix))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--page-count", default="___")
    parser.add_argument("--toc-map")
    args = parser.parse_args()
    toc_pages = {}
    if args.toc_map:
        toc_pages = json.loads(Path(args.toc_map).read_text(encoding="utf-8"))

    if not INPUT_DOCX.exists():
        raise FileNotFoundError(INPUT_DOCX)
    if not DB_SCREENSHOT.exists():
        raise FileNotFoundError(DB_SCREENSHOT)
    assets = create_assets()
    doc = Document(INPUT_DOCX)
    ensure_document_styles(doc)

    actual_intro = find_block(doc, "ВСТУП", occurrence=2)
    remove_range(doc, 0, actual_intro)
    insert_fragment(
        doc,
        0,
        build_front_matter(doc, str(args.page_count), toc_pages),
    )

    replace_section(
        doc,
        "ВСТУП",
        "1 АНАЛІТИЧНА ЧАСТИНА",
        build_introduction(doc),
    )
    replace_figure_before_caption(
        doc,
        "Рисунок 1.1 – Узагальнена архітектура системи EduGraph",
        assets["architecture"],
        16.0,
    )
    insert_caption_before_table_by_header(
        doc,
        "Клас рішення",
        "Таблиця 1.1 – Порівняння класів систем пошуку освітніх документів",
    )
    replace_section(
        doc,
        "1.3 Огляд існуючих комплексних рішень",
        "2 ФУНКЦІОНАЛЬНА ЧАСТИНА",
        build_section_1_3_to_1_7(doc),
    )
    replace_section(
        doc,
        "2 ФУНКЦІОНАЛЬНА ЧАСТИНА",
        "3 ПРОЄКТНА ЧАСТИНА",
        build_section_2(doc, assets),
    )
    replace_section(
        doc,
        "3 ПРОЄКТНА ЧАСТИНА",
        "ВИСНОВКИ",
        build_section_3(doc, assets),
    )
    replace_section(
        doc,
        "ВИСНОВКИ",
        "ПЕРЕЛІК ВИКОРИСТАНИХ ДЖЕРЕЛ",
        build_conclusions(doc),
    )
    replace_section(
        doc,
        "ПЕРЕЛІК ВИКОРИСТАНИХ ДЖЕРЕЛ",
        "ДОДАТКИ",
        build_sources(doc),
    )
    replace_section(
        doc,
        "Додаток А. Альбом графічного матеріалу",
        "Додаток Б. Текстова специфікація API та моделей даних",
        build_appendix_a(doc),
    )

    appendix_captions = [
        ("Група", "Таблиця Б.1 – Групи маршрутів API EduGraph"),
        ("Модель", "Таблиця Б.2 – Основні моделі даних API"),
        ("Роль", "Таблиця В.1 – Матриця доступу за ролями"),
        ("ID", "Таблиця В.2 – Сценарії функціональної перевірки"),
        ("Крок", "Таблиця Г.1 – Послідовність роботи користувача"),
        ("Зона супроводу", "Таблиця Г.2 – Зони супроводу системи"),
        ("Термін", "Таблиця Д.1 – Основні терміни EduGraph"),
    ]
    for header, caption in appendix_captions:
        insert_caption_before_table_by_header(doc, header, caption)

    replace_text_everywhere(
        doc,
        {
            "Backend залежить від SQLite": "Реалізація бекенду залежить від SQLite",
            "економічно-організаційною частиною": "проєктною частиною",
            "економічно-організаційної частини": "проєктної частини",
        },
    )

    apply_document_format(doc)
    figure_count = count_caption_paragraphs(doc, "Рисунок ")
    table_count = count_caption_paragraphs(doc, "Таблиця ")
    replace_text_everywhere(
        doc,
        {
            "[[FIGURE_COUNT]]": str(figure_count),
            "[[TABLE_COUNT]]": str(table_count),
        },
    )
    add_page_number_footer(doc)
    OUTPUT_DOCX.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUTPUT_DOCX)
    print(OUTPUT_DOCX)


if __name__ == "__main__":
    main()
