"""RAG router — upload documents for context-aware BRD generation."""

import uuid
import time

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional

from app.services import rag_service
from app.utils.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/rag", tags=["rag"])

# Track uploaded sessions
_rag_sessions: dict[str, dict] = {}


@router.post("/upload")
async def upload_documents(files: list[UploadFile] = File(...)):
    """Upload multiple PDF/TXT files. Returns a rag_session_id."""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    rag_session_id = str(uuid.uuid4())
    all_chunks = []

    for f in files:
        if not f.filename:
            continue
        allowed = (".pdf", ".txt", ".md")
        if not f.filename.lower().endswith(allowed):
            logger.warning("Skipped unsupported file: %s", f.filename)
            continue

        try:
            content = await f.read()
            if len(content) > 10 * 1024 * 1024:  # 10MB limit
                raise ValueError("File too large (max 10MB)")
            text = rag_service.parse_document(content, f.filename)
            chunks = rag_service.chunk_text(text)
            all_chunks.extend(chunks)
        except Exception as e:
            logger.error("Failed to process %s: %s", f.filename, e)
            raise HTTPException(status_code=422, detail=f"Error processing {f.filename}: {str(e)}")

    if not all_chunks:
        raise HTTPException(status_code=422, detail="No text could be extracted from uploaded files")

    rag_service.store_chunks(rag_session_id, all_chunks)
    _rag_sessions[rag_session_id] = {"file_count": len(files), "chunk_count": len(all_chunks)}

    logger.info("RAG upload | session=%s | %d files → %d chunks", rag_session_id, len(files), len(all_chunks))
    return {
        "rag_session_id": rag_session_id,
        "files_processed": len(files),
        "total_chunks": len(all_chunks),
    }


@router.delete("/session/{rag_session_id}")
def clear_rag_session(rag_session_id: str):
    """Clear a RAG session to free memory."""
    rag_service.clear_session(rag_session_id)
    _rag_sessions.pop(rag_session_id, None)
    return {"status": "cleared", "rag_session_id": rag_session_id}
