// Test script to verify frontend-backend connection
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function testConnection() {
  console.log('Testing frontend-backend connection...');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test 2: Chat endpoint
    console.log('2. Testing chat endpoint...');
    const chatResponse = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello test',
        user_id: 'test_user',
        session_id: 'test_session'
      })
    });
    
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      console.log('✅ Chat test successful:', chatData.response.substring(0, 100) + '...');
    } else {
      console.error('❌ Chat test failed:', chatResponse.status, chatResponse.statusText);
    }
    
    // Test 3: CORS test
    console.log('3. Testing CORS...');
    const corsResponse = await fetch(`${API_BASE_URL}/health`, {
      method: 'OPTIONS'
    });
    console.log('✅ CORS test:', corsResponse.status === 200 ? 'OK' : 'Failed');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

// Run the test
testConnection();