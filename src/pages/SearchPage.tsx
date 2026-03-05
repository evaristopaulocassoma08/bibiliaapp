import { useState } from "react";
import { Layout } from "@/components/Layout";
import { dailyVerses, toggleFavorite, isFavorite } from "@/lib/bible-data";
import { Search, Heart } from "lucide-react";
import { toast } from "sonner";

const SearchPage = () => {
  const [query, setQuery] = useState("");

  const results = query.length >= 2
    ? dailyVerses.filter(
        (v) =>
          v.text.toLowerCase().includes(query.toLowerCase()) ||
          v.reference.toLowerCase().includes(query.toLowerCase()) ||
          v.book.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleFavorite = (verse: typeof dailyVerses[0]) => {
    const result = toggleFavorite(verse);
    toast(result ? "Adicionado aos favoritos ❤️" : "Removido dos favoritos");
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold">
          🔍 <span className="text-primary">Buscar</span>
        </h1>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar versículos, livros..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm"
          />
        </div>

        {query.length >= 2 && (
          <p className="text-sm text-muted-foreground">
            {results.length} resultado{results.length !== 1 ? "s" : ""} encontrado{results.length !== 1 ? "s" : ""}
          </p>
        )}

        <div className="space-y-3">
          {results.map((verse) => (
            <div
              key={verse.reference}
              className="glass-card rounded-xl p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm leading-relaxed text-foreground/90 italic">
                  "{verse.text}"
                </p>
                <button
                  onClick={() => handleFavorite(verse)}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      isFavorite(verse.reference)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              </div>
              <span className="text-xs font-medium text-primary">{verse.reference}</span>
            </div>
          ))}
        </div>

        {query.length < 2 && (
          <div className="text-center py-12 space-y-3">
            <span className="text-4xl">📝</span>
            <p className="text-muted-foreground text-sm">
              Digite pelo menos 2 caracteres para buscar
            </p>
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <span className="text-4xl">🤷</span>
            <p className="text-muted-foreground text-sm">
              Nenhum resultado encontrado para "{query}"
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;
