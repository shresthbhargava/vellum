"""
Vellum Pipeline - SSE Streaming Endpoints
"""

import asyncio
import json
import time
import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

from app.services import extraction_agent, brd_agent, critic_agent, multimodal_parser
from app.services import competitive_agent
from app.utils.logging_config import get_logger
from app.database import SessionLocal
from app.models.db_models import BRDSession

logger = get_logger(__name__)
router = APIRouter(prefix="/api", tags=["pipeline"])

sessions: dict[str, dict] = {}


class GenerateRequest(BaseModel):
    startup_name: str = ""
    text_input: str = ""
    input_type: str = "text"
    filename: Optional[str] = None
    file_content: Optional[str] = None


def sse_event(data: dict) -> str:
    return f"data: {json.dumps(data, default=str)}\n\n"


def save_session_to_db(session_id: str, data: dict):
    db = SessionLocal()
    try:
        existing = db.query(BRDSession).filter(BRDSession.id == session_id).first()
        if existing:
            for key, value in data.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
        else:
            db_record = BRDSession(id=session_id, **data)
            db.add(db_record)
        db.commit()
        logger.info("Session saved to DB: %s", session_id)
    except Exception as e:
        db.rollback()
        logger.error("DB save failed for %s: %s", session_id, e)
    finally:
        db.close()


def load_session_from_db(session_id: str) -> dict | None:
    db = SessionLocal()
    try:
        row = db.query(BRDSession).filter(BRDSession.id == session_id).first()
        if row:
            return {
                "session_id": row.id,
                "created_at": str(row.created_at),
                "startup_name": row.startup_name,
                "domain": row.domain,
                "raw_input": row.raw_input,
                "extracted_data": row.extracted_data or {},
                "enriched_data": row.enriched_data or {},
                "brd": row.brd_data or {},
                "validation": row.validation_data or {},
                "quality_review": row.quality_review or {},
                "traces": row.traces or [],
                "vellum_score": row.vellum_score,
                "processing_time_ms": row.processing_time_ms,
                "status": "success",
                "gcs_uri": None,
                "error": None,
            }
        return None
    except Exception as e:
        logger.error("DB load failed for %s: %s", session_id, e)
        return None
    finally:
        db.close()


