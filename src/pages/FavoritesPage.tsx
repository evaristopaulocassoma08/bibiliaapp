import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { getFavorites, toggleFavorite } from "@/lib/bible-data";
import type { BibleVerse } from "@/lib/bible-data";
import { Heart, Trash2, Share2 } from "lucide-react";
import { toast } from "sonner";

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState<BibleVerse[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const handleRemove = (verse: BibleVerse) => {
    toggleFavorite(verse);
    setFavorites(getFavorites());
    toast("Removido dos favoritos");
  };

  const handleShare = async (verse: BibleVerse) => {
    try {
      await navigator.share?.({
        title: verse.reference,
        text: `"${verse.text}" — ${verse.reference}`,
      });
    } catch {
      await navigator.clipboard?.writeText(`"${verse.text}" — ${verse.reference}`);
      toast("Versículo copiado! 📋");
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold">
            ❤️ <span className="text-primary">Favoritos</span>
          </h1>
          <span className="text-sm text-muted-foreground">{favorites.length} versículo{favorites.length !== 1 ? "s" : ""}</span>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <div className="space-y-1">
              <p className="text-foreground font-medium">Nenhum favorito ainda</p>
              <p className="text-sm text-muted-foreground">
                Toque no ❤️ nos versículos para salvá-los aqui
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((verse) => (
              <div
                key={verse.reference}
                className="glass-card rounded-xl p-4 space-y-3"
              >
                <p className="text-sm leading-relaxed text-foreground/90 italic">
                  "{verse.text}"
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary">{verse.reference}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleShare(verse)}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FavoritesPage;
