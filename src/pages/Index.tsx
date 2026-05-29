import { useState, useEffect } from "react";
import { Heart, Share2, RefreshCw, BookOpen, Search, Users, StickyNote, ChevronRight, Flame, TrendingUp, Clock, Star } from "lucide-react";
import { getDailyVerse, toggleFavorite, isFavorite, dailyVerses, getReadingHistory, getFavorites } from "@/lib/bible-data";
import type { BibleVerse } from "@/lib/bible-data";
import { Layout } from "@/components/Layout";
import { MotivationalHighlight } from "@/components/MotivationalHighlight";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Index = () => {
  const [verse, setVerse] = useState<BibleVerse>(getDailyVerse());
  const [favorited, setFavorited] = useState(false);
  const navigate = useNavigate();
  const history = getReadingHistory();
  const favCount = getFavorites().length;

  useEffect(() => {
    setFavorited(isFavorite(verse.reference));
  }, [verse]);

  const handleFavorite = async () => {
    const result = await toggleFavorite(verse);
    setFavorited(result);
    toast(result ? "Adicionado aos favoritos" : "Removido dos favoritos");
  };

  const handleShare = async () => {
    try {
      await navigator.share?.({ title: verse.reference, text: `"${verse.text}" — ${verse.reference}` });
    } catch {
      await navigator.clipboard?.writeText(`"${verse.text}" — ${verse.reference}`);
      toast("Versículo copiado!");
    }
  };

  const handleNewVerse = () => {
    const randomIndex = Math.floor(Math.random() * dailyVerses.length);
    setVerse(dailyVerses[randomIndex]);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{greeting()}, bem-vindo(a) 👋</p>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Bíblia<span className="text-primary">App</span>
          </h1>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-3 text-center">
            <Flame className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{history.length}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Leituras</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <Heart className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{favCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Favoritos</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">66</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Livros</p>
          </div>
        </div>

        {/* Verse of the Day */}
        <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 space-y-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary animate-glow-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Versículo do Dia
              </span>
            </div>
            <button
              onClick={handleNewVerse}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-all"
              title="Novo versículo"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <blockquote className="relative z-10">
            <p className="text-lg md:text-xl font-display leading-relaxed italic text-foreground">
              "{verse.text}"
            </p>
          </blockquote>

          <div className="flex items-center justify-between relative z-10">
            <span className="text-sm font-semibold text-primary">{verse.reference}</span>
            <div className="flex gap-1">
              <button
                onClick={handleFavorite}
                className="p-2 rounded-lg hover:bg-secondary/50 transition-all"
              >
                <Heart className={`h-5 w-5 transition-colors ${favorited ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary"}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-lg hover:bg-secondary/50 transition-all text-muted-foreground hover:text-primary"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Explorar</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: BookOpen, title: "Ler a Bíblia", desc: "AT e NT completos", url: "/biblia", color: "from-blue-500/10 to-blue-600/5" },
              { icon: Search, title: "Buscar Versículos", desc: "Pesquisa inteligente", url: "/buscar", color: "from-green-500/10 to-green-600/5" },
              { icon: Heart, title: "Favoritos", desc: `${favCount} versículos salvos`, url: "/favoritos", color: "from-red-500/10 to-red-600/5" },
              { icon: StickyNote, title: "Minhas Notas", desc: "Reflexões pessoais", url: "/notas", color: "from-yellow-500/10 to-yellow-600/5" },
              { icon: Users, title: "Grupos", desc: "Comunidade cristã", url: "/grupos", color: "from-purple-500/10 to-purple-600/5" },
              { icon: Clock, title: "Histórico", desc: `${history.length} leituras`, url: "/biblia", color: "from-orange-500/10 to-orange-600/5" },
            ].map((item) => (
              <button
                key={item.url + item.title}
                onClick={() => navigate(item.url)}
                className="glass-card rounded-xl p-4 text-left hover:border-primary/30 transition-all duration-200 group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative z-10">
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-semibold text-sm text-foreground block">{item.title}</span>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Reading History */}
        {history.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Leitura Recente</h2>
              <Clock className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {history.slice(0, 8).map((ref) => (
                <span key={ref} className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border/50 hover:border-primary/30 transition-colors cursor-default">
                  {ref}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Inspirational Banner */}
        <section className="glass-card rounded-2xl p-5 border-primary/10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gold-gradient flex items-center justify-center shrink-0">
              <Flame className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Mantenha sua leitura diária</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                A Palavra de Deus é lâmpada para os seus pés e luz para o seu caminho
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
