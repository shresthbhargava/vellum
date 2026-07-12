import os
from dataclasses import dataclass
from dotenv import load_dotenv
load_dotenv()




@dataclass(frozen=True)
class Settings:
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_primary_model: str = os.getenv("GROQ_PRIMARY_MODEL", "llama-3.3-8b-instant")
    groq_vision_model: str = os.getenv("GROQ_VISION_MODEL", "llama-4-scout-17b-16e-instruct")
    groq_fallback_model: str = os.getenv("GROQ_FALLBACK_MODEL", "llama-3.3-70b-versatile")
    service_host: str = os.getenv("SERVICE_HOST", "0.0.0.0")
    service_port: int = int(os.getenv("SERVICE_PORT", "8500"))
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    llm_max_retries: int = int(os.getenv("LLM_MAX_RETRIES", "2"))
    llm_retry_base_delay: float = float(os.getenv("LLM_RETRY_BASE_DELAY", "1.0"))
    max_image_size_bytes: int = int(os.getenv("MAX_IMAGE_SIZE_BYTES", str(5 * 1024 * 1024)))
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///vellum.db")

    def validate(self) -> list[str]:
        problems = []
        if not self.groq_api_key:
            problems.append("GROQ_API_KEY is not set — LLM calls will fail")
        return problems

settings = Settings()