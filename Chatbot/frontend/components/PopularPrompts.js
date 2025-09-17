'use client';

import { useState } from 'react';
import { MessageSquare, Heart, Brain, Apple, Zap, Users } from 'lucide-react';

export default function PopularPrompts({ onPromptSelect, isVisible = true }) {
  const popularPrompts = [
    {
      id: 1,
      text: "How can I eat healthier as a teenager?",
      category: "Nutrition",
      icon: Apple,
      color: "bg-green-100 text-green-700"
    },
    {
      id: 2,
      text: "I'm feeling stressed about school. What can I do?",
      category: "Mental Health",
      icon: Brain,
      color: "bg-blue-100 text-blue-700"
    },
    {
      id: 3,
      text: "How much sleep do I really need?",
      category: "Sleep & Rest",
      icon: Zap,
      color: "bg-purple-100 text-purple-700"
    },
    {
      id: 4,
      text: "What's normal during puberty?",
      category: "Development",
      icon: Heart,
      color: "bg-pink-100 text-pink-700"
    },
    {
      id: 5,
      text: "How do I deal with peer pressure?",
      category: "Social Health",
      icon: Users,
      color: "bg-orange-100 text-orange-700"
    },
    {
      id: 6,
      text: "What exercises are good for teens?",
      category: "Fitness",
      icon: Zap,
      color: "bg-red-100 text-red-700"
    }
  ];

  const [showAll, setShowAll] = useState(false);

  if (!isVisible) return null;

  const displayedPrompts = showAll ? popularPrompts : popularPrompts.slice(0, 4);

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm max-w-2xl">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-medium text-gray-800">Popular Health Questions</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        {displayedPrompts.map((prompt) => {
          const IconComponent = prompt.icon;
          return (
            <button
              key={prompt.id}
              onClick={() => onPromptSelect(prompt.text)}
              className="flex items-start gap-2 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${prompt.color}`}>
                <IconComponent className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 group-hover:text-gray-900 leading-relaxed">
                  {prompt.text}
                </p>
                <span className="text-xs text-gray-500 mt-1 block">
                  {prompt.category}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {!showAll && popularPrompts.length > 4 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-sm text-blue-600 hover:text-blue-700 py-2 border-t pt-3"
        >
          Show more questions...
        </button>
      )}

      {showAll && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full text-sm text-gray-500 hover:text-gray-600 py-2 border-t pt-3"
        >
          Show less
        </button>
      )}
    </div>
  );
}