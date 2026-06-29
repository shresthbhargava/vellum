"""
Vellum Database Layer

WHY: Right now sessions live in a Python dict — gone on restart.
This sets up SQLAlchemy + SQLite so data persists to a file.
SQLite = zero config, no PostgreSQL install needed.
Swap to PostgreSQL later by changing ONE line (DATABASE_URL).

HOW:
- SQLAlchemy ORM = Python classes → database tables
- Session = connection to run queries
- Base = registry that tracks all table models
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os

# ── Database URL ──────────────────────────────────────────────
# SQLite stores data in vellum.db file in ai-service root
# check_same_thread=False is REQUIRED for FastAPI (multi-threaded)
DB_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "..", "vellum.db"))
DATABASE_URL = f"sqlite:///{DB_PATH}"

# ── Engine (connection pool) ──────────────────────────────────
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, echo=False)

# ── SessionLocal (creates DB sessions per request) ────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Base (all table models inherit from this) ─────────────────
class Base(DeclarativeBase):
    pass


def get_db():
    """
    FastAPI dependency. Usage:
        @router.get("/sessions")
        def list_sessions(db: Session = Depends(get_db)):
            ...
    Yields a DB session, auto-closes after request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Call once on startup. Creates tables if missing. Safe to call repeatedly."""
    Base.metadata.create_all(bind=engine)