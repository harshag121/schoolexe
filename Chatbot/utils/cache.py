try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

import json
import hashlib
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class CacheManager:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.cache_ttl = int(os.getenv("CACHE_TTL", "3600"))  # 1 hour default

        if REDIS_AVAILABLE:
            try:
                self.redis = redis.from_url(self.redis_url)
            except:
                self.redis = None
        else:
            self.redis = None

        # Always have memory cache as fallback
        self.memory_cache = {}

    def _generate_cache_key(self, message: str) -> str:
        """Generate a cache key from the message"""
        return hashlib.md5(message.encode()).hexdigest()

    async def get_cached_response(self, message: str) -> Optional[str]:
        """Get cached response for a message"""
        cache_key = self._generate_cache_key(message)

        if self.redis:
            try:
                cached = await self.redis.get(cache_key)
                if cached:
                    return cached.decode('utf-8')
            except:
                pass

        # Fallback to memory cache
        return self.memory_cache.get(cache_key)

    async def cache_response(self, message: str, response: str):
        """Cache a response for a message"""
        cache_key = self._generate_cache_key(message)

        if self.redis:
            try:
                await self.redis.setex(cache_key, self.cache_ttl, response)
                return
            except:
                pass

        # Fallback to memory cache
        self.memory_cache[cache_key] = response

    async def clear_cache(self):
        """Clear all cached responses"""
        if self.redis:
            try:
                await self.redis.flushdb()
            except:
                pass

        self.memory_cache.clear()

    async def get_cache_stats(self) -> dict:
        """Get cache statistics"""
        if self.redis:
            try:
                info = await self.redis.info()
                return {
                    "redis_connected": True,
                    "keys": info.get("db0", {}).get("keys", 0)
                }
            except:
                pass

        return {
            "redis_connected": False,
            "memory_cache_size": len(self.memory_cache)
        }