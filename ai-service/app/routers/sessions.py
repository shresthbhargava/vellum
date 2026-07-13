from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.db_models import BRDSession
from app.config import settings

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def verify_access(x_vellum_key: str = Header(default=None)):
    if not x_vellum_key or x_vellum_key != settings.sessions_api_key:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.get("")
def list_sessions(
    limit: int = 20,
    db: Session = Depends(get_db),
    _: None = Depends(verify_access),
):
    rows = (
        db.query(BRDSession)
        .order_by(desc(BRDSession.created_at))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "startup_name": r.startup_name,
            "domain": r.domain,
            "vellum_score": r.vellum_score,
            "processing_time_ms": r.processing_time_ms,
            "created_at": str(r.created_at),
        }
        for r in rows
    ]


@router.get("/{session_id}")
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    _: None = Depends(verify_access),
):
    row = db.query(BRDSession).filter(BRDSession.id == session_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "id": row.id,
        "startup_name": row.startup_name,
        "domain": row.domain,
        "raw_input": row.raw_input,
        "extracted_data": row.extracted_data or {},
        "enriched_data": row.enriched_data or {},
        "brd_data": row.brd_data or {},
        "validation_data": row.validation_data or {},
        "quality_review": row.quality_review or {},
        "traces": row.traces or [],
        "vellum_score": row.vellum_score,
        "processing_time_ms": row.processing_time_ms,
        "created_at": str(row.created_at),
    }