"""
Vellum AI Service — Entry point.

This is the file that runs when you type: uvicorn app.main:app

WHAT IT DOES:
1. Sets up logging (so you can see what's happening)
2. Checks config (warns if API key is missing)
3. Registers all routers (connects URLs to functions)
4. Adds CORS middleware (so your Java frontend can call this API from a browser)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.utils.logging_config import setup_logging, get_logger
from app.routers import extraction, brd, critic, multimodal, pipeline, sessions, validation
from app.database import init_db

# ── Step 1: Setup logging BEFORE anything else ───────────────────
setup_logging()
logger = get_logger(__name__)

# ── Step 2: Validate config ─────────────────────────────────────
problems = settings.validate()
for problem in problems:
    logger.error("CONFIG PROBLEM: %s", problem)

# ── Step 3: Create the FastAPI app ──────────────────────────────
app = FastAPI(
    title="Vellum AI Service",
    description="AI-powered business research and BRD generation pipeline",
    version="2.0.0",
)

# ── Step 4: CORS — allows your Java frontend to call this API ───
# Without this, browsers block cross-origin requests (your Java app
# runs on :8081, this runs on :8500 — that's "cross-origin").
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Step 5: Register routers ────────────────────────────────────
app.include_router(pipeline.router)
app.include_router(sessions.router)
app.include_router(extraction.router)
app.include_router(brd.router)
app.include_router(critic.router)
app.include_router(multimodal.router)
app.include_router(validation.router)


# ── Step 6: Health check and root ───────────────────────────────
@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}


@app.get("/")
def root():
    return {
        "message": "Vellum AI Service is running",
        "docs": "http://localhost:8500/docs",
        "endpoints": {
            "extraction": "POST /api/extraction",
            "brd_draft": "POST /api/brd/draft",
            "brd_critic": "POST /api/brd/critic",
            "multimodal": "POST /api/multimodal-extraction",
        },
    }


# ── Step 7: Startup event ────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    # Ensure DB tables exist
    try:
        init_db()
        logger.info("Database tables initialized")
    except Exception as e:
        logger.error("DB init failed (tables may already exist): %s", e)

    logger.info("=" * 50)
    logger.info("Vellum AI Service v2.1.0 starting...")
    logger.info("Primary model: %s", settings.groq_primary_model)
    logger.info("Vision model: %s", settings.groq_vision_model)
    logger.info("Fallback model: %s", settings.groq_fallback_model)
    if not settings.groq_api_key:
        logger.error("GROQ_API_KEY not set — all LLM calls will fail!")
    else:
        logger.info("API key configured: gsk_...%s", settings.groq_api_key[-4:])
    logger.info("Swagger docs: http://localhost:%d/docs", settings.service_port)
    logger.info("=" * 50)