# MCQ Quiz Module

A comprehensive Multiple Choice Question (MCQ) quiz module integrated with the existing teen health chatbot. This module allows users to generate, take, and analyze educational quizzes on various health topics.

## 🌟 Features

### Core Features
- **AI-Generated MCQs**: Uses Gemini API to generate topic-specific multiple choice questions
- **Difficulty Levels**: Easy, Medium, and Hard difficulty settings
- **Content Validation**: Ensures questions have exactly one correct answer and unique options
- **Safe Content**: Content filtering to ensure age-appropriate material for teens
- **Real-time Feedback**: Immediate feedback with explanations after each answer
- **Progress Tracking**: Analytics and statistics for quiz performance

### User Interface
- **Seamless Integration**: Toggle between Chat and Quiz modes in the same interface
- **Topic Selection**: Users can specify any topic for question generation
- **Interactive Quiz**: One-by-one question delivery with visual feedback
- **Score Tracking**: Real-time score display during quiz sessions
- **Dashboard Analytics**: View quiz statistics and performance metrics

## 🏗️ Architecture

### Backend (Python/FastAPI)
```
mcq/
├── __init__.py          # Module exports
├── models.py            # Pydantic models and types
├── database.py          # SQLite database operations
└── service.py           # MCQ generation and management service
```

### Frontend (React/TypeScript)
```
frontend/src/
├── components/
│   └── QuizPanel.tsx    # Main quiz interface component
├── lib/
│   └── api.ts           # API client with MCQ endpoints
└── app/
    ├── chat/page.tsx    # Chat page with quiz mode toggle
    └── dashboard/page.tsx # Dashboard with quiz analytics
```

### Database Schema
```sql
-- Questions table
CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  question TEXT NOT NULL,
  options TEXT NOT NULL,      -- JSON array of MCQOption objects
  explanation TEXT NOT NULL,
  distractor_rationale TEXT, -- JSON array of rationale strings
  source TEXT NOT NULL,
  confidence REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved BOOLEAN DEFAULT FALSE
);

-- Attempts table
CREATE TABLE attempts (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  selected TEXT NOT NULL,     -- A, B, C, or D
  correct BOOLEAN NOT NULL,
  user_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions (id)
);
```

## 🚀 API Endpoints

### Generate Questions
```http
POST /mcq/generate
Content-Type: application/json

{
  "topic": "Nutrition for Teens",
  "difficulty": "medium",
  "count": 5,
  "context": "Focus on balanced diet and healthy eating habits"
}
```

### Get Next Question
```http
GET /mcq/next?topic=Nutrition&difficulty=medium
```

### Submit Answer
```http
POST /mcq/attempt
Content-Type: application/json

{
  "question_id": "uuid-string",
  "selected": "B",
  "user_id": "user123"
}
```

### Get Analytics
```http
GET /mcq/analytics?topic=Nutrition
```

## 📊 Data Models

### MCQItem
```typescript
interface MCQItem {
  id: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: MCQOption[];
  explanation: string;
  distractor_rationale: string[];
  source: 'FROM_CONTEXT' | 'GENERATED';
  estimated_confidence: number;
}
```

### MCQOption
```typescript
interface MCQOption {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
  is_correct: boolean;
}
```

## 🎯 Usage Examples

### Backend Usage
```python
from mcq import MCQService, GenerateRequest, Difficulty

# Initialize service
mcq_service = MCQService(gemini_service)

# Generate questions
request = GenerateRequest(
    topic="Mental Health",
    difficulty=Difficulty.MEDIUM,
    count=3
)
questions = await mcq_service.generate_mcqs(request)

# Get next question
question = mcq_service.get_next_question("Mental Health", Difficulty.MEDIUM)

# Submit answer
result = mcq_service.submit_answer("question-id", "B", "user123")
```

