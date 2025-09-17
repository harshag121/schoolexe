#!/usr/bin/env python3
"""
Demo script for Teen Health Chatbot
Shows how to interact with the enhanced chatbot API
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def demo_chat():
    """Demonstrate the enhanced chatbot features"""
    print("🏥 Teen Health Chatbot Demo")
    print("=" * 50)

    # Test different health topics
    test_messages = [
        "I'm worried about my diet and want to eat healthier",
        "How often should I shower?",
        "My friends are pressuring me to try alcohol",
        "I want to start exercising but don't know how",
        "I'm going through puberty and feel confused",
        "Someone is bullying me at school"
    ]

    user_id = "demo_user"

    for i, message in enumerate(test_messages, 1):
        print(f"\n🗣️  Test {i}: {message}")
        print("-" * 40)

        # Send chat request
        payload = {
            "message": message,
            "user_id": user_id,
            "session_id": f"demo_session_{i}"
        }

        try:
            response = requests.post(f"{BASE_URL}/chat", json=payload)
            response.raise_for_status()
            data = response.json()

            print("🤖 Bot Response:")
            print(f"   {data['response'][:200]}...")

            if data.get('topic'):
                print(f"📋 Detected Topic: {data['topic']}")

            if data.get('follow_up_questions'):
                print("❓ Follow-up Questions:")
                for j, question in enumerate(data['follow_up_questions'][:2], 1):
                    print(f"   {j}. {question}")

            print(".3f")
        except requests.exceptions.RequestException as e:
            print(f"❌ Error: {e}")

        time.sleep(1)  # Brief pause between requests

    print("\n" + "=" * 50)
    print("🎯 Demo completed! The chatbot can handle various health topics.")

def demo_follow_up():
    """Demonstrate follow-up questions feature"""
    print("\n📋 Follow-up Questions Demo")
    print("-" * 30)

    try:
        # Get follow-up questions for nutrition topic
        response = requests.get(f"{BASE_URL}/follow-up/demo_user?topic=nutrition")
        response.raise_for_status()
        data = response.json()

        print("🍎 Nutrition Follow-up Questions:")
        for i, question in enumerate(data['questions'], 1):
            print(f"   {i}. {question}")

    except requests.exceptions.RequestException as e:
        print(f"❌ Error getting follow-up questions: {e}")

def demo_topics():
    """Show available health topics"""
    print("\n📚 Available Health Topics")
    print("-" * 25)

    try:
        response = requests.get(f"{BASE_URL}/topics")
        response.raise_for_status()
        data = response.json()

        print("Health Topics:")
        for topic, description in data['descriptions'].items():
            print(f"   • {topic}: {description}")

    except requests.exceptions.RequestException as e:
        print(f"❌ Error getting topics: {e}")

if __name__ == "__main__":
    print("🚀 Starting Teen Health Chatbot Demo...")
    print("Make sure the server is running: python main.py")
    print("Press Enter to continue...")
    input()

    try:
        demo_topics()
        demo_chat()
        demo_follow_up()

        print("\n🎉 Demo completed successfully!")
        print("\n💡 Try these example interactions:")
        print("   curl -X POST http://localhost:8000/chat \\")
        print("        -H 'Content-Type: application/json' \\")
        print("        -d '{\"message\": \"How can I stay healthy?\", \"user_id\": \"your_id\"}'")

    except KeyboardInterrupt:
        print("\n👋 Demo interrupted by user")
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")