import { useState, useEffect } from "react";
import { Heart, Share2, RefreshCw } from "lucide-react";
import { getDailyVerse, toggleFavorite, isFavorite, dailyVerses, getReadingHistory } from "@/lib/bible-data";
import type { BibleVerse } from "@/lib/bible-data";
import { Layout } from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Index = () => {
  const [verse, setVerse] = useState<BibleVerse>(getDailyVerse());
  const [favorited, setFavorited] = useState(false);
  const navigate = useNavigate();
  const history = getReadingHistory();

  useEffect(() => {
    setFavorited(isFavorite(verse.reference));
  }, [verse]);

  const handleFavorite = () => {
    const result = toggleFavorite(verse);
    setFavorited(result);
    toast(result ? "Adicionado aos favoritos ❤️" : "Removido dos favoritos");
  };

  const handleShare = async () => {
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

  const handleNewVerse = () => {
    const randomIndex = Math.floor(Math.random() * dailyVerses.length);
    setVerse(dailyVerses[randomIndex]);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        {/* Greeting */}
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Bíblia <span className="text-primary">Online</span>
          </h1>
          <p className="text-muted-foreground">A Palavra de Deus ao seu alcance</p>
        </div>

        {/* Verse of the Day */}
        <section className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              ✨ Versículo do Dia
            </span>
            <button
              onClick={handleNewVerse}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
              title="Novo versículo"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <blockquote className="verse-highlight rounded-lg p-4">
            <p className="text-lg font-display leading-relaxed italic text-foreground">
              "{verse.text}"
            </p>
          </blockquote>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary">{verse.reference}</span>
            <div className="flex gap-2">
              <button
                onClick={handleFavorite}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${
                    favorited ? "fill-primary text-primary" : "text-muted-foreground"
                  }`}
                />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/biblia")}
            className="glass-card rounded-xl p-4 text-left hover:border-primary/30 transition-colors group"
          >
            <span className="text-2xl mb-2 block">📖</span>
            <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
              Ler a Bíblia
            </span>
            <p className="text-xs text-muted-foreground mt-1">66 livros completos</p>
          </button>

          <button
            onClick={() => navigate("/buscar")}
            className="glass-card rounded-xl p-4 text-left hover:border-primary/30 transition-colors group"
          >
            <span className="text-2xl mb-2 block">🔍</span>
            <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
              Buscar
            </span>
            <p className="text-xs text-muted-foreground mt-1">Encontre versículos</p>
          </button>

          <button
            onClick={() => navigate("/favoritos")}
            className="glass-card rounded-xl p-4 text-left hover:border-primary/30 transition-colors group"
          >
            <span className="text-2xl mb-2 block">❤️</span>
            <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
              Favoritos
            </span>
            <p className="text-xs text-muted-foreground mt-1">Seus versículos salvos</p>
          </button>

          <button
            onClick={() => navigate("/grupos")}
            className="glass-card rounded-xl p-4 text-left hover:border-primary/30 transition-colors group"
          >
            <span className="text-2xl mb-2 block">👥</span>
            <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
              Grupos
            </span>
            <p className="text-xs text-muted-foreground mt-1">Comunidade de fé</p>
          </button>
        </section>

        {/* Reading History */}
        {history.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">Leitura Recente</h2>
            <div className="flex gap-2 flex-wrap">
              {history.slice(0, 8).map((ref) => (
                <span
                  key={ref}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                >
                  {ref}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default Index;
