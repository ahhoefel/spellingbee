
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ListSelector from './components/ListSelector';
import SpellingGame from './components/SpellingGame';
import Stats from './components/Stats';
import { AppState, WordResult, SpellingListData } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [csvData, setCsvData] = useState<SpellingListData | null>(null);
  const [practiceWords, setPracticeWords] = useState<string[]>([]);
  const [sessionResults, setSessionResults] = useState<WordResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const loadStaticLists = async () => {
      try {
        const response = await fetch('./lists.csv');
        if (!response.ok) throw new Error('Failed to load spelling lists.');
        const text = await response.text();
        const parsedData = parseCSV(text);
        setCsvData(parsedData);
        setAppState(AppState.SELECTION);
      } catch (error) {
        console.error(error);
        setErrorMessage('Could not load the spelling word lists. Please try refreshing the page.');
        setAppState(AppState.ERROR);
      }
    };

    loadStaticLists();
  }, []);

  const parseCSV = (text: string): SpellingListData => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return {};

    const headers = lines[0].split(',').map(h => h.trim());
    const data: SpellingListData = {};
    headers.forEach(h => { data[h] = []; });

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(cell => cell.trim());
      row.forEach((cell, colIdx) => {
        if (headers[colIdx] && cell) {
          data[headers[colIdx]].push(cell);
        }
      });
    }
    return data;
  };

  const shuffleArray = (array: string[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startPractice = (selectedLists: string[]) => {
    if (!csvData) return;
    
    const combinedSet = new Set<string>();
    selectedLists.forEach(listName => {
      csvData[listName].forEach(word => combinedSet.add(word));
    });
    
    const wordsToPractice = shuffleArray(Array.from(combinedSet));
    setPracticeWords(wordsToPractice);
    setAppState(AppState.PRACTICE);
  };

  const finishPractice = (results: WordResult[]) => {
    setSessionResults(results);
    setAppState(AppState.RESULTS);
  };

  const restart = () => {
    setAppState(AppState.SELECTION);
    setPracticeWords([]);
    setSessionResults([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 pb-12">
        {appState === AppState.LOADING && (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Loading spelling lists...</p>
          </div>
        )}

        {appState === AppState.ERROR && (
          <div className="max-w-md mx-auto p-8 bg-red-50 rounded-2xl border border-red-100 text-center">
            <div className="text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Oops!</h2>
            <p className="text-red-600 mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {appState === AppState.SELECTION && csvData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ListSelector 
              data={csvData} 
              onConfirm={startPractice} 
            />
          </div>
        )}
        
        {appState === AppState.PRACTICE && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <SpellingGame words={practiceWords} onFinish={finishPractice} />
          </div>
        )}
        
        {appState === AppState.RESULTS && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Stats results={sessionResults} onRestart={restart} />
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-slate-400 text-sm">
        <p>&copy; 2024 SpellingBee Master • Powered by Gemini AI</p>
      </footer>
    </div>
  );
};

export default App;
