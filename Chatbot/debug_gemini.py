#!/usr/bin/env python3
"""
Debug script to see full Gemini response
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(__file__))

from services.gemini_service import GeminiService
from mcq.service import MCQService
from mcq.models import GenerateRequest, Difficulty

async def debug_gemini():
    """Debug what Gemini is returning"""
    
    print("🔍 Debugging Gemini Response")
    print("=" * 40)
    
    try:
        gemini_service = GeminiService()
        mcq_service = MCQService(gemini_service)
        
        # Build the prompt
        prompt = mcq_service.build_mcq_prompt("Sleep", Difficulty.EASY, 1, "")
        print(f"Prompt:\n{prompt}")
        print("\n" + "="*50)
        
        # Get raw response
        print("Getting Gemini response...")
        response = await gemini_service.generate_response(prompt)
        
        print(f"\nFull Response ({len(response)} chars):")
        print("-" * 40)
        print(response)
        print("-" * 40)
        
        # Try extraction
        json_content = mcq_service.extract_json_from_response(response)
        if json_content:
            print(f"\nExtracted JSON ({len(json_content)} chars):")
            print(json_content)
        else:
            print("\n❌ No JSON extracted")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_gemini())