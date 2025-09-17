import google.generativeai as genai
import os
from typing import Optional, Dict, List
import time
import re
from dotenv import load_dotenv

load_dotenv()

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

        genai.configure(api_key=api_key)

        # Configure the model with safety settings for teens
        self.generation_config = genai.GenerationConfig(
            temperature=0.7,
            top_p=0.8,
            top_k=40,
            max_output_tokens=1024,
        )

        self.safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]

        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config=self.generation_config,
            safety_settings=self.safety_settings
        )

        # Define teen health topics
        self.health_topics = {
            'nutrition': ['food', 'eating', 'diet', 'healthy eating', 'vitamins', 'calories', 'balanced diet', 'eat healthier', 'nutrition'],
            'sanitation': ['clean', 'hygiene', 'wash', 'bath', 'cleanliness', 'personal care'],
            'health': ['doctor', 'medical', 'wellness', 'body', 'health check', 'sick', 'illness'],
            'substance_abuse': ['drugs', 'alcohol', 'smoking', 'addiction', 'peer pressure', 'saying no', 'smoke', 'drink'],
            'healthy_lifestyle': ['exercise', 'fitness', 'sports', 'active', 'lifestyle', 'habits'],
            'reproductive_health': ['puberty', 'changes', 'body changes', 'periods', 'relationships'],
            'hiv_prevention': ['safe', 'protection', 'std', 'safe sex', 'condoms', 'testing'],
            'injuries_violence': ['safety', 'bullying', 'fight', 'accident', 'emergency', 'first aid'],
            'growing_healthy': ['growth', 'development', 'teen years', 'adolescence', 'maturing']
        }

        # Conversation context storage
        self.conversation_context = {}

    def identify_topic(self, message: str) -> Optional[str]:
        """Identify the health topic from the user's message"""
        message_lower = message.lower()

        for topic, keywords in self.health_topics.items():
            for keyword in keywords:
                if keyword in message_lower:
                    return topic

        return None

    def get_topic_prompt(self, topic: str, message: str) -> str:
        """Get specialized prompt for each health topic"""
        base_prompt = """
You are a friendly, knowledgeable health educator chatbot designed specifically for teenagers.
Your goal is to provide accurate, age-appropriate health information that helps teens make informed decisions about their well-being.

IMPORTANT GUIDELINES:
- Always be supportive, non-judgmental, and encouraging
- Use simple, clear language that teens can understand
- Provide factual information based on reliable health guidelines
- Encourage positive health behaviors and seeking help when needed
- Respect privacy and confidentiality
- If a topic is sensitive, suggest talking to a trusted adult or healthcare professional
- Focus on empowerment and building healthy habits

"""

        topic_prompts = {
            'nutrition': """
HEALTH TOPIC: Nutrition and Healthy Eating

Key points to cover:
- Importance of balanced meals with fruits, vegetables, proteins, and whole grains
- Understanding portion sizes and calorie needs for growing teens
- Making healthy food choices and reading nutrition labels
- Dealing with food cravings and emotional eating
- Staying hydrated and the role of water in health
- Cultural considerations in healthy eating

Encourage teens to:
- Try new healthy foods
- Involve family in meal planning
- Listen to their body's hunger cues
- Balance treats with nutritious foods
""",

            'sanitation': """
HEALTH TOPIC: Personal Hygiene and Sanitation

Key points to cover:
- Daily hygiene routines for cleanliness and health
- Importance of handwashing and personal care
- Dental hygiene and oral health
- Body odor management during puberty
- Laundry and clothing care
- Environmental cleanliness and its impact on health

Encourage teens to:
- Develop good hygiene habits
- Take care of personal belongings
- Maintain a clean living environment
- Feel confident in their personal care routine
""",

            'health': """
HEALTH TOPIC: General Health and Wellness

Key points to cover:
- Understanding normal body changes during adolescence
- Importance of regular health check-ups
- Recognizing when to seek medical help
- Mental health and emotional well-being
- Sleep hygiene and rest needs
- Building healthy relationships with healthcare providers

Encourage teens to:
- Pay attention to their body's signals
- Ask questions about their health
- Take responsibility for their well-being
- Seek help when feeling unwell
""",

            'substance_abuse': """
HEALTH TOPIC: Substance Abuse Prevention

Key points to cover:
- Understanding peer pressure and making independent decisions
- Facts about alcohol, tobacco, and other substances
- Short-term and long-term effects on health and brain development
- Building refusal skills and confidence
- Healthy ways to cope with stress and emotions
- Resources for help if needed

Encourage teens to:
- Trust their instincts about what's right for them
- Build strong support networks
- Develop healthy coping strategies
- Seek help if they're concerned about substance use
""",

            'healthy_lifestyle': """
HEALTH TOPIC: Healthy Lifestyle and Physical Fitness

Key points to cover:
- Benefits of regular physical activity for body and mind
- Finding enjoyable forms of exercise
- Setting realistic fitness goals
- Balancing screen time with physical activity
- Importance of rest and recovery
- Building sustainable healthy habits

Encourage teens to:
- Find physical activities they enjoy
- Set small, achievable goals
- Include movement in daily routines
- Listen to their body's needs for rest
""",

            'reproductive_health': """
HEALTH TOPIC: Reproductive Health and Puberty

Key points to cover:
- Normal physical and emotional changes during puberty
- Understanding reproductive anatomy and function
- Menstrual health and hygiene
- Emotional aspects of puberty changes
- Healthy relationships and boundaries
- When to seek advice about reproductive health

Encourage teens to:
- Understand their changing bodies
- Ask questions about normal development
- Practice self-care during changes
- Talk to trusted adults about concerns
""",

            'hiv_prevention': """
HEALTH TOPIC: HIV Prevention and Sexual Health

Key points to cover:
- Understanding HIV/AIDS and transmission
- Importance of testing and early detection
- Safe practices and protection methods
- Making informed decisions about sexual health
- Resources for confidential testing and counseling
- Supporting friends and peers

Encourage teens to:
- Make informed choices about their health
- Get tested if sexually active
- Use protection consistently
- Talk openly about sexual health
""",

            'injuries_violence': """
HEALTH TOPIC: Injury Prevention and Violence Awareness

Key points to cover:
- Recognizing and avoiding dangerous situations
- Dealing with bullying and peer pressure
- Safe practices in sports and physical activities
- Emergency response and first aid basics
- Building healthy conflict resolution skills
- Resources for help with violence or abuse

Encourage teens to:
- Trust their instincts about safety
- Speak up about unsafe situations
- Learn basic first aid skills
- Build supportive relationships
""",

            'growing_healthy': """
HEALTH TOPIC: Healthy Growth and Development

Key points to cover:
- Physical, emotional, and social development in teens
- Setting healthy boundaries and building self-esteem
- Managing stress and building resilience
- Developing healthy relationships
- Planning for the future and setting goals
- Understanding and accepting individual growth patterns

Encourage teens to:
- Embrace their unique development journey
- Build confidence and self-worth
- Develop healthy coping skills
- Seek support when facing challenges
"""
        }

        topic_specific = topic_prompts.get(topic, "")

        return f"""{base_prompt}{topic_specific}

User's question: {message}

Please provide a helpful, accurate, and age-appropriate response that addresses their specific question while incorporating relevant health education information. If this seems like a follow-up question, build upon previous context if available.

Response should be:
- Direct and relevant to their question
- Educational but not overwhelming
- Encouraging and supportive
- Include practical advice when appropriate
- Suggest professional help for complex medical issues
"""

    async def generate_response(self, message: str, user_id: Optional[str] = None, context: Optional[Dict] = None) -> str:
        """
        Generate a response using Gemini API with teen health-focused context
        """
        try:
            # Identify the health topic
            topic = self.identify_topic(message)

            # Get conversation context if available
            conversation_history = ""
            if user_id and user_id in self.conversation_context:
                recent_messages = self.conversation_context[user_id][-3:]  # Last 3 exchanges
                conversation_history = "\nRecent conversation:\n" + "\n".join([
                    f"User: {msg['user']}\nAssistant: {msg['assistant']}"
                    for msg in recent_messages
                ])

            # Craft the appropriate prompt
            if topic:
                prompt = self.get_topic_prompt(topic, message)
                if conversation_history:
                    prompt += f"\n\n{conversation_history}"
            else:
                # General health-focused prompt
                prompt = f"""
You are a friendly health educator chatbot for teenagers. Focus on promoting healthy habits, providing accurate information, and encouraging positive lifestyle choices.

User message: {message}
{conversation_history}

Provide a helpful, age-appropriate response that promotes health and wellness.
"""

            start_time = time.time()
            response = self.model.generate_content(prompt)
            processing_time = time.time() - start_time

            if response.text:
                final_response = response.text.strip()

                # Store conversation context
                if user_id:
                    if user_id not in self.conversation_context:
                        self.conversation_context[user_id] = []

                    self.conversation_context[user_id].append({
                        'user': message,
                        'assistant': final_response,
                        'timestamp': time.time(),
                        'topic': topic
                    })

                    # Keep only last 10 exchanges
                    if len(self.conversation_context[user_id]) > 10:
                        self.conversation_context[user_id] = self.conversation_context[user_id][-10:]

                return final_response
            else:
                return "I'm sorry, I couldn't generate a response. Please try rephrasing your question."

        except Exception as e:
            print(f"Gemini API error: {e}")
            return "I'm experiencing technical difficulties. Please try again later."

    def get_follow_up_questions(self, topic: str) -> List[str]:
        """Get suggested follow-up questions for a topic"""
        follow_ups = {
            'nutrition': [
                "What are some healthy snacks I can eat between meals?",
                "How can I talk to my parents about eating healthier?",
                "What should I do if I'm worried about my weight?"
            ],
            'sanitation': [
                "How often should I shower or bathe?",
                "What should I do if I have acne or skin problems?",
                "How can I keep my room clean and organized?"
            ],
            'health': [
                "When should I see a doctor?",
                "How can I deal with feeling stressed or anxious?",
                "What are some ways to get better sleep?"
            ],
            'substance_abuse': [
                "How can I say no to peer pressure?",
                "What are the effects of vaping?",
                "Where can I get help if I need it?"
            ],
            'healthy_lifestyle': [
                "What are some fun ways to exercise?",
                "How much screen time is too much?",
                "How can I make exercise a habit?"
            ],
            'reproductive_health': [
                "Is it normal to feel this way about my changing body?",
                "How can I talk to my parents about puberty?",
                "What should I know about relationships?"
            ],
            'hiv_prevention': [
                "Where can I get tested?",
                "How do I talk to my partner about protection?",
                "What are the different types of protection?"
            ],
            'injuries_violence': [
                "What should I do if I'm being bullied?",
                "How can I stay safe online?",
                "What are some ways to resolve conflicts peacefully?"
            ],
            'growing_healthy': [
                "How can I build my confidence?",
                "What should I do if I feel overwhelmed?",
                "How can I set goals for my future?"
            ]
        }

        return follow_ups.get(topic, [])
        """
        Generate a response using Gemini API with teen-appropriate context
        """
        try:
            # Add context for teen-appropriate responses
            prompt = f"""
You are a helpful and safe chatbot designed for teenagers. Your responses should be:
- Age-appropriate and educational
- Positive and encouraging
- Respectful and inclusive
- Free from harmful content
- Helpful for learning and personal growth

User message: {message}

Please provide a helpful, appropriate response:
"""

            start_time = time.time()
            response = self.model.generate_content(prompt)
            processing_time = time.time() - start_time

            if response.text:
                return response.text.strip()
            else:
                return "I'm sorry, I couldn't generate a response. Please try rephrasing your question."

        except Exception as e:
            print(f"Gemini API error: {e}")
            return "I'm experiencing technical difficulties. Please try again later."