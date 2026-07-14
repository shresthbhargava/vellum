from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services import validation_agent
from app.utils.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/validation", tags=["validation"])


class ValidateRequest(BaseModel):
    idea: str
    industry: Optional[str] = None


@router.post("/validate")
def validate(req: ValidateRequest):
    if not req.idea or len(req.idea.strip()) < 10:
        raise HTTPException(status_code=400, detail="Idea must be at least 10 characters")

    try:
        result = validation_agent.validate_idea(idea=req.idea, industry=req.industry)
        return result
    except Exception as e:
        logger.error("Validation failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))