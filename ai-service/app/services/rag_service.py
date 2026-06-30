"""RAG service — parse, chunk, embed, retrieve documents per session."""

import os
import io
import hashlib
from typing import Optional

from pypdf import PdfReader
from app.utils.logging_config import get_logger

logger = get_logger(__name__)

# ── In-memory ChromaDB (per-session, cleared after use) ──────────
_collection = None
_client = None


def _get_collection(session_id: str):
    """Get or create a ChromaDB collection for this session."""
    global _client, _collection
    if _client is None:
        import chromadb
        _client = chromadb.Client()
    return _client.get_or_create_collection(name=f"rag_{session_id}")


def parse_document(file_bytes: bytes, filename: str) -> str:
    """Extract text from a PDF or TXT file."""
    name = filename.lower()
    if name.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(file_bytes))
        pages = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text and text.strip():
                pages.append(f"[Page {i+1}]\n{text.strip()}")
        full = "\n\n".join(pages)
        if not full.strip():
            raise ValueError(f"Could not extract text from {filename}")
        logger.info("Parsed PDF: %s | %d pages | %d chars", filename, len(pages), len(full))
        return full
    elif name.endswith(".txt") or name.endswith(".md"):
        text = file_bytes.decode("utf-8", errors="ignore")
        logger.info("Parsed text: %s | %d chars", filename, len(text))
        return text
    else:
        raise ValueError(f"Unsupported file type: {filename}")


def chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        start += chunk_size - overlap
    logger.info("Chunked text: %d words → %d chunks", len(words), len(chunks))
    return chunks


def store_chunks(session_id: str, chunks: list[str]):
    """Embed and store chunks in ChromaDB."""
    if not chunks:
        return
    collection = _get_collection(session_id)
    ids = [f"chunk_{i}" for i in range(len(chunks))]
    collection.upsert(
        documents=chunks,
        ids=ids,
    )
    logger.info("Stored %d chunks in ChromaDB for session %s", len(chunks), session_id)


def retrieve_context(session_id: str, query: str, top_k: int = 5) -> str:
    """Retrieve the most relevant chunks for a query."""
    try:
        collection = _get_collection(session_id)
        if collection.count() == 0:
            return ""
        results = collection.query(query_texts=[query], n_results=min(top_k, collection.count()))
        docs = results.get("documents", [[]])[0]
        if not docs:
            return ""
        context = "\n\n---\n\n".join(docs)
        logger.info("Retrieved %d chunks (%d chars) for query", len(docs), len(context))
        return context
    except Exception as e:
        logger.warning("RAG retrieval failed: %s", e)
        return ""


def clear_session(session_id: str):
    """Remove all chunks for a session to free memory."""
    global _client
    try:
        if _client is not None:
            _client.delete_collection(name=f"rag_{session_id}")
            logger.info("Cleared RAG session: %s", session_id)
    except Exception as e:
        logger.warning("Failed to clear RAG session %s: %s", session_id, e)
