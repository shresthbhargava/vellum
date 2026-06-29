"""
Database table definitions (SQLAlchemy ORM models).

WHY JSON columns instead of normalizing everything?
- BRD has 15+ nested fields (objectives[], user_stories[], stakeholders[]...)
- Normalizing = 10+ tables + complex JOINs
- JSON columns = dump the whole dict, simple to query later
- SQLAlchemy JSON type works with SQLite's json1 extension
"""

from sqlalchemy import Column, String, Float, Integer, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class BRDSession(Base):
    """
    Stores every BRD pipeline run.
    ID = the same UUID you already use as session_id (e.g. "abc-123-def").
    """
    __tablename__ = "brd_sessions"

    id = Column(String, primary_key=True)
    created_at = Column(DateTime, server_default=func.now())

    # Input
    startup_name = Column(String, default="")
    domain = Column(String, default="")
    raw_input = Column(Text, default="")

    # Pipeline outputs (JSON dicts)
    extracted_data = Column(JSON, default=dict)
    enriched_data = Column(JSON, default=dict)
    brd_data = Column(JSON, default=dict)
    validation_data = Column(JSON, default=dict)
    quality_review = Column(JSON, default=dict)
    traces = Column(JSON, default=list)

    # Meta
    vellum_score = Column(Float, nullable=True)
    processing_time_ms = Column(Float, nullable=True)


class IdeaValidation(Base):
    """
    Stores standalone idea validations (from /validate page).
    Separate from BRD sessions — user might validate without generating BRD.
    """
    __tablename__ = "idea_validations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, server_default=func.now())

    # Input
    idea = Column(Text, nullable=False)
    industry = Column(String, default="")

    # Output
    idea_summary = Column(Text, default="")
    dimensions = Column(JSON, default=list)
    overall_score = Column(Float, default=0.0)
    verdict = Column(String, default="")
    recommendation = Column(Text, default="")
    confidence = Column(Float, default=0.0)