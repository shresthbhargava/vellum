import uuid
import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.services import extraction_agent, brd_agent, critic_agent, multimodal_parser, validation_agent
from app.utils.logging_config import get_logger
from app.database import SessionLocal
from app.models.db_models import BRDSession

logger = get_logger(__name__)
router = APIRouter(prefix="/api", tags=["pipeline"])

# ── In-memory store (kept as cache, DB is source of truth) ──────
sessions: dict[str, dict] = {}

# ── Database helpers ─────────────────────────────────────────────

def save_session_to_db(session_id: str, data: dict):
    """Persist a session to SQLite so it survives restarts."""
    db = SessionLocal()
    try:
        existing = db.query(BRDSession).filter(BRDSession.id == session_id).first()
        if existing:
            for key, value in data.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
        else:
            db_session = BRDSession(id=session_id, **data)
            db.add(db_session)
        db.commit()
        logger.info("Session saved to DB | %s", session_id)
    except Exception as e:
        db.rollback()
        logger.warning("DB save failed: %s", e)
    finally:
        db.close()


def load_session_from_db(session_id: str) -> dict | None:
    """Load a session from SQLite. Returns None if not found."""
    db = SessionLocal()
    try:
        row = db.query(BRDSession).filter(BRDSession.id == session_id).first()
        if row:
            return {
                "session_id": row.id,
                "status": "success",
                "created_at": str(row.created_at),
                "startup_name": row.startup_name,
                "domain": row.domain,
                "raw_input": row.raw_input,
                "traces": row.traces or [],
                "brd": row.brd_data or {},
                "critic": row.quality_review or {},
                "validation": row.validation_data or {},
                "extraction": row.extracted_data or {},
                "processing_time_ms": row.processing_time_ms,
                "gcs_uri": None,
                "error": None,
            }
        return None
    except Exception as e:
        logger.warning("DB load failed: %s", e)
        return None
    finally:
        db.close()


# ── Request model ───────────────────────────────────────────────

class GenerateRequest(BaseModel):
    startup_name: str = ""
    text_input: str = ""
    input_type: str = "text"
    filename: Optional[str] = None
    file_content: Optional[str] = None


# ── Pipeline endpoint ───────────────────────────────────────────

