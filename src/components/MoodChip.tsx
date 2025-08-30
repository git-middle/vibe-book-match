import { cn } from "@/lib/utils";
import { MoodType, MoodKey } from "@/types/library";
import { moodToKeyMap } from "@/lib/moodMapping";

interface MoodChipProps {
  mood: MoodType;                  // 表示ラベル（例: 'ゾクゾクしたい'）
  selected: boolean;
  onClick: (mood: MoodType) => void;
  className?: string;
}

// 新8分類のキーに対応したスタイル
const moodStyles: Record<MoodKey, string> = {
  // ゾクゾクしたい
  zokuzoku:
    "bg-mood-zokuzoku/20 border-mood-zokuzoku text-mood-zokuzoku hover:bg-mood-zokuzoku/30 data-[selected=true]:bg-mood-zokuzoku data-[selected=true]:text-white",
  // 泣きたい
  nakitai:
    "bg-mood-nakitai/20 border-mood-nakitai text-mood-nakitai hover:bg-mood-nakitai/30 data-[selected=true]:bg-mood-nakitai data-[selected=true]:text-white",
  // キュンとしたい
  kyun:
    "bg-mood-kyun/20 border-mood-kyun text-mood-kyun hover:bg-mood-kyun/30 data-[selected=true]:bg-mood-kyun data-[selected=true]:text-white",
  // 元気が欲しい
  genki:
    "bg-mood-genki/20 border-mood-genki text-mood-genki hover:bg-mood-genki/30 data-[selected=true]:bg-mood-genki data-[selected=true]:text-white",
  // 不思議な世界へ
  fushigi:
    "bg-mood-fushigi/20 border-mood-fushigi text-mood-fushigi hover:bg-mood-fushigi/30 data-[selected=true]:bg-mood-fushigi data-[selected=true]:text-white",
  // じっくり味わいたい
  jikkuri:
    "bg-mood-jikkuri/20 border-mood-jikkuri text-mood-jikkuri hover:bg-mood-jikkuri/30 data-[selected=true]:bg-mood-jikkuri data-[selected=true]:text-white",
  // ほっとしたい
  hotto:
    "bg-mood-hotto/20 border-mood-hotto text-mood-hotto hover:bg-mood-hotto/30 data-[selected=true]:bg-mood-hotto data-[selected=true]:text-white",
  // 知的に楽しみたい
  chiteki:
    "bg-mood-chiteki/20 border-mood-chiteki text-mood-chiteki hover:bg-mood-chiteki/30 data-[selected=true]:bg-mood-chiteki data-[selected=true]:text-white",
};

export function MoodChip({ mood, selected, onClick, className }: MoodChipProps) {
  const moodKey = moodToKeyMap[mood]; // label -> key
  const chipStyle = moodStyles[moodKey];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={selected}
      aria-label={mood}
      className={cn(
        "mood-chip inline-flex items-center rounded-full border px-4 py-2 text-sm transition-colors",
        chipStyle,
        className
      )}
      data-selected={selected}
      onClick={() => onClick(mood)}
    >
      {mood}
    </button>
  );
}
