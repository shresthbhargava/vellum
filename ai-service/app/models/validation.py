from pydantic import BaseModel, Field


class ValidationRequest(BaseModel):
    idea: str = Field(..., min_length=10, description="The startup idea to validate")
    industry: str | None = None


class DimensionScore(BaseModel):
    dimension: str
    score: int = Field(ge=1, le=10, description="Score from 1 to 10")
    explanation: str = Field(..., min_length=20, description="Why this score")


class ValidationResponse(BaseModel):
    idea_summary: str
    dimensions: list[DimensionScore]
    overall_score: float = Field(ge=1.0, le=10.0)
    verdict: str
    recommendation: str
    confidence: float = Field(ge=0.0, le=1.0)