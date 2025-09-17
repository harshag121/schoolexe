from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import time
from dotenv import load_dotenv

# Optional imports for rate limiting
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    from slowapi.middleware import SlowAPIMiddleware
    SLOWAPI_AVAILABLE = True
except ImportError:
    SLOWAPI_AVAILABLE = False

# Load environment variables
load_dotenv()

# Import our modules
from services.gemini_service import GeminiService
from services.content_filter import ContentFilter
from models.chat_models import ChatRequest, ChatResponse, FollowUpRequest, FollowUpResponse
from utils.cache import CacheManager
from utils.logger import logger

# Import MCQ module
from mcq import MCQService, GenerateRequest, GenerateResponse, AttemptRequest, AttemptResponse, Difficulty

app = FastAPI(
    title="Teen Chatbot API",
    description="A safe chatbot for teens with content restrictions",
    version="1.0.0"
)

# Rate limiting setup (if available)
if SLOWAPI_AVAILABLE:
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter

    async def _rate_limit_handler(request: Request, exc: RateLimitExceeded):
        return _rate_limit_exceeded_handler(request, exc)

    app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)
    app.add_middleware(SlowAPIMiddleware)
else:
    limiter = None

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
try:
    gemini_service = GeminiService()
    content_filter = ContentFilter()
    cache_manager = CacheManager()
    mcq_service = MCQService(gemini_service)
    logger.info("All services initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize services: {e}")
    raise

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware to log all requests"""
    start_time = time.time()

    client_host = request.client.host if request.client else "unknown"
    logger.info(f"Request: {request.method} {request.url} from {client_host}")

    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(f"Response: {response.status_code} in {process_time:.3f}s")
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Request failed after {process_time:.3f}s: {e}")
        raise

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Teen Chatbot API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint with detailed status"""
    try:
        # Check cache status
        cache_stats = await cache_manager.get_cache_stats()

        return {
            "status": "healthy",
            "timestamp": time.time(),
            "services": {
                "gemini": "available",
                "content_filter": "available",
                "cache": cache_stats
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, req: Request):
    """
    Main chat endpoint with content filtering and restrictions
    """
    start_time = time.time()
    user_ip = req.client.host if req.client else "unknown"

    logger.info(f"Chat request from {user_ip}: {request.message[:100]}...")

    try:
        # Validate input
        if not request.message or len(request.message.strip()) == 0:
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        if len(request.message) > 1000:
            raise HTTPException(status_code=400, detail="Message too long (max 1000 characters)")

        # Check for inappropriate content in user input
        if not content_filter.is_safe_content(request.message):
            logger.warning(f"Inappropriate content detected from {user_ip}: {request.message[:50]}...")
            raise HTTPException(
                status_code=400,
                detail="Your message contains inappropriate content. Please keep conversations appropriate."
            )

        # Check cache first
        cached_response = await cache_manager.get_cached_response(request.message)
        if cached_response:
            processing_time = time.time() - start_time
            logger.info(f"Cache hit for request from {user_ip}, response time: {processing_time:.3f}s")
            return ChatResponse(
                response=cached_response,
                is_safe=True,
                filtered=False,
                processing_time=processing_time
            )

        # Get response from Gemini
        logger.info(f"Generating response for {user_ip}")
        raw_response = await gemini_service.generate_response(
            request.message,
            user_id=request.user_id,
            context={"session_id": request.session_id}
        )

        # Detect topic and get follow-up questions
        detected_topic = gemini_service.identify_topic(request.message)
        follow_up_questions = []
        if detected_topic:
            follow_up_questions = gemini_service.get_follow_up_questions(detected_topic)[:3]  # Limit to 3

        # Filter the response for teen safety
        filtered_response, was_filtered = content_filter.filter_response(raw_response)

        if was_filtered:
            logger.info(f"Response filtered for safety from {user_ip}")

        # Cache the response
        await cache_manager.cache_response(request.message, filtered_response)

        processing_time = time.time() - start_time
        logger.info(f"Response generated for {user_ip} in {processing_time:.3f}s")

        return ChatResponse(
            response=filtered_response,
            is_safe=True,
            filtered=was_filtered,
            processing_time=processing_time,
            topic=detected_topic,
            follow_up_questions=follow_up_questions
        )

    except HTTPException:
        raise
    except Exception as e:
        processing_time = time.time() - start_time
        logger.error(f"Unexpected error for {user_ip} after {processing_time:.3f}s: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/follow-up/{user_id}", response_model=FollowUpResponse)
async def get_follow_up_questions(user_id: str, topic: Optional[str] = None):
    """
    Get suggested follow-up questions for a user based on their conversation history
    """
    try:
        if topic:
            # Get questions for specific topic
            questions = gemini_service.get_follow_up_questions(topic)
        else:
            # Get questions based on recent conversation topics
            if user_id in gemini_service.conversation_context:
                recent_topics = [
                    msg['topic'] for msg in gemini_service.conversation_context[user_id][-5:]
                    if msg['topic']
                ]
                if recent_topics:
                    # Use the most recent topic
                    questions = gemini_service.get_follow_up_questions(recent_topics[-1])
                else:
                    questions = ["What health topic would you like to learn about?",
                               "Do you have questions about nutrition or exercise?",
                               "Would you like advice on staying healthy?"]
            else:
                questions = ["What health topic interests you?",
                           "Do you have questions about growing up healthy?",
                           "Would you like to talk about fitness or nutrition?"]

        return FollowUpResponse(
            questions=questions[:5],  # Limit to 5 questions
            topic=topic or "general"
        )

    except Exception as e:
        logger.error(f"Error getting follow-up questions for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get follow-up questions")

@app.get("/topics")
async def get_available_topics():
    """
    Get list of available health topics
    """
    return {
        "topics": list(gemini_service.health_topics.keys()),
        "descriptions": {
            "nutrition": "Healthy eating, balanced diet, and nutrition",
            "sanitation": "Personal hygiene and cleanliness",
            "health": "General health and wellness",
            "substance_abuse": "Drug and alcohol prevention",
            "healthy_lifestyle": "Fitness, exercise, and healthy habits",
            "reproductive_health": "Puberty and body changes",
            "hiv_prevention": "Sexual health and protection",
            "injuries_violence": "Safety and conflict resolution",
            "growing_healthy": "Healthy growth and development"
        }
    }

# MCQ Quiz Endpoints
@app.post("/mcq/generate", response_model=GenerateResponse)
async def generate_mcqs(request: GenerateRequest):
    """Generate MCQ questions for a given topic and difficulty"""
    if SLOWAPI_AVAILABLE and limiter:
        limiter.limit("10/minute")(generate_mcqs)
    
    try:
        logger.info(f"Generating MCQs: topic={request.topic}, difficulty={request.difficulty}, count={request.count}")
        
        # Validate input
        if not request.topic.strip():
            raise HTTPException(status_code=400, detail="Topic cannot be empty")
        
        # Content filter check
        content_to_check = request.topic + " " + (request.context or "")
        if not content_filter.is_safe_content(content_to_check):
            logger.warning(f"MCQ topic blocked by content filter: {request.topic}")
            raise HTTPException(status_code=400, detail="Topic contains inappropriate content")
        
        # Generate MCQs
        mcq_items = await mcq_service.generate_mcqs(request)
        
        if not mcq_items:
            raise HTTPException(status_code=500, detail="Failed to generate valid MCQs")
        
        return GenerateResponse(items=mcq_items)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in MCQ generation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/mcq/next")
async def get_next_question(topic: Optional[str] = None, difficulty: Optional[str] = None):
    """Get the next MCQ question for quiz"""
    try:
        # Validate difficulty if provided
        diff_enum = None
        if difficulty:
            try:
                diff_enum = Difficulty(difficulty.lower())
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid difficulty. Use: easy, medium, hard")
        
        question = mcq_service.get_next_question(topic=topic, difficulty=diff_enum)
        
        if not question:
            raise HTTPException(status_code=404, detail="No questions found for the specified criteria")
        
        return question
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting next question: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/mcq/attempt", response_model=AttemptResponse)
async def submit_attempt(request: AttemptRequest):
    """Submit an answer attempt and get feedback"""
    try:
        logger.info(f"MCQ attempt: question_id={request.question_id}, selected={request.selected}")
        
        result = mcq_service.submit_answer(
            question_id=request.question_id,
            selected=request.selected,
            user_id=request.user_id
        )
        
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return AttemptResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting MCQ attempt: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/mcq/analytics")
async def get_mcq_analytics(topic: Optional[str] = None):
    """Get MCQ analytics and statistics"""
    try:
        analytics = mcq_service.get_analytics(topic=topic)
        return analytics
        
    except Exception as e:
        logger.error(f"Error getting MCQ analytics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/admin/clear-cache")
async def clear_cache():
    """Admin endpoint to clear cache"""
    try:
        await cache_manager.clear_cache()
        logger.info("Cache cleared by admin")
        return {"message": "Cache cleared successfully"}
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear cache")

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))

    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )