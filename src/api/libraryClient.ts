import { Book, SearchParams, SearchResult, LibraryApiConfig } from '@/types/library';
import { classifyBooksMood } from '@/lib/moodClassifier';

let mockBooks: Book[] = [];

// JSONを読み込む
async function loadMockBooks() {
  if (mockBooks.length === 0) {
    const res = await fetch('/books.json');
    const data = await res.json();

    // JSONが { "items": [ ... ] } の形なので、itemsを変換
    mockBooks = data.items.map((raw: any) => ({
      id: raw.id,
      title: raw.title,
      authors: raw.authors || [],
      publishYear: raw.pubYear,
      summary: raw.summary || "",

      // 以下はダミーや空値
      isbn: "",
      publisher: "",
      ndc: "",
      subjects: [],
      coverImage: "/mock/covers/noimage.png", // 画像なしの時のデフォルト
      pageCount: undefined,
      holdings: []
    }));
  }
  return mockBooks;
}


// デフォルト設定
const defaultConfig: LibraryApiConfig = {
  baseUrl: '/api/library',
  useMock: true
};

let config = defaultConfig;

export function setLibraryConfig(newConfig: Partial<LibraryApiConfig>) {
  config = { ...config, ...newConfig };
}

export function getLibraryConfig(): LibraryApiConfig {
  return config;
}

// モック検索 別ファイルより
async function mockSearch(params: SearchParams): Promise<SearchResult> {
  await new Promise(resolve => setTimeout(resolve, 500));

  let filteredBooks = await loadMockBooks();
  filteredBooks = [...filteredBooks];
  
  // テキスト検索フィルタ
  if (params.freeText) {
    const searchText = params.freeText.toLowerCase();
    filteredBooks = filteredBooks.filter(book => 
      book.title.toLowerCase().includes(searchText) ||
      book.summary?.toLowerCase().includes(searchText) ||
      book.authors.some(author => author.toLowerCase().includes(searchText)) ||
      book.subjects?.some(subject => subject.toLowerCase().includes(searchText))
    );
  }
  
  // フィルタ適用
  if (params.filters) {
    const { era, length, type } = params.filters;
    
    if (era && era !== 'all') {
      const currentYear = new Date().getFullYear();
      filteredBooks = filteredBooks.filter(book => {
        if (!book.publishYear) return true;
        if (era === 'recent') return currentYear - book.publishYear <= 10;
        if (era === 'classic') return currentYear - book.publishYear > 50;
        return true;
      });
    }
    
    if (length && length !== 'all') {
      filteredBooks = filteredBooks.filter(book => {
        if (!book.pageCount) return true;
        if (length === 'short') return book.pageCount <= 200;
        if (length === 'medium') return book.pageCount > 200 && book.pageCount <= 400;
        if (length === 'long') return book.pageCount > 400;
        return true;
      });
    }
    
    if (type && type !== 'all') {
      filteredBooks = filteredBooks.filter(book => {
        if (!book.ndc) return true;
        const isNonFiction = book.ndc.startsWith('0') || book.ndc.startsWith('1') || 
                           book.ndc.startsWith('2') || book.ndc.startsWith('3') || 
                           book.ndc.startsWith('4') || book.ndc.startsWith('5') ||
                           book.ndc.startsWith('6') || book.ndc.startsWith('7');
        return type === 'fiction' ? !isNonFiction : isNonFiction;
      });
    }
  }
  
  // 気分分類を追加
  const classifiedBooks = await classifyBooksMood(filteredBooks);
  
  // 気分マッチングでソート
  if (params.moods.length > 0) {
    classifiedBooks.forEach(book => {
      if (book.moodScores) {
        const matchScore = book.moodScores
          .filter(score => params.moods.includes(score.mood))
          .reduce((sum, score) => sum + score.score, 0);
        (book as any).__matchScore = matchScore;
      }
    });
    
    classifiedBooks.sort((a, b) => {
      const aScore = (a as any).__matchScore || 0;
      const bScore = (b as any).__matchScore || 0;
      return bScore - aScore;
    });
  }
  
  return {
    books: classifiedBooks,
    totalCount: classifiedBooks.length
  };
}

// 実API検索関数（未実装）
async function realApiSearch(params: SearchParams): Promise<SearchResult> {
  const response = await fetch(`${config.baseUrl}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
    },
    body: JSON.stringify(params)
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
}

// 検索API
export async function searchBooks(params: SearchParams): Promise<SearchResult> {
  if (config.useMock) {
    return mockSearch(params);
  } else {
    return realApiSearch(params);
  }
}

// 本の詳細取得
export async function getBook(id: string): Promise<Book | null> {
  if (config.useMock) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const book = mockBooks.find(b => b.id === id);
    if (book) {
      // 気分分類を追加
      const [classifiedBook] = await classifyBooksMood([book]);
      return classifiedBook;
    }
    return null;
  } else {
    const response = await fetch(`${config.baseUrl}/books/${id}`, {
      headers: {
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
}

// 類似本の取得
export async function getSimilarBooks(bookId: string): Promise<Book[]> {
  if (config.useMock) {
    await new Promise(resolve => setTimeout(resolve, 300));
    // 簡単な類似本ロジック：同じNDCカテゴリの本
    const book = mockBooks.find(b => b.id === bookId);
    if (!book) return [];
    
    const similar = mockBooks
      .filter(b => b.id !== bookId && b.ndc?.substring(0, 3) === book.ndc?.substring(0, 3))
      .slice(0, 3);
    
    return classifyBooksMood(similar);
  } else {
    const response = await fetch(`${config.baseUrl}/similar/${bookId}`, {
      headers: {
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
}