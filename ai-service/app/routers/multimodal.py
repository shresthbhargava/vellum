from fastapi import APIRouter, HTTPException
from app.models.common import MultimodalExtractionRequest, ExtractionResponse, ErrorResponse
from app.services import multimodal_parser,extraction_agent
from app.utils.logging_config import get_logger
import time
logger = get_logger(__name__)
router=APIRouter(prefix="/api", tags=["multimodal"])
@router.post("/multimodal-extraction",response_model=ExtractionResponse,responses={500:{"model":ErrorResponse}})
def multimodal_extract(request:MultimodalExtractionRequest):
    start=time.time()
    logger.info("Received multimodal extraction request | %d chars",len(request.raw_idea))
    image_texts=[]
    if request.images:
        try:
            image_texts=multimodal_parser.extract_text_from_images(request.images)
            image_texts.append(image_texts)
            logger.info("Image extraction done | %d chars",len(request.images))
        except (ValueError,RuntimeError) as e:
            logger.warning("Image extraction failed,continuing with text only: %s",e)
            
    combined_parts=[]
    if request.text:
        combined_parts.append(request.text)
    combined_parts.extend(image_texts)
    if not combined_parts:
        raise HTTPException(status_code=400,detail="No text or images provided for extraction")
    combined_text="\n\n--- Image Context ---\n\n".join(combined_parts)
    try:
        result=extraction_agent.extract_business_data(combined_text)
        elapsed=(time.time()-start)*1000
        return ExtractionResponse(
            status="success",
            data=result.model_dump(),
            processing_time_ms=round(elapsed,1),
        )
    except (ValueError,RuntimeError) as e:
        logger.error("Multimodal extraction failed: %s",e)
        raise HTTPException(status_code=500,detail=str(e))
            
    