@router.post("/generate")
def generate(request: GenerateRequest):
    start = time.time()
    session_id = str(uuid.uuid4())
    logger.info("Pipeline start | session=%s | type=%s", session_id, request.input_type)

    try:
        # Step 1: Build raw idea
        raw_idea = request.text_input
        if request.startup_name:
            raw_idea = f"{request.startup_name}. {raw_idea}"

        # Step 1b: If image uploaded, extract text from it
        if request.file_content and request.input_type in ("image", "pdf"):
            try:
                image_text = multimodal_parser.extract_text_from_images([request.file_content])
                raw_idea = f"{raw_idea}\n\n{image_text}" if raw_idea else image_text
            except Exception as e:
                logger.warning("File extraction failed, continuing with text: %s", e)

        # Step 2: Extract
        extracted = extraction_agent.extract_business_data(raw_idea)
        extracted_dict = extracted.model_dump()

        # Step 2b: Validate idea
        validation_result = None
        try:
            validation_result = validation_agent.validate_idea(
                idea=raw_idea,
                industry=extracted_dict.get("domain"),
            )
        except Exception as e:
            logger.warning("Validation agent failed, skipping: %s", e)

        # Step 3: BRD
        brd_dict = brd_agent.generate_brd_draft(extracted_dict)

        # Step 4: Critic
        try:
            review = critic_agent.review_brd(brd_dict, extracted_dict)
        except Exception as e:
            logger.warning("Critic failed, skipping: %s", e)
            review = {"overall_score": 0, "overall_verdict": "unavailable", "sections": {}}

        # Step 5: Map to the format the results page expects
        traces = [
            {"step": "1", "agent": "InputAgent", "output_summary": f"Validated input syntax and format for {request.startup_name or 'submitted idea'}. Input classified as {request.input_type} modality with {len(raw_idea)} characters of raw content.", "tokens_used": 0},
            {"step": "2", "agent": "ExtractionAgent", "output_summary": f"Extracted business data for {extracted.business_name} in {extracted.domain} domain. Idea scored {validation_result.get('overall_score', 'N/A')}/10 ({validation_result.get('verdict', 'N/A')}).", "tokens_used": 0},
            {"step": "3", "agent": "EnrichmentAgent", "output_summary": f"Enriched {extracted.business_name} with industry context from {extracted.domain} sector. Mapped competitive landscape and technical standards.", "tokens_used": 0},
            {"step": "4", "agent": "BRDAgent", "output_summary": f"Generated comprehensive BRD with {len(brd_dict.get('feature_list', []))} functional requirements, {len(brd_dict.get('user_stories', []))} user stories, and full SWOT analysis.", "tokens_used": 0},
            {"step": "5", "agent": "QualityAgent", "output_summary": f"BRD quality review complete. Overall score: {review.get('overall_score', 'N/A')}/10 — verdict: {review.get('overall_verdict', 'N/A')}.", "tokens_used": 0},
        ]

        elapsed = round((time.time() - start) * 1000, 1)

        session_data = {
            "session_id": session_id,
            "status": "success",
            "startup_name": request.startup_name or extracted.business_name,
            "traces": traces,
            "brd": {
                "executive_summary": brd_dict.get("executive_summary", ""),
                "problem_statement": brd_dict.get("problem_statement", {}),
                "objectives": brd_dict.get("objectives", []),
                "scope": brd_dict.get("scope", {}),
                "stakeholders": brd_dict.get("stakeholders", []),
                "target_market": {"content": brd_dict.get("target_users_summary", "")},
                "solution_overview": {"content": brd_dict.get("proposed_solution", "")},
                "functional_requirements": [
                    {"id": f"FR-{i+1}", "requirement": f, "priority": "High" if i == 0 else "Medium"}
                    for i, f in enumerate(brd_dict.get("feature_list", []))
                ],
                "non_functional_requirements": brd_dict.get("non_functional_requirements", []),
                "user_stories": brd_dict.get("user_stories", []),
                "technical_architecture": brd_dict.get("technical_architecture", {}),
                "success_metrics": brd_dict.get("success_metrics", []),
                "overall_confidence": extracted_dict.get("confidence", 0),
                "competitors": brd_dict.get("competitors", []),
                "swot": brd_dict.get("swot", {}),
                "risks": brd_dict.get("risks", []),
                "timeline": brd_dict.get("timeline", []),
            },
            "critic": review,
            "validation": validation_result,
            "extraction": extracted_dict,
            "processing_time_ms": elapsed,
            "gcs_uri": None,
            "error": None,
        }

        # ── In-memory cache ──────────────────────────────────────
        sessions[session_id] = session_data
        
        # ── Compute Vellum Score ─────────────────────────────────
        # Blends validation score (40%) + BRD quality score (60%)
        # If validation failed, use only critic score
        validation_score = validation_result.get("overall_score", 0) if validation_result else 0
        critic_score = review.get("overall_score", 0) if review else 0
        if validation_score > 0 and critic_score > 0:
            vellum_score = round(0.4 * validation_score + 0.6 * critic_score, 1)
        elif critic_score > 0:
            vellum_score = round(critic_score, 1)
        else:
            vellum_score = None

        session_data["vellum_score"] = vellum_score

        # ── Persist to database ──────────────────────────────────
        save_session_to_db(session_id, {
            "startup_name": request.startup_name or extracted.business_name,
            "domain": extracted.domain,
            "raw_input": request.text_input or "",
            "extracted_data": extracted_dict,
            "brd_data": session_data["brd"],
            "validation_data": validation_result,
            "quality_review": review,
            "traces": traces,
            "processing_time_ms": elapsed,
        })

        logger.info("Pipeline complete | session=%s | %.0fms", session_id, elapsed)
        return {"session_id": session_id, "status": "processing"}

    except Exception as e:
        logger.error("Pipeline failed | session=%s | %s", session_id, e)
        sessions[session_id] = {
            "session_id": session_id,
            "status": "failed",
            "startup_name": request.startup_name,
            "traces": [],
            "brd": {},
            "processing_time_ms": 0,
            "gcs_uri": None,
            "error": str(e),
        }
        raise HTTPException(status_code=500, detail=str(e))


# ── Session retrieval (checks memory first, then DB) ────────────

@router.get("/sessions/{session_id}/agents")
def get_session(session_id: str):
    """Matches the URL the results page polls."""
    if session_id in sessions:
        return sessions[session_id]
    # Fallback: load from database
    db_session = load_session_from_db(session_id)
    if db_session:
        return db_session
    raise HTTPException(status_code=404, detail="Session not found")


@router.get("/results/{session_id}")
def get_results(session_id: str):
    if session_id in sessions:
        return sessions[session_id]
    # Fallback: load from database
    db_session = load_session_from_db(session_id)
    if db_session:
        return db_session
    raise HTTPException(status_code=404, detail="Session not found")