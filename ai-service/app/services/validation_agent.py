import json
import time

from app.services.groq_client import call_llm, fix_spacing
from app.utils.logging_config import get_logger

logger = get_logger(__name__)

VALIDATION_PROMPT = """You are a startup idea validator with experience as a
venture capitalist, startup founder, and product manager. Your job is to
honestly evaluate startup ideas across 5 dimensions.

Startup idea:
{idea}

Score each dimension 1-10 using this rubric:
- 1-3: Major red flags, unlikely to succeed
- 4-5: Significant concerns, needs major pivots
- 6-7: Viable with clear risks to address
- 8-9: Strong idea, minor gaps
- 10: Exceptional, minimal concerns

Dimensions:
1. "market_need" — Is there a REAL problem people will pay to solve?
   Consider: How painful is the problem? How many people have it?
   Will they pay for a solution or just complain about it?

2. "technical_feasibility" — Can a small team (2-5 people) actually
   build this in 6-12 months?
   Consider: Does the tech exist today? Are there APIs/libraries?
   Or does it require breakthroughs (AI sentience, new hardware)?

3. "competitive_landscape" — How differentiated is this from what
   already exists?
   Consider: Are there direct competitors? Switching costs?
   Is this 10x better or just slightly different?

4. "scalability" — Can this grow from 100 to 100,000 users without
   linearly increasing costs?
   Consider: Network effects? Viral loops? Marketplace dynamics?
   Or does each user require manual effort?

5. "revenue_potential" — Is there a clear, believable path to money?
   Consider: Willingness to pay? Pricing power? Market size?
   Or is this a "build users first, figure out money later" situation?

Verdict guide (based on overall average):
- 8.0+: "strong_candidate"
- 6.0-7.9: "promising_with_gaps"
- 4.0-5.9: "high_risk"
- Below 4.0: "not_recommended"

Be honest. Do not inflate scores. Most ideas are 5-7. An 8+ is rare.
If the idea is vague, score conservatively and say so.

Return ONLY valid JSON:
{{
  "idea_summary": "One sentence summarizing the core idea",
  "dimensions": [
    {{"dimension": "market_need", "score": 7, "explanation": "Why this score — be specific"}},
    {{"dimension": "technical_feasibility", "score": 6, "explanation": "Why"}},
    {{"dimension": "competitive_landscape", "score": 5, "explanation": "Why"}},
    {{"dimension": "scalability", "score": 7, "explanation": "Why"}},
    {{"dimension": "revenue_potential", "score": 6, "explanation": "Why"}}
  ],
  "overall_score": 6.2,
  "verdict": "promising_with_gaps",
  "recommendation": "2-3 sentence actionable recommendation",
  "confidence": 0.8
}}
"""


def validate_idea(idea: str, industry: str | None = None) -> dict:
    start_time = time.time()
    logger.info("Starting idea validation | idea_length=%d chars", len(idea))

    # Build context
    context = idea
    if industry:
        context = f"Industry: {industry}\n\nIdea: {idea}"

    content = call_llm(
        messages=[{
            "role": "user",
            "content": VALIDATION_PROMPT.format(idea=context),
        }],
        use_primary=False,
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    data = json.loads(content)

    # Fix spacing on text fields
    data["idea_summary"] = fix_spacing(data.get("idea_summary", ""), [])
    data["recommendation"] = fix_spacing(data.get("recommendation", ""), [])

    for dim in data.get("dimensions", []):
        dim["explanation"] = fix_spacing(dim.get("explanation", ""), [])

    elapsed_ms = (time.time() - start_time) * 1000
    logger.info(
        "Validation complete | %.0fms | score=%.1f | verdict=%s",
        elapsed_ms, data.get("overall_score", 0), data.get("verdict", "unknown"),
    )

    return data