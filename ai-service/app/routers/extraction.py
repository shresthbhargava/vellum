from fastapi import APIRouter, HTTPException
from app.models.common import ExtractionRequest, ExtractionResponse, ErrorResponse
from app.models.extraction import ExtractedData
from app.services import extraction_agent
from app.utils.logging_config import get_logger
import time

logger = get_logger(__name__)
router = APIRouter(prefix="/api", tags=["extraction"])

@router.post(
    "/extraction",
    response_model=ExtractionResponse,
    responses={500: {"model": ErrorResponse}},
)
def extract(request: ExtractionRequest):
    start = time.time()
    logger.info("Received extraction request | %d chars", len(request.raw_idea))
    
    try:
        result = extraction_agent.extract_business_data(request.raw_idea)
        elapsed = (time.time() - start) * 1000
        
        return ExtractionResponse(
            status="success",
            data=result.model_dump(),
            processing_time_ms=round(elapsed, 1),
        )
    except (ValueError, RuntimeError) as e:
        logger.error("Extraction failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))