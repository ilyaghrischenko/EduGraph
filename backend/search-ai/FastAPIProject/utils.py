import textract
import os
from pathlib import Path

DOCS_DIR = Path("university_docs")

def extract_text_from_file(path: Path) -> str:
    try:
        text = textract.process(str(path)).decode("utf-8", errors="ignore")
        return text
    except Exception as e:
        print(f"Ошибка извлечения текста из {path}: {e}")
        return ""


def fix_string(text: str) -> str:
    try:
        # Пытаемся восстановить UTF-8, интерпретированный как CP1251
        return text.encode('cp1251').decode('utf-8')
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text

def rename_files_recursively(directory):
    # Используем os.walk с topdown=False, чтобы переименовывать файлы до папок,
    # иначе, переименовав папку, мы потеряем пути к файлам внутри.
    for root, dirs, files in os.walk(directory, topdown=False):

        # 1. Переименовываем файлы
        for filename in files:
            fixed_name = fix_string(filename)

            if fixed_name != filename:
                old_path = os.path.join(root, filename)
                new_path = os.path.join(root, fixed_name)

                try:
                    os.rename(old_path, new_path)
                    print(f"[FILE] Renamed: {filename} -> {fixed_name}")
                except OSError as e:
                    print(f"[ERROR] Could not rename {filename}: {e}")

        # 2. Переименовываем папки
        for dirname in dirs:
            fixed_dirname = fix_string(dirname)

            if fixed_dirname != dirname:
                old_path = os.path.join(root, dirname)
                new_path = os.path.join(root, fixed_dirname)

                try:
                    os.rename(old_path, new_path)
                    print(f"[DIR]  Renamed: {dirname} -> {fixed_dirname}")
                except OSError as e:
                    print(f"[ERROR] Could not rename dir {dirname}: {e}")


if __name__ == "__main__":
    print(f"Scanning {DOCS_DIR} for corrupted filenames...")
    if not DOCS_DIR.exists():
        print(f"Directory {DOCS_DIR} does not exist.")
    else:
        rename_files_recursively(DOCS_DIR)
        print("Done.")