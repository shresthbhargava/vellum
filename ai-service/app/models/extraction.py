from pydantic import BaseModel, Field
from typing import List


class ExtractionRequest(BaseModel):
    raw_idea: str = Field(..., min_length=10, max_length=10000)


class ExtractedData(BaseModel):
    business_name: str
    problem_statement: str
    target_users: List[str]
    proposed_solution: str
    key_features: List[str]
    domain: str
    confidence: float = Field(ge=0.0, le=1.0)
