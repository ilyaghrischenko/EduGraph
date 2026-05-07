from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import List
import logging
import lancedb
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

MODEL_NAME = "intfloat/multilingual-e5-large"
DB_PATH = "./vector_db"
TABLE_NAME = "document_chunks"

model = SentenceTransformer(MODEL_NAME)

db = lancedb.connect(DB_PATH)


class IncomingDocument(BaseModel):
    id: str
    title: str
    content: str
    url: str
    content_hash: str
    folder_name: str | None = None


class UpsertRequest(BaseModel):
    documents: List[IncomingDocument]


class DeleteRequest(BaseModel):
    document_ids: List[str]


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    min_score: float = 0.81


class SearchResult(BaseModel):
    document_id: str
    title: str
    content: str
    url: str
    folder_name: str | None = None
    score: float


def escape_filter_value(value: str) -> str:
    return value.replace("'", "''")


#настроить правильно max_chars overlap чтобы и производительно было, и качественно
def chunk_text(text: str, max_chars: int = 2500, overlap: int = 300) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        return []

    chunks: list[str] = []
    start = 0

    while start < len(text):
        end = start + max_chars
        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        start += max_chars - overlap

    return chunks


def get_or_create_table():
    if TABLE_NAME in db.table_names():
        return db.open_table(TABLE_NAME)

    sample_vector = model.encode(
        "passage: sample",
        normalize_embeddings=True,
    ).tolist()

    return db.create_table(
        TABLE_NAME,
        data=[
            {
                "document_id": "__init__",
                "chunk_id": "__init__",
                "title": "__init__",
                "content": "__init__",
                "url": "__init__",
                "folder_name": "__init__",
                "content_hash": "__init__",
                "vector": sample_vector,
            }
        ],
    )


table = get_or_create_table()


@app.get("/")
def index():
    return {"message": "EduGraph Vector Search API is running"}


@app.post("/documents/upsert")
def upsert_documents(request: UpsertRequest):
    inserted_chunks = 0
    skipped_documents = 0

    for doc in request.documents:
        content = doc.content.strip()

        if not content:
            logger.warning("Skipping document '%s' — empty content", doc.title)
            skipped_documents += 1
            continue

        safe_document_id = escape_filter_value(doc.id)

        table.delete(f"document_id = '{safe_document_id}'")

        chunks = chunk_text(content)

        if not chunks:
            skipped_documents += 1
            continue

        passages = [f"passage: {chunk}" for chunk in chunks]

        vectors = model.encode(
            passages,
            batch_size=8,
            show_progress_bar=False,
            normalize_embeddings=True,
        )

        rows = []

        for index, (chunk, vector) in enumerate(zip(chunks, vectors)):
            rows.append(
                {
                    "document_id": doc.id,
                    "chunk_id": f"{doc.id}:{index}",
                    "title": doc.title,
                    "content": chunk,
                    "url": doc.url,
                    "folder_name": doc.folder_name,
                    "content_hash": doc.content_hash,
                    "vector": vector.tolist(),
                }
            )

        table.add(rows)
        inserted_chunks += len(rows)

    try:
        table.delete("document_id = '__init__'")
    except Exception:
        pass

    return {
        "inserted_chunks": inserted_chunks,
        "skipped_documents": skipped_documents,
    }


@app.post("/documents/delete")
def delete_documents(request: DeleteRequest):
    for document_id in request.document_ids:
        safe_document_id = escape_filter_value(document_id)
        table.delete(f"document_id = '{safe_document_id}'")

    return {"deleted_documents": len(request.document_ids)}


@app.post("/search", response_model=list[SearchResult])
def search(request: SearchRequest):
    query = request.query.strip()

    if not query:
        return []

    query_vector = model.encode(
        f"query: {query}",
        normalize_embeddings=True,
    ).tolist()

    raw_results = (
        table
        .search(query_vector)
        .metric("cosine")
        .limit(request.top_k * 3)
        .to_list()
    )

    results: list[SearchResult] = []

    for item in raw_results:
        distance = float(item.get("_distance", 1.0))

        score = 1.0 - distance

        logger.info(
            "Search result: query='%s', title='%s', distance=%s, score=%s",
            query,
            item["title"],
            distance,
            score,
        )

        if score < request.min_score:
            continue

        results.append(
            SearchResult(
                document_id=item["document_id"],
                title=item["title"],
                content=item["content"],
                url=item["url"],
                folder_name=item.get("folder_name"),
                score=score,
            )
        )

        if len(results) >= request.top_k:
            break

    return results