@router.post("/stream")
async def stream_generate(request: Request):
    body = await request.json()
    req = GenerateRequest(**body)

    async def event_generator() -> AsyncGenerator[str, None]:
        start = time.time()
        session_id = str(uuid.uuid4())
        logger.info("SSE Pipeline start | session=%s | type=%s", session_id, req.input_type)

        try:
            # Step 0: Initializing
            yield sse_event({"type": "status", "step": 0, "agent": "system", "message": "Warming up agent pipeline..."})

            # Step 1: Input validation
            raw_idea = req.text_input
            if req.startup_name:
                raw_idea = f"{req.startup_name}. {raw_idea}"

            if req.file_content and req.input_type in ("image", "pdf"):
                try:
                    image_text = await asyncio.to_thread(
                        multimodal_parser.extract_text_from_images,
                        [req.file_content],
                    )
                    raw_idea = f"{raw_idea}\n\n{image_text}" if raw_idea else image_text
                except Exception as e:
                    logger.warning("File extraction failed: %s", e)

            yield sse_event({"type": "status", "step": 1, "agent": "InputAgent", "message": f"Validated {len(raw_idea)} characters of input across {req.input_type} modality"})

            # Step 2: Extraction
            yield sse_event({"type": "status", "step": 2, "agent": "ExtractionAgent", "message": "Extracting business data, domain, and key entities..."})
            extracted = await asyncio.to_thread(
                extraction_agent.extract_business_data, raw_idea
            )
            extracted_dict = extracted.model_dump()
            yield sse_event({"type": "status", "step": 2, "agent": "ExtractionAgent", "message": f"Extracted data for {extracted.business_name} in {extracted.domain} domain"})

            # Step 3: Enrichment (validation agent if available)
            validation_result = None
            yield sse_event({"type": "status", "step": 3, "agent": "EnrichmentAgent", "message": "Enriching with industry context and competitive landscape..."})
            try:
                from app.services import validation_agent as va
                validation_result = await asyncio.to_thread(
                    va.validate_idea,
                    idea=raw_idea,
                    industry=extracted_dict.get("domain"),
                )
                yield sse_event({"type": "status", "step": 3, "agent": "EnrichmentAgent", "message": "Idea validated and context enriched"})
            except ImportError:
                yield sse_event({"type": "status", "step": 3, "agent": "EnrichmentAgent", "message": "Skipping enrichment - module not available"})
            except Exception as e:
                yield sse_event({"type": "status", "step": 3, "agent": "EnrichmentAgent", "message": f"Enrichment skipped: {str(e)[:60]}"})

            # Step 3.5: Competitive Intelligence
            competitive_data = None
            yield sse_event({"type": "status", "step": 3, "agent": "EnrichmentAgent", "message": "Analyzing competitive landscape..."})
            try:
                competitive_data = await asyncio.to_thread(
                    competitive_agent.analyze_competition,
                    req.startup_name or extracted_dict.get("business_name", ""),
                    extracted_dict.get("domain", ""),
                    raw_idea,
                )
                comp_count = len(competitive_data.get("competitors", []))
                yield sse_event({"type": "status", "step": 3, "agent": "EnrichmentAgent", "message": f"Found {comp_count} competitors in {extracted_dict.get('domain', '')} space"})
            except Exception as e:
                logger.warning("Competitive agent failed: %s", e)

            # Step 4: BRD Generation
            yield sse_event({"type": "status", "step": 4, "agent": "BRDAgent", "message": "Generating Business Requirements Document..."})
            brd_dict = await asyncio.to_thread(
                brd_agent.generate_brd_draft, extracted_dict
            )
            feature_count = len(brd_dict.get("feature_list", []))
            story_count = len(brd_dict.get("user_stories", []))
            yield sse_event({"type": "status", "step": 4, "agent": "BRDAgent", "message": f"Generated {feature_count} features and {story_count} user stories"})

            # Step 5: Quality Review
            yield sse_event({"type": "status", "step": 5, "agent": "QualityAgent", "message": "Running quality review and scoring..."})
            try:
                review = await asyncio.to_thread(
                    critic_agent.review_brd, brd_dict, extracted_dict
                )
            except Exception as e:
                logger.warning("Critic failed: %s", e)
                review = {"overall_score": 0, "overall_verdict": "unavailable", "sections": {}}
            yield sse_event({"type": "status", "step": 5, "agent": "QualityAgent", "message": f"Quality score: {review.get('overall_score', 'N/A')}/10"})

            # Build session data
            comp_competitors = competitive_data.get("competitors", []) if competitive_data else brd_dict.get("competitors", [])

            traces = [
                {"step": "1", "agent": "InputAgent", "output_summary": f"Validated input for {req.startup_name or 'submitted idea'}. {req.input_type} modality, {len(raw_idea)} chars.", "tokens_used": 0},
                {"step": "2", "agent": "ExtractionAgent", "output_summary": f"Extracted data for {extracted.business_name} in {extracted.domain} domain. Confidence: {extracted_dict.get('confidence', 'N/A')}.", "tokens_used": 0},
                {"step": "3", "agent": "EnrichmentAgent", "output_summary": f"Analyzed {len(comp_competitors)} competitors in {extracted.domain} space. Market maturity: {competitive_data.get('market_maturity', 'N/A') if competitive_data else 'N/A'}.", "tokens_used": 0},
                {"step": "4", "agent": "BRDAgent", "output_summary": f"Generated BRD with {feature_count} features and {story_count} user stories.", "tokens_used": 0},
                {"step": "5", "agent": "QualityAgent", "output_summary": f"Quality score: {review.get('overall_score', 'N/A')}/10 - {review.get('overall_verdict', 'N/A')}.", "tokens_used": 0},
            ]

            elapsed = round((time.time() - start) * 1000, 1)

            session_data = {
                "session_id": session_id,
                "status": "success",
                "startup_name": req.startup_name or extracted.business_name,
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
                    "competitors": comp_competitors,
                    "swot": brd_dict.get("swot", {}),
                    "risks": brd_dict.get("risks", []),
                    "timeline": brd_dict.get("timeline", []),
                },
                "competitive_intelligence": competitive_data,
                "critic": review,
                "validation": validation_result,
                "extraction": extracted_dict,
                "processing_time_ms": elapsed,
                "gcs_uri": None,
                "error": None,
            }

            sessions[session_id] = session_data

            # Save to DB
            await asyncio.to_thread(save_session_to_db, session_id, {
                "startup_name": req.startup_name or extracted.business_name,
                "domain": extracted.domain,
                "raw_input": req.text_input,
                "extracted_data": extracted_dict,
                "enriched_data": competitive_data,
                "brd_data": brd_dict,
                "validation_data": validation_result,
                "quality_review": review,
                "traces": traces,
                "processing_time_ms": elapsed,
            })

            # Send complete event
            yield sse_event({
                "type": "complete",
                "step": 5,
                "agent": "QualityAgent",
                "message": "BRD generation complete!",
                "data": {"session_id": session_id, "processing_time_ms": elapsed},
            })

            logger.info("SSE Pipeline complete | session=%s | %.0fms", session_id, elapsed)

        except Exception as e:
            logger.error("SSE Pipeline failed | session=%s | %s", session_id, e)
            yield sse_event({
                "type": "error",
                "step": 0,
                "agent": "system",
                "message": str(e),
            })

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/generate")
def generate(request: GenerateRequest):
    start = time.time()
    session_id = str(uuid.uuid4())
    logger.info("Pipeline start | session=%s | type=%s", session_id, request.input_type)

    try:
        raw_idea = request.text_input
        if request.startup_name:
            raw_idea = f"{request.startup_name}. {raw_idea}"

        if request.file_content and request.input_type in ("image", "pdf"):
            try:
                image_text = multimodal_parser.extract_text_from_images([request.file_content])
                raw_idea = f"{raw_idea}\n\n{image_text}" if raw_idea else image_text
            except Exception as e:
                logger.warning("File extraction failed: %s", e)

        extracted = extraction_agent.extract_business_data(raw_idea)
        extracted_dict = extracted.model_dump()

        validation_result = None
        try:
            from app.services import validation_agent as va
            validation_result = va.validate_idea(
                idea=raw_idea, industry=extracted_dict.get("domain"),
            )
        except (ImportError, Exception) as e:
            logger.warning("Validation skipped: %s", e)

        competitive_data = None
        try:
            competitive_data = competitive_agent.analyze_competition(
                request.startup_name or extracted_dict.get("business_name", ""),
                extracted_dict.get("domain", ""),
                raw_idea,
            )
        except Exception as e:
            logger.warning("Competitive agent failed: %s", e)

        brd_dict = brd_agent.generate_brd_draft(extracted_dict)

        try:
            review = critic_agent.review_brd(brd_dict, extracted_dict)
        except Exception as e:
            logger.warning("Critic failed: %s", e)
            review = {"overall_score": 0, "overall_verdict": "unavailable", "sections": {}}

        comp_competitors = competitive_data.get("competitors", []) if competitive_data else brd_dict.get("competitors", [])

        traces = [
            {"step": "1", "agent": "InputAgent", "output_summary": f"Validated input for {request.startup_name or 'idea'}.", "tokens_used": 0},
            {"step": "2", "agent": "ExtractionAgent", "output_summary": f"Extracted data for {extracted.business_name}.", "tokens_used": 0},
            {"step": "3", "agent": "EnrichmentAgent", "output_summary": f"Analyzed {len(comp_competitors)} competitors.", "tokens_used": 0},
            {"step": "4", "agent": "BRDAgent", "output_summary": f"Generated BRD with {len(brd_dict.get('feature_list', []))} features.", "tokens_used": 0},
            {"step": "5", "agent": "QualityAgent", "output_summary": f"Score: {review.get('overall_score', 'N/A')}/10.", "tokens_used": 0},
        ]

        elapsed = round((time.time() - start) * 1000, 1)
        session_data = {
            "session_id": session_id, "status": "success",
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
                "competitors": comp_competitors,
                "swot": brd_dict.get("swot", {}),
                "risks": brd_dict.get("risks", []),
                "timeline": brd_dict.get("timeline", []),
            },
            "competitive_intelligence": competitive_data,
            "critic": review, "validation": validation_result,
            "extraction": extracted_dict, "processing_time_ms": elapsed,
            "gcs_uri": None, "error": None,
        }
        sessions[session_id] = session_data
        save_session_to_db(session_id, {
            "startup_name": request.startup_name or extracted.business_name,
            "domain": extracted.domain, "raw_input": request.text_input,
            "extracted_data": extracted_dict, "enriched_data": competitive_data,
            "brd_data": brd_dict, "validation_data": validation_result,
            "quality_review": review, "traces": traces,
            "processing_time_ms": elapsed,
        })
        return {"session_id": session_id, "status": "processing"}

    except Exception as e:
        logger.error("Pipeline failed | session=%s | %s", session_id, e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}/agents")
def get_session(session_id: str):
    if session_id in sessions:
        return sessions[session_id]
    db_session = load_session_from_db(session_id)
    if db_session:
        sessions[session_id] = db_session
        return db_session
    raise HTTPException(status_code=404, detail="Session not found")


@router.get("/results/{session_id}")
def get_results(session_id: str):
    if session_id in sessions:
        return sessions[session_id]
    db_session = load_session_from_db(session_id)
    if db_session:
        sessions[session_id] = db_session
        return db_session
    raise HTTPException(status_code=404, detail="Session not found")