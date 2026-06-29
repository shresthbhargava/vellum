import json
import time

from app.models.extraction import ExtractedData
from app.services.groq_client import call_llm, fix_spacing
from app.utils.logging_config import get_logger

logger = get_logger(__name__)

EXTRACTION_PROMPT = """You are a precise business analyst. Your only job
is to extract facts that are explicitly stated or unambiguously implied
in the text below. You must not infer, assume, or add anything beyond
what the text directly supports.

Rules:
- For "problem_statement" specifically: if the text describes a product
  or service but doesn't explicitly state the problem, infer the most
  obvious, directly-supported problem the product is solving (e.g. if
  the product is "a dog walking app for busy professionals", the
  problem is that busy professionals lack time to walk their dogs).
  This is a reasonable, low-risk inference, not fabrication.
- For all other fields, if a detail is genuinely absent or ambiguous,
  write "Not specified" rather than guessing numbers, names, or facts
  that aren't supported by the text at all.
- Do not paraphrase vaguely. Use specific nouns, numbers, and names from
  the text itself wherever they exist.
- "target_users" must be specific demographic/behavioral descriptions
  (e.g. "working professionals aged 25-40 in Mumbai"), not generic terms
  like "users" or "customers".
- "key_features" must be concrete, individually testable capabilities
  the product has, not vague benefits (write "Live GPS tracking during
  walks", not "great user experience").
- "domain" must be a specific industry category (e.g. "Pet Care Services",
  not "App" or "Technology").
- "confidence" must reflect how complete and unambiguous the input was:
  0.9+ only if nearly every field had clear textual support; lower it
  proportionally for each field you had to leave vague or empty.

Return ONLY valid JSON matching this exact structure, no markdown, no
explanation text:
{{
  "business_name": "string",
  "problem_statement": "string",
  "target_users": ["string"],
  "proposed_solution": "string",
  "key_features": ["string"],
  "domain": "string",
  "confidence": 0.0
}}

Raw idea:
{raw_idea}
"""


def extract_business_data(raw_idea: str) -> ExtractedData:
    start_time = time.time()
    logger.info("Starting extraction | input_length=%d chars", len(raw_idea))

    try:
        content = call_llm(
            messages=[{
                "role": "user",
                "content": EXTRACTION_PROMPT.format(raw_idea=raw_idea),
            }],
            use_primary=True,
            temperature=0.2,
            response_format={"type": "json_object"},
        )
    except RuntimeError as e:
        logger.error("Extraction LLM call failed: %s", e)
        raise

    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        logger.error("Extraction returned invalid JSON: %s | raw: %.200s", e, content)
        raise ValueError(f"LLM returned invalid JSON: {e}") from e

    business_name = data.get("business_name", "")
    protected = [business_name] if business_name and business_name != "Not specified" else []

    for field_name in ["business_name", "problem_statement", "proposed_solution", "domain"]:
        if field_name in data and isinstance(data[field_name], str):
            data[field_name] = fix_spacing(data[field_name], protected)

    result = ExtractedData(**data)

    elapsed_ms = (time.time() - start_time) * 1000
    logger.info(
        "Extraction complete | %.0fms | business=%s | domain=%s | confidence=%.2f",
        elapsed_ms, result.business_name, result.domain, result.confidence,
    )

    return result