import { Book, SearchParams, SearchResult, LibraryApiConfig } from '@/types/library';
import { classifyBooksMood } from '@/lib/moodClassifier';

let mockBooks: Book[] = [];

// ===== しきい値設定 =====
const MIN_MOOD_ONLY = 0.40;       // 気分のみ検索時の基本しきい値
const MIN_MOOD_WITH_QUERY = 0.25; // 気分 + キーワード併用時
const MIN_MOOD_FLOOR = 0.20;      // 緩和の下限
const RELAX_STEP = 0.05;          // 段階的に緩和する幅

// ===== 選択気分に対する最大スコアを取り出す =====
function maxSelectedMoodScore(
  moodScores: { mood: string; score: number }[] | undefined,
  selected: Set<string>
): number {
  if (!moodScores || moodScores.length === 0 || selected.size === 0) return 0;
  let max = 0;
  for (const s of moodScores) {
    if (selected.has(s.mood) && s.score > max) max = s.score;
  }
  return max;
}

// JSONを読み込む
async function loadMockBooks() {
  if (mockBooks.length === 0) {
    const res = await fetch('/books.json');
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];

    mockBooks = items.map((raw: any) => ({
      id: raw.id ?? "",
      title: raw.title ?? "",
      authors: raw.authors ?? [],
      publishYear: raw.pubYear ?? undefined,
      summary: raw.summary ?? "",
      isbn: "",
      publisher: "",
      ndc: "",
      subjects: [],
      pageCount: undefined,
      holdings: [],
      detailUrl: raw.detailUrl ?? null,
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

// ====== ここから置き換え：mockSearch ======
async function mockSearch(params: SearchParams): Promise<SearchResult> {
  await new Promise(resolve => setTimeout(resolve, 500));

  let filteredBooks = await loadMockBooks();
  filteredBooks = [...filteredBooks];

  // テキスト検索フィルタ
  if (params.freeText?.trim()) {
    const searchText = params.freeText.toLowerCase().trim();
    filteredBooks = filteredBooks.filter(book =>
      book.title.toLowerCase().includes(searchText) ||
      book.summary?.toLowerCase().includes(searchText) ||
      book.authors.some(author => author.toLowerCase().includes(searchText)) ||
      book.subjects?.some(subject => subject.toLowerCase().includes(searchText))
    );
  }

  // 既存フィルタ（era / length / type）
  if (params.filters) {
    const { era, length, type } = params.filters;

    if (era && era !== 'all') {
      const currentYear = new Date().getFullYear();
      filteredBooks = filteredBooks.filter(book => {
        if (!book.publishYear) return true;
        if (era === 'recent')  return currentYear - book.publishYear <= 10;
        if (era === 'classic') return currentYear - book.publishYear > 50;
        return true;
      });
    }

    if (length && length !== 'all') {
      filteredBooks = filteredBooks.filter(book => {
        if (!book.pageCount) return true;
        if (length === 'short')  return book.pageCount <= 200;
        if (length === 'medium') return book.pageCount > 200 && book.pageCount <= 400;
        if (length === 'long')   return book.pageCount > 400;
        return true;
      });
    }

    if (type && type !== 'all') {
      filteredBooks = filteredBooks.filter(book => {
        if (!book.ndc) return true;
        const isNonFiction =
          book.ndc.startsWith('0') || book.ndc.startsWith('1') ||
          book.ndc.startsWith('2') || book.ndc.startsWith('3') ||
          book.ndc.startsWith('4') || book.ndc.startsWith('5') ||
          book.ndc.startsWith('6') || book.ndc.startsWith('7');
        return type === 'fiction' ? !isNonFiction : isNonFiction;
      });
    }
  }

  // 気分分類（各 book に moodScores を付加）
  const classifiedBooks = await classifyBooksMood(filteredBooks);

  // ===== AND条件での気分フィルタ（各気分がしきい値以上） =====
const selectedMoods = new Set(params.moods ?? []);
const hasQuery = !!params.freeText?.trim();

let working = classifiedBooks;

if (selectedMoods.size > 0) {
  // しきい値：気分のみ検索は高め、キーワード併用時は少し緩め
  let thresholdEach = hasQuery ? 0.25 : 0.40;
  const FLOOR = 0.20;      // 下限
  const STEP = 0.05;       // 緩和幅

  // moodScores を {mood -> score} にしておく
  const toScoreMap = (ms: any[] | undefined) => {
    const map = new Map<string, number>();
    (ms ?? []).forEach(s => map.set(s.mood, s.score));
    return map;
  };

  const filterOnce = (th: number) =>
    working
      .map(b => {
        const map = toScoreMap((b as any).moodScores);
        // AND判定：選択した各気分が th 以上か？
        const eachScores = Array.from(selectedMoods).map(m => map.get(m) ?? 0);
        const pass = eachScores.every(s => s >= th);
        // ソート用の集計（通過したものだけ意味あり）
        const sum = eachScores.reduce((a, s) => a + s, 0);
        const min = Math.min(...eachScores);
        return { b, pass, sum, min };
      })
      .filter(x => x.pass)
      .map(x => {
        (x.b as any).__sumMood = x.sum;
        (x.b as any).__minMood = x.min;
        return x.b;
      });

  // まず基本しきい値で試す
  let filtered = filterOnce(thresholdEach);

  // 0件のときのみ、段階的に緩和（ANDを維持したまま）
  while (filtered.length === 0 && thresholdEach > FLOOR) {
    thresholdEach = Math.max(FLOOR, thresholdEach - STEP);
    filtered = filterOnce(thresholdEach);
  }

  working = filtered;

  // 並べ替え：合計スコア -> 最小スコア（均一性） -> タイトル
  working.sort((a: any, b: any) => {
    if ((b.__sumMood ?? 0) !== (a.__sumMood ?? 0)) {
      return (b.__sumMood ?? 0) - (a.__sumMood ?? 0);
    }
    if ((b.__minMood ?? 0) !== (a.__minMood ?? 0)) {
      return (b.__minMood ?? 0) - (a.__minMood ?? 0);
    }
    return (a.title ?? '').localeCompare(b.title ?? '');
  });
} else {
  // 気分未選択時は従来どおり
  working = [...classifiedBooks].sort((a, b) =>
    (a.title ?? '').localeCompare(b.title ?? '')
  );
}

  return {
    books: working,
    totalCount: working.length
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
  return config.useMock ? mockSearch(params) : realApiSearch(params);
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
