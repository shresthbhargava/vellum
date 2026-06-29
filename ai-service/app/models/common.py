from pydantic import BaseModel, Field

class ExtractionRequest(BaseModel):
    raw_idea: str = Field(..., min_length=10, description="Raw business idea text (min 10 characters)")

class ExtractionResponse(BaseModel):
    status: str = Field(default="success")
    data: dict = Field(default_factory=dict)
    processing_time_ms: float = Field(default=0.0)

class BrdDraftRequest(BaseModel):
    extracted_data: dict = Field(..., description="The extracted business data from the extraction agent")
    images: list[str] | None = Field(default=None, description="Base64-encoded images for additional context (optional)")

class BrdDraftResponse(BaseModel):
    status: str = Field(default="success")
    data: dict = Field(default_factory=dict)
    processing_time_ms: float = Field(default=0.0)

class CriticRequest(BaseModel):
    brd_draft: dict = Field(..., description="The generated BRD draft to review")
    extracted_data: dict = Field(..., description="Original extracted data for grounding the review")

class CriticResponse(BaseModel):
    status: str = Field(default="success")
    review: dict = Field(default_factory=dict)
    processing_time_ms: float = Field(default=0.0)

class MultimodalExtractionRequest(BaseModel):
    text: str = Field(default="", description="Text description of the business idea")
    images: list[str] = Field(default_factory=list, description="Base64-encoded images")

class ErrorResponse(BaseModel):
    status: str = Field(default="error")
    error: str = Field(default="Unknown error")
    detail: str = Field(default="")