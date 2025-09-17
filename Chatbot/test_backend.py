#!/usr/bin/env python3
"""
Simple test script to verify the backend is working
"""
import asyncio
import json
import requests
import time
import sys

async def test_backend():
    """Test the backend API endpoints"""
    
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Teen Chatbot Backend API")
    print("=" * 50)
    
    # Wait for server to be ready
    print("⏳ Waiting for server to be ready...")
    for i in range(10):
        try:
            response = requests.get(f"{base_url}/health", timeout=5)
            if response.status_code == 200:
                print("✅ Server is ready!")
                break
        except:
            time.sleep(1)
            print(f"   Attempt {i+1}/10...")
    else:
        print("❌ Server not responding")
        return False
    
    # Test health endpoint
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Test chat endpoint
    print("\n2. Testing chat endpoint...")
    try:
        chat_data = {
            "message": "What is good nutrition for teens?",
            "user_id": "test_user"
        }
        response = requests.post(f"{base_url}/chat", json=chat_data, timeout=30)
        if response.status_code == 200:
            print("✅ Chat endpoint working")
            chat_response = response.json()
            print(f"   Response length: {len(chat_response.get('response', ''))}")
        else:
            print(f"❌ Chat endpoint failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Chat endpoint error: {e}")
    
    # Test MCQ generation endpoint
    print("\n3. Testing MCQ generation...")
    try:
        mcq_data = {
            "topic": "Healthy Eating",
            "difficulty": "easy",
            "count": 1,
            "context": ""
        }
        response = requests.post(f"{base_url}/mcq/generate", json=mcq_data, timeout=60)
        if response.status_code == 200:
            print("✅ MCQ generation working")
            mcq_response = response.json()
            print(f"   Generated {len(mcq_response.get('items', []))} MCQs")
            if mcq_response.get('items'):
                first_mcq = mcq_response['items'][0]
                print(f"   Sample question: {first_mcq.get('question', '')[:50]}...")
        else:
            print(f"❌ MCQ generation failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ MCQ generation error: {e}")
    
    # Test MCQ next question endpoint
    print("\n4. Testing next question endpoint...")
    try:
        response = requests.get(f"{base_url}/mcq/next")
        if response.status_code == 200:
            print("✅ Next question endpoint working")
            question_response = response.json()
            if question_response:
                print(f"   Question available: {question_response.get('question', '')[:50]}...")
            else:
                print("   No questions available in database")
        else:
            print(f"❌ Next question failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Next question error: {e}")
    
    print("\n🎉 Backend testing completed!")
    return True

if __name__ == "__main__":
    asyncio.run(test_backend())