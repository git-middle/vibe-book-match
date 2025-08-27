export type MoodType = 
  | 'うきうき' 
  | 'しんみり' 
  | 'ワクワク' 
  | '落ち着きたい' 
  | '泣きたい' 
  | '知的好奇心' 
  | '冒険したい' 
  | '恋愛気分' 
  | '元気がない' 
  | '集中したい';

export type MoodKey = 
  | 'ukiuki'
  | 'shinmiri' 
  | 'wakuwaku'
  | 'ochitsuki'
  | 'nakitai'
  | 'chishiki'
  | 'bouken'
  | 'renai'
  | 'genki-nai'
  | 'syuuchuu';

export interface MoodScore {
  mood: MoodType;
  score: number;
}

export interface Book {
  id: string;
  isbn?: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishYear?: number;
  summary?: string;
  ndc?: string;
  subjects?: string[];
  coverImage?: string;
  pageCount?: number;
  moodScores?: MoodScore[];
  holdings?: Holding[];
}

export interface Holding {
  id: string;
  location: string;
  callNumber: string;
  status: 'available' | 'checked_out' | 'reserved';
}

export interface SearchParams {
  moods: MoodType[];
  freeText?: string;
  filters?: {
    era?: 'all' | 'recent' | 'classic';
    length?: 'all' | 'short' | 'medium' | 'long';
    type?: 'all' | 'fiction' | 'non-fiction';
  };
  sortBy?: 'mood_match' | 'publication_date' | 'popularity';
}

export interface SearchResult {
  books: Book[];
  totalCount: number;
  searchId?: string;
}

export interface LibraryApiConfig {
  baseUrl?: string;
  apiKey?: string;
  useMock: boolean;
}