import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { getFavorites, toggleFavorite, syncFavoritesFromCloud } from "@/lib/bible-data";
import type { BibleVerse } from "@/lib/bible-data";
import { Heart, Trash2, Share2, BookOpen, Filter, Search, Download, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const FavoritesPage = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<BibleVerse[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);

  const loadCloud = async () => {
    setSyncing(true);
    const list = await syncFavoritesFromCloud();
    setFavorites(list);
    setSyncing(false);
  };

  useEffect(() => {
    setFavorites(getFavorites());
    if (user) loadCloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = favorites.filter((v) => {
    if (filter && v.book !== filter) return false;
    if (search && !v.text.toLowerCase().includes(search.toLowerCase()) && !v.reference.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const uniqueBooks = [...new Set(favorites.map((v) => v.book))];

  const handleRemove = async (verse: BibleVerse) => {
    await toggleFavorite(verse);
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

  const handleCopy = async (verse: BibleVerse) => {
    await navigator.clipboard?.writeText(`"${verse.text}" — ${verse.reference}`);
    toast.success("Copiado!");
  };

  const handleExport = () => {
    if (!favorites.length) return toast.error("Sem favoritos para exportar");
    const txt = favorites.map((v) => `${v.reference}\n"${v.text}"\n`).join("\n");
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `favoritos-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Favoritos exportados");
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-20">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary shrink-0" />
              Favoritos
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {favorites.length} versículo{favorites.length !== 1 ? "s" : ""} salvo{favorites.length !== 1 ? "s" : ""}
              {user && " · sincronizado"}
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            {user && (
              <button
                onClick={loadCloud}
                disabled={syncing}
                title="Sincronizar"
                className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 text-foreground ${syncing ? "animate-spin" : ""}`} />
              </button>
            )}
            <button
              onClick={handleExport}
              title="Exportar"
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <Download className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* Search */}
        {favorites.length > 0 && (
          <div className="relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar nos favoritos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none"
            />
          </div>
        )}

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
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-sm text-muted-foreground">Nenhum resultado.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((verse, i) => (
              <div
                key={verse.reference}
                className="glass-card rounded-xl p-4 space-y-3 animate-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
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
                    onClick={() => handleCopy(verse)}
                    title="Copiar"
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleShare(verse)}
                    title="Compartilhar"
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(verse)}
                    title="Remover"
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
