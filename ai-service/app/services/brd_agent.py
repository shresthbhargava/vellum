from app.services.groq_client import call_llm, fix_spacing
import json


BRD_PROMPT = """You are a senior product manager writing a comprehensive
Business Requirements Document for a startup. The input is a brief
startup idea. Expand it into a thorough, professional BRD.

Startup idea (verified data):
{extracted_data}

Instructions:
- You may REASON ABOUT and INFER reasonable details based on the idea.
- Write in plain, confident, professional language. No buzzwords.
- Be specific and concrete, not vague.

Return ONLY valid JSON with this exact structure:
{{
  "executive_summary": "3-4 sentences: problem, solution, target audience",
  "problem_statement": {{
    "current_situation": "What is broken right now",
    "pain_points": ["Specific pain point 1", "Specific pain point 2", "Specific pain point 3"],
    "impact": "Consequences: time lost, money wasted, opportunities missed"
  }},
  "objectives": ["SMART objective 1", "SMART objective 2", "SMART objective 3"],
  "scope": {{
    "in_scope": ["Included feature/capability 1", "Included feature/capability 2"],
    "out_of_scope": ["NOT included for MVP 1", "NOT included for MVP 2"]
  }},
  "stakeholders": [
    {{"role": "Role name", "responsibility": "What they are responsible for"}},
    {{"role": "Role name", "responsibility": "What they are responsible for"}}
  ],
  "target_users_summary": "Detailed description of primary and secondary users",
  "proposed_solution": "How the product works, specific about approach and UX",
  "feature_list": ["Concrete feature 1", "Concrete feature 2", "Concrete feature 3", "Concrete feature 4", "Concrete feature 5"],
  "non_functional_requirements": [
    {{"id": "NFR-1", "requirement": "Specific requirement", "category": "Performance"}},
    {{"id": "NFR-2", "requirement": "Specific requirement", "category": "Security"}}
  ],
  "user_stories": [
    {{"id": "US-1", "as_a": "user type", "i_want": "action", "so_that": "benefit", "acceptance_criteria": ["criterion 1", "criterion 2"]}},
    {{"id": "US-2", "as_a": "user type", "i_want": "action", "so_that": "benefit", "acceptance_criteria": ["criterion 1", "criterion 2"]}}
  ],
  "technical_architecture": {{
    "overview": "High-level architecture description",
    "components": ["Component 1", "Component 2", "Component 3"],
    "data_flow": "How data moves through the system",
    "tech_stack": ["Technology 1", "Technology 2", "Technology 3"]
  }},
  "success_metrics": [
    {{"metric": "Metric name", "target": "Target value", "measurement": "How measured"}},
    {{"metric": "Metric name", "target": "Target value", "measurement": "How measured"}}
  ],
  "competitors": [
    {{"name": "Competitor Name", "advantages": "What they do well", "disadvantages": "What they lack", "risk_level": "High|Medium|Low"}},
    {{"name": "Competitor Name", "advantages": "What they do well", "disadvantages": "What they lack", "risk_level": "High|Medium|Low"}}
  ],
  "swot": {{
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "weaknesses": ["Weakness 1", "Weakness 2"],
    "opportunities": ["Opportunity 1", "Opportunity 2"],
    "threats": ["Threat 1", "Threat 2"]
  }},
  "risks": [
    {{"risk": "Risk description", "probability": "High|Medium|Low", "impact": "High|Medium|Low", "mitigation": "How to mitigate"}},
    {{"risk": "Risk description", "probability": "High|Medium|Low", "impact": "High|Medium|Low", "mitigation": "How to mitigate"}}
  ],
  "timeline": [
    {{"phase": "MVP Development", "duration": "3 months", "deliverables": ["Deliverable 1", "Deliverable 2"]}},
    {{"phase": "Beta Launch", "duration": "2 months", "deliverables": ["Deliverable 1", "Deliverable 2"]}}
  ],
  "confidence": 0.0
}}
"""


def generate_brd_draft(extracted_data: dict) -> dict:
    business_name = extracted_data.get("business_name", "")
    protected = [business_name] if business_name else []

    content = call_llm(
        messages=[{
            "role": "user",
            "content": BRD_PROMPT.format(extracted_data=json.dumps(extracted_data)),
        }],
        use_primary=False,
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    data = json.loads(content)

    # Helper to fix spacing on a string field
    def fs(text):
        return fix_spacing(text, protected) if isinstance(text, str) else text

    # Simple string fields
    for key in ["executive_summary", "target_users_summary", "proposed_solution"]:
        if key in data:
            data[key] = fs(data[key])

    # Nested dict with string + list fields
    if "problem_statement" in data and isinstance(data["problem_statement"], dict):
        ps = data["problem_statement"]
        for k in ["current_situation", "impact"]:
            if k in ps:
                ps[k] = fs(ps[k])
        ps["pain_points"] = [fs(p) for p in ps.get("pain_points", [])]

    # String arrays
    for key in ["objectives", "feature_list"]:
        if key in data:
            data[key] = [fs(item) for item in data[key]]

    # Scope
    if "scope" in data and isinstance(data["scope"], dict):
        for k in ["in_scope", "out_of_scope"]:
            if k in data["scope"]:
                data["scope"][k] = [fs(s) for s in data["scope"][k]]

    # Stakeholders
    for sh in data.get("stakeholders", []):
        if isinstance(sh, dict):
            sh["role"] = fs(sh.get("role", ""))
            sh["responsibility"] = fs(sh.get("responsibility", ""))

    # Non-functional requirements
    for nfr in data.get("non_functional_requirements", []):
        if isinstance(nfr, dict):
            nfr["requirement"] = fs(nfr.get("requirement", ""))

    # User stories
    for us in data.get("user_stories", []):
        if isinstance(us, dict):
            for k in ["as_a", "i_want", "so_that"]:
                if k in us:
                    us[k] = fs(us[k])
            if "acceptance_criteria" in us:
                us["acceptance_criteria"] = [fs(ac) for ac in us["acceptance_criteria"]]

    # Technical architecture
    ta = data.get("technical_architecture", {})
    if isinstance(ta, dict):
        for k in ["overview", "data_flow"]:
            if k in ta:
                ta[k] = fs(ta[k])
        for k in ["components", "tech_stack"]:
            if k in ta:
                ta[k] = [fs(item) for item in ta[k]]

    # Success metrics
    for sm in data.get("success_metrics", []):
        if isinstance(sm, dict):
            for k in ["metric", "target", "measurement"]:
                if k in sm:
                    sm[k] = fs(sm[k])

    # Competitors
    for comp in data.get("competitors", []):
        if isinstance(comp, dict):
            for k in ["name", "advantages", "disadvantages"]:
                if k in comp:
                    comp[k] = fs(comp[k])

    # SWOT
    swot = data.get("swot", {})
    if isinstance(swot, dict):
        for quadrant in ["strengths", "weaknesses", "opportunities", "threats"]:
            if quadrant in swot:
                swot[quadrant] = [fs(item) for item in swot[quadrant]]

    # Risks
    for r in data.get("risks", []):
        if isinstance(r, dict):
            for k in ["risk", "mitigation"]:
                if k in r:
                    r[k] = fs(r[k])

    # Timeline
    for tm in data.get("timeline", []):
        if isinstance(tm, dict):
            for k in ["phase", "duration"]:
                if k in tm:
                    tm[k] = fs(tm[k])
            if "deliverables" in tm:
                tm["deliverables"] = [fs(d) for d in tm["deliverables"]]

    return data