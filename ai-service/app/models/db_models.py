from sqlalchemy import Column, String, Float, Integer, Text, DateTime, JSON
from sqlalchemy.sql import func

from app.database import Base


class BRDSession(Base):
    __tablename__ = "brd_sessions"

    id = Column(String, primary_key=True)
    created_at = Column(DateTime, server_default=func.now())

    # Auth
    user_id = Column(String, default="anonymous", index=True)

    # Input
    startup_name = Column(String, default="")
    domain = Column(String, default="")
    raw_input = Column(Text, default="")

    # Pipeline outputs (stored as JSON dicts)
    extracted_data = Column(JSON, default=dict)
    enriched_data = Column(JSON, default=dict)
    brd_data = Column(JSON, default=dict)
    validation_data = Column(JSON, default=dict)
    quality_review = Column(JSON, default=dict)
    competitive_intelligence = Column(JSON, default=dict)
    traces = Column(JSON, default=list)

    # Meta
    vellum_score = Column(Float, nullable=True)
    processing_time_ms = Column(Float, nullable=True)


class IdeaValidation(Base):
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