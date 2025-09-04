import { Book } from "@/types/library";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Calendar, User } from "lucide-react";
import { useState, useEffect } from "react";

interface BookCardProps {
  book: Book;
  onDetailClick?: (book: Book) => void;
  showMoodScores?: boolean;
  isFavorite?: boolean;               
  onToggleFavorite?: () => void;
  isRead?: boolean;
  onToggleRead?: () => void;
}

export function BookCard({
  book,
  onDetailClick,
  showMoodScores = true,
  isFavorite = false,
  onToggleFavorite,
  isRead = false,                 
  onToggleRead,
}: BookCardProps) {
  const availableHolding = book.holdings?.find((h) => h.status === "available");
  
  const statusBadge = availableHolding ? (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
      在架
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
      貸出中
    </Badge>
  );



  return (
     <Card className={`book-card relative group ${isRead ? "bg-gray-200" : ""}`}>
      <CardContent className="p-4 space-y-3">
        {/* ヘッダー部分 */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-lg leading-tight line-clamp-2 group-hover:none transition-colors
             ${isRead ? "text-muted-foreground" : "text-card-foreground"}`}>
              {book.title}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <User className="w-3 h-3" />
              <span className="truncate">{book.authors.join(", ")}</span>
            </div>
          </div>

          {/* お気に入りハート */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.();
            }}
             className="flex-shrink-0"
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
              }`}
            />
          </button>
        </div>

        {/* 概要 */}
        {book.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {book.summary}
          </p>
        )}

        {/* メタ情報 */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {book.publishYear && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{book.publishYear}年</span>
            </div>
          )}
          {book.pageCount && <span>{book.pageCount}ページ</span>}
          {availableHolding && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{availableHolding.location}</span>
            </div>
          )}
        </div>

        {/* 気分スコア表示 */}
        {showMoodScores && book.moodScores && book.moodScores.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">この本が合いそうな気分</div>
            <div className="flex flex-wrap gap-1">
              {book.moodScores.slice(0, 3).map((score, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs bg-gradient-mood/20 text-primary border-primary/20"
                >
                  {score.mood} {Math.round(score.score * 100)}%
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* NDC分類 */}
        {book.ndc && <div className="text-xs text-muted-foreground">分類: {book.ndc}</div>}

        {/* 詳細ボタン */}
        <div className="mt-3 flex justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onDetailClick?.(book)}>
            詳細を見る
          </Button>
        <Button
            className="bg-primary text-white" 
            size="sm"
            onClick={(e) => {
            e.stopPropagation();
            onToggleRead?.(); 
            }}            
          >
            {isRead ? "未読に戻す" : "既読にする"}     
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
