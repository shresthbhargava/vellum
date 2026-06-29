from fastapi import APIRouter, HTTPException
from app.models.common import CriticRequest, CriticResponse, ErrorResponse
from app.services import critic_agent
from app.utils.logging_config import get_logger
import time

logger = get_logger(__name__)
router = APIRouter(prefix="/api/brd", tags=["critic"])

@router.post("/critic", response_model=CriticResponse, responses={500: {"model": ErrorResponse}})
def review_brd(request: CriticRequest):
    start = time.time()
    logger.info("Critic review request | business=%s", request.extracted_data.get("business_name", "?"))

    try:
        review = critic_agent.review_brd(request.brd_draft, request.extracted_data)
        elapsed = (time.time() - start) * 1000

        return CriticResponse(
            status="success",
            review=review,
            processing_time_ms=round(elapsed, 1),
        )
    except (ValueError, RuntimeError) as e:
        logger.error("Critic review failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))