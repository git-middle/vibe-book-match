import { Book, SearchParams, SearchResult, LibraryApiConfig } from '@/types/library';
import { classifyBooksMood } from '@/lib/moodClassifier';

// モックデータ
const mockBooks: Book[] = [
  {
    id: '1',
    isbn: '9784101092157',
    title: '海辺のカフカ',
    authors: ['村上春樹'],
    publisher: '新潮社',
    publishYear: 2005,
    summary: '15歳の少年カフカと、猫と話せる老人ナカタさんの不思議な冒険物語。現実と非現実が交差する、美しくも謎めいた長編小説。',
    ndc: '913.6',
    subjects: ['日本文学', '小説', '現代文学'],
    coverImage: '/mock/covers/kafka.jpg',
    pageCount: 544,
    holdings: [
      { id: '1-1', location: '2階文学コーナー', callNumber: '913.6/ム', status: 'available' },
      { id: '1-2', location: '1階新着コーナー', callNumber: '913.6/ム', status: 'checked_out' }
    ]
  },
  {
    id: '2',
    isbn: '9784003311219',
    title: '坊っちゃん',
    authors: ['夏目漱石'],
    publisher: '岩波書店',
    publishYear: 1906,
    summary: '江戸っ子気質の青年教師が四国の中学校で巻き起こすユーモラスな騒動を描いた、漱石初期の代表作。',
    ndc: '913.6',
    subjects: ['日本文学', '小説', '明治文学'],
    coverImage: '/mock/covers/botchan.jpg',
    pageCount: 224,
    holdings: [
      { id: '2-1', location: '2階文学コーナー', callNumber: '913.6/ナ', status: 'available' }
    ]
  },
  {
    id: '3',
    isbn: '9784003368015',
    title: '宇宙からの帰還',
    authors: ['立花隆'],
    publisher: '中央公論新社',
    publishYear: 1985,
    summary: 'アポロ計画の宇宙飛行士たちが体験した神秘的な体験と、それが彼らの人生観に与えた影響を丹念に追ったノンフィクション。',
    ndc: '538.9',
    subjects: ['宇宙開発', 'アポロ計画', '科学技術'],
    coverImage: '/mock/covers/space.jpg',
    pageCount: 512,
    holdings: [
      { id: '3-1', location: '1階科学コーナー', callNumber: '538.9/タ', status: 'available' }
    ]
  },
  {
    id: '4',
    isbn: '9784167158057',
    title: '容疑者Xの献身',
    authors: ['東野圭吾'],
    publisher: '文藝春秋',
    publishYear: 2008,
    summary: '天才数学者が隣人の殺人事件に関わる完全犯罪を企てるが、物理学者湯川学との頭脳戦が始まる。直木賞受賞作品。',
    ndc: '913.6',
    subjects: ['日本文学', 'ミステリー', '推理小説'],
    coverImage: '/mock/covers/suspect.jpg',
    pageCount: 394,
    holdings: [
      { id: '4-1', location: '2階文学コーナー', callNumber: '913.6/ヒ', status: 'reserved' },
      { id: '4-2', location: '3階文庫コーナー', callNumber: 'B913.6/ヒ', status: 'available' }
    ]
  },
  {
    id: '5',
    isbn: '9784101001210',
    title: 'こころ',
    authors: ['夏目漱石'],
    publisher: '新潮社',
    publishYear: 1914,
    summary: '明治時代の知識人の孤独と苦悩を描いた、日本近代文学の代表作。先生と私、そしてKとの友情と恋愛の悲劇を通して人間の心の奥底を探る。',
    ndc: '913.6',
    subjects: ['日本文学', '小説', '明治文学', '心理小説'],
    coverImage: '/mock/covers/kokoro.jpg',
    pageCount: 248,
    holdings: [
      { id: '5-1', location: '2階文学コーナー', callNumber: '913.6/ナ', status: 'available' },
      { id: '5-2', location: '3階文庫コーナー', callNumber: 'B913.6/ナ', status: 'available' }
    ]
  },
  {
    id: '6',
    isbn: '9784061596230',
    title: '銃・病原菌・鉄',
    authors: ['ジャレド・ダイアモンド', '倉骨彰訳'],
    publisher: '草思社',
    publishYear: 2012,
    summary: '人類史における文明の格差がどのように生まれたのかを、地理的・環境的要因から解き明かした名著。ピュリッツァー賞受賞作。',
    ndc: '204',
    subjects: ['世界史', '人類学', '文明論'],
    coverImage: '/mock/covers/guns.jpg',
    pageCount: 528,
    holdings: [
      { id: '6-1', location: '1階歴史コーナー', callNumber: '204/ダ', status: 'available' }
    ]
  }
];

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

// モック検索関数
async function mockSearch(params: SearchParams): Promise<SearchResult> {
  // シミュレーション遅延
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredBooks = [...mockBooks];
  
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