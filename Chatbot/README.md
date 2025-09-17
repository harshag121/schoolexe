# Teen Health Chatbot API

A safe and fast chatbot API designed specifically for teenagers, built with FastAPI and Google's Gemini AI. Focuses on 9 key health and wellness topics to provide age-appropriate education and support.

## 🎯 Health Topics Covered

1. **Nutrition** - Healthy eating, balanced diet, portion control
2. **Sanitation** - Personal hygiene and cleanliness
3. **Health** - General wellness and medical care
4. **Substance Abuse Prevention** - Drug/alcohol awareness and refusal skills
5. **Healthy Lifestyle + Physical Fitness** - Exercise, fitness, and healthy habits
6. **Reproductive Health & HIV Prevention** - Puberty, sexual health, and protection
7. **Injuries & Violence** - Safety, bullying prevention, and conflict resolution
8. **Growing Up Healthy** - Healthy development and self-confidence

## ✨ Key Features

- 🚀 **FastAPI Backend**: High-performance async API
- 🤖 **Gemini AI Integration**: Latest Google AI model with teen-safe configurations
- 🛡️ **Content Filtering**: Built-in restrictions for teen-appropriate content
- 🧠 **Smart Topic Detection**: Automatically identifies health topics from user questions
- 💬 **Q&A Chat Features**: Follow-up questions and conversation context
- ⚡ **Caching**: Redis-backed caching for fast responses
- � **Conversation Memory**: Tracks user conversations for better responses
- �🔒 **Safety First**: Multiple layers of content filtering and safety checks
- � **Comprehensive Logging**: Request tracking and error monitoring

## Quick Start

1. **Clone and setup:**
   ```bash
   cd teen-chatbot
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

3. **Run the server:**
   ```bash
   python main.py
   ```

4. **Test the API:**
   ```bash
   curl -X POST "http://localhost:8000/chat" \
        -H "Content-Type: application/json" \
        -d '{"message": "Hello, how are you?"}'
   ```

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `POST /chat` - Main chat endpoint

### Chat Request Format
```json
{
  "message": "Your message here",
  "user_id": "optional_user_id",
  "session_id": "optional_session_id",
  "age_group": "teen"
}
```

### Chat Response Format
```json
{
  "response": "AI response here",
  "is_safe": true,
  "filtered": false,
  "processing_time": 0.123
}
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FastAPI       │    │  Content Filter │    │   Gemini AI     │
│   Backend       │───▶│   Service       │───▶│   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Caching       │    │   Safety        │    │   Response      │
│   Layer         │    │   Checks        │    │   Generation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Safety Features

- **Input Filtering**: Checks user messages for inappropriate content
- **Response Filtering**: Filters AI responses for teen safety
- **Gemini Safety Settings**: Built-in AI safety configurations
- **Pattern Matching**: Regex-based content detection
- **Fallback Responses**: Safe alternatives for filtered content

## Performance Optimizations

- **Async Processing**: Non-blocking I/O operations
- **Response Caching**: Redis-backed cache for repeated queries
- **Connection Pooling**: Efficient API connections
- **Memory Management**: Optimized memory usage

## Deployment

### Docker Deployment
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production Deployment
```bash
# Using gunicorn for production
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## Configuration

Environment variables:
- `GEMINI_API_KEY`: Your Google Gemini API key (required)
- `REDIS_URL`: Redis connection URL (optional)
- `CACHE_TTL`: Cache time-to-live in seconds (default: 3600)
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)

## Development

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run tests
pytest

# Run with auto-reload
uvicorn main:app --reload
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details