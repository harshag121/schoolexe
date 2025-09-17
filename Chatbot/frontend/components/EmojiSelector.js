'use client';

import { enhancedEmojis, emojiTopicMapping } from '@/lib/session';

export default function EmojiSelector({ onEmojiSelect, selectedEmoji, showPersistent = false }) {
  const handleEmojiClick = (emoji) => {
    const mapping = emojiTopicMapping[emoji];
    onEmojiSelect(emoji, mapping);
  };

  if (!showPersistent && selectedEmoji) {
    return null; // Hide after selection unless persistent
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-3">
      <div className="text-xs text-gray-600 mb-2 text-center">
        How are you feeling?
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {enhancedEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleEmojiClick(emoji)}
            className={`w-10 h-10 text-2xl rounded-full border-2 transition-all duration-200 hover:scale-110 ${
              selectedEmoji === emoji
                ? 'border-blue-500 bg-blue-50 scale-110 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            title={emojiTopicMapping[emoji]?.message || 'Select this mood'}
          >
            {emoji}
          </button>
        ))}
      </div>
      {showPersistent && (
        <div className="text-xs text-gray-500 mt-2 text-center">
          Click to express your mood anytime
        </div>
      )}
    </div>
  );
}