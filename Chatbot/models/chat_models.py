from pydantic import BaseModel
from typing import Optional, List

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    age_group: Optional[str] = "teen"  # Default to teen restrictions

class ChatResponse(BaseModel):
    response: str
    is_safe: bool
    filtered: bool
    processing_time: Optional[float] = None
    topic: Optional[str] = None
    follow_up_questions: Optional[List[str]] = None
    conversation_context: Optional[dict] = None

class FollowUpRequest(BaseModel):
    user_id: str
    topic: Optional[str] = None
    limit: Optional[int] = 3

class FollowUpResponse(BaseModel):
    questions: List[str]
    topic: str

class FilterResult(BaseModel):
    is_safe: bool
    filtered_content: Optional[str] = None
    violations: Optional[list[str]] = None