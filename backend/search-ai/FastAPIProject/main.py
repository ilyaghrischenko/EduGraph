from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, CrossEncoder
from typing import List
import logging
import lancedb
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

EMBEDDING_MODEL_NAME = "intfloat/multilingual-e5-base"
RERANKER_MODEL_NAME = "cross-encoder/mmarco-mMiniLMv2-L12-H384-v1"

DB_PATH = "./vector_db"
TABLE_NAME = "document_chunks"

embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
reranker = CrossEncoder(RERANKER_MODEL_NAME)

db = lancedb.connect(DB_PATH)


class IncomingDocument(BaseModel):
    id: str
    title: str
    content: str
    url: str
    content_hash: str
    folder_name: str | None = None


class UpsertRequest(BaseModel):
    documents: list[IncomingDocument]


class DeleteRequest(BaseModel):
    document_ids: List[str]


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    min_score: float = 0.74
    min_rerank_score: float = 1.0


class SearchResult(BaseModel):
    document_id: str
    title: str
    content: str
    url: str
    folder_name: str | None = None
    score: float
    rerank_score: float


def escape_filter_value(value: str) -> str:
    return value.replace("'", "''")


#todo настроить правильно max_chars overlap чтобы и производительно было, и качественно
def chunk_text(text: str, max_chars: int = 1800, overlap: int = 200) -> list[str]:
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

    sample_vector = embedding_model.encode(
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


@app.get("/health")
def health():
    logger.info("Health endpoint was called")
    return {"status": "ok"}


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

        vectors = embedding_model.encode(
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

    query_vector = embedding_model.encode(
        f"query: {query}",
        normalize_embeddings=True,
    ).tolist()

    candidate_limit = max(request.top_k * 8, 30)

    raw_results = (
        table
        .search(query_vector)
        .metric("cosine")
        .limit(candidate_limit)
        .to_list()
    )

    candidates = []
    seen_chunk_ids: set[str] = set()

    for item in raw_results:
        distance = float(item.get("_distance", 1.0))
        vector_score = 1.0 - distance

        logger.debug(
            "Vector result: query='%s', title='%s', distance=%s, score=%s",
            query,
            item["title"],
            distance,
            vector_score,
        )

        if vector_score < request.min_score:
            continue

        chunk_id = item["chunk_id"]

        if chunk_id in seen_chunk_ids:
            continue

        seen_chunk_ids.add(chunk_id)

        candidates.append(
            {
                "document_id": item["document_id"],
                "chunk_id": chunk_id,
                "title": item["title"],
                "content": item["content"],
                "url": item["url"],
                "folder_name": item.get("folder_name"),
                "score": vector_score,
            }
        )

    if not candidates:
        return []

    rerank_pairs = [
        [query, f"{candidate['title']}\n{candidate['content']}"]
        for candidate in candidates
    ]

    rerank_scores = reranker.predict(
        rerank_pairs,
        batch_size=8,
        show_progress_bar=False,
    )

    reranked = []

    for candidate, rerank_score in zip(candidates, rerank_scores):
        rerank_score = float(rerank_score)

        logger.debug(
            "Rerank result: query='%s', title='%s', vector_score=%s, rerank_score=%s",
            query,
            candidate["title"],
            candidate["score"],
            rerank_score,
        )

        if rerank_score < request.min_rerank_score:
            continue

        reranked.append(
            {
                **candidate,
                "rerank_score": rerank_score,
            }
        )

    reranked.sort(key=lambda item: item["rerank_score"], reverse=True)

    results: list[SearchResult] = []

    seen_document_ids: set[str] = set()

    for item in reranked:
        document_id = item["document_id"]

        if document_id in seen_document_ids:
            continue

        seen_document_ids.add(document_id)

        results.append(
            SearchResult(
                document_id=document_id,
                title=item["title"],
                content=item["content"],
                url=item["url"],
                folder_name=item.get("folder_name"),
                score=item["score"],
                rerank_score=item["rerank_score"],
            )
        )

        if len(results) >= request.top_k:
            break

    return results