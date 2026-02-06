
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-6 px-4 mb-8 bg-white border-b border-slate-200 shadow-sm flex items-center justify-center gap-3">
      <div className="bg-indigo-600 p-2 rounded-lg text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 16 3-8 3 8"/><path d="M7 16V4"/><path d="M20 12h-4"/><path d="M11 12H7"/><path d="M11 16H7"/><circle cx="5" cy="16" r="3"/><path d="M17 16h6"/></svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 tracking-tight">SpellingBee Master</h1>
    </header>
  );
};

export default Header;
