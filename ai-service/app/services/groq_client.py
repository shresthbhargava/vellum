import json
import time
from typing import Any

import groq
from groq import GroqError

from app.config import settings
from app.utils.logging_config import get_logger

logger = get_logger(__name__)

_client: groq.Groq | None = None


def get_client() -> groq.Groq:
    global _client
    if _client is None:
        if not settings.groq_api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not set. Create a .env file with "
                "GROQ_API_KEY=gsk_your_key_here"
            )
        _client = groq.Groq(api_key=settings.groq_api_key)
        logger.info("Groq client initialized")
    return _client


def get_model_name(use_primary: bool = True, use_vision: bool = False) -> str:
    if use_vision:
        return settings.groq_vision_model
    return settings.groq_primary_model if use_primary else settings.groq_fallback_model


def call_llm(
    messages: list[dict[str, Any]],
    *,
    use_primary: bool = True,
    use_vision: bool = False,
    temperature: float = 0.2,
    response_format: dict | None = None,
) -> str:
    client = get_client()

    if use_vision:
        models_to_try = [get_model_name(use_vision=True)]
    elif use_primary:
        models_to_try = [get_model_name(use_primary=True), get_model_name(use_primary=False)]
    else:
        models_to_try = [get_model_name(use_primary=False)]

    last_error: Exception | None = None

    for model_name in models_to_try:
        for attempt in range(settings.llm_max_retries + 1):
            try:
                start = time.time()

                kwargs: dict[str, Any] = {
                    "model": model_name,
                    "messages": messages,
                    "temperature": temperature,
                }
                if response_format is not None:
                    kwargs["response_format"] = response_format

                response = client.chat.completions.create(**kwargs)
                content = response.choices[0].message.content or ""

                elapsed_ms = (time.time() - start) * 1000
                logger.info(
                    "LLM call succeeded | model=%s | attempt=%d | %.0fms | %d chars",
                    model_name, attempt + 1, elapsed_ms, len(content),
                )
                return content

            except GroqError as e:
                last_error = e
                elapsed_ms = (time.time() - start) * 1000

                status_code = getattr(e, "status_code", None)
                is_retryable = status_code in (429, 500, 502, 503, 504) if status_code else False

                if is_retryable and attempt < settings.llm_max_retries:
                    delay = settings.llm_retry_base_delay * (2 ** attempt)
                    logger.warning(
                        "LLM call failed (retryable) | model=%s | attempt=%d | status=%s | retrying in %.1fs",
                        model_name, attempt + 1, status_code, delay,
                    )
                    time.sleep(delay)
                else:
                    logger.error(
                        "LLM call failed (non-retryable or exhausted) | model=%s | attempt=%d | %.0fms | %s",
                        model_name, attempt + 1, elapsed_ms, str(e),
                    )
                    break

    raise RuntimeError(f"All LLM calls failed. Last error: {last_error}")


def fix_spacing(text: str, protected_terms: list[str] | None = None) -> str:
    
    import wordninja

    protected_terms = protected_terms or []
    protected_lower = [t.lower() for t in protected_terms]

    

    if not text or not text.strip():
        return text

    words = text.split(" ")
    fixed_words = []

    for word in words:
        if not word:
            fixed_words.append(word)
            continue

        stripped = word.rstrip(".,!?;:()\"'")
        clean = stripped.lstrip(".,!?;:()\"'")
        clean_lower = clean.lower()

        if clean_lower in protected_lower:
            fixed_words.append(word)
            continue

        if clean.isalpha() and len(clean) > 4 and not _dictionary.check(clean_lower):
            split_result = wordninja.split(clean_lower)
            if len(split_result) > 1 and all(_dictionary.check(w) for w in split_result):
                prefix = word[: len(word) - len(stripped)] if stripped else ""
                suffix = stripped[len(clean):] if clean != stripped else ""
                fixed_words.append(prefix + " ".join(split_result) + suffix)
                continue

        fixed_words.append(word)

    return " ".join(fixed_words)