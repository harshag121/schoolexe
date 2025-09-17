import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45 seconds timeout (increased for Gemini API)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - server took too long to respond');
    }
    
    if (!error.response) {
      throw new Error('Network error - unable to connect to server');
    }
    
    throw error;
  }
);

export const chatAPI = {
  sendMessage: async (message) => {
    const response = await api.post('/chat', message);
    return response.data;
  },

  getFollowUpQuestions: async (userId, topic) => {
    const params = topic ? `?topic=${topic}` : '';
    const response = await api.get(`/follow-up/${userId}${params}`);
    return response.data;
  },

  getHealthTopics: async () => {
    const response = await api.get('/topics');
    return response.data;
  },

  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export const mcqAPI = {
  generateMCQs: async (request) => {
    const response = await api.post('/mcq/generate', request);
    return response.data;
  },

  getNextQuestion: async (topic = null, difficulty = null) => {
    const params = new URLSearchParams();
    if (topic) params.append('topic', topic);
    if (difficulty) params.append('difficulty', difficulty);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    const response = await api.get(`/mcq/next${queryString}`);
    return response.data;
  },

  submitAttempt: async (request) => {
    const response = await api.post('/mcq/attempt', request);
    return response.data;
  },

  getAnalytics: async (topic = null) => {
    const params = topic ? `?topic=${topic}` : '';
    const response = await api.get(`/mcq/analytics${params}`);
    return response.data;
  },
};

export default api;