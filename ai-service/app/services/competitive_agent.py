"""
Competitive Intelligence Agent

Analyzes the startup's domain and industry to identify real competitors,
their strengths, weaknesses, market positioning, and gaps the startup
can exploit. Uses Groq LLM's knowledge + structured prompting.
"""

from app.services.groq_client import call_llm
from app.utils.logging_config import get_logger

logger = get_logger(__name__)

COMPETITIVE_PROMPT = """You are a competitive intelligence analyst. Given a startup idea, identify and analyze its competitive landscape.

STARTUP: {startup_name}
DOMAIN: {domain}
IDEA: {idea}

Return a JSON object with this exact structure:
{{
  "market_overview": "2-3 sentence overview of the market size, growth trend, and key dynamics",
  "competitors": [
    {{
      "name": "Competitor Name",
      "type": "direct" or "indirect",
      "description": "1-2 sentence description of what they do",
      "strengths": ["strength1", "strength2", "strength3"],
      "weaknesses": ["weakness1", "weakness2"],
      "market_position": "leader" or "challenger" or "niche",
      "pricing_model": "their pricing approach",
      "threat_level": "high" or "medium" or "low"
    }}
  ],
  "market_gaps": [
    "Gap 1: Description of unmet need",
    "Gap 2: Description of underserved segment"
  ],
  "competitive_advantage_opportunities": [
    "Opportunity 1: How this startup can differentiate",
    "Opportunity 2: Unique angle to exploit"
  ],
  "market_maturity": "emerging" or "growing" or "mature" or "declining",
  "entry_barriers": ["Barrier 1", "Barrier 2", "Barrier 3"],
  "recommended_positioning": "1-2 sentence suggested market positioning for this startup"
}}

RULES:
- Identify 4-6 REAL competitors that actually exist. Use your knowledge.
- Be specific and factual. No made-up companies.
- Focus on the most relevant competitors in the same domain.
- If the domain is very niche, include adjacent/indirect competitors too.
- market_gaps should highlight real opportunities, not generic advice."""


def analyze_competition(startup_name: str, domain: str, raw_idea: str) -> dict:
    """
    Run competitive intelligence analysis.

    Args:
        startup_name: The startup's name
        domain: The industry/domain from extraction
        raw_idea: The full idea description

    Returns:
        Dict with market_overview, competitors[], market_gaps[],
        competitive_advantage_opportunities[], market_maturity,
        entry_barriers[], recommended_positioning
    """
    logger.info("Running competitive analysis for %s in %s", startup_name, domain)

    prompt = COMPETITIVE_PROMPT.format(
        startup_name=startup_name or "Unnamed Startup",
        domain=domain or "General",
        idea=raw_idea[:2000],
    )

    messages = [{"role": "user", "content": prompt}]

    response = call_llm(
        messages,
        use_primary=False,
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    import json
    result = json.loads(response)

    competitor_count = len(result.get("competitors", []))
    high_threats = sum(1 for c in result.get("competitors", []) if c.get("threat_level") == "high")
    gap_count = len(result.get("market_gaps", []))

    logger.info(
        "Competitive analysis complete: %d competitors (%d high threat), %d market gaps, maturity=%s",
        competitor_count, high_threats, gap_count,
        result.get("market_maturity", "unknown"),
    )

    return result