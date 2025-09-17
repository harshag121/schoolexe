import re
from typing import Tuple, List

class ContentFilter:
    def __init__(self):
        # Define inappropriate content patterns
        self.inappropriate_patterns = [
            # Profanity
            r'\b(fuck|shit|damn|bitch|asshole|cunt|pussy|dick|cock)\b',
            # Drug references
            r'\b(weed|marijuana|cocaine|heroin|meth|ecstasy|molly|get drugs|buy drugs)\b',
            # Sexual content
            r'\b(sex|porn|naked|nude|orgasm|masturbat)\b',
            # Violence
            r'\b(kill|murder|suicide|self-harm|cut|die)\b',
            # Hate speech
            r'\b(racist|homophob|transphob|sexist)\b',
        ]

        # Compile regex patterns
        self.compiled_patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.inappropriate_patterns]

        # Safe topics for teens
        self.safe_topics = [
            'school', 'homework', 'friends', 'family', 'hobbies',
            'sports', 'music', 'movies', 'books', 'games',
            'health', 'fitness', 'nutrition', 'mental health',
            'career', 'college', 'future', 'goals', 'dreams'
        ]

    def is_safe_content(self, content: str) -> bool:
        """
        Check if content is safe for teens
        """
        content_lower = content.lower()

        # Check for inappropriate patterns
        for pattern in self.compiled_patterns:
            if pattern.search(content_lower):
                return False

        return True

    def filter_response(self, response: str) -> Tuple[str, bool]:
        """
        Filter AI response for teen safety
        Returns: (filtered_response, was_filtered)
        """
        if self.is_safe_content(response):
            return response, False

        # If response contains inappropriate content, provide a safe alternative
        filtered_response = self._generate_safe_response(response)

        return filtered_response, True

    def _generate_safe_response(self, original_response: str) -> str:
        """
        Generate a safe alternative response
        """
        safe_responses = [
            "I'm here to help with schoolwork, hobbies, and positive topics. What would you like to talk about?",
            "Let's keep our conversation appropriate and fun! What are you interested in learning about?",
            "I want to make sure our chat is safe and positive. Can you tell me about your favorite subjects or activities?",
            "I'm designed to help with educational and positive topics. What can I assist you with today?"
        ]

        # Try to match the topic if possible
        for topic in self.safe_topics:
            if topic in original_response.lower():
                return f"That's an interesting topic! I'd be happy to help you learn more about {topic} in a positive way."

        return safe_responses[0]

    def get_violations(self, content: str) -> List[str]:
        """
        Get list of violations found in content
        """
        violations = []
        content_lower = content.lower()

        for i, pattern in enumerate(self.compiled_patterns):
            if pattern.search(content_lower):
                violations.append(f"Pattern {i+1} matched")

        return violations