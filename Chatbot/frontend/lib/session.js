// Session management utilities
export const sessionManager = {
  getUserId: () => {
    if (typeof window === 'undefined') return null;
    
    let userId = localStorage.getItem('adolai_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('adolai_user_id', userId);
    }
    return userId;
  },

  getSessionId: () => {
    if (typeof window === 'undefined') return null;
    
    let sessionId = sessionStorage.getItem('adolai_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('adolai_session_id', sessionId);
    }
    return sessionId;
  },

  clearSession: () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('adolai_session_id');
  },

  clearUser: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('adolai_user_id');
    sessionStorage.removeItem('adolai_session_id');
  }
};

// Emoji to health topic mapping
export const emojiTopicMapping = {
  '😊': { topic: 'growing_healthy', message: 'I\'m feeling good! Tell me about staying healthy and growing strong.' },
  '😢': { topic: 'health', message: 'I\'m feeling sad. Can you help me understand these feelings and how to feel better?' },
  '😴': { topic: 'healthy_lifestyle', message: 'I\'m feeling tired. What can you tell me about sleep and rest?' },
  '😡': { topic: 'health', message: 'I\'m feeling angry. How can I manage these feelings in a healthy way?' },
  '😎': { topic: 'healthy_lifestyle', message: 'I\'m feeling confident! Tell me about maintaining a healthy, active lifestyle.' },
  '😰': { topic: 'health', message: 'I\'m feeling anxious. Can you help me understand stress and how to cope with it?' },
  '🤔': { topic: 'growing_healthy', message: 'I\'m curious about health topics. What should I know about growing up healthy?' },
  '😋': { topic: 'nutrition', message: 'I\'m thinking about food! Tell me about healthy eating habits.' }
};

export const enhancedEmojis = ['😊', '😢', '😴', '😡', '😎', '😰', '🤔', '😋'];