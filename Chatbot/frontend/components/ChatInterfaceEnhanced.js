'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

// Enhanced Emoji Selector Component
function EmojiSelector({ onEmojiSelect, selectedEmoji, onDismiss }) {
  const [hoveredEmoji, setHoveredEmoji] = useState('');

  const emojiOptions = [
    { emoji: '😊', label: 'Happy', description: 'Feeling good and positive' },
    { emoji: '😢', label: 'Sad', description: 'Feeling down or upset' },
    { emoji: '😴', label: 'Tired', description: 'Feeling sleepy or exhausted' },
    { emoji: '😡', label: 'Angry', description: 'Feeling frustrated or mad' },
    { emoji: '😎', label: 'Confident', description: 'Feeling cool and confident' },
    { emoji: '😰', label: 'Anxious', description: 'Feeling worried or stressed' },
    { emoji: '🤔', label: 'Thoughtful', description: 'Feeling contemplative' },
    { emoji: '😐', label: 'Neutral', description: 'Feeling okay, nothing special' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="mb-3">
        <p className="text-sm font-medium text-gray-700 mb-1">
          How are you feeling right now?
        </p>
        <p className="text-xs text-gray-500">
          {hoveredEmoji 
            ? emojiOptions.find(opt => opt.emoji === hoveredEmoji)?.description
            : 'Select an emoji that matches your mood'
          }
        </p>
      </div>
      
      <div className="grid grid-cols-4 gap-2 mb-3">
        {emojiOptions.map((option) => (
          <button
            key={option.emoji}
            onClick={() => onEmojiSelect(option.emoji)}
            onMouseEnter={() => setHoveredEmoji(option.emoji)}
            onMouseLeave={() => setHoveredEmoji('')}
            className={`w-12 h-12 text-2xl rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
              selectedEmoji === option.emoji
                ? 'border-blue-500 bg-blue-50 scale-110 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:scale-105 hover:shadow-sm'
            }`}
            title={`${option.label}: ${option.description}`}
          >
            {option.emoji}
          </button>
        ))}
      </div>

      {onDismiss && (
        <div className="flex justify-end">
          <button
            onClick={onDismiss}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}

// Enhanced Message List Component
function MessageList({ messages, isLoading }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end' 
      });
    }
  };

  useEffect(() => {
    const shouldSmoothScroll = messages.length > 1;
    scrollToBottom(shouldSmoothScroll);
  }, [messages.length]);

  useEffect(() => {
    if (isLoading) {
      scrollToBottom(false);
    }
  }, [isLoading]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 scroll-smooth max-w-4xl mx-auto w-full">
      <div className="space-y-1">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} mb-4`}>
            <div className="flex items-start gap-3 max-w-xs sm:max-w-md">
              {message.isBot && (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 text-sm">🤖</span>
                </div>
              )}
              
              <div className="flex flex-col">
                <div className={`rounded-lg p-3 shadow-sm ${
                  message.isBot
                    ? 'bg-white border border-gray-200'
                    : 'bg-blue-500 text-white'
                }`}>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  {message.emoji && (
                    <span className="text-lg ml-2 inline-block">{message.emoji}</span>
                  )}
                </div>
                
                <div className={`text-xs text-gray-400 mt-1 ${
                  message.isBot ? 'text-left' : 'text-right'
                }`}>
                  {formatTime(message.timestamp)}
                  {message.processingTime && (
                    <span className="ml-1">({message.processingTime.toFixed(1)}s)</span>
                  )}
                </div>
              </div>

              {!message.isBot && (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-gray-600 text-sm">👤</span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex items-start gap-3 max-w-xs">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-600 text-sm">🤖</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
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
    </div>
  );
}

// Enhanced Input Bar Component
function InputBar({ value, onChange, onSend, disabled = false, placeholder = "Type your health question...", maxLength = 500 }) {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmedMessage = value.trim();
    if (trimmedMessage && !disabled) {
      onSend(trimmedMessage);
    }
  };

  const canSend = value.trim().length > 0 && !disabled;
  const isNearLimit = value.length > maxLength * 0.8;

  return (
    <div className="bg-white border-t p-4">
      <div className="max-w-4xl mx-auto">
        {isNearLimit && (
          <div className="text-right mb-2">
            <span className={`text-xs ${
              value.length >= maxLength ? 'text-red-500' : 'text-yellow-500'
            }`}>
              {value.length}/{maxLength}
            </span>
          </div>
        )}

        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={disabled}
              className={`w-full p-3 pr-4 border rounded-lg transition-all duration-200 focus:outline-none ${
                isFocused 
                  ? 'border-blue-500 ring-2 ring-blue-100' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${
                disabled 
                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                  : 'bg-white'
              } ${
                value.length >= maxLength 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                  : ''
              }`}
            />
            
            {disabled && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`p-3 rounded-lg transition-all duration-200 flex items-center justify-center ${
              canSend
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title={canSend ? 'Send message' : 'Type a message to send'}
          >
            <Send size={20} />
          </button>
        </div>

        {!disabled && value.length === 0 && (
          <div className="mt-2 text-xs text-gray-500">
            💡 Try asking about nutrition, exercise, mental health, or any health topic
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Chat Interface Container
export default function ChatInterface() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const REQUEST_TIMEOUT = 10000; // 10 seconds

  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hello! How are you doing today? Select the emoji closest to what you\'re feeling.',
      isBot: true,
      timestamp: new Date(),
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [loadingState, setLoadingState] = useState('idle'); // 'idle', 'loading', 'error', 'timeout'
  const [error, setError] = useState(null);
  const [userId] = useState(() => `user_${Date.now()}`);
  const [showEmojiSelector, setShowEmojiSelector] = useState(true);

  // API call with timeout
  const fetchWithTimeout = async (url, options) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - server took too long to respond');
      }
      throw error;
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji) => {
    setSelectedEmoji(emoji);
    setShowEmojiSelector(false);
    handleSendMessage(emoji);
  }, []);

  // Handle emoji selector dismissal
  const handleEmojiDismiss = useCallback(() => {
    setShowEmojiSelector(false);
  }, []);

  // Handle input change
  const handleInputChange = useCallback((value) => {
    setInputMessage(value);
    setError(null); // Clear any previous errors
  }, []);

  // Add message to state
  const addMessage = useCallback((message) => {
    const newMessage = {
      ...message,
      id: Date.now().toString(),
    };

    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  // Handle sending messages
  const handleSendMessage = useCallback(async (messageText) => {
    const text = messageText || inputMessage.trim();
    if (!text) return;

    // Clear input immediately for better UX
    setInputMessage('');
    setLoadingState('loading');
    setError(null);

    // Add user message
    addMessage({
      text,
      isBot: false,
      timestamp: new Date(),
      emoji: messageText ? undefined : selectedEmoji,
    });

    try {
      const startTime = Date.now();
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          user_id: userId,
          session_id: `session_${userId}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const processingTime = (Date.now() - startTime) / 1000;

      // Add bot response
      addMessage({
        text: data.response,
        isBot: true,
        timestamp: new Date(),
        processingTime,
      });

      setLoadingState('idle');

    } catch (error) {
      console.error('Error sending message:', error);
      
      const apiError = {
        message: error.message || 'Unknown error occurred',
        timestamp: new Date(),
      };

      setLoadingState('error');
      setError(apiError);

      // Add error message
      addMessage({
        text: 'Sorry, I\'m having trouble responding right now. Please try again.',
        isBot: true,
        timestamp: new Date(),
      });
    }
  }, [inputMessage, selectedEmoji, userId, addMessage]);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const showConnectionError = loadingState === 'error' || loadingState === 'timeout';

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">🤖</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">AdolAI chatbot</h1>
              <p className="text-xs text-gray-500">Teen Health Assistant</p>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              showConnectionError ? 'bg-red-400' : 'bg-green-400'
            }`}></div>
            <span className="text-xs text-gray-500">
              {showConnectionError ? 'Connection issues' : 'Online'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-3">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-red-700">
              ⚠️ {error.message}
            </p>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <MessageList 
        messages={messages} 
        isLoading={loadingState === 'loading'}
      />

      {/* Emoji Selector */}
      {showEmojiSelector && messages.length === 1 && (
        <div className="p-4 max-w-4xl mx-auto w-full">
          <div className="flex justify-start">
            <div className="flex items-start gap-3 max-w-xs">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-blue-600 text-sm">🤖</span>
              </div>
              <EmojiSelector 
                onEmojiSelect={handleEmojiSelect}
                selectedEmoji={selectedEmoji}
                onDismiss={handleEmojiDismiss}
              />
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <InputBar
        value={inputMessage}
        onChange={handleInputChange}
        onSend={handleSendMessage}
        disabled={loadingState === 'loading'}
        placeholder="Type your health question..."
        maxLength={500}
      />
    </div>
  );
}