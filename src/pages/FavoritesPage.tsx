import { BookCard } from "@/components/BookCard";
import { Book } from "@/types/library";

interface FavoritesPageProps {
  favorites: Book[];
  onBack: () => void;
  onToggleFavorite: (book: Book) => void;
  onDetailClick: (book: Book) => void;
}

export default function FavoritesPage({ 
  favorites, 
  onBack,
  onToggleFavorite,
  onDetailClick,
}: FavoritesPageProps) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">お気に入りの本一覧</h1>
        <p className="text-muted-foreground">お気に入りした順に表示されています。</p>
      </div>
      {favorites.length === 0 ? (
        <p>まだお気に入りはありません。</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((book) => (
            <BookCard 
            key={book.id} 
            book={book} 
            isFavorite={true}
            onToggleFavorite={() => onToggleFavorite(book)}
            onDetailClick={onDetailClick}
            showMoodScores={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
