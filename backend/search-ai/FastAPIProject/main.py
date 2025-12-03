# from fastapi import FastAPI, Query
# from fastapi.staticfiles import StaticFiles
# from pydantic import BaseModel
# from sentence_transformers import SentenceTransformer
# from sklearn.metrics.pairwise import cosine_similarity
# from pathlib import Path
# from utils import extract_text_from_file
# from fastapi.responses import JSONResponse
# import numpy as np
#
# app = FastAPI()
#
# model = SentenceTransformer("intfloat/multilingual-e5-base")
#
# DOCS_DIR = Path("university_docs")
#
# class Document(BaseModel):
#     title: str
#     url: str
#
# @app.get("/")
# def index():
#     return {"message": "Hello World"}
#
# @app.get("/search")
# def search(q: str = Query(...)):
#     query_embedding = model.encode(f"query: {q}")
#     results = []
#
#     for path in DOCS_DIR.rglob("*"):
#         if path.is_file() and path.suffix.lower() in {".pdf", ".docx", ".txt"}:
#             try:
#                 text = extract_text_from_file(path)
#                 if not text.strip():
#                     continue
#                 embedding = model.encode(f"passage: {text}")
#                 score = cosine_similarity([query_embedding], [embedding])[0][0]
#
#                 results.append({
#                     "title": str(path.relative_to(DOCS_DIR)),
#                     "url": f"/static/university_docs/{path.relative_to(DOCS_DIR)}",
#                     "score": float(score)
#                 })
#             except Exception as e:
#                 print(f"Ошибка при обработке {path}: {e}")
#                 continue
#
#     results.sort(key=lambda x: x["score"], reverse=True)
#     top_results = results[:5]
#
#     response = [{"title": r["title"].encode('cp1251').decode('utf-8'), "url": r["url"].encode('cp1251').decode('utf-8')} for r in top_results]
#
#     return JSONResponse(content=response)

from fastapi import FastAPI, Query
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from pathlib import Path
from utils import extract_text_from_file
from fastapi.responses import JSONResponse
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Подключаем статику
app.mount("/static", StaticFiles(directory="university_docs"), name="static")

model = SentenceTransformer("intfloat/multilingual-e5-base")
DOCS_DIR = Path("university_docs")


class Document(BaseModel):
    title: str
    url: str


@app.get("/")
def index():
    return {"message": "University Docs Search API"}


def fix_mojibake(text: str) -> str:
    """
    Пытается восстановить текст из кракозябр (CP1251 -> UTF-8).
    Пример: 'РћРћРљ' -> 'ООК'
    """
    try:
        # Пробуем закодировать в cp1251 и декодировать как utf-8
        return text.encode('cp1251').decode('utf-8')
    except (UnicodeEncodeError, UnicodeDecodeError):
        # Если не вышло (например, текст уже нормальный), возвращаем как есть
        return text


@app.get("/search")
def search(q: str = Query(...)):
    # Логируем запрос для отладки
    logger.info(f"Search query: {q}")

    query_embedding = model.encode(f"query: {q}")
    results = []

    # Используем rglob для рекурсивного поиска
    for path in DOCS_DIR.rglob("*"):
        # Игнорируем скрытые файлы и папки
        if path.name.startswith('.'):
            continue

        if path.is_file() and path.suffix.lower() in {".pdf", ".docx", ".txt"}:
            try:
                # 1. Получаем "сырое" имя файла и путь (относительно корня docs)
                raw_relative_path = path.relative_to(DOCS_DIR)
                raw_filename = path.name

                # 2. Чиним название для отображения пользователю (title)
                # Чиним имя файла
                clean_filename = fix_mojibake(raw_filename)
                # Чиним весь путь для красивого тайтла (если папки тоже битые)
                clean_relative_path_str = str(raw_relative_path).replace("\\", "/")  # Нормализация слешей
                clean_title = fix_mojibake(clean_relative_path_str)

                # Извлекаем текст
                text = extract_text_from_file(path)
                if not text or not text.strip():
                    continue

                embedding = model.encode(f"passage: {text}")
                score = cosine_similarity([query_embedding], [embedding])[0][0]

                results.append({
                    "title": clean_title,  # Человекочитаемое название
                    # ВАЖНО: URL оставляем "битым", так как файл на диске всё ещё называется криво.
                    # FastAPI StaticFiles найдет его только по реальному имени на диске.
                    "url": f"/static/{raw_relative_path}",
                    "score": float(score)
                })
            except Exception as e:
                logger.error(f"Error processing {path}: {e}")
                continue

    results.sort(key=lambda x: x["score"], reverse=True)
    top_results = results[:5]

    return JSONResponse(content=top_results)