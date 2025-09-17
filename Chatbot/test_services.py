#!/usr/bin/env python3
"""
Enhanced Test script for Teen Health Chatbot
Tests the enhanced features including topic detection, Q&A, and follow-up questions
"""

import asyncio
import json
from services.gemini_service import GeminiService
from services.content_filter import ContentFilter

async def test_health_topics():
    """Test topic detection and responses"""
    print("🧪 Testing Teen Health Chatbot Features\n")

    # Initialize services
    try:
        gemini_service = GeminiService()
        content_filter = ContentFilter()
        print("✅ Services initialized successfully\n")
    except Exception as e:
        print(f"❌ Failed to initialize services: {e}")
        return

    # Test cases for different health topics
    test_cases = [
        {
            "message": "I'm worried about my diet and want to eat healthier",
            "expected_topic": "nutrition"
        },
        {
            "message": "How often should I shower and take care of my hygiene?",
            "expected_topic": "sanitation"
        },
        {
            "message": "What should I do if I feel stressed about school?",
            "expected_topic": "health"
        },
        {
            "message": "My friends are pressuring me to try smoking, what should I do?",
            "expected_topic": "substance_abuse"
        },
        {
            "message": "I want to start exercising but don't know where to begin",
            "expected_topic": "healthy_lifestyle"
        },
        {
            "message": "I'm going through puberty and have questions about body changes",
            "expected_topic": "reproductive_health"
        },
        {
            "message": "How can I protect myself from HIV and STIs?",
            "expected_topic": "hiv_prevention"
        },
        {
            "message": "Someone at school is bullying me, what should I do?",
            "expected_topic": "injuries_violence"
        },
        {
            "message": "How can I grow up healthy and confident?",
            "expected_topic": "growing_healthy"
        }
    ]

    print("🔍 Testing Topic Detection and Responses:\n")

    for i, test_case in enumerate(test_cases, 1):
        print(f"Test {i}: {test_case['message'][:50]}...")

        # Test topic detection
        detected_topic = gemini_service.identify_topic(test_case['message'])
        print(f"  📋 Detected Topic: {detected_topic}")

        # Test response generation
        try:
            response = await gemini_service.generate_response(
                test_case['message'],
                user_id=f"test_user_{i}"
            )
            print("  ✅ Response generated successfully")
            print(f"  📝 Response length: {len(response)} characters")

            # Test content filtering
            is_safe = content_filter.is_safe_content(response)
            print(f"  🛡️  Content safe: {is_safe}")

        except Exception as e:
            print(f"  ❌ Error generating response: {e}")

        # Test follow-up questions
        if detected_topic:
            follow_ups = gemini_service.get_follow_up_questions(detected_topic)
            print(f"  ❓ Follow-up questions: {len(follow_ups)} available")

        print()

    # Test conversation context
    print("🧠 Testing Conversation Context:\n")

    user_id = "test_conversation_user"
    conversation_messages = [
        "I'm worried about eating healthy",
        "What are some good snacks?",
        "How can I talk to my parents about this?"
    ]

    for msg in conversation_messages:
        print(f"User: {msg}")
        response = await gemini_service.generate_response(msg, user_id=user_id)
        print(f"Bot: {response[:100]}...")
        print()

    # Check conversation history
    if user_id in gemini_service.conversation_context:
        history = gemini_service.conversation_context[user_id]
        print(f"📚 Conversation history stored: {len(history)} exchanges")
        for i, exchange in enumerate(history[-3:], 1):  # Show last 3
            print(f"  {i}. Topic: {exchange.get('topic', 'general')}")
    print()

    # Test inappropriate content filtering
    print("🚫 Testing Content Filtering:\n")

    inappropriate_messages = [
        "How do I get drugs?",
        "Tell me about sex",
        "I want to hurt myself"
    ]

    for msg in inappropriate_messages:
        is_safe = content_filter.is_safe_content(msg)
        print(f"Message: '{msg}' -> Safe: {is_safe}")

    print("\n🎉 Testing completed!")

if __name__ == "__main__":
    asyncio.run(test_health_topics())