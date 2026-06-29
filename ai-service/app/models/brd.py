from pydantic import BaseModel, Field
from typing import List


class BrdGenerationRequest(BaseModel):
    extracted_data: dict


class BrdDraft(BaseModel):
    executive_summary: str
    problem_statement: str
    target_users_summary: str
    proposed_solution: str
    feature_list: List[str]
    confidence: float = Field(ge=0.0, le=1.0)
