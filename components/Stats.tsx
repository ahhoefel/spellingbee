
import React from 'react';
import { WordResult } from '../types';

interface StatsProps {
  results: WordResult[];
  onRestart: () => void;
}

const Stats: React.FC<StatsProps> = ({ results, onRestart }) => {
  const correctCount = results.filter(r => r.isCorrect).length;
  const percentage = Math.round((correctCount / results.length) * 100);

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Practice Complete!</h2>
        <div className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold uppercase tracking-wider">
          Performance Summary
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 bg-slate-50 rounded-2xl text-center border border-slate-100">
          <p className="text-slate-500 text-sm mb-1">Accuracy</p>
          <p className="text-4xl font-black text-indigo-600">{percentage}%</p>
        </div>
        <div className="p-6 bg-green-50 rounded-2xl text-center border border-green-100">
          <p className="text-green-600 text-sm mb-1">Correct</p>
          <p className="text-4xl font-black text-green-700">{correctCount}</p>
        </div>
        <div className="p-6 bg-slate-50 rounded-2xl text-center border border-slate-100">
          <p className="text-slate-500 text-sm mb-1">Total Words</p>
          <p className="text-4xl font-black text-slate-700">{results.length}</p>
        </div>
      </div>

      <div className="mb-10">
        <h3 className="font-bold text-slate-700 mb-4 px-2">Word Breakdown</h3>
        <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-3">Word</th>
                <th className="px-6 py-3">Your Answer</th>
                <th className="px-6 py-3 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {results.map((result, idx) => (
                <tr key={idx} className="hover:bg-white transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-800">{result.word}</td>
                  <td className="px-6 py-4 text-slate-600 font-mono">{result.userInput}</td>
                  <td className="px-6 py-4 text-right">
                    {result.isCorrect ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-500 font-bold">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold text-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        New Practice Session
      </button>
    </div>
  );
};

export default Stats;
