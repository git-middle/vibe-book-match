import { Book, MoodScore, MoodType } from '@/types/library';
import { ruleBasedAdjustments, moodToNdcCategories } from './moodMapping';

// 文字正規化（表記ゆれ対策）
const normalize = (s: string) => s.normalize('NFKC').toLowerCase();

// LLM分類のモック（実際にはAPI呼び出しになる）
async function getLLMMoodClassification(book: Book): Promise<MoodScore[]> {
  // 実際のLLM呼び出しの代わりにモック分類
  const raw = `${book.title} ${book.summary || ''} ${book.subjects?.join(' ') || ''}`;
  const text = normalize(raw);

  const mockScores: MoodScore[] = [];

  // ── 新8分類に対応した簡易ヒューリスティクス ──
  // 恋愛・青春 → キュン
  if (text.includes('恋') || text.includes('愛') || text.includes('ロマンス') || text.includes('学園')) {
    mockScores.push({ mood: 'キュンとしたい', score: 0.8 });
  }

  // ミステリ・サスペンス・ホラー → ゾクゾク
  if (
    text.includes('ミステリ') || text.includes('サスペンス') || text.includes('推理') ||
    text.includes('探偵') || text.includes('ホラー') || text.includes('怪異') || text.includes('怪談')
  ) {
    mockScores.push({ mood: 'ゾクゾクしたい', score: 0.9 });
    // 論理・推理の知的要素も少し加点
    mockScores.push({ mood: '知的に楽しみたい', score: 0.6 });
  }

  // 科学・研究・学習・技術 → 知的に楽しみたい
  if (text.includes('科学') || text.includes('研究') || text.includes('学習') || text.includes('技術') || text.includes('評論')) {
    mockScores.push({ mood: '知的に楽しみたい', score: 0.85 });
  }

  // 冒険・旅・探検・SF/ファンタジー → 不思議な世界へ
  if (
    text.includes('冒険') || text.includes('旅') || text.includes('探検') ||
    text.includes('sf') || text.includes('ファンタジー') || text.includes('魔法') ||
    text.includes('異世界') || text.includes('時間') || text.includes('タイムリープ')
  ) {
    mockScores.push({ mood: '不思議な世界へ', score: 0.85 });
  }

  // 家族・人生・思い出 → 泣きたい/ほっとしたい
  if (text.includes('家族') || text.includes('親子') || text.includes('人生') || text.includes('思い出') || text.includes('手紙')) {
    mockScores.push({ mood: '泣きたい', score: 0.8 });
    mockScores.push({ mood: 'ほっとしたい', score: 0.6 });
  }

  // 感動・涙・別れ → 泣きたい
  if (text.includes('感動') || text.includes('涙') || text.includes('別れ') || text.includes('喪失') || text.includes('再生')) {
    mockScores.push({ mood: '泣きたい', score: 0.9 });
  }

  // 笑い・コメディ・ユーモア → ほっとしたい
  if (text.includes('笑い') || text.includes('コメディ') || text.includes('ユーモア') || text.includes('癒し') || text.includes('やさしい')) {
    mockScores.push({ mood: 'ほっとしたい', score: 0.75 });
  }

  // 希望・励まし・挑戦・部活 → 元気が欲しい
  if (text.includes('希望') || text.includes('励まし') || text.includes('挑戦') || text.includes('努力') || text.includes('部活') || text.includes('合格')) {
    mockScores.push({ mood: '元気が欲しい', score: 0.85 });
  }

  // 詩・哲学・静か・随筆・古典 → じっくり味わいたい
  if (text.includes('詩') || text.includes('哲学') || text.includes('静か') || text.includes('随筆') || text.includes('古典') || text.includes('文豪') || text.includes('純文学')) {
    mockScores.push({ mood: 'じっくり味わいたい', score: 0.8 });
  }

  // デフォルト（該当なし時）
  if (mockScores.length === 0) {
    const allMoods: MoodType[] = [
      'ゾクゾクしたい',
      '泣きたい',
      'キュンとしたい',
      '元気が欲しい',
      '不思議な世界へ',
      'じっくり味わいたい',
      'ほっとしたい',
      '知的に楽しみたい',
    ];
    const randomMood = allMoods[Math.floor(Math.random() * allMoods.length)];
    mockScores.push({ mood: randomMood, score: 0.6 });
  }

  // 上位3つまで返す
  return mockScores
    .reduce<Record<string, MoodScore>>((acc, ms) => {
      // 同一moodが複数回pushされた場合は最大値を採用
      const prev = acc[ms.mood];
      if (!prev || prev.score < ms.score) acc[ms.mood] = ms;
      return acc;
    }, {})
    .let ? [] as any : Object.values(mockScores.reduce((acc, ms) => { const k = ms.mood; acc[k] = acc[k] && acc[k].score > ms.score ? acc[k] : ms; return acc; }, {} as Record<string, MoodScore>))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// ルールベース補正
function applyRuleBasedCorrection(book: Book, llmScores: MoodScore[]): MoodScore[] {
  const scores = new Map<MoodType, number>();

  // LLMスコアを反映（重み0.7）
  llmScores.forEach(({ mood, score }) => {
    scores.set(mood, score * 0.7);
  });

  const text = normalize(`${book.title} ${book.summary || ''} ${book.subjects?.join(' ') || ''}`);

  // ルールベース補正（重み0.3）
  ruleBasedAdjustments.forEach(({ keywords, adjustments }) => {
    const hit = keywords.some(k => text.includes(normalize(k)));
    if (hit) {
      adjustments.forEach(({ mood, scoreBoost }) => {
        const cur = scores.get(mood) || 0;
        scores.set(mood, Math.min(1.0, cur + scoreBoost * 0.3));
      });
    }
  });

  // NDCベース補正（マッチした気分に+0.06）
  if (book.ndc) {
    Object.entries(moodToNdcCategories).forEach(([mood, ndcCategories]) => {
      const matches = ndcCategories.some(ndc => book.ndc?.startsWith(ndc));
      if (matches) {
        const cur = scores.get(mood as MoodType) || 0;
        scores.set(mood as MoodType, Math.min(1.0, cur + 0.2 * 0.3));
      }
    });
  }

  // スコア成形：上位3件
  return Array.from(scores.entries())
    .map(([mood, score]) => ({ mood, score }))
    .filter(({ score }) => score > 0.05)
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
    // エラー時はデフォルト（8分類の中から安全なもの）
    return [{ mood: 'じっくり味わいたい', score: 0.5 }];
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
