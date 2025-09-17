'use client';

import { useState, useEffect } from 'react';
import { Brain, CheckCircle, XCircle, RotateCcw, Target } from 'lucide-react';
import { mcqAPI } from '@/lib/api';

export default function MCQQuiz({ userId, onClose }) {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [correctLabel, setCorrectLabel] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState(null);

  const fetchNextQuestion = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mcqAPI.getNextQuestion();
      setCurrentQuestion(data);
      setSelectedAnswer(null);
      setShowResult(false);
      setCorrectLabel(null);
      setExplanation('');
    } catch (error) {
      console.error('Error fetching question:', error);
      let errorMessage = 'Failed to load next question. Please try again.';
      
      if (error.response?.status === 404) {
        errorMessage = 'No more questions available. Check back later for new content!';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again in a moment.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !currentQuestion) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await mcqAPI.submitAttempt({
        question_id: currentQuestion.id,
        selected: selectedAnswer,
        user_id: userId
      });
      
      setIsCorrect(result.correct);
      setCorrectLabel(result.correct_label);
      setExplanation(result.explanation);
      setShowResult(true);
      
      // Update score
      setScore(prev => ({
        correct: prev.correct + (result.correct ? 1 : 0),
        total: prev.total + 1
      }));
    } catch (error) {
      console.error('Error submitting answer:', error);
      let errorMessage = 'Failed to submit answer. Please try again.';
      
      if (error.response?.status === 404) {
        errorMessage = 'Question not found. Please try a different question.';
      } else if (error.response?.status === 400) {
        const detail = error.response.data?.detail;
        errorMessage = detail || 'Invalid answer submission. Please try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again in a moment.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextQuestion();
  }, []);

  if (loading && !currentQuestion) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading quiz...</span>
        </div>
      </div>
    );
  }

  if (!currentQuestion && !error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <div className="text-center py-8">
          <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No questions available</h3>
          <p className="text-gray-600 mb-4">Check back later for new quiz questions!</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close Quiz
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
        <div className="text-center py-8">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Oops! Something went wrong</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={fetchNextQuestion}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Close Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Brain className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Health Quiz</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-600">
            <Target className="h-4 w-4 mr-1" />
            Score: {score.correct}/{score.total}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {currentQuestion.question}
          </h3>
          {currentQuestion.topic && (
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Topic: {currentQuestion.topic}
            </span>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {currentQuestion.options.map((option, index) => {
          const optionLabel = option.label; // Use the label from the option object
          const isSelected = selectedAnswer === optionLabel;
          const isCorrectAnswer = showResult && correctLabel === optionLabel;
          const isWrongSelected = showResult && isSelected && !isCorrect;
          
          return (
            <button
              key={index}
              onClick={() => !showResult && setSelectedAnswer(optionLabel)}
              disabled={showResult || loading}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                showResult
                  ? isCorrectAnswer
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : isWrongSelected
                    ? 'border-red-500 bg-red-50 text-red-800'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                  : isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-medium mr-3">
                  {optionLabel}
                </span>
                <span className="flex-1">{option.text}</span>
                {showResult && isCorrectAnswer && (
                  <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                )}
                {showResult && isWrongSelected && (
                  <XCircle className="h-5 w-5 text-red-600 ml-2" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Result */}
      {showResult && (
        <div className={`p-4 rounded-lg mb-6 ${
          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center mb-2">
            {isCorrect ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
            )}
            <span className={`font-medium ${
              isCorrect ? 'text-green-800' : 'text-red-800'
            }`}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </span>
          </div>
          {explanation && (
            <p className={`text-sm ${
              isCorrect ? 'text-green-700' : 'text-red-700'
            }`}>
              {explanation}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        {showResult ? (
          <button
            onClick={fetchNextQuestion}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : 'Next Question'}
          </button>
        ) : (
          <button
            onClick={submitAnswer}
            disabled={!selectedAnswer || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Answer'}
          </button>
        )}
        
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Close Quiz
        </button>
      </div>
    </div>
  );
}