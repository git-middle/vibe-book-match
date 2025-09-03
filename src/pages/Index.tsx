import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { BookCard } from "@/components/BookCard";
import { SearchParams, SearchResult, Book } from "@/types/library";
import { searchBooks } from "@/api/libraryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BookOpen, Sparkles } from "lucide-react";

interface IndexProps {
  favorites: Book[];
  onToggleFavorite: (book: Book) => void;
}

const Index = ({ favorites, onToggleFavorite }: IndexProps) => {
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<string>("mood_match");
  const { toast } = useToast();

  // 本の詳細リンクを決定
  const getDetailUrl = (book: Book) => {
    if (book.detailUrl && /^https?:\/\//.test(book.detailUrl)) {
      return book.detailUrl;
    }
    return "https://kadobun.jp/special/natsu-fair/";
  };

  const handleSearch = async (params: SearchParams) => {
    setIsLoading(true);
    try {
      const result = await searchBooks({ ...params, sortBy: sortBy as any });
      setSearchResult(result);

      if (result.books.length === 0) {
        toast({
          title: "検索結果がありません",
          description: "条件を変えて再度お試しください。",
        });
      } else {
        toast({
          title: "検索完了",
          description: `${result.books.length}冊の本が見つかりました。`,
        });
      }
    } catch (error) {
      console.error("検索エラー:", error);
      toast({
        title: "検索エラー",
        description: "検索中にエラーが発生しました。しばらく後でお試しください。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookClick = (book: Book) => {
    const url = getDetailUrl(book);
    window.open(url, "_blank", "noopener");
  };

  const sortedBooks = searchResult
    ? [...searchResult.books].sort((a, b) => {
        if (sortBy === "mood_match") {
          return (b as any).__sumMood - (a as any).__sumMood;
        }
        if (sortBy === "publication_date") {
          return (b.publishYear ?? 0) - (a.publishYear ?? 0);
        }
        return 0;
      })
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-mood">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">気分で選ぶ本</h1>
              <p className="text-xs text-muted-foreground">今読みたい本の検索</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">全94冊</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* 検索フォーム */}
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />

        {/* 検索結果 */}
        {searchResult && (
          <section className="space-y-6">
            {/* ヘッダー */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">検索結果</h2>
                <p className="text-sm text-muted-foreground">
                  {searchResult.totalCount}冊が見つかりました
                </p>
              </div>
              {searchResult.books.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">並び替え:</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mood_match">気分適合度</SelectItem>
                      <SelectItem value="publication_date">新着順</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* 一覧 */}
            {sortedBooks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onDetailClick={handleBookClick}
                    showMoodScores={true}
                    isFavorite={favorites.some((b) => b.id === book.id)}  
                    onToggleFavorite={() => onToggleFavorite(book)}     
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg">本が見つかりませんでした</h3>
                <p className="text-muted-foreground">検索条件を変えて、もう一度お試しください。</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  新しい検索を始める
                </Button>
              </div>
            )}
          </section>
        )}

        {/* ローディング */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">あなたにぴったりの本を探しています...</p>
          </div>
        )}

        {/* 初期表示 */}
        {!searchResult && !isLoading && (
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-mood rounded-full flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-semibold text-xl">本との出会いを始めましょう</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              気分や興味に合わせ、あなたにぴったりの一冊を見つけます。
              <br />
              上のフォームから検索を始めてください。
            </p>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="border-t mt-16 text-center text-sm text-muted-foreground p-6">
        <p>今読みたい本の検索システム - 気分で選ぶ本</p>
        <p>※本アプリは個人による非公式のプロジェクトであり、「角川文庫夏フェア2025」とは関係ありません。</p>
      </footer>
    </div>
  );
};

export default Index;
