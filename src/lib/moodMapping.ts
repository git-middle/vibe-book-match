import { MoodType, MoodKey } from '@/types/library';

// 気分とキー名のマッピング
export const moodToKeyMap: Record<MoodType, MoodKey> = {
  'うきうき': 'ukiuki',
  'しんみり': 'shinmiri',
  'ワクワク': 'wakuwaku',
  '落ち着きたい': 'ochitsuki',
  '泣きたい': 'nakitai',
  '知的好奇心': 'chishiki',
  '冒険したい': 'bouken',
  '恋愛気分': 'renai',
  '元気がない': 'genki-nai',
  '集中したい': 'syuuchuu'
};

export const keyToMoodMap: Record<MoodKey, MoodType> = {
  'ukiuki': 'うきうき',
  'shinmiri': 'しんみり',
  'wakuwaku': 'ワクワク',
  'ochitsuki': '落ち着きたい',
  'nakitai': '泣きたい',
  'chishiki': '知的好奇心',
  'bouken': '冒険したい',
  'renai': '恋愛気分',
  'genki-nai': '元気がない',
  'syuuchuu': '集中したい'
};

// 気分→NDC/キーワードのマッピング（検索クエリ生成用）
export const moodToSearchKeywords: Record<MoodType, string[]> = {
  'うきうき': ['コメディ', 'ユーモア', '笑い', '楽しい', '明るい', 'ハッピー'],
  'しんみり': ['家族', '人生', '回想', '追憶', '静寂', '内省'],
  'ワクワク': ['冒険', 'SF', 'ファンタジー', 'ミステリー', 'スリル', '発見'],
  '落ち着きたい': ['詩', '随筆', '自然', '瞑想', '哲学', '静謐'],
  '泣きたい': ['感動', '別れ', '愛', '家族', '友情', '成長'],
  '知的好奇心': ['科学', '歴史', '学習', '研究', '新書', '解説'],
  '冒険したい': ['旅行', '探検', '冒険小説', '異文化', '挑戦'],
  '恋愛気分': ['恋愛', 'ロマンス', '愛', '青春', '恋愛小説'],
  '元気がない': ['癒し', '希望', '励まし', '回復', '勇気'],
  '集中したい': ['学習', '資格', '技術書', '専門書', '仕事']
};

// 気分→NDCカテゴリのマッピング
export const moodToNdcCategories: Record<MoodType, string[]> = {
  'うきうき': ['913', '914'], // 小説、随筆
  'しんみり': ['911', '914', '913'], // 詩歌、随筆、小説
  'ワクワク': ['913', '400', '500'], // 小説、自然科学、技術
  '落ち着きたい': ['100', '911', '914'], // 哲学、詩歌、随筆
  '泣きたい': ['913', '916'], // 小説、記録・手記・ルポルタージュ
  '知的好奇心': ['000', '100', '200', '300', '400', '500'], // 総記、哲学、歴史、社会科学、自然科学、技術
  '冒険したい': ['913', '290'], // 小説、地理・地誌・紀行
  '恋愛気分': ['913'], // 小説
  '元気がない': ['159', '914', '916'], // 人生訓、随筆、記録
  '集中したい': ['000', '300', '400', '500', '600', '700'] // 学習・技術系
};

// ルールベース補正用のキーワード→気分スコア調整
export interface RuleBasedAdjustment {
  keywords: string[];
  adjustments: { mood: MoodType; scoreBoost: number }[];
}

export const ruleBasedAdjustments: RuleBasedAdjustment[] = [
  {
    keywords: ['闘病', '病気', '医療'],
    adjustments: [
      { mood: '泣きたい', scoreBoost: 0.2 },
      { mood: '元気がない', scoreBoost: 0.15 }
    ]
  },
  {
    keywords: ['家族', '親子', '兄弟'],
    adjustments: [
      { mood: 'しんみり', scoreBoost: 0.15 },
      { mood: '泣きたい', scoreBoost: 0.1 }
    ]
  },
  {
    keywords: ['科学', '実験', '研究'],
    adjustments: [
      { mood: '知的好奇心', scoreBoost: 0.2 }
    ]
  },
  {
    keywords: ['旅行', '旅', '異国'],
    adjustments: [
      { mood: '冒険したい', scoreBoost: 0.2 },
      { mood: 'ワクワク', scoreBoost: 0.1 }
    ]
  }
];