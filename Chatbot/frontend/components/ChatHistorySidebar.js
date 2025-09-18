'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Star, StarOff, Download, Trash2, Calendar, MessageCircle, X, ChevronDown, ChevronRight } from 'lucide-react';
import { chatHistoryManager } from '@/lib/chatHistory';

export default function ChatHistorySidebar({ 
  userId, 
  currentSessionId, 
  onSessionSelect, 
  onNewChat, 
  isVisible, 
  onClose 
}) {
  const [sessions, setSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Load sessions when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      loadSessions();
    }
  }, [userId]);

  const loadSessions = () => {
    setLoading(true);
    try {
      const allSessions = chatHistoryManager.getAllSessions(userId);
      setSessions(allSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search sessions
  const filteredSessions = useMemo(() => {
    let filtered = [...sessions];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = chatHistoryManager.searchSessions(userId, searchQuery.trim());
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.lastModified || session.createdAt);
        return sessionDate >= startDate;
      });
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(session => 
        chatHistoryManager.isFavorite(userId, session.sessionId)
      );
    }

    return filtered.sort((a, b) => (b.lastModified || b.createdAt) - (a.lastModified || a.createdAt));
  }, [sessions, searchQuery, dateFilter, showFavoritesOnly, userId]);

  const handleSessionClick = (session) => {
    if (onSessionSelect) {
      onSessionSelect(session);
    }
  };

  const handleToggleFavorite = (e, sessionId) => {
    e.stopPropagation();
    chatHistoryManager.toggleFavorite(userId, sessionId);
    loadSessions(); // Refresh to update favorite status
  };

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat session?')) {
      chatHistoryManager.deleteSession(userId, sessionId);
      loadSessions();
    }
  };

  const handleExport = (format) => {
    chatHistoryManager.downloadExport(userId, format);
  };

  const toggleSessionExpansion = (e, sessionId) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getSessionPreview = (session) => {
    if (session.summary) {
      return session.summary;
    }
    
    if (session.messages && session.messages.length > 0) {
      const firstUserMessage = session.messages.find(m => !m.isBot);
      if (firstUserMessage) {
        return firstUserMessage.text.length > 60 
          ? firstUserMessage.text.substring(0, 60) + '...'
          : firstUserMessage.text;
      }
    }
    
    return 'New conversation';
  };

  const getTopicEmoji = (topic) => {
    const topicEmojis = {
      'nutrition': '🥗',
      'fitness': '💪',
      'mental_health': '🧠',
      'growing_healthy': '🌱',
      'health': '❤️',
      'healthy_lifestyle': '🌟',
      'general': '💬'
    };
    return topicEmojis[topic] || '💬';
  };

  if (!isVisible) return null;

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Chat History</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
          
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`text-xs px-2 py-1 rounded ${
              showFavoritesOnly 
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            ⭐ Favorites
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onNewChat}
            className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            + New Chat
          </button>
          
          <div className="relative group">
            <button className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors">
              <Download size={16} />
            </button>
            <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                onClick={() => handleExport('json')}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded-t-lg"
              >
                Export JSON
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded-b-lg"
              >
                Export Text
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageCircle size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">
              {searchQuery || showFavoritesOnly 
                ? 'No conversations found' 
                : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredSessions.map((session) => {
              const isExpanded = expandedSessions.has(session.sessionId);
              const isFavorite = chatHistoryManager.isFavorite(userId, session.sessionId);
              const isActive = session.sessionId === currentSessionId;
              
              return (
                <div key={session.sessionId} className="group">
                  <div
                    onClick={() => handleSessionClick(session)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      isActive 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">
                            {getTopicEmoji(session.topic)}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            {session.topic?.replace('_', ' ').toUpperCase() || 'GENERAL'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-800 line-clamp-2 mb-1">
                          {getSessionPreview(session)}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDate(session.lastModified || session.createdAt)}
                          </span>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleToggleFavorite(e, session.sessionId)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {isFavorite ? (
                                <Star size={14} className="text-yellow-500 fill-current" />
                              ) : (
                                <StarOff size={14} className="text-gray-400" />
                              )}
                            </button>
                            
                            {session.messages && session.messages.length > 2 && (
                              <button
                                onClick={(e) => toggleSessionExpansion(e, session.sessionId)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                {isExpanded ? (
                                  <ChevronDown size={14} className="text-gray-400" />
                                ) : (
                                  <ChevronRight size={14} className="text-gray-400" />
                                )}
                              </button>
                            )}
                            
                            <button
                              onClick={(e) => handleDeleteSession(e, session.sessionId)}
                              className="p-1 hover:bg-red-100 rounded"
                            >
                              <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded Message Preview */}
                    {isExpanded && session.messages && (
                      <div className="mt-2 pl-2 border-l-2 border-gray-200 space-y-1">
                        {session.messages.slice(-3).map((message, idx) => (
                          <div key={idx} className="text-xs">
                            <span className={`font-medium ${
                              message.isBot ? 'text-blue-600' : 'text-gray-600'
                            }`}>
                              {message.isBot ? 'Bot' : 'You'}:
                            </span>
                            <span className="text-gray-500 ml-1">
                              {message.text.length > 100 
                                ? message.text.substring(0, 100) + '...'
                                : message.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          {filteredSessions.length} of {sessions.length} conversations
          {showFavoritesOnly && ` • ${chatHistoryManager.getFavoriteSessions(userId).length} favorites`}
        </div>
      </div>
    </div>
  );
}