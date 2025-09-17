'use client';

import { useState, useEffect } from 'react';
import { chatAPI } from '@/lib/api';

export default function HealthTopics({ onTopicSelect, isVisible = false }) {
  const [topics, setTopics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isVisible && !topics) {
      loadTopics();
    }
  }, [isVisible, topics]);

  const loadTopics = async () => {
    setLoading(true);
    try {
      const data = await chatAPI.getHealthTopics();
      setTopics(data);
    } catch (error) {
      console.error('Failed to load health topics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="text-center text-gray-500">Loading health topics...</div>
      </div>
    );
  }

  if (!topics) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="font-semibold text-gray-800 mb-3">Health Topics</h3>
      <div className="grid grid-cols-2 gap-2">
        {topics.topics.map((topic) => (
          <button
            key={topic}
            onClick={() => onTopicSelect(topic, topics.descriptions[topic])}
            className="text-left p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="font-medium text-sm capitalize">
              {topic.replace('_', ' ')}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {topics.descriptions[topic]?.substring(0, 50)}...
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}