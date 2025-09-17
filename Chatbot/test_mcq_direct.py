#!/usr/bin/env python3
"""
Direct test of MCQ functionality without running the full server
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(__file__))

from services.gemini_service import GeminiService
from mcq.service import MCQService
from mcq.models import GenerateRequest, Difficulty
from utils.logger import logger

async def test_mcq_direct():
    """Test MCQ generation directly"""
    
    print("🧪 Direct MCQ Module Test")
    print("=" * 40)
    
    try:
        # Initialize services
        print("1. Initializing services...")
        gemini_service = GeminiService()
        mcq_service = MCQService(gemini_service, "test_mcq_direct.db")
        print("✅ Services initialized")
        
        # Test MCQ generation
        print("\n2. Testing MCQ generation...")
        request = GenerateRequest(
            topic="Healthy Sleep Habits",
            difficulty=Difficulty.EASY,
            count=1,
            context="Focus on teenagers and good sleep hygiene"
        )
        
        print(f"   Generating MCQ for: {request.topic}")
        mcqs = await mcq_service.generate_mcqs(request)
        
        if mcqs:
            print(f"✅ Generated {len(mcqs)} MCQs successfully!")
            
            # Display the generated MCQ
            mcq = mcqs[0]
            print(f"\n📝 Generated MCQ:")
            print(f"   ID: {mcq.id}")
            print(f"   Topic: {mcq.topic}")
            print(f"   Difficulty: {mcq.difficulty}")
            print(f"   Question: {mcq.question}")
            print(f"   Options:")
            for option in mcq.options:
                marker = "✅" if option.is_correct else "  "
                print(f"     {marker} {option.label}: {option.text}")
            print(f"   Explanation: {mcq.explanation}")
            
            # Test getting next question
            print(f"\n3. Testing get next question...")
            next_question = mcq_service.get_next_question()
            if next_question:
                print(f"✅ Retrieved question: {next_question.id}")
            else:
                print("❌ No questions available")
            
            # Test submitting answer
            print(f"\n4. Testing answer submission...")
            correct_answer = mcq.get_correct_label()
            result = mcq_service.submit_answer(mcq.id, correct_answer, "test_user")
            
            if result.get("correct"):
                print(f"✅ Correct answer submission worked")
            else:
                print(f"❌ Answer submission failed: {result}")
            
            # Test analytics
            print(f"\n5. Testing analytics...")
            analytics = mcq_service.get_analytics()
            print(f"✅ Analytics: {analytics}")
            
        else:
            print("❌ No MCQs generated")
            
            # Let's debug what went wrong
            print("\n🔍 Debugging Gemini response...")
            prompt = mcq_service.build_mcq_prompt(request.topic, request.difficulty, request.count, request.context)
            print(f"   Prompt length: {len(prompt)}")
            
            # Test a simple Gemini call
            try:
                simple_response = await gemini_service.generate_response("What is good sleep for teens?")
                print(f"   Simple Gemini test: {len(simple_response)} chars")
                print(f"   Response preview: {simple_response[:100]}...")
            except Exception as e:
                print(f"   Gemini test failed: {e}")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_mcq_direct())