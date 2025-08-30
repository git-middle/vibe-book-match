export type MoodType = 
  |'ゾクゾクしたい'
  |'泣きたい'
  |'キュンとしたい'
  |'元気が欲しい'
  |'不思議な世界へ'
  |'じっくり味わいたい'
  |'ほっとしたい'
  |'知的に楽しみたい';
  
export type MoodKey = 
  |'zokuzoku'
  |'nakitai'
  |'kyun'
  |'genki'
  |'fushigi'
  |'jikkuri'
  |'hotto'
  |'chiteki';

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