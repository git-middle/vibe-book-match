import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";  
import Index from "./pages/Index";
import FavoritesPage from "./pages/FavoritesPage";
import { Book } from "@/types/library";       

const queryClient = new QueryClient();

const App = () => {
  const [activeTab, setActiveTab] = useState<"home" | "favorites">("home");
  const [favorites, setFavorites] = useState<Book[]>([]);

  // 初期化（localStorage から）
  useEffect(() => {
    const stored = localStorage.getItem("library-favorites");
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  }, []);

  // お気に入りを更新する関数
  const toggleFavorite = (book: Book) => {
    setFavorites((prev) => {
      const exists = prev.find((b) => b.id === book.id);
      let updated;
      if (exists) {
        updated = prev.filter((b) => b.id !== book.id);
      } else {
        updated = [...prev, book];
      }
      localStorage.setItem("library-favorites", JSON.stringify(updated));
      return updated;
    });
  };

// 詳細リンクを作る関数（ホームと本棚で共通利用）
  const getDetailUrl = (book: Book) => {
    if (book.detailUrl && /^https?:\/\//.test(book.detailUrl)) {
      return book.detailUrl;
    }
    const author = book.authors?.[0] ?? "";
    const siteFilter = [
      "site:kadokawabunko.jp",
      "site:bunko.kadokawa.co.jp",
      "site:kadokawa.co.jp",
    ].join(" OR ");
    const q = `${siteFilter} "${book.title}" ${author}`.trim();
    return "https://kadobun.jp/special/natsu-fair/"; // フォールバック
  };

  const handleDetailClick = (book: Book) => {
    const url = getDetailUrl(book);
    window.open(url, "_blank", "noopener");
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        {/* ホーム */}
        <div style={{ display: activeTab === "home" ? "block" : "none" }}>
          <Index 
          favorites={favorites} 
          onToggleFavorite={toggleFavorite} 
          onDetailClick={handleDetailClick}
          />
        </div>

        {/* 本棚 */}
        <div style={{ display: activeTab === "favorites" ? "block" : "none" }}>
          <FavoritesPage
            favorites={favorites}
            onBack={() => setActiveTab("home")}
            onToggleFavorite={toggleFavorite}
            onDetailClick={handleDetailClick}
          />
        </div>

        {/* 切り替えボタン */}
        <button
          onClick={() =>
            setActiveTab((prev) => (prev === "home" ? "favorites" : "home"))
          }
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg bg-primary text-white"
        >
          {activeTab === "home" ? "本棚" : "ホーム"}
        </button>
      </div>
    </QueryClientProvider>
  );
};

export default App;
