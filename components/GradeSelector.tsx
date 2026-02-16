// /Users/hoefel/dev/spellingbee/components/GradeSelector.tsx

import React from 'react';

interface GradeSelectorProps {
    onSelect: (grade: string) => void;
}

const GradeSelector: React.FC<GradeSelectorProps> = ({ onSelect }) => {
    return (
        <div className="max-w-2xl mx-auto p-10 bg-white rounded-3xl shadow-2xl border border-slate-100 text-center">
            <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Select Your Grade</h2>
                <p className="text-slate-500">Choose your grade level to start practicing.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                    onClick={() => onSelect('4')}
                    className="p-8 rounded-2xl border-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                >
                    <div className="text-4xl font-black text-indigo-600 mb-2 group-hover:scale-110 transform transition-transform">Grade 4</div>
                </button>

                <button
                    onClick={() => onSelect('5')}
                    className="p-8 rounded-2xl border-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                >
                    <div className="text-4xl font-black text-indigo-600 mb-2 group-hover:scale-110 transform transition-transform">Grade 5</div>
                </button>
            </div>
        </div>
    );
};

export default GradeSelector;
