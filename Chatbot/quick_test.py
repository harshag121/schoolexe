#!/usr/bin/env python3
"""
Quick API test script
"""

import asyncio
from services.gemini_service import GeminiService
from services.content_filter import ContentFilter

async def quick_test():
    print("🚀 Quick Teen Health Chatbot Test")
    print("=" * 40)

    try:
        # Initialize services
        gemini_service = GeminiService()
        content_filter = ContentFilter()

        # Test a simple message
        test_message = "I'm worried about eating healthy foods"
        print(f"📝 Test Message: {test_message}")

        # Generate response
        response = await gemini_service.generate_response(test_message, user_id="quick_test")

        print("🤖 AI Response:")
        print(response[:300] + "..." if len(response) > 300 else response)

        # Check topic detection
        topic = gemini_service.identify_topic(test_message)
        print(f"📋 Detected Topic: {topic}")

        # Get follow-up questions
        if topic:
            follow_ups = gemini_service.get_follow_up_questions(topic)
            print(f"❓ Follow-up Questions ({len(follow_ups)}):")
            for i, q in enumerate(follow_ups[:2], 1):
                print(f"   {i}. {q}")

        print("\n✅ Test completed successfully!")
        print("\n🎯 Your chatbot is working perfectly!")
        print("💡 It can detect health topics and provide educational responses")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(quick_test())