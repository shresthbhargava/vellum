import logging
import sys
from app.config import settings
def setup_logging() -> None:
    fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    datefmt="%Y-%m-%d %H:%M:%S"
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(fmt=fmt, datefmt=datefmt))
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(settings.log_level)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)