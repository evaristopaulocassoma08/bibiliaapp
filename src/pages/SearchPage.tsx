import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { dailyVerses, toggleFavorite, isFavorite } from "@/lib/bible-data";
import { trackSearch } from "@/lib/activity-tracker";
import { Search, Heart, BookOpen, Filter, X } from "lucide-react";
import { toast } from "sonner";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [filterTestament, setFilterTestament] = useState<"all" | "old" | "new">("all");

  // Track search queries (debounced) for activity history
  useEffect(() => {
    if (query.trim().length < 2) return;
    const t = setTimeout(() => trackSearch(query), 800);
    return () => clearTimeout(t);
  }, [query]);

  const oldTestamentBooks = ["Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio", "Josué", "Juízes", "Rute", "1 Samuel", "2 Samuel", "1 Reis", "2 Reis", "1 Crônicas", "2 Crônicas", "Esdras", "Neemias", "Ester", "Jó", "Salmos", "Provérbios", "Eclesiastes", "Cantares", "Isaías", "Jeremias", "Lamentações", "Ezequiel", "Daniel", "Oséias", "Joel", "Amós", "Obadias", "Jonas", "Miquéias", "Naum", "Habacuque", "Sofonias", "Ageu", "Zacarias", "Malaquias"];

  const results = query.length >= 2
    ? dailyVerses.filter((v) => {
        const matchesQuery = v.text.toLowerCase().includes(query.toLowerCase()) ||
          v.reference.toLowerCase().includes(query.toLowerCase()) ||
          v.book.toLowerCase().includes(query.toLowerCase());
        
        if (filterTestament === "all") return matchesQuery;
        if (filterTestament === "old") return matchesQuery && oldTestamentBooks.includes(v.book);
        return matchesQuery && !oldTestamentBooks.includes(v.book);
      })
    : [];

  const handleFavorite = async (verse: typeof dailyVerses[0]) => {
    const result = await toggleFavorite(verse);
    toast(result ? "Adicionado aos favoritos" : "Removido dos favoritos");
  };

  const popularSearches = ["amor", "fé", "esperança", "paz", "força", "Senhor", "salvação", "graça"];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-bold text-foreground">
            <Search className="h-7 w-7 text-primary inline mr-2" />
            Buscar
          </h1>
          <p className="text-sm text-muted-foreground">Encontre versículos por palavra-chave</p>
        </div>

        {/* Search Input */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar versículos, livros..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {(["all", "old", "new"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterTestament(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filterTestament === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "all" ? "Todos" : t === "old" ? "Antigo T." : "Novo T."}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Searches */}
        {query.length < 2 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Buscas Populares</h2>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => setQuery(term)}
                  className="px-4 py-2 rounded-full text-sm bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary border border-border/50 hover:border-primary/30 transition-all"
                >
                  {term}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Results */}
        {query.length >= 2 && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {results.length} resultado{results.length !== 1 ? "s" : ""}
          </p>
        )}

        <div className="space-y-3">
          {results.map((verse, i) => (
            <div key={verse.reference} className="glass-card rounded-xl p-4 space-y-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">{verse.reference}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm leading-relaxed text-foreground/90 italic">
                  "{verse.text}"
                </p>
                <button
                  onClick={() => handleFavorite(verse)}
                  className="shrink-0 p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <Heart className={`h-4 w-4 ${isFavorite(verse.reference) ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary"}`} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {query.length < 2 && (
          <div className="text-center py-8 space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
              <Search className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm">Digite pelo menos 2 caracteres para buscar</p>
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
              <Search className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-foreground font-medium">Nenhum resultado</p>
            <p className="text-muted-foreground text-sm">Tente outra palavra-chave</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;
