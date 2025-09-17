// Client-side cache management
class ClientCache {
  constructor(maxSize = 50, ttl = 5 * 60 * 1000) { // 5 minutes TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  _generateKey(message, userId) {
    return `${userId}_${message.trim().toLowerCase()}`;
  }

  get(message, userId) {
    const key = this._generateKey(message, userId);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.response;
  }

  set(message, response, userId) {
    const key = this._generateKey(message, userId);
    
    // Remove oldest if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      userId
    });
  }

  clear(userId = null) {
    if (userId) {
      // Clear only for specific user
      for (const [key, value] of this.cache.entries()) {
        if (value.userId === userId) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all
      this.cache.clear();
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }
}

export const clientCache = new ClientCache();