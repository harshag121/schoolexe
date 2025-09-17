'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, BookOpen, HelpCircle } from 'lucide-react';

export default function MCQFormatter({ content, onStartQuiz }) {
  const [showFormatted, setShowFormatted] = useState(false);

  // Check if content contains MCQ-like structure
  const isMCQContent = (text) => {
    return text.includes('**Question') && text.includes('**Answer:') && text.includes('**Explanation:');
  };

  // Parse MCQ content into structured format
  const parseMCQs = (text) => {
    const questions = [];
    const questionBlocks = text.split('---').filter(block => block.trim());
    
    questionBlocks.forEach((block, index) => {
      const questionMatch = block.match(/\*\*Question \d+:\*\*\s*(.+?)(?=\n[A-D]\))/s);
      const answerMatch = block.match(/\*\*Answer:\*\*\s*([A-D])\)\s*(.+?)(?=\n|$)/s);
      const explanationMatch = block.match(/\*\*Explanation:\*\*\s*(.+?)(?=\n|$)/s);
      
      if (questionMatch) {
        const optionsText = block.substring(
          block.indexOf(questionMatch[0]) + questionMatch[0].length,
          block.indexOf('**Answer:**')
        );
        
        const options = [];
        const optionMatches = optionsText.match(/([A-D])\)\s*(.+?)(?=\n[A-D]\)|$)/g);
        
        if (optionMatches) {
          optionMatches.forEach(opt => {
            const [, label, text] = opt.match(/([A-D])\)\s*(.+)/);
            options.push({ label: label.trim(), text: text.trim() });
          });
        }
        
        questions.push({
          id: index + 1,
          question: questionMatch[1].trim(),
          options,
          correctAnswer: answerMatch ? answerMatch[1] : null,
          explanation: explanationMatch ? explanationMatch[1].trim() : null
        });
      }
    });
    
    return questions;
  };

  if (!isMCQContent(content)) {
    return (
      <div className="text-gray-800 whitespace-pre-wrap">
        {content}
      </div>
    );
  }

  const questions = parseMCQs(content);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-gray-900">Quiz Questions</span>
          <span className="text-sm text-gray-500">({questions.length} questions)</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFormatted(!showFormatted)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            {showFormatted ? 'Show Raw' : 'Format Quiz'}
          </button>
          {onStartQuiz && (
            <button
              onClick={() => onStartQuiz(questions)}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              Start Interactive Quiz
            </button>
          )}
        </div>
      </div>

      {showFormatted ? (
        <div className="space-y-6">
          {questions.map((q, index) => (
            <MCQQuestion key={q.id} question={q} questionNumber={index + 1} />
          ))}
        </div>
      ) : (
        <div className="text-gray-800 whitespace-pre-wrap text-sm">
          {content}
        </div>
      )}
    </div>
  );
}

function MCQQuestion({ question, questionNumber }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleOptionClick = (optionLabel) => {
    setSelectedAnswer(optionLabel);
    setShowAnswer(true);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border">
      <div className="mb-4">
        <h3 className="font-medium text-gray-900 mb-2">
          Question {questionNumber}: {question.question}
        </h3>
      </div>

      <div className="space-y-2 mb-4">
        {question.options.map((option) => {
          const isCorrect = option.label === question.correctAnswer;
          const isSelected = option.label === selectedAnswer;
          const isWrong = isSelected && !isCorrect;

          return (
            <button
              key={option.label}
              onClick={() => handleOptionClick(option.label)}
              disabled={showAnswer}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                showAnswer
                  ? isCorrect
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : isWrong
                    ? 'border-red-500 bg-red-50 text-red-800'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                  : isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-medium mr-3">
                    {option.label}
                  </span>
                  <span className="flex-1">{option.text}</span>
                </div>
                {showAnswer && isCorrect && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {showAnswer && isWrong && (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {showAnswer && question.explanation && (
        <div className={`p-3 rounded-lg border ${
          selectedAnswer === question.correctAnswer
            ? 'bg-green-50 border-green-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start">
            <HelpCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Explanation:</p>
              <p className="text-sm text-gray-700">{question.explanation}</p>
            </div>
          </div>
        </div>
      )}

      {!showAnswer && (
        <div className="text-center">
          <p className="text-sm text-gray-500">Select an answer to see the explanation</p>
        </div>
      )}
    </div>
  );
}