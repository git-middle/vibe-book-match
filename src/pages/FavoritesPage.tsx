import { useEffect, useState } from "react";
import { BookCard } from "@/components/BookCard";
import { Book } from "@/types/library";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Book[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("library-favorites");
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">お気に入り一覧</h1>
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
