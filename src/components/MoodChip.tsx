import { cn } from "@/lib/utils";
import { MoodType, MoodKey } from "@/types/library";
import { moodToKeyMap } from "@/lib/moodMapping";

interface MoodChipProps {
  mood: MoodType;
  selected: boolean;
  onClick: (mood: MoodType) => void;
  className?: string;
}

const moodStyles: Record<MoodKey, string> = {
  ukiuki: 'bg-mood-ukiuki/20 border-mood-ukiuki text-mood-ukiuki hover:bg-mood-ukiuki/30 data-[selected=true]:bg-mood-ukiuki data-[selected=true]:text-white',
  shinmiri: 'bg-mood-shinmiri/20 border-mood-shinmiri text-mood-shinmiri hover:bg-mood-shinmiri/30 data-[selected=true]:bg-mood-shinmiri data-[selected=true]:text-white',
  wakuwaku: 'bg-mood-wakuwaku/20 border-mood-wakuwaku text-mood-wakuwaku hover:bg-mood-wakuwaku/30 data-[selected=true]:bg-mood-wakuwaku data-[selected=true]:text-white',
  ochitsuki: 'bg-mood-ochitsuki/20 border-mood-ochitsuki text-mood-ochitsuki hover:bg-mood-ochitsuki/30 data-[selected=true]:bg-mood-ochitsuki data-[selected=true]:text-white',
  nakitai: 'bg-mood-nakitai/20 border-mood-nakitai text-mood-nakitai hover:bg-mood-nakitai/30 data-[selected=true]:bg-mood-nakitai data-[selected=true]:text-white',
  chishiki: 'bg-mood-chishiki/20 border-mood-chishiki text-mood-chishiki hover:bg-mood-chishiki/30 data-[selected=true]:bg-mood-chishiki data-[selected=true]:text-white',
  bouken: 'bg-mood-bouken/20 border-mood-bouken text-mood-bouken hover:bg-mood-bouken/30 data-[selected=true]:bg-mood-bouken data-[selected=true]:text-white',
  renai: 'bg-mood-renai/20 border-mood-renai text-mood-renai hover:bg-mood-renai/30 data-[selected=true]:bg-mood-renai data-[selected=true]:text-white',
  'genki-nai': 'bg-mood-genki-nai/20 border-mood-genki-nai text-mood-genki-nai hover:bg-mood-genki-nai/30 data-[selected=true]:bg-mood-genki-nai data-[selected=true]:text-white',
  syuuchuu: 'bg-mood-syuuchuu/20 border-mood-syuuchuu text-mood-syuuchuu hover:bg-mood-syuuchuu/30 data-[selected=true]:bg-mood-syuuchuu data-[selected=true]:text-white'
};

export function MoodChip({ mood, selected, onClick, className }: MoodChipProps) {
  const moodKey = moodToKeyMap[mood];
  const chipStyle = moodStyles[moodKey];

  return (
    <button
      className={cn(
        "mood-chip",
        chipStyle,
        className
      )}
      data-selected={selected}
      onClick={() => onClick(mood)}
      type="button"
    >
      {mood}
    </button>
  );
}