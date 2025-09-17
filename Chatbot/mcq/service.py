import json
import re
import uuid
from typing import List, Optional
from .models import MCQItem, GenerateRequest, Difficulty
from .database import MCQDatabase
from services.gemini_service import GeminiService
from utils.logger import logger

class MCQService:
    def __init__(self, gemini_service: GeminiService, db_path: str = "mcq_database.db"):
        self.gemini_service = gemini_service
        self.db = MCQDatabase(db_path)
        
    def build_mcq_prompt(self, topic: str, difficulty: Difficulty, count: int, context: str = "") -> str:
        """Build the all-in-one prompt for MCQ generation"""
        
        context_section = f"\n\nAdditional Context:\n{context}" if context else ""
        
        prompt = f"""You are creating a multiple choice quiz for teenagers about "{topic}" at {difficulty.value} difficulty level.{context_section}

Generate exactly {count} question(s) and return them as a valid JSON array.

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON - no explanations, no markdown formatting
2. Each question has exactly 4 options (A, B, C, D)  
3. Exactly ONE option marked as correct (is_correct: true)
4. All other options marked as incorrect (is_correct: false)
5. distractor_rationale must have exactly 4 entries (one for each option)
6. Keep text short and clear for teens
7. Avoid sensitive topics

JSON FORMAT (copy exactly):
[
  {{
    "id": "generated-uuid",
    "topic": "{topic}",
    "difficulty": "{difficulty.value}",
    "question": "Your question here (under 200 chars)",
    "options": [
      {{"label": "A", "text": "Option A text", "is_correct": false}},
      {{"label": "B", "text": "Option B text", "is_correct": true}},
      {{"label": "C", "text": "Option C text", "is_correct": false}},
      {{"label": "D", "text": "Option D text", "is_correct": false}}
    ],
    "explanation": "Why B is correct (under 240 chars)",
    "distractor_rationale": ["Why A is wrong", "Why B is wrong (even though it's correct)", "Why C is wrong", "Why D is wrong"],
    "source": "GENERATED",
    "estimated_confidence": 0.85
  }}
]

IMPORTANT: distractor_rationale must have exactly 4 items, one explaining why each option A, B, C, D is wrong (even for the correct answer, explain why the others might think it's wrong).

Return only the JSON array above with your content filled in."""

        return prompt
    
    async def generate_mcqs(self, request: GenerateRequest) -> List[MCQItem]:
        """Generate MCQs using Gemini and store valid ones in database"""
        try:
            logger.info(f"Generating {request.count} MCQs for topic: {request.topic}, difficulty: {request.difficulty}")
            
            prompt = self.build_mcq_prompt(
                request.topic, 
                request.difficulty, 
                request.count, 
                request.context
            )
            
            # Use existing Gemini service
            response = await self.gemini_service.generate_response(prompt)
            
            # Extract JSON from response
            logger.info(f"Raw Gemini response: {response[:500]}...")  # Log first 500 chars
            json_content = self.extract_json_from_response(response)
            if not json_content:
                logger.error(f"No valid JSON found in Gemini response: {response}")
                return []
            
            # Parse and validate MCQs
            mcq_items = self.parse_and_validate_mcqs(json_content, request.topic, request.difficulty)
            
            # Store valid MCQs in database
            stored_items = []
            for item in mcq_items:
                if self.db.store_question(item):
                    stored_items.append(item)
                    logger.info(f"Stored MCQ: {item.id}")
                else:
                    logger.warning(f"Failed to store or duplicate MCQ: {item.id}")
            
            logger.info(f"Successfully generated and stored {len(stored_items)} MCQs")
            return stored_items
            
        except Exception as e:
            logger.error(f"Error generating MCQs: {e}")
            return []
    
    def extract_json_from_response(self, response: str) -> Optional[str]:
        """Extract JSON content from Gemini response"""
        try:
            logger.info(f"Full Gemini response length: {len(response)}")
            
            # Remove any markdown formatting
            clean_response = re.sub(r'```json\s*', '', response)
            clean_response = re.sub(r'```\s*$', '', clean_response)
            clean_response = clean_response.strip()
            
            # Find the start and end of the JSON array
            start_idx = clean_response.find('[')
            if start_idx == -1:
                logger.error("No opening bracket found in response")
                return None
            
            # Find the matching closing bracket
            bracket_count = 0
            end_idx = -1
            
            for i in range(start_idx, len(clean_response)):
                if clean_response[i] == '[':
                    bracket_count += 1
                elif clean_response[i] == ']':
                    bracket_count -= 1
                    if bracket_count == 0:
                        end_idx = i + 1
                        break
            
            if end_idx == -1:
                logger.error("No matching closing bracket found")
                return None
            
            json_content = clean_response[start_idx:end_idx]
            logger.info(f"Extracted JSON length: {len(json_content)}")
            
            return json_content
                
        except Exception as e:
            logger.error(f"Error extracting JSON: {e}")
            return None
    
    def parse_and_validate_mcqs(self, json_content: str, topic: str, difficulty: Difficulty) -> List[MCQItem]:
        """Parse JSON and validate MCQ items"""
        try:
            data = json.loads(json_content)
            if not isinstance(data, list):
                logger.error("JSON response is not a list")
                return []
            
            valid_mcqs = []
            for item_data in data:
                try:
                    # Ensure required fields
                    item_data.setdefault('topic', topic)
                    item_data.setdefault('difficulty', difficulty.value)
                    item_data.setdefault('source', 'GENERATED')
                    item_data.setdefault('estimated_confidence', 0.8)
                    
                    # Generate a unique ID if it's the placeholder
                    if item_data.get('id') in ['generated-uuid', 'a1b2c3d4-e5f6-7890-1234-567890abcdef']:
                        item_data['id'] = str(uuid.uuid4())
                    
                    # Create MCQItem and validate
                    mcq_item = MCQItem(**item_data)
                    mcq_item.validate_single_correct_answer()
                    mcq_item.validate_unique_options()
                    
                    valid_mcqs.append(mcq_item)
                    
                except Exception as e:
                    logger.warning(f"Invalid MCQ item: {e}")
                    continue
            
            logger.info(f"Validated {len(valid_mcqs)} out of {len(data)} MCQs")
            return valid_mcqs
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            return []
        except Exception as e:
            logger.error(f"Error parsing MCQs: {e}")
            return []
    
    def get_next_question(self, topic: Optional[str] = None, difficulty: Optional[Difficulty] = None) -> Optional[MCQItem]:
        """Get the next question for quiz"""
        return self.db.get_next_question(topic, difficulty)
    
    def submit_answer(self, question_id: str, selected: str, user_id: Optional[str] = None) -> dict:
        """Submit an answer and get result"""
        try:
            # Validate selected option
            if selected not in ["A", "B", "C", "D"]:
                return {"error": "Invalid option selected. Must be A, B, C, or D"}
            
            question = self.db.get_question_by_id(question_id)
            if not question:
                return {"error": "Question not found"}
            
            correct_label = question.get_correct_label()
            is_correct = selected == correct_label
            
            # Record attempt
            from .models import AttemptRequest
            attempt = AttemptRequest(question_id=question_id, selected=selected, user_id=user_id)  # type: ignore
            self.db.record_attempt(attempt, is_correct)
            
            return {
                "correct": is_correct,
                "explanation": question.explanation,
                "correct_label": correct_label,
                "question_id": question_id
            }
            
        except Exception as e:
            logger.error(f"Error submitting answer: {e}")
            return {"error": "Failed to submit answer"}
    
    def get_analytics(self, topic: Optional[str] = None) -> dict:
        """Get quiz analytics"""
        return self.db.get_analytics(topic)