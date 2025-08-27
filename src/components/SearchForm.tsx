import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { MoodChip } from "./MoodChip";
import { MoodType, SearchParams } from "@/types/library";

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
}

const allMoods: MoodType[] = [
  'うきうき', 'しんみり', 'ワクワク', '落ち着きたい', '泣きたい',
  '知的好奇心', '冒険したい', '恋愛気分', '元気がない', '集中したい'
];

export function SearchForm({ onSearch, isLoading = false }: SearchFormProps) {
  const [selectedMoods, setSelectedMoods] = useState<MoodType[]>([]);
  const [freeText, setFreeText] = useState("");
  const [era, setEra] = useState<string>("all");
  const [length, setLength] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  const handleMoodToggle = (mood: MoodType) => {
    setSelectedMoods(prev =>
      prev.includes(mood)
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const searchParams: SearchParams = {
      moods: selectedMoods,
      freeText: freeText.trim() || undefined,
      filters: {
        era: era as any,
        length: length as any,
        type: type as any
      }
    };

    onSearch(searchParams);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-warm bg-clip-text text-transparent">
            いまの気分に、ぴったりの一冊を
          </h1>
          <p className="text-muted-foreground">
            あなたの気分や興味に合った本を図書館の蔵書から見つけます
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 気分選択 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">気分を選んでください（複数選択可）</Label>
            <div className="flex flex-wrap gap-2">
              {allMoods.map((mood) => (
                <MoodChip
                  key={mood}
                  mood={mood}
                  selected={selectedMoods.includes(mood)}
                  onClick={handleMoodToggle}
                />
              ))}
            </div>
            {selectedMoods.length > 0 && (
              <p className="text-sm text-muted-foreground">
                選択中: {selectedMoods.join(', ')}
              </p>
            )}
          </div>

          {/* 自由入力 */}
          <div className="space-y-2">
            <Label htmlFor="freeText" className="text-base font-medium">
              キーワードや気分を自由に入力
            </Label>
            <Input
              id="freeText"
              placeholder="例: 夏の終わりっぽい、自然が出る本、仕事で疲れた..."
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              className="w-full"
            />
          </div>

          {/* 絞り込みオプション */}
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

          {/* 検索ボタン */}
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3"
            disabled={isLoading}
          >
            {isLoading ? '本を探しています...' : '本を探す'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}