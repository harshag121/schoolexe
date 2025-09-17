'use client';

import { useState, useEffect } from 'react';
import { chatAPI } from '@/lib/api';

export default function FollowUpQuestions({ userId, lastTopic, onQuestionSelect, visible = false }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && userId && lastTopic) {
      loadFollowUpQuestions();
    }
  }, [visible, userId, lastTopic]);

  const loadFollowUpQuestions = async () => {
    setLoading(true);
    try {
      const data = await chatAPI.getFollowUpQuestions(userId, lastTopic);
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Failed to load follow-up questions:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  if (!visible || loading) return null;

  if (questions.length === 0) return null;

  return (
    <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
      <div className="text-sm font-medium text-blue-800 mb-2">
        💡 You might also want to know:
      </div>
      <div className="space-y-1">
        {questions.slice(0, 3).map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionSelect(question)}
            className="block w-full text-left text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100 p-2 rounded transition-colors"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}