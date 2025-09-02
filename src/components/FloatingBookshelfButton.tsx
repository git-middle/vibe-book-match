import { Link } from "react-router-dom";

export function FloatingBookshelfButton() {
  return (
    <Link
      to="/favorites"
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/80 transition"
    >
      本棚
    </Link>
  );
}
