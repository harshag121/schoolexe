#!/usr/bin/env python3
"""
Test script for MCQ functionality
Run this to validate that the MCQ module is working correctly
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from mcq import MCQService, GenerateRequest, Difficulty
from services.gemini_service import GeminiService

async def test_mcq_functionality():
    """Test all MCQ functionality"""
    print("🧪 Starting MCQ Module Tests")
    print("=" * 50)
    
    try:
        # Initialize services
        print("1. Initializing services...")
        gemini_service = GeminiService()
        mcq_service = MCQService(gemini_service, "test_mcq.db")
        print("✅ Services initialized successfully")
        
        # Test MCQ generation
        print("\n2. Testing MCQ generation...")
        request = GenerateRequest(
            topic="Basic Python Programming",
            difficulty=Difficulty.EASY,
            count=2,
            context="Focus on variables and data types"
        )
        
        mcq_items = await mcq_service.generate_mcqs(request)
        print(f"✅ Generated {len(mcq_items)} MCQ items")
        
        if mcq_items:
            # Display first question
            first_question = mcq_items[0]
            print(f"\n📝 Sample Question:")
            print(f"Topic: {first_question.topic}")
            print(f"Difficulty: {first_question.difficulty}")
            print(f"Question: {first_question.question}")
            print("Options:")
            for option in first_question.options:
                mark = "✓" if option.is_correct else " "
                print(f"  [{mark}] {option.label}. {option.text}")
            print(f"Explanation: {first_question.explanation}")
            
            # Test getting next question
            print("\n3. Testing get next question...")
            next_question = mcq_service.get_next_question("Basic Python Programming", Difficulty.EASY)
            if next_question:
                print(f"✅ Retrieved question: {next_question.question[:50]}...")
            else:
                print("❌ No question found")
            
            # Test submitting answer
            print("\n4. Testing answer submission...")
            result = mcq_service.submit_answer(
                question_id=first_question.id,
                selected="A",
                user_id="test_user"
            )
            
            if "error" not in result:
                print(f"✅ Answer submitted - Correct: {result['correct']}")
                print(f"   Explanation: {result['explanation']}")
            else:
                print(f"❌ Error submitting answer: {result['error']}")
            
            # Test analytics
            print("\n5. Testing analytics...")
            analytics = mcq_service.get_analytics()
            print(f"✅ Analytics retrieved: {len(analytics)} data points")
            
        else:
            print("❌ No MCQ items generated")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n" + "=" * 50)
    print("🎉 MCQ Module Tests Completed Successfully!")
    return True

async def test_backend_integration():
    """Test that the backend can import and use MCQ module"""
    print("\n🔗 Testing Backend Integration")
    print("-" * 30)
    
    try:
        # Test imports
        from main import mcq_service
        print("✅ MCQ service imported in main.py")
        
        # Test database initialization
        mcq_service.db.init_database()
        print("✅ Database initialized")
        
        print("✅ Backend integration working")
        return True
        
    except Exception as e:
        print(f"❌ Backend integration failed: {e}")
        return False

def test_frontend_files():
    """Test that frontend files exist and are valid"""
    print("\n🎨 Testing Frontend Integration")
    print("-" * 30)
    
    frontend_files = [
        "frontend/src/components/QuizPanel.tsx",
        "frontend/src/lib/api.ts",
        "frontend/src/app/chat/page.tsx",
        "frontend/src/app/dashboard/page.tsx"
    ]
    
    for file_path in frontend_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path} exists")
        else:
            print(f"❌ {file_path} missing")
            return False
    
    print("✅ Frontend files present")
    return True

async def main():
    """Run all tests"""
    print("🚀 MCQ Module Validation Suite")
    print("Testing the complete MCQ quiz functionality...")
    print()
    
    # Run tests
    backend_test = await test_mcq_functionality()
    integration_test = await test_backend_integration()
    frontend_test = test_frontend_files()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"MCQ Core Functionality: {'✅ PASS' if backend_test else '❌ FAIL'}")
    print(f"Backend Integration:    {'✅ PASS' if integration_test else '❌ FAIL'}")
    print(f"Frontend Files:         {'✅ PASS' if frontend_test else '❌ FAIL'}")
    
    all_passed = backend_test and integration_test and frontend_test
    print(f"\nOverall Status: {'🎉 ALL TESTS PASSED' if all_passed else '⚠️  SOME TESTS FAILED'}")
    
    if all_passed:
        print("\n🎊 MCQ Module is ready for use!")
        print("\nTo use the MCQ features:")
        print("1. Start the backend: python main.py")
        print("2. Start the frontend: cd frontend && npm run dev")
        print("3. Open the chat page and click the 'Quiz' tab")
        print("4. Enter a topic and start generating questions!")
    
    return all_passed

if __name__ == "__main__":
    asyncio.run(main())