import json
import time

from app.services.groq_client import call_llm, fix_spacing
from app.utils.logging_config import get_logger

logger = get_logger(__name__)

CRITIC_PROMPT = """You are a senior product manager reviewing a Business
Requirements Document draft. Your job is to evaluate quality and provide
constructive feedback.

ORIGINAL DATA (ground truth — what the BRD should be based on):
{extracted_data}

GENERATED BRD DRAFT (what you're reviewing):
{brd_draft}

Evaluate each section on a scale of 1-10:
- ACCURACY: Does it match the original data? (No invented facts?)
- SPECIFICITY: Does it use concrete details (numbers, names, places)?
- COMPLETENESS: Is anything important from the original data missing?

For each section, provide:
- score: 1-10
- verdict: "strong" (7+), "acceptable" (5-6), or "weak" (<5)
- feedback: One sentence explaining the score, or a specific improvement suggestion

Return ONLY valid JSON, no markdown:
{{
  "overall_score": 7.5,
  "overall_verdict": "acceptable",
  "sections": {{
    "executive_summary": {{
      "score": 8,
      "verdict": "strong",
      "feedback": "Clearly states the problem and solution in 3 sentences."
    }},
    "problem_statement": {{
      "score": 6,
      "verdict": "acceptable",
      "feedback": "States the problem but doesn't explain WHY it matters (consequences)."
    }},
    "target_users_summary": {{
      "score": 7,
      "verdict": "acceptable",
      "feedback": "..."
    }},
    "proposed_solution": {{
      "score": 7,
      "verdict": "acceptable",
      "feedback": "..."
    }},
    "feature_list": {{
      "score": 8,
      "verdict": "strong",
      "feedback": "..."
    }}
  }},
  "key_strengths": ["Point 1", "Point 2"],
  "improvement_suggestions": ["Suggestion 1", "Suggestion 2"],
  "summary": "One paragraph overall assessment."
}}
"""


def review_brd(brd_draft: dict, extracted_data: dict) -> dict:
    start_time = time.time()
    logger.info("Starting BRD review | business=%s", extracted_data.get("business_name", "unknown"))

    try:
        content = call_llm(
            messages=[{
                "role": "user",
                "content": CRITIC_PROMPT.format(
                    extracted_data=json.dumps(extracted_data, indent=2),
                    brd_draft=json.dumps(brd_draft, indent=2),
                ),
            }],
            use_primary=False,
            temperature=0.2,
            response_format={"type": "json_object"},
        )
    except RuntimeError as e:
        logger.error("Critic LLM call failed: %s", e)
        raise

    try:
        review = json.loads(content)
    except json.JSONDecodeError as e:
        logger.error("Critic returned invalid JSON: %s | raw: %.200s", e, content)
        raise ValueError(f"Critic returned invalid JSON: {e}") from e

    elapsed_ms = (time.time() - start_time) * 1000
    overall = review.get("overall_score", "N/A")
    logger.info("BRD review complete | %.0fms | overall_score=%s", elapsed_ms, overall)

    return review