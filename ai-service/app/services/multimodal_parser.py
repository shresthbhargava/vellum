import time

from app.services.groq_client import call_llm
from app.utils.logging_config import get_logger

logger = get_logger(__name__)

IMAGE_EXTRACTION_PROMPT = """You are a business analyst reviewing a pitch
deck or business document. Extract ALL business information visible in
this image. Be specific — capture:

1. Business/product name
2. The problem being solved
3. Target users or customers described
4. Key features or capabilities mentioned
5. Any pricing, numbers, or metrics shown
6. The industry or domain

Return your findings as a clear, detailed paragraph that could be used
as input to a business analysis pipeline. Do NOT add information not
visible in the image. If the image is unclear or has limited text,
describe what you CAN see and note what's unclear."""


def extract_text_from_images(images_b64: list[str]) -> str:
    if not images_b64:
        raise ValueError("No images provided")

    start_time = time.time()
    logger.info("Starting image extraction | %d images", len(images_b64))

    content_parts: list[dict] = [
        {"type": "text", "text": IMAGE_EXTRACTION_PROMPT}
    ]

    for i, img in enumerate(images_b64):
        if img.startswith("data:"):
            image_url = img
        else:
            image_url = f"data:image/png;base64,{img}"

        raw_size = len(img) * 3 // 4
        if raw_size > 5 * 1024 * 1024:
            logger.warning(
                "Image %d is %.1fMB (max 5MB) — may fail or be truncated",
                i + 1, raw_size / (1024 * 1024),
            )

        content_parts.append({
            "type": "image_url",
            "image_url": {"url": image_url},
        })

    try:
        extracted_text = call_llm(
            messages=[{"role": "user", "content": content_parts}],
            use_vision=True,
            temperature=0.2,
            response_format=None,
        )
    except RuntimeError as e:
        logger.error("Vision model call failed: %s", e)
        raise

    elapsed_ms = (time.time() - start_time) * 1000
    logger.info(
        "Image extraction complete | %.0fms | %d chars extracted",
        elapsed_ms, len(extracted_text),
    )

    return extracted_text