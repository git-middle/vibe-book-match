import { Book, MoodScore, MoodType } from '@/types/library';
import { ruleBasedAdjustments, moodToNdcCategories } from './moodMapping';

// LLM分類のモック（実際にはAPI呼び出しになる）
async function getLLMMoodClassification(book: Book): Promise<MoodScore[]> {
  // 実際のLLM呼び出しの代わりにモック分類
  const text = `${book.title} ${book.summary || ''} ${book.subjects?.join(' ') || ''}`;
  
  // 簡単なキーワードベースのモック分類
  const mockScores: MoodScore[] = [];
  
  // キーワードベースの簡単な分類
  if (text.includes('愛') || text.includes('恋') || text.includes('ロマンス')) {
    mockScores.push({ mood: '恋愛気分', score: 0.8 });
  }
  if (text.includes('科学') || text.includes('研究') || text.includes('学習')) {
    mockScores.push({ mood: '知的好奇心', score: 0.9 });
  }
  if (text.includes('冒険') || text.includes('旅') || text.includes('探検')) {
    mockScores.push({ mood: '冒険したい', score: 0.85 });
    mockScores.push({ mood: 'ワクワク', score: 0.7 });
  }
  if (text.includes('家族') || text.includes('人生') || text.includes('思い出')) {
    mockScores.push({ mood: 'しんみり', score: 0.8 });
  }
  if (text.includes('感動') || text.includes('涙') || text.includes('別れ')) {
    mockScores.push({ mood: '泣きたい', score: 0.9 });
  }
  if (text.includes('笑い') || text.includes('コメディ') || text.includes('ユーモア')) {
    mockScores.push({ mood: 'うきうき', score: 0.85 });
  }
  if (text.includes('癒し') || text.includes('希望') || text.includes('励まし')) {
    mockScores.push({ mood: '元気がない', score: 0.8 });
  }
  if (text.includes('詩') || text.includes('瞑想') || text.includes('静か')) {
    mockScores.push({ mood: '落ち着きたい', score: 0.8 });
  }
  if (text.includes('学習') || text.includes('仕事') || text.includes('技術')) {
    mockScores.push({ mood: '集中したい', score: 0.75 });
  }
  
  // デフォルトでランダムなスコアを追加（実際のLLMではより精密）
  if (mockScores.length === 0) {
    const allMoods: MoodType[] = ['うきうき', 'しんみり', 'ワクワク', '落ち着きたい', '泣きたい'];
    const randomMood = allMoods[Math.floor(Math.random() * allMoods.length)];
    mockScores.push({ mood: randomMood, score: 0.5 + Math.random() * 0.3 });
  }
  
  return mockScores.slice(0, 3); // 上位3つまで
}

// ルールベース補正
function applyRuleBasedCorrection(book: Book, llmScores: MoodScore[]): MoodScore[] {
  const scores = new Map<MoodType, number>();
  
  // LLMスコアをマップに設定
  llmScores.forEach(({ mood, score }) => {
    scores.set(mood, score * 0.7); // LLM重み0.7
  });
  
  const text = `${book.title} ${book.summary || ''} ${book.subjects?.join(' ') || ''}`.toLowerCase();
  
  // ルールベース補正を適用
  ruleBasedAdjustments.forEach(({ keywords, adjustments }) => {
    const hasKeyword = keywords.some(keyword => text.includes(keyword.toLowerCase()));
    if (hasKeyword) {
      adjustments.forEach(({ mood, scoreBoost }) => {
        const currentScore = scores.get(mood) || 0;
        scores.set(mood, Math.min(1.0, currentScore + scoreBoost * 0.3)); // ルール重み0.3
      });
    }
  });
  
  // NDCベース補正
  if (book.ndc) {
    Object.entries(moodToNdcCategories).forEach(([mood, ndcCategories]) => {
      const matchesNdc = ndcCategories.some(ndc => book.ndc?.startsWith(ndc));
      if (matchesNdc) {
        const currentScore = scores.get(mood as MoodType) || 0;
        scores.set(mood as MoodType, Math.min(1.0, currentScore + 0.2 * 0.3));
      }
    });
  }
  
  // スコア順でソートして上位3つを返す
  return Array.from(scores.entries())
    .map(([mood, score]) => ({ mood, score }))
    .filter(({ score }) => score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// メイン分類関数
export async function classifyBookMood(book: Book): Promise<MoodScore[]> {
  try {
    const llmScores = await getLLMMoodClassification(book);
    return applyRuleBasedCorrection(book, llmScores);
  } catch (error) {
    console.error('気分分類エラー:', error);
    // エラー時はデフォルトスコアを返す
    return [{ mood: 'しんみり', score: 0.5 }];
  }
}

// 複数の本を一括分類
export async function classifyBooksMood(books: Book[]): Promise<Book[]> {
  const classifiedBooks = await Promise.all(
    books.map(async (book) => {
      const moodScores = await classifyBookMood(book);
      return { ...book, moodScores };
    })
  );
  
  return classifiedBooks;
}