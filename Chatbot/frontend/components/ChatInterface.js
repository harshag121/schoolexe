'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Menu, X, History } from 'lucide-react';
import { chatAPI } from '@/lib/api';
import { sessionManager } from '@/lib/session';
import { clientCache } from '@/lib/cache';
import { debugAPI } from '@/lib/debug';
import { chatHistoryManager } from '@/lib/chatHistory';
import HealthTopics from './HealthTopics';
import FollowUpQuestions from './FollowUpQuestions';
import MCQQuiz from './MCQQuiz';
import MCQFormatter from './MCQFormatter';
import PopularPrompts from './PopularPrompts';
import ChatHistorySidebar from './ChatHistorySidebar';

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hi there! I\'m here to help answer your health questions. You can ask me anything about nutrition, fitness, mental health, or growing up. Click on a popular question below or type your own!',
      isBot: true,
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [lastTopic, setLastTopic] = useState(null);
  const [showTopics, setShowTopics] = useState(false);
  const [showFollowUps, setShowFollowUps] = useState(false);
  const [showMCQ, setShowMCQ] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      const uid = sessionManager.getUserId();
      const sid = sessionManager.getSessionId();
      setUserId(uid);
      setSessionId(sid);
      
      // Check backend connection
      try {
        await chatAPI.healthCheck();
        setConnectionStatus('connected');
      } catch (error) {
        setConnectionStatus('error');
        console.error('Backend connection failed:', error);
      }
    };
    
    initSession();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    
    // Save current session to history
    if (userId && sessionId && messages.length > 1) {
      const userMessages = messages.filter(m => !m.isBot);
      const botMessages = messages.filter(m => m.isBot);
      
      if (userMessages.length > 0) {
        chatHistoryManager.updateSessionMessages(userId, sessionId, messages);
      }
    }
  }, [messages, userId, sessionId]);

  const handleTopicSelect = (topic, description) => {
    setShowTopics(false);
    const message = `Tell me about ${topic.replace('_', ' ')}`;
    handleSendMessage(message);
  };

  const handleFollowUpSelect = (question) => {
    setShowFollowUps(false);
    handleSendMessage(question);
  };

  const handlePromptSelect = (prompt) => {
    handleSendMessage(prompt);
  };

  const addMessage = (text, isBot = false) => {
    const message = {
      id: Date.now().toString() + Math.random(),
      text,
      isBot,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
    return message;
  };

  const handleSendMessage = async (messageText, suggestedTopic = null) => {
    const text = messageText || inputMessage.trim();
    if (!text) return;

    // Add user message
    addMessage(text, false);
    setInputMessage('');
    setIsLoading(true);
    setShowFollowUps(false);

    try {
      // Check cache first
      const cachedResponse = clientCache.get(text, userId);
      if (cachedResponse) {
        console.log('Using cached response');
        // Add bot response from cache
        addMessage(cachedResponse.response, true);
        
        // Update topic for follow-ups
        if (cachedResponse.topic) {
          setLastTopic(cachedResponse.topic);
          setShowFollowUps(true);
          
          // Update session in history
          chatHistoryManager.saveSession(userId, {
            sessionId,
            topic: cachedResponse.topic,
            summary: text.substring(0, 60) + (text.length > 60 ? '...' : ''),
          });
        } else if (suggestedTopic) {
          setLastTopic(suggestedTopic);
          setShowFollowUps(true);
        }
        return;
      }

      const response = await chatAPI.sendMessage({
        message: text,
        user_id: userId,
        session_id: sessionId,
      });

      // Cache the response
      clientCache.set(text, {
        response: response.response,
        topic: response.topic
      }, userId);

      // Add bot response
      addMessage(response.response, true);
      
      // Update topic for follow-ups
      if (response.topic) {
        setLastTopic(response.topic);
        setShowFollowUps(true);
        
        // Save session with topic metadata
        chatHistoryManager.saveSession(userId, {
          sessionId,
          topic: response.topic,
          summary: text.substring(0, 60) + (text.length > 60 ? '...' : ''),
          messages: [...messages, 
            { id: Date.now().toString() + Math.random(), text, isBot: false, timestamp: new Date() },
            { id: Date.now().toString() + Math.random() + 1, text: response.response, isBot: true, timestamp: new Date() }
          ]
        });
      } else if (suggestedTopic) {
        setLastTopic(suggestedTopic);
        setShowFollowUps(true);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorMessage = 'Sorry, I\'m having trouble responding right now. Please try again.';
      
      if (error.message.includes('timeout')) {
        errorMessage = '⚠️ Request timeout - server took too long to respond. Please try again.';
      } else if (error.message.includes('Network error')) {
        errorMessage = '🔌 Network error - unable to connect to server. Please check your connection.';
      } else if (error.response?.status === 500) {
        errorMessage = '🔧 Server error - please try again in a moment.';
      } else if (error.response?.status === 400) {
        // Handle specific backend validation errors
        const detail = error.response.data?.detail;
        if (detail) {
          if (detail.includes('inappropriate content')) {
            errorMessage = '⚠️ Please keep conversations appropriate and friendly.';
          } else if (detail.includes('Message cannot be empty')) {
            errorMessage = '📝 Please enter a message before sending.';
          } else if (detail.includes('Message too long')) {
            errorMessage = '📏 Your message is too long. Please keep it under 1000 characters.';
          } else {
            errorMessage = `❌ ${detail}`;
          }
        } else {
          errorMessage = 'Invalid request - please try rephrasing your message.';
        }
      } else if (error.response?.status === 503) {
        errorMessage = '🔧 Service temporarily unavailable - please try again later.';
      } else if (error.response?.status === 429) {
        errorMessage = '⏱️ Too many requests - please wait a moment before trying again.';
      }
      
      addMessage(errorMessage, true);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleNewChat = () => {
    // Clear current session and start fresh
    sessionManager.clearSession();
    const newSessionId = sessionManager.getSessionId();
    setSessionId(newSessionId);
    setMessages([
      {
        id: '1',
        text: 'Hi there! I\'m here to help answer your health questions. You can ask me anything about nutrition, fitness, mental health, or growing up. Click on a popular question below or type your own!',
        isBot: true,
        timestamp: new Date(),
      }
    ]);
    setLastTopic(null);
    setShowFollowUps(false);
    setShowTopics(false);
    setShowHistorySidebar(false);
  };

  const handleSessionSelect = (session) => {
    // Load selected session
    if (session.messages) {
      setMessages(session.messages);
      setSessionId(session.sessionId);
      setLastTopic(session.topic);
      setShowHistorySidebar(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        userId={userId}
        currentSessionId={sessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        isVisible={showHistorySidebar}
        onClose={() => setShowHistorySidebar(false)}
      />
      
      {/* Main Chat Interface */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistorySidebar(!showHistorySidebar)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                title="Toggle chat history"
              >
                <History size={20} />
              </button>
              
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-lg">🤖</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">AdolAI chatbot</h1>
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 
                    connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-gray-600">
                    {connectionStatus === 'connected' ? 'Connected' : 
                     connectionStatus === 'error' ? 'Connection Error' : 'Connecting...'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistorySidebar(!showHistorySidebar)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors hidden lg:block"
                title="Toggle chat history"
              >
                <History size={20} />
              </button>
              
              <button
                onClick={async () => {
                  console.log('🔍 Running connection test...');
                  const result = await debugAPI.testConnection();
                  if (result.success) {
                    setConnectionStatus('connected');
                    addMessage('✅ Connection test successful!', true);
                  } else {
                    setConnectionStatus('error');
                    addMessage(`❌ Connection test failed: ${result.error}`, true);
                  }
                }}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                title="Test backend connection"
              >
                🔍 Test
              </button>
              <button
                onClick={() => setShowMCQ(!showMCQ)}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                title="Take a health quiz"
              >
                🧠 Quiz
              </button>
              <button
                onClick={() => setShowTopics(!showTopics)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {showTopics ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div className="flex items-start gap-3 max-w-sm">
              {message.isBot && (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-sm">🤖</span>
                </div>
              )}
              <div
                className={`rounded-lg p-3 shadow-sm ${
                  message.isBot
                    ? 'bg-white border'
                    : 'bg-blue-500 text-white'
                }`}
              >
                {message.isBot ? (
                  <MCQFormatter 
                    content={message.text} 
                    onStartQuiz={(questions) => {
                      // Could implement interactive quiz mode here
                      console.log('Starting quiz with:', questions);
                    }}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                )}
                <div className={`text-xs mt-1 ${
                  message.isBot ? 'text-gray-500' : 'text-blue-100'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
              {!message.isBot && (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 text-sm">👤</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Health Topics */}
        <HealthTopics 
          isVisible={showTopics}
          onTopicSelect={handleTopicSelect}
        />

        {/* Popular Health Prompts - Show initially */}
        {messages.length <= 2 && (
          <div className="flex justify-start">
            <div className="flex items-start gap-3 max-w-2xl w-full">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm">🤖</span>
              </div>
              <PopularPrompts 
                onPromptSelect={handlePromptSelect}
                isVisible={true}
              />
            </div>
          </div>
        )}

        {/* Follow-up Questions */}
        <FollowUpQuestions
          userId={userId}
          lastTopic={lastTopic}
          visible={showFollowUps && !isLoading}
          onQuestionSelect={handleFollowUpSelect}
        />

        {/* MCQ Quiz */}
        {showMCQ && (
          <div className="mt-4">
            <MCQQuiz 
              userId={userId}
              onClose={() => setShowMCQ(false)}
            />
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-3 max-w-sm">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm">🤖</span>
              </div>
              <div className="bg-white border rounded-lg p-3 shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your health question..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputMessage.trim()}
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title={!inputMessage.trim() ? "Type a message first" : "Send message"}
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* MCQ Quiz Modal */}
      {showMCQ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <MCQQuiz 
            userId={userId}
            onClose={() => setShowMCQ(false)}
          />
        </div>
      )}
      </div>
    </div>
  );
}