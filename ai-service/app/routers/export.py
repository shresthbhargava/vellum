from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from app.database import SessionLocal
from app.models.db_models import BRDSession
from app.services.pdf_export import generate_brd_pdf
from app.utils.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/pdf/{session_id}")
def export_pdf(session_id: str):
    """Download a BRD as a PDF file."""
    # Try in-memory first (import here to avoid circular)
    from app.routers.pipeline import sessions
    if session_id in sessions:
        data = sessions[session_id]
    else:
        # Load from database
        db = SessionLocal()
        try:
            row = db.query(BRDSession).filter(BRDSession.id == session_id).first()
            if not row:
                raise HTTPException(status_code=404, detail="Session not found")
            data = {
                "session_id": row.id,
                "startup_name": row.startup_name,
                "brd": row.brd_data or {},
                "validation": row.validation_data or {},
                "critic": row.quality_review or {},
                "vellum_score": row.vellum_score,
            }
        finally:
            db.close()

    try:
        pdf_bytes = generate_brd_pdf(data)
        filename = f"{data.get('startup_name', 'brd').replace(' ', '_')}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        logger.error("PDF generation failed: %s", e)
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")