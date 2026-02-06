
import React, { useState } from 'react';
import { SpellingListData } from '../types';

interface ListSelectorProps {
  data: SpellingListData;
  onConfirm: (selectedLists: string[]) => void;
}

const ListSelector: React.FC<ListSelectorProps> = ({ data, onConfirm }) => {
  const listNames = Object.keys(data);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleList = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelected(next);
  };

  const handleStart = () => {
    if (selected.size > 0) {
      onConfirm(Array.from(selected));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-10 bg-white rounded-3xl shadow-2xl border border-slate-100">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2 text-center">Master Your Spelling</h2>
        <p className="text-slate-500 text-center">Select the lists you want to practice in this session.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-10">
        {listNames.map(name => (
          <label 
            key={name} 
            className={`flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              selected.has(name) 
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                : 'border-slate-100 hover:border-slate-200 text-slate-600'
            }`}
          >
            <input 
              type="checkbox" 
              className="w-5 h-5 mr-4 accent-indigo-600"
              checked={selected.has(name)}
              onChange={() => toggleList(name)}
            />
            <div className="flex-grow">
              <span className="font-bold text-lg">{name}</span>
              <span className="ml-2 text-sm opacity-60">({data[name].length} words)</span>
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={handleStart}
        disabled={selected.size === 0}
        className={`w-full py-5 rounded-2xl font-black text-xl shadow-lg transform transition-all active:scale-95 ${
          selected.size > 0 
            ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
            : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
        }`}
      >
        Start Round ({selected.size} Selected)
      </button>
    </div>
  );
};

export default ListSelector;
