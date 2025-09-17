from typing import List, Literal, Annotated, Optional
from pydantic import BaseModel, Field
from enum import Enum
import uuid

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class MCQOption(BaseModel):
    label: Literal["A", "B", "C", "D"]
    text: str = Field(..., max_length=80, min_length=1)
    is_correct: bool

class MCQItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topic: str
    difficulty: Difficulty
    question: str = Field(..., max_length=200)
    options: Annotated[List[MCQOption], Field(min_length=4, max_length=4)]
    explanation: str = Field(..., max_length=240)
    distractor_rationale: Annotated[List[str], Field(min_length=4, max_length=4)]
    source: Literal["FROM_CONTEXT", "GENERATED"]
    estimated_confidence: float = Field(..., ge=0, le=1)

    def validate_single_correct_answer(self):
        """Ensure exactly one option is marked as correct"""
        correct_count = sum(1 for option in self.options if option.is_correct)
        if correct_count != 1:
            raise ValueError(f"MCQ must have exactly one correct answer, found {correct_count}")
        return self

    def validate_unique_options(self):
        """Ensure all option texts are unique"""
        option_texts = [option.text for option in self.options]
        if len(set(option_texts)) != len(option_texts):
            raise ValueError("All option texts must be unique")
        return self

    def get_correct_label(self) -> str:
        """Get the label of the correct answer"""
        for option in self.options:
            if option.is_correct:
                return option.label
        raise ValueError("No correct answer found")

class GenerateRequest(BaseModel):
    topic: str
    difficulty: Difficulty
    count: int = Field(..., ge=1, le=20)
    context: str = ""

class GenerateResponse(BaseModel):
    items: List[MCQItem]

class AttemptRequest(BaseModel):
    question_id: str
    selected: Literal["A", "B", "C", "D"]
    user_id: Optional[str] = None

class AttemptResponse(BaseModel):
    correct: bool
    explanation: str
    correct_label: Literal["A", "B", "C", "D"]
    question_id: str