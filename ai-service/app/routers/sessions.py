"""Session history endpoints — read from Supabase PostgreSQL."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.db_models import BRDSession

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.get("")
def list_sessions(limit: int = 20, db: Session = Depends(get_db)):
    """Return recent BRD sessions, newest first."""
    rows = (
        db.query(BRDSession)
        .order_by(desc(BRDSession.created_at))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "startup_name": r.startup_name or "Untitled",
            "vellum_score": r.vellum_score,
            "status": "completed" if r.brd_data else "processing",
            "processing_time_ms": r.processing_time_ms,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@router.get("/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    """Fetch a single session by ID."""
    row = db.query(BRDSession).filter(BRDSession.id == session_id).first()
    if not row:
        return {"error": "Session not found"}
    return {
        "id": row.id,
        "startup_name": row.startup_name,
        "raw_input": row.raw_input,
        "extracted_data": row.extracted_data,
        "enriched_data": row.enriched_data,
        "brd_data": row.brd_data,
        "validation_data": row.validation_data,
        "quality_review": row.quality_review,
        "traces": row.traces,
        "vellum_score": row.vellum_score,
        "processing_time_ms": row.processing_time_ms,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }
