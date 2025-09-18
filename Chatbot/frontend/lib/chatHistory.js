// Chat history management utilities
class ChatHistoryManager {
  constructor() {
    this.storageKey = 'adolai_chat_history';
    this.sessionsKey = 'adolai_chat_sessions';
    this.favoritesKey = 'adolai_favorite_chats';
  }

  // Get all chat sessions for a user
  getAllSessions(userId) {
    if (typeof window === 'undefined') return [];
    
    try {
      const sessions = JSON.parse(localStorage.getItem(this.sessionsKey) || '{}');
      return sessions[userId] || [];
    } catch (error) {
      console.error('Error reading chat sessions:', error);
      return [];
    }
  }

  // Save a chat session
  saveSession(userId, sessionData) {
    if (typeof window === 'undefined') return;
    
    try {
      const sessions = JSON.parse(localStorage.getItem(this.sessionsKey) || '{}');
      if (!sessions[userId]) {
        sessions[userId] = [];
      }
      
      // Find existing session or create new one
      const existingIndex = sessions[userId].findIndex(s => s.sessionId === sessionData.sessionId);
      if (existingIndex >= 0) {
        sessions[userId][existingIndex] = {
          ...sessions[userId][existingIndex],
          ...sessionData,
          lastModified: Date.now()
        };
      } else {
        sessions[userId].push({
          ...sessionData,
          createdAt: Date.now(),
          lastModified: Date.now()
        });
      }
      
      // Keep only last 50 sessions per user
      sessions[userId] = sessions[userId]
        .sort((a, b) => b.lastModified - a.lastModified)
        .slice(0, 50);
      
      localStorage.setItem(this.sessionsKey, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving chat session:', error);
    }
  }

  // Update session messages
  updateSessionMessages(userId, sessionId, messages) {
    if (typeof window === 'undefined') return;
    
    try {
      const sessions = JSON.parse(localStorage.getItem(this.sessionsKey) || '{}');
      if (!sessions[userId]) return;
      
      const sessionIndex = sessions[userId].findIndex(s => s.sessionId === sessionId);
      if (sessionIndex >= 0) {
        sessions[userId][sessionIndex].messages = messages;
        sessions[userId][sessionIndex].lastModified = Date.now();
        
        // Update summary and topic based on latest messages
        const userMessages = messages.filter(m => !m.isBot);
        const botMessages = messages.filter(m => m.isBot);
        
        if (userMessages.length > 0) {
          sessions[userId][sessionIndex].summary = userMessages[0].text.substring(0, 60) + '...';
        }
        
        localStorage.setItem(this.sessionsKey, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error updating session messages:', error);
    }
  }

  // Get a specific session
  getSession(userId, sessionId) {
    const sessions = this.getAllSessions(userId);
    return sessions.find(s => s.sessionId === sessionId);
  }

  // Delete a session
  deleteSession(userId, sessionId) {
    if (typeof window === 'undefined') return;
    
    try {
      const sessions = JSON.parse(localStorage.getItem(this.sessionsKey) || '{}');
      if (sessions[userId]) {
        sessions[userId] = sessions[userId].filter(s => s.sessionId !== sessionId);
        localStorage.setItem(this.sessionsKey, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  // Search through chat history
  searchSessions(userId, query, options = {}) {
    const sessions = this.getAllSessions(userId);
    const lowerQuery = query.toLowerCase();
    
    return sessions.filter(session => {
      // Search in session metadata
      if (session.summary && session.summary.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      if (session.topic && session.topic.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      
      // Search in messages
      if (session.messages) {
        return session.messages.some(message => 
          message.text.toLowerCase().includes(lowerQuery)
        );
      }
      
      return false;
    }).sort((a, b) => b.lastModified - a.lastModified);
  }

  // Filter sessions by date range
  filterSessionsByDate(userId, startDate, endDate) {
    const sessions = this.getAllSessions(userId);
    return sessions.filter(session => {
      const sessionDate = session.createdAt || session.lastModified;
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }

  // Get favorite sessions
  getFavoriteSessions(userId) {
    if (typeof window === 'undefined') return [];
    
    try {
      const favorites = JSON.parse(localStorage.getItem(this.favoritesKey) || '{}');
      const userFavorites = favorites[userId] || [];
      const sessions = this.getAllSessions(userId);
      
      return sessions.filter(session => 
        userFavorites.includes(session.sessionId)
      );
    } catch (error) {
      console.error('Error reading favorite sessions:', error);
      return [];
    }
  }

  // Toggle favorite status
  toggleFavorite(userId, sessionId) {
    if (typeof window === 'undefined') return false;
    
    try {
      const favorites = JSON.parse(localStorage.getItem(this.favoritesKey) || '{}');
      if (!favorites[userId]) {
        favorites[userId] = [];
      }
      
      const index = favorites[userId].indexOf(sessionId);
      if (index >= 0) {
        favorites[userId].splice(index, 1);
      } else {
        favorites[userId].push(sessionId);
      }
      
      localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
      return favorites[userId].includes(sessionId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  }

  // Check if session is favorite
  isFavorite(userId, sessionId) {
    if (typeof window === 'undefined') return false;
    
    try {
      const favorites = JSON.parse(localStorage.getItem(this.favoritesKey) || '{}');
      return (favorites[userId] || []).includes(sessionId);
    } catch (error) {
      return false;
    }
  }

  // Export sessions as JSON
  exportSessions(userId, format = 'json') {
    const sessions = this.getAllSessions(userId);
    
    if (format === 'json') {
      const data = JSON.stringify(sessions, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      return blob;
    }
    
    if (format === 'txt') {
      let text = `Chat History Export for User: ${userId}\n`;
      text += `Exported on: ${new Date().toLocaleString()}\n\n`;
      text += '='.repeat(50) + '\n\n';
      
      sessions.forEach((session, index) => {
        text += `Session ${index + 1}: ${session.sessionId}\n`;
        text += `Created: ${new Date(session.createdAt).toLocaleString()}\n`;
        text += `Topic: ${session.topic || 'General'}\n`;
        text += `Summary: ${session.summary || 'No summary'}\n`;
        text += '-'.repeat(30) + '\n';
        
        if (session.messages) {
          session.messages.forEach(message => {
            const sender = message.isBot ? 'Bot' : 'User';
            const time = new Date(message.timestamp).toLocaleTimeString();
            text += `[${time}] ${sender}: ${message.text}\n`;
          });
        }
        
        text += '\n' + '='.repeat(50) + '\n\n';
      });
      
      const blob = new Blob([text], { type: 'text/plain' });
      return blob;
    }
    
    return null;
  }

  // Download exported sessions
  downloadExport(userId, format = 'json') {
    const blob = this.exportSessions(userId, format);
    if (!blob) return;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adolai_chat_history_${userId}_${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Clear all history for a user
  clearHistory(userId) {
    if (typeof window === 'undefined') return;
    
    try {
      const sessions = JSON.parse(localStorage.getItem(this.sessionsKey) || '{}');
      delete sessions[userId];
      localStorage.setItem(this.sessionsKey, JSON.stringify(sessions));
      
      const favorites = JSON.parse(localStorage.getItem(this.favoritesKey) || '{}');
      delete favorites[userId];
      localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  // Get storage statistics
  getStorageStats(userId) {
    const sessions = this.getAllSessions(userId);
    const favorites = this.getFavoriteSessions(userId);
    
    let totalMessages = 0;
    let oldestSession = null;
    let newestSession = null;
    
    sessions.forEach(session => {
      if (session.messages) {
        totalMessages += session.messages.length;
      }
      
      const sessionDate = session.createdAt || session.lastModified;
      if (!oldestSession || sessionDate < oldestSession) {
        oldestSession = sessionDate;
      }
      if (!newestSession || sessionDate > newestSession) {
        newestSession = sessionDate;
      }
    });
    
    return {
      totalSessions: sessions.length,
      totalMessages,
      favoriteSessions: favorites.length,
      oldestSession: oldestSession ? new Date(oldestSession) : null,
      newestSession: newestSession ? new Date(newestSession) : null
    };
  }
}

export const chatHistoryManager = new ChatHistoryManager();