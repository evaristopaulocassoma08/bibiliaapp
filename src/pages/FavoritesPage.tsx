import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { getFavorites, toggleFavorite } from "@/lib/bible-data";
import type { BibleVerse } from "@/lib/bible-data";
import { Heart, Trash2, Share2, BookOpen, Filter } from "lucide-react";
import { toast } from "sonner";

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState<BibleVerse[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const filtered = filter
    ? favorites.filter((v) => v.book.toLowerCase().includes(filter.toLowerCase()))
    : favorites;

  const uniqueBooks = [...new Set(favorites.map((v) => v.book))];

  const handleRemove = (verse: BibleVerse) => {
    toggleFavorite(verse);
    setFavorites(getFavorites());
    toast("Removido dos favoritos");
  };

  const handleShare = async (verse: BibleVerse) => {
    try {
      await navigator.share?.({ title: verse.reference, text: `"${verse.text}" — ${verse.reference}` });
    } catch {
      await navigator.clipboard?.writeText(`"${verse.text}" — ${verse.reference}`);
      toast("Versículo copiado!");
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-bold text-foreground">
              <Heart className="h-7 w-7 text-primary inline mr-2" />
              Favoritos
            </h1>
            <p className="text-sm text-muted-foreground">{favorites.length} versículo{favorites.length !== 1 ? "s" : ""} salvo{favorites.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Book Filter */}
        {uniqueBooks.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Filtrar por livro</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter("")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!filter ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                Todos
              </button>
              {uniqueBooks.map((book) => (
                <button
                  key={book}
                  onClick={() => setFilter(book)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === book ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  {book}
                </button>
              ))}
            </div>
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="h-20 w-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
              <Heart className="h-9 w-9 text-muted-foreground/30" />
            </div>
            <div className="space-y-1">
              <p className="text-foreground font-semibold">Nenhum favorito ainda</p>
              <p className="text-sm text-muted-foreground">
                Toque no ❤️ nos versículos para salvá-los aqui
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((verse, i) => (
              <div
                key={verse.reference}
                className="glass-card rounded-xl p-4 space-y-3 animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">{verse.reference}</span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90 italic">
                  "{verse.text}"
                </p>
                <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/30">
                  <button
                    onClick={() => handleShare(verse)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(verse)}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FavoritesPage;
