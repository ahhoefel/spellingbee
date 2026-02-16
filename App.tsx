
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ListSelector from './components/ListSelector';
import SpellingGame from './components/SpellingGame';
import GradeSelector from './components/GradeSelector';
import Stats from './components/Stats';
import { AppState, WordResult, SpellingListData } from './types';
import { auth, googleProvider } from './services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

const SKIP_AUTH = true;

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(AppState.SELECTION);
    const [csvData, setCsvData] = useState<SpellingListData | null>(null);
    const [practiceWords, setPracticeWords] = useState<string[]>([]);
    const [sentences, setSentences] = useState<Record<string, string>>({});
    const [sessionResults, setSessionResults] = useState<WordResult[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [selectedGrade, setSelectedGrade] = useState<string | null>(null);

    useEffect(() => {
        if (SKIP_AUTH) {
            setAuthLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const loadData = async (grade: string) => {
        setAppState(AppState.LOADING);
        try {
            const listFile = grade === '5' ? './lists_grade5.csv' : './lists.csv';
            const sentencesFile = grade === '5' ? './sentences_grade5.csv' : './sentences.csv';

            const [listsResponse, sentencesResponse] = await Promise.all([
                fetch(listFile),
                fetch(sentencesFile).catch(() => null)
            ]);

            if (!listsResponse.ok) throw new Error(`Failed to load spelling lists for Grade ${grade}.`);
            const listsText = await listsResponse.text();
            if (listsText.trim().startsWith('<!DOCTYPE')) {
                // throw new Error(`Received HTML instead of CSV. Ensure ${listFile} is in the public/ folder.`);
                throw new Error(`Whoops. I don't have the words yet. Can someone send Andrew the file?`);
            }
            const parsedData = parseCSV(listsText);

            if (sentencesResponse && sentencesResponse.ok) {
                const sentencesText = await sentencesResponse.text();
                setSentences(parseSentences(sentencesText));
            }

            setCsvData(parsedData);
            setAppState(AppState.SELECTION);
        } catch (error) {
            console.error(error);
            setErrorMessage(error instanceof Error ? error.message : 'Could not load the spelling word lists.');
            setAppState(AppState.ERROR);
        }
    };

    const parseSentences = (text: string): Record<string, string> => {
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        const data: Record<string, string> = {};
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const firstComma = line.indexOf(',');
            if (firstComma > -1) {
                const word = line.substring(0, firstComma).trim();
                let sentence = line.substring(firstComma + 1).trim();
                if (sentence.startsWith('"') && sentence.endsWith('"')) {
                    sentence = sentence.slice(1, -1).replace(/""/g, '"');
                }
                data[word] = sentence;
            }
        }
        return data;
    };

    const handleGradeSelect = (grade: string) => {
        setSelectedGrade(grade);
        loadData(grade);
    };

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

    const handleSignIn = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error signing in", error);
            setErrorMessage("Failed to sign in with Google.");
            setAppState(AppState.ERROR);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            {!authLoading && user && (
                <div className="bg-indigo-50 border-b border-indigo-100 py-2 px-4">
                    <div className="container mx-auto flex justify-between items-center">
                        <span className="text-sm text-indigo-900">Signed in as <strong>{user.displayName || user.email}</strong></span>
                        <button
                            onClick={() => signOut(auth)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            )}

            <main className="flex-grow container mx-auto px-4 pb-12">
                {authLoading && (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-medium">Checking authentication...</p>
                    </div>
                )}

                {!authLoading && !user && !SKIP_AUTH && (
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Welcome Back</h2>
                            <p className="text-slate-500 mb-8">Sign in to access your spelling lists and track progress.</p>
                            <button
                                onClick={handleSignIn}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-3"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Sign in with Google
                            </button>
                        </div>
                    </div>
                )}

                {!authLoading && (user || SKIP_AUTH) && appState === AppState.LOADING && (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-medium">Loading spelling lists...</p>
                    </div>
                )}

                {!authLoading && (user || SKIP_AUTH) && appState === AppState.ERROR && (
                    <div className="max-w-md mx-auto p-8 bg-red-50 rounded-2xl border border-red-100 text-center">
                        <div className="text-red-500 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
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

                {!authLoading && (user || SKIP_AUTH) && appState === AppState.SELECTION && !selectedGrade && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <GradeSelector onSelect={handleGradeSelect} />
                    </div>
                )}

                {!authLoading && (user || SKIP_AUTH) && appState === AppState.SELECTION && selectedGrade && csvData && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <ListSelector
                            data={csvData}
                            onConfirm={startPractice}
                        />
                    </div>
                )}

                {!authLoading && (user || SKIP_AUTH) && appState === AppState.PRACTICE && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <SpellingGame words={practiceWords} sentences={sentences} onFinish={finishPractice} />
                    </div>
                )}

                {!authLoading && (user || SKIP_AUTH) && appState === AppState.RESULTS && (
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
