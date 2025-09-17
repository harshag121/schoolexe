// Debug helper for testing API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const debugAPI = {
  async testConnection() {
    console.log('🔍 Starting connection test...');
    
    try {
      // Test direct fetch first
      console.log('Testing direct fetch to backend...');
      const response = await fetch(`${API_BASE_URL}/health`);
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Direct fetch failed:', error);
      return { success: false, error: error.message };
    }
  },
  
  async testChatMessage() {
    console.log('🔍 Testing chat message...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Test message',
          user_id: 'debug_user',
          session_id: 'debug_session'
        })
      });
      
      console.log('Chat response status:', response.status);
      const data = await response.json();
      console.log('Chat response data:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Chat test failed:', error);
      return { success: false, error: error.message };
    }
  }
};

// Add to window for easy testing in browser console
if (typeof window !== 'undefined') {
  window.debugAPI = debugAPI;
}