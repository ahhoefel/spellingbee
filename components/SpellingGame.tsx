
import React, { useState, useEffect, useRef } from 'react';
import { playWordTTS } from '../services/geminiService';
import { WordResult } from '../types';

interface SpellingGameProps {
  words: string[];
  onFinish: (results: WordResult[]) => void;
}

const SpellingGame: React.FC<SpellingGameProps> = ({ words, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [results, setResults] = useState<WordResult[]>([]);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentWord = words[currentIndex];

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    announceWord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const announceWord = async () => {
    if (audioContextRef.current && currentWord) {
      setIsAudioLoading(true);
      await playWordTTS(currentWord, audioContextRef.current);
      setIsAudioLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback !== null || !userInput.trim()) return;

    const isCorrect = userInput.trim().toLowerCase() === currentWord.toLowerCase();
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    const result: WordResult = {
      word: currentWord,
      userInput: userInput.trim(),
      isCorrect,
      timestamp: Date.now()
    };

    setResults(prev => [...prev, result]);
  };

  const nextWord = () => {
    if (currentIndex + 1 < words.length) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setFeedback(null);
    } else {
      onFinish([...results]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center text-center">
      <div className="w-full flex justify-between items-center mb-10">
        <span className="text-sm font-medium text-slate-400">Word {currentIndex + 1} of {words.length}</span>
        <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-300" 
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>
      </div>

      <button
        onClick={announceWord}
        disabled={isAudioLoading}
        className={`group mb-8 p-6 rounded-full transition-all ${
          isAudioLoading 
            ? 'bg-slate-100 text-slate-400 scale-95' 
            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:scale-110 active:scale-95'
        }`}
      >
        {isAudioLoading ? (
          <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
        )}
      </button>

      <form onSubmit={handleSubmit} className="w-full">
        <input
          ref={inputRef}
          type="text"
          autoFocus
          disabled={feedback !== null}
          className={`w-full text-center text-3xl font-bold p-4 border-b-4 outline-none transition-all uppercase tracking-widest ${
            feedback === 'correct' ? 'border-green-500 text-green-600' : 
            feedback === 'incorrect' ? 'border-red-500 text-red-600' : 
            'border-slate-200 focus:border-indigo-500'
          }`}
          placeholder="TYPE HERE"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />

        {feedback === null && (
          <button
            type="submit"
            className="mt-8 px-8 py-3 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 transition-colors"
          >
            Check Spelling
          </button>
        )}
      </form>

      {feedback && (
        <div className="mt-8 animate-bounce-in">
          {feedback === 'correct' ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">✨</span>
              <p className="text-xl font-bold text-green-600">Perfect!</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">😕</span>
              <p className="text-xl font-bold text-red-600">Almost! It's spelled:</p>
              <p className="text-3xl font-black text-slate-800 tracking-wider uppercase">{currentWord}</p>
            </div>
          )}
          <button
            onClick={nextWord}
            className="mt-8 px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg transition-all"
          >
            {currentIndex + 1 < words.length ? 'Next Word' : 'See Final Results'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SpellingGame;
