from fastapi import APIRouter, HTTPException

from app.models.validation import ValidationRequest, ValidationResponse
from app.services import validation_agent
from app.utils.logging_config import get_logger
from app.database import SessionLocal
from app.models.db_models import IdeaValidation

logger = get_logger(__name__)
router = APIRouter(prefix="/api/validation", tags=["validation"])


@router.post("/validate", response_model=ValidationResponse)
def validate_idea(request: ValidationRequest):
    """Score a startup idea across 5 dimensions."""
    logger.info(
        "Validation request | idea_length=%d | industry=%s",
        len(request.idea), request.industry,
    )
    try:
        result = validation_agent.validate_idea(
            idea=request.idea,
            industry=request.industry,
        )
        data = ValidationResponse(**result)

        # ── Persist to database ────────────────────────────────────
        db = SessionLocal()
        try:
            db_validation = IdeaValidation(
                idea=request.idea,
                industry=request.industry or "",
                idea_summary=data.idea_summary,
                dimensions=[d.model_dump() if hasattr(d, "model_dump") else d for d in data.dimensions],
                overall_score=data.overall_score,
                verdict=data.verdict,
                recommendation=data.recommendation,
                confidence=data.confidence,
            )
            db.add(db_validation)
            db.commit()
            logger.info("Validation saved to DB | score=%s", data.overall_score)
        except Exception as e:
            db.rollback()
            logger.warning("DB save failed: %s", e)
        finally:
            db.close()

        return data
    except ValueError as e:
        logger.error("Validation data error: %s", e)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error("Validation failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))