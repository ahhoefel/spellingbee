
export interface WordResult {
  word: string;
  userInput: string;
  isCorrect: boolean;
  timestamp: number;
}

export enum AppState {
  LOADING = 'LOADING',
  SELECTION = 'SELECTION',
  PRACTICE = 'PRACTICE',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}

export interface SpellingListData {
  [listName: string]: string[];
}

export interface PracticeSession {
  words: string[];
  currentIndex: number;
  results: WordResult[];
}
