import os
import numpy as np
import tensorflow_hub as hub
from sklearn.metrics.pairwise import cosine_similarity
from docx import Document
import PyPDF2

SUPPORTED_EXTENSIONS = ['.txt', '.pdf', '.docx', '.md']
MODEL_URL = "https://tfhub.dev/google/universal-sentence-encoder/4"

# ===== Загрузка модели =====
print("Загрузка модели...")
model = hub.load(MODEL_URL)


def get_all_files(folder_path):
    all_files = []
    for root, _, files in os.walk(folder_path):
        for file in files:
            if any(file.lower().endswith(ext) for ext in SUPPORTED_EXTENSIONS):
                all_files.append(os.path.join(root, file))
    return all_files


def extract_text(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    try:
        if ext == '.txt' or ext == '.md':
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        elif ext == '.pdf':
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                return '\n'.join(page.extract_text() or '' for page in reader.pages)
        elif ext == '.docx':
            doc = Document(file_path)
            return '\n'.join(paragraph.text for paragraph in doc.paragraphs)
    except Exception as e:
        print(f"Ошибка при чтении {file_path}: {e}")
        return ''
    return ''


def build_index(folder_path):
    file_paths = get_all_files(folder_path)
    print(f"Найдено файлов: {len(file_paths)}")
    docs = [extract_text(fp) for fp in file_paths]
    embeddings = model(docs)
    return file_paths, docs, embeddings


def search(query, file_paths, docs, embeddings, top_k=5):
    query_emb = model([query])
    similarities = cosine_similarity(query_emb, embeddings)[0]
    top_indices = similarities.argsort()[-top_k:][::-1]

    print("\n📌 Результаты по запросу:", query)
    for i in top_indices:
        print(f"---\n📄 Файл: {file_paths[i]}\n🔗 Сходство: {similarities[i]:.2f}")
        print(f"📄 Превью: {docs[i][:300].strip()}...\n")


if __name__ == "__main__":
    folder_path = input("👉 Введите путь к папке с документами: ").strip()
    file_paths, docs, embeddings = build_index(folder_path)

    while True:
        query = input("\n🔎 Введите запрос (или 'exit' для выхода): ").strip()
        if query.lower() == 'exit':
            break
        search(query, file_paths, docs, embeddings)