import { BookCard } from "@/components/BookCard";
import { Book } from "@/types/library";
import { Button } from "@/components/ui/button"; 

export default function FavoritesPage({ favorites, onBack }: { favorites: Book[], onBack: () => void }) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">お気に入り一覧</h1>
      </div>
      {favorites.length === 0 ? (
        <p>まだお気に入りはありません。</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