### Frontend Usage
```typescript
import { apiService } from '@/lib/api';

// Generate questions
const response = await apiService.generateMCQs({
  topic: "Fitness for Teens",
  difficulty: "easy",
  count: 5
});

// Get next question
const question = await apiService.getNextQuestion("Fitness", "easy");

// Submit answer
const result = await apiService.submitAnswer({
  question_id: question.id,
  selected: "A",
  user_id: "user123"
});
```

## 🔧 Setup and Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- Gemini API key

### Backend Setup
1. Install dependencies (already in requirements.txt):
   ```bash
   pip install fastapi uvicorn pydantic sqlite3
   ```

2. The MCQ module is already integrated with the existing backend

### Frontend Setup
1. MCQ components are already integrated into the existing React app
2. No additional dependencies required

### Configuration
Set your Gemini API key in the environment:
```bash
GEMINI_API_KEY=your_api_key_here
```

## 🧪 Testing

Run the validation script to test all functionality:
```bash
python test_mcq.py
```

This will test:
- MCQ generation with Gemini API
- Database operations
- Answer validation
- Analytics generation
- Backend integration
- Frontend file presence

## 📈 Analytics and Metrics

The dashboard displays:
- **Total Quiz Questions**: Number of questions generated
- **Quiz Attempts**: Number of answers submitted
- **Success Rate**: Percentage of correct answers
- **Performance by Topic**: Breakdown by subject area
- **Difficulty Analysis**: Performance across difficulty levels

## 🛡️ Safety and Content Filtering

- All generated content passes through the existing content filter
- Questions are validated for appropriateness for teen audience
- Duplicate questions are automatically prevented
- Each question includes confidence scoring from the AI

## 🔮 Future Enhancements

- **Embeddings-based Deduplication**: Use semantic similarity to prevent duplicate questions
- **Adaptive Difficulty**: Adjust question difficulty based on user performance
- **Streak Tracking**: Track consecutive correct answers
- **Topic Recommendations**: Suggest topics based on chat history
- **Multiplayer Quizzes**: Share quizzes with friends
- **Question Rating**: Allow users to rate question quality

## 🤝 Integration with Existing Chatbot

The MCQ module seamlessly integrates with the existing teen health chatbot:

1. **Shared UI**: Same interface with mode toggle
2. **Consistent Styling**: Matches existing design system
3. **Content Filter**: Uses same safety mechanisms
4. **User Storage**: Shares user ID and storage systems
5. **Topic Continuity**: Can generate quizzes based on chat topics

## 📝 API Response Examples

### Generate Response
```json
{
  "items": [
    {
      "id": "uuid-123",
      "topic": "Nutrition",
      "difficulty": "medium",
      "question": "Which nutrient is essential for bone health?",
      "options": [
        {"label": "A", "text": "Vitamin C", "is_correct": false},
        {"label": "B", "text": "Calcium", "is_correct": true},
        {"label": "C", "text": "Iron", "is_correct": false},
        {"label": "D", "text": "Protein", "is_correct": false}
      ],
      "explanation": "Calcium is crucial for building and maintaining strong bones.",
      "distractor_rationale": [
        "Vitamin C helps immunity, not bones",
        "Calcium builds bones",
        "Iron helps blood, not bones",
        "Protein builds muscle, not bones"
      ],
      "source": "GENERATED",
      "estimated_confidence": 0.85
    }
  ]
}
```

### Attempt Response
```json
{
  "correct": true,
  "explanation": "Calcium is crucial for building and maintaining strong bones.",
  "correct_label": "B",
  "question_id": "uuid-123"
}
```

## 🎉 Getting Started

1. **Start the Backend**:
   ```bash
   python main.py
   ```

2. **Start the Frontend**:
   ```bash
   cd frontend && npm run dev
   ```

3. **Access the Application**:
   - Open http://localhost:3000
   - Navigate to the Chat page
   - Click the "Quiz" tab
   - Enter a topic and start learning!

The MCQ module is now fully integrated and ready to enhance your health education experience! 🌟