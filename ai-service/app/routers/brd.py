from fastapi import APIRouter, HTTPException
from app.models.common import BrdDraftRequest, BrdDraftResponse, ErrorResponse
from app.services import brd_agent
from app.utils.logging_config import get_logger
import time

logger = get_logger(__name__)
router = APIRouter(prefix="/api/brd", tags=["brd"])

@router.post("/draft", response_model=BrdDraftResponse, responses={500: {"model": ErrorResponse}})
def generate_draft(request: BrdDraftRequest):
    start = time.time()
    logger.info("BRD draft request | business=%s", request.extracted_data.get("business_name", "?"))

    try:
        result = brd_agent.generate_brd_draft(request.extracted_data)
        elapsed = (time.time() - start) * 1000

        return BrdDraftResponse(
            status="success",
            data=result.model_dump(),
            processing_time_ms=round(elapsed, 1),
        )
    except (ValueError, RuntimeError) as e:
        logger.error("BRD generation failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))