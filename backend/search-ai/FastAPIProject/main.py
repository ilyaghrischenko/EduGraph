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

# Настройка логов
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Путь к папке
DOCS_DIR = Path("university_docs")
DOCS_DIR.mkdir(parents=True, exist_ok=True)

# Подключаем статику
app.mount("/static", StaticFiles(directory=str(DOCS_DIR)), name="static")

model = SentenceTransformer("intfloat/multilingual-e5-base")


def fix_text(text: str) -> str:
    """Чинит кракозябры (РћРћРљ -> ООК)"""
    try:
        return text.encode('cp1251').decode('utf-8')
    except:
        return text


@app.get("/")
def index():
    return {"message": "API работает"}


@app.get("/search")
def search(q: str = Query(...)):
    results = []
    query_embedding = model.encode(f"query: {q}")

    for path in DOCS_DIR.rglob("*"):
        if not path.is_file() or path.name.startswith('.'):
            continue

        if path.suffix.lower() not in {".pdf", ".docx", ".txt"}:
            continue

        try:
            text = extract_text_from_file(path)
            if not text or not text.strip():
                continue

            embedding = model.encode(f"passage: {text}")
            score = cosine_similarity([query_embedding], [embedding])[0][0]

            # --- ИСПРАВЛЕНИЕ ---

            # Получаем относительный путь
            relative_path = path.relative_to(DOCS_DIR)

            # 1. Красивое название (Title): Чиним кодировку для глаз пользователя
            clean_title = fix_text(str(relative_path))

            # 2. Рабочая ссылка (URL):
            # Используем .as_posix() - это штатный метод Python, который сам
            # превращает путь в формат с прямыми слэшами (/).
            # Это работает в Python 3.10 и не вызывает ошибку SyntaxError.
            real_url = f"/static/{relative_path.as_posix()}"

            results.append({
                "title": clean_title,
                "url": real_url,
                "score": float(score)
            })

        except Exception as e:
            print(f"Ошибка с файлом {path}: {e}")
            continue

    results.sort(key=lambda x: x["score"], reverse=True)
    return JSONResponse(content=results[:5])