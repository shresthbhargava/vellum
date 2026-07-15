"""
Central configuration for the Vellum AI Service.
"""

import os
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Settings:
    """Immutable settings loaded once at startup."""

    # ── Groq LLM ──────────────────────────────────────────────────
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_primary_model: str = os.getenv("GROQ_PRIMARY_MODEL", "llama-3.1-8b-instant")
    groq_vision_model: str = os.getenv("GROQ_VISION_MODEL", "llama-4-scout-17b-16e-instruct")
    groq_fallback_model: str = os.getenv("GROQ_FALLBACK_MODEL", "llama-3.3-70b-versatile")

    # ── Service ───────────────────────────────────────────────────
    service_host: str = os.getenv("SERVICE_HOST", "0.0.0.0")
    service_port: int = int(os.getenv("SERVICE_PORT", "8500"))
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    # ── Retry / Timeout ───────────────────────────────────────────
    llm_max_retries: int = int(os.getenv("LLM_MAX_RETRIES", "2"))
    llm_retry_base_delay: float = float(os.getenv("LLM_RETRY_BASE_DELAY", "1.0"))

    # ── Multi-modal ───────────────────────────────────────────────
    max_image_size_bytes: int = int(os.getenv("MAX_IMAGE_SIZE_BYTES", str(5 * 1024 * 1024)))

    # ── Database (Supabase PostgreSQL) ────────────────────────────
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///vellum.db")
    sessions_api_key: str = os.getenv("SESSIONS_API_KEY", "vellum-2024-secure-key")

    # ── Auth (Supabase JWT) ───────────────────────────────────────
    supabase_jwt_secret: str = os.getenv("SUPABASE_JWT_SECRET", "")

    def validate(self) -> list[str]:
        problems = []
        if not self.groq_api_key:
            problems.append("GROQ_API_KEY is not set — LLM calls will fail")
        return problems