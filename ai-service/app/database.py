"""
Vellum Database Layer — PostgreSQL via Supabase

WHY THIS FILE EXISTS:
- All BRD sessions need to persist across deploys and restarts.
- Uses SQLAlchemy ORM with Supabase PostgreSQL (Connection Pooler on port 6543).
- Swap DATABASE_URL in .env to change databases — everything else stays the same.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

# ── Engine ────────────────────────────────────────────────────────
# pool_pre_ping=True sends a test query before reusing a connection.
# This catches stale connections that Supabase closes after inactivity.
engine = create_engine(
    settings.database_url,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)

# ── SessionLocal ──────────────────────────────────────────────────
# Factory that creates new DB sessions. Each request gets its own.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Base ──────────────────────────────────────────────────────────
# All table models inherit from this.
class Base(DeclarativeBase):
    pass


# ── Helper functions ─────────────────────────────────────────────

def get_db():
    """
    FastAPI dependency. Yields a DB session, auto-closes after request.
        @router.get("/sessions")
        def list_sessions(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Call once on startup. Creates all tables if they don't exist."""
    Base.metadata.create_all(bind=engine)