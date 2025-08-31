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

  // ===== 追加: 「気分だけで検索したときに全部出る」を防ぐフィルタ =====
  const selectedMoods = new Set(params.moods ?? []);
  const hasQuery = !!params.freeText?.trim();

  let working = classifiedBooks;

  if (selectedMoods.size > 0) {
    // まず基本しきい値でフィルタ
    let threshold = hasQuery ? MIN_MOOD_WITH_QUERY : MIN_MOOD_ONLY;

    const filterOnce = (th: number) =>
      working
        .map(b => {
          const maxScore = maxSelectedMoodScore((b as any).moodScores, selectedMoods);
          return { b, maxScore };
        })
        .filter(x => x.maxScore >= th)
        .map(x => {
          // ランキング用：選択気分のスコア合計も計算（並べ替えに使う）
          const sumScore = ((x.b as any).moodScores ?? [])
            .filter((s: any) => selectedMoods.has(s.mood))
            .reduce((acc: number, s: any) => acc + s.score, 0);
          (x.b as any).__maxMood = x.maxScore;
          (x.b as any).__sumMood = sumScore;
          return x.b;
        });

    let filtered = filterOnce(threshold);

    // 0件のときだけ段階的に緩和（最低 MIN_MOOD_FLOOR まで）
    while (filtered.length === 0 && threshold > MIN_MOOD_FLOOR) {
      threshold = Math.max(MIN_MOOD_FLOOR, threshold - RELAX_STEP);
      filtered = filterOnce(threshold);
    }

    working = filtered;

    // 並べ替え：合計スコア -> 最大スコア -> タイトル
    working.sort((a: any, b: any) => {
      if (b.__sumMood !== a.__sumMood) return (b.__sumMood ?? 0) - (a.__sumMood ?? 0);
      if (b.__maxMood !== a.__maxMood) return (b.__maxMood ?? 0) - (a.__maxMood ?? 0);
      return (a.title ?? '').localeCompare(b.title ?? '');
    });
  } else {
    // 気分未選択時は従来通り（freeText や他フィルタのみ）
    // タイトルで安定ソートだけ足しておく
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
