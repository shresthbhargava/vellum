"""
Vellum AI Service — Entry point.
Runs when you type: uvicorn app.main:app
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.utils.logging_config import setup_logging, get_logger
from app.routers import extraction, brd, critic, multimodal, pipeline, export, rag
from app.routers import validation, sessions
from app.database import init_db      # ← NEW


setup_logging()
logger = get_logger(__name__)

problems = settings.validate()
for problem in problems:
    logger.error("CONFIG PROBLEM: %s", problem)


# ── Lifespan: runs once on startup ────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Creates DB tables on startup, then runs the app."""
    init_db()  # ← NEW: creates vellum.db + tables if they don't exist
    logger.info("Database initialized (vellum.db)")
    yield  # App runs here


app = FastAPI(
    title="Vellum AI Service",
    description="AI-powered startup intelligence platform",
    version="2.1.0",  # Bumped for DB feature
    lifespan=lifespan,  # ← NEW: replaces on_event("startup")
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extraction.router)
app.include_router(brd.router)
app.include_router(critic.router)
app.include_router(multimodal.router)
app.include_router(pipeline.router)
app.include_router(validation.router)  # ← NEW
app.include_router(sessions.router)
app.include_router(export.router)
app.include_router(rag.router)  # add this line



@app.get("/health")
def health_check():
    return {"status": "ok", "version": "2.1.0"}


@app.get("/")
def root():
    return {
        "message": "Vellum AI Service is running",
        "docs": "http:// ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8500'}/docs",
        "endpoints": {
            "pipeline": "POST /api/pipeline/generate",
            "validation": "POST /api/validation/validate",
            "extraction": "POST /api/extraction",
            "brd_draft": "POST /api/brd/draft",
            "brd_critic": "POST /api/brd/critic",
        },
    }


@app.on_event("startup")
def on_startup():
    logger.info("=" * 50)
    logger.info("Vellum AI Service v2.1.0 starting...")
    logger.info("Primary model: %s", settings.groq_primary_model)
    logger.info("Fallback model: %s", settings.groq_fallback_model)
    if not settings.groq_api_key:
        logger.error("GROQ_API_KEY not set — all LLM calls will fail!")
    else:
        logger.info("API key configured: gsk_...%s", settings.groq_api_key[-4:])
    logger.info("Swagger docs: http://localhost:%d/docs", settings.service_port)
    logger.info("=" * 50)