import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MoodChip } from "./MoodChip";
import { MoodType, MoodKey, SearchParams } from "@/types/library";
import { moodToKeyMap, keyToMoodMap } from "@/lib/moodMapping";

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
}

// moodToKeyMap（label→key）から並びを作る
const moodEntries = Object.entries(moodToKeyMap) as [MoodType, MoodKey][];

// 初期値の定数（UIで非表示でも値は持っておく）
const DEFAULTS = {
  freeText: "",
  era: "all",
  length: "all",
  type: "all",
  selectedMoodKeys: [] as MoodKey[],
};

export function SearchForm({ onSearch, isLoading = false }: SearchFormProps) {
  // 内部状態はキーで持つ（重複や表記ゆれに強い）
  const [selectedMoodKeys, setSelectedMoodKeys] = useState<MoodKey[]>([]);
  const [freeText, setFreeText] = useState("");
  const [era, setEra] = useState<string>("all");
  const [length, setLength] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  // いまの条件が初期から変わっているか
  const isDirty =
    freeText.trim() !== DEFAULTS.freeText ||
    era !== DEFAULTS.era ||
    length !== DEFAULTS.length ||
    type !== DEFAULTS.type ||
    selectedMoodKeys.length > 0;

  // 検索は呼ばない（=結果はそのまま）
  const handleResetFilters = () => {
    setFreeText(DEFAULTS.freeText);
    setEra(DEFAULTS.era);
    setLength(DEFAULTS.length);
    setType(DEFAULTS.type);
    setSelectedMoodKeys(DEFAULTS.selectedMoodKeys);
  };

  // MoodChip はラベル（MoodType）を返すので、キーに変換してトグル
  const handleMoodToggleByLabel = (moodLabel: MoodType) => {
    const key = moodToKeyMap[moodLabel];
    setSelectedMoodKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 送信時はラベル配列に戻す（SearchParams.moods が MoodType[] の想定）
    const selectedLabels: MoodType[] = selectedMoodKeys.map((k) => keyToMoodMap[k]);

    const searchParams: SearchParams = {
      moods: selectedLabels,
      freeText: freeText.trim() || undefined,
      filters: {
        era: era as any,
        length: length as any,
        type: type as any,
      },
    };

    onSearch(searchParams);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-Kaisei text-4xl text-[#626464]">
          今のあなたに<br></br>ぴったりの一冊を。
          </h1>
          <br></br>
          <p className="text-muted-foreground">
          「角川文庫夏フェア2025」に掲載されている本の中から検索できます。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 気分選択 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">気分を選んでください（複数選択可）</Label>
            <div className="flex flex-wrap gap-2">
              {moodEntries.map(([label, key]) => (
                <MoodChip
                  key={key}
                  mood={label} // MoodChip はラベルを受け取る
                  selected={selectedMoodKeys.includes(key)}
                  onClick={handleMoodToggleByLabel} // ラベルで受けてキーに変換してトグル
                />
              ))}
            </div>
            {selectedMoodKeys.length > 0 && (
              <p className="text-sm text-muted-foreground">
                選択中: {selectedMoodKeys.map((k) => keyToMoodMap[k]).join("、")}
              </p>
            )}
          </div>

          {/* 自由入力 */}
          <div className="space-y-2">
            <Label htmlFor="freeText" className="text-base font-medium">
              本のタイトルや著者名を入力
            </Label>
            <Input
              id="freeText"
              placeholder="例：夏目、猫、など"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              className="w-full"
            />
          </div>
          
          {/*       
           絞り込みオプション
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">年代</Label>
              <Select value={era} onValueChange={setEra}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="recent">最近の本（10年以内）</SelectItem>
                  <SelectItem value="classic">古典・名作（50年以上前）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">文字量</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="short">短め（200ページ以下）</SelectItem>
                  <SelectItem value="medium">普通（200-400ページ）</SelectItem>
                  <SelectItem value="long">長め（400ページ以上）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">ジャンル</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="fiction">フィクション（小説等）</SelectItem>
                  <SelectItem value="non-fiction">ノンフィクション</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          */}

          {/* 検索ボタン */}
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3"
            disabled={isLoading}
          >
            {isLoading ? "探しています..." : "探す"}
          </Button>

          {/* リセット（検索ボタンと“同じ形” / 上に配置） */}
          <Button
            type="button"
            onClick={handleResetFilters}
            disabled={!isDirty || isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3"  // 形は同じ、色だけ軽く
            aria-label="検索条件をリセット"
            title="検索条件だけクリアします（結果はそのまま）">
          条件をリセット
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}