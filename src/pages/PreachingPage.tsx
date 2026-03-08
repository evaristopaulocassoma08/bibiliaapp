import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Send, BookOpen, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Sermon {
  id?: string;
  theme: string;
  title: string;
  content: string;
}

const PreachingPage = () => {
  const { user } = useAuth();
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [savedSermons, setSavedSermons] = useState<Sermon[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  const generateSermon = async () => {
    if (!theme.trim()) {
      toast.error("Digite um tema ou assunto");
      return;
    }
    setLoading(true);
    setSermon(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-sermon", {
        body: { theme: theme.trim() },
      });

      if (error) throw error;
      setSermon({ theme: theme.trim(), title: data.title, content: data.content });
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao gerar pregação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const saveSermon = async () => {
    if (!sermon || !user) return;
    try {
      const { error } = await supabase.from("sermons").insert({
        user_id: user.id,
        theme: sermon.theme,
        title: sermon.title,
        content: sermon.content,
      });
      if (error) throw error;
      toast.success("Pregação salva com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar pregação");
    }
  };

  const loadSavedSermons = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("sermons")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setSavedSermons(data as any);
    setShowSaved(true);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-bold text-foreground">
              <Sparkles className="h-7 w-7 text-primary inline mr-2" />
              Pregação com IA
            </h1>
            <p className="text-sm text-muted-foreground">
              Digite um tema e receba capítulos e textos para pregar
            </p>
          </div>
          {user && (
            <button
              onClick={loadSavedSermons}
              className="px-4 py-2 rounded-xl bg-secondary text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
            >
              <BookOpen className="h-4 w-4 inline mr-1" />
              Salvas
            </button>
          )}
        </div>

        {/* Input */}
        <div className="glass-card rounded-xl p-5 space-y-4">
          <label className="text-sm font-medium text-foreground block">
            Qual tema ou assunto deseja pregar?
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Ex: Amor de Deus, Fé, Perdão, Família..."
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateSermon()}
              className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
            />
            <button
              onClick={generateSermon}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Gerar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Amor de Deus", "Fé e Esperança", "Perdão", "Família", "Salvação", "Oração"].map((s) => (
              <button
                key={s}
                onClick={() => setTheme(s)}
                className="px-3 py-1.5 rounded-full text-xs bg-secondary text-muted-foreground hover:text-foreground hover:border-primary/30 border border-border/50 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="glass-card rounded-xl p-8 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Gerando pregação sobre "{theme}"...</p>
          </div>
        )}

        {/* Result */}
        {sermon && !loading && (
          <div className="glass-card rounded-xl p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-foreground">{sermon.title}</h2>
              {user && (
                <button
                  onClick={saveSermon}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                  <Save className="h-3.5 w-3.5" />
                  Salvar
                </button>
              )}
            </div>
            <div className="prose prose-sm prose-invert max-w-none text-foreground/90">
              <ReactMarkdown>{sermon.content}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Saved Sermons */}
        {showSaved && savedSermons.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Pregações Salvas
            </h2>
            {savedSermons.map((s, i) => (
              <button
                key={i}
                onClick={() => { setSermon(s); setShowSaved(false); }}
                className="w-full glass-card rounded-xl p-4 text-left hover:border-primary/20 transition-colors"
              >
                <p className="text-sm font-semibold text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-1">Tema: {s.theme}</p>
              </button>
            ))}
          </section>
        )}
      </div>
    </Layout>
  );
};

export default PreachingPage;
