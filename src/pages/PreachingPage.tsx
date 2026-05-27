import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { trackSermon } from "@/lib/activity-tracker";
import {
  saveAISearch,
  getAISearchHistory,
  toggleAIFavorite,
  deleteAISearch,
  type AISearchItem,
} from "@/lib/bible-data";
import {
  Sparkles,
  Send,
  BookOpen,
  Loader2,
  Save,
  Trash2,
  Share2,
  MessageCircle,
  AtSign,
  Copy,
  Download,
  Lightbulb,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Sermon {
  id?: string;
  theme: string;
  title: string;
  content: string;
  created_at?: string;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

const SUGGESTIONS = [
  "Amor de Deus",
  "Fé e Esperança",
  "Perdão",
  "Família segundo Deus",
  "Salvação pela graça",
  "Oração eficaz",
  "Vencendo a ansiedade",
  "Propósito de vida",
  "Frutos do Espírito",
  "Gratidão",
];

const PreachingPage = () => {
  const { user } = useAuth();
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [savedSermons, setSavedSermons] = useState<Sermon[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Carregar comentários quando uma pregação salva é exibida
  useEffect(() => {
    if (sermon?.id) loadComments(sermon.id);
    else setComments([]);
  }, [sermon?.id]);

  const generateSermon = async () => {
    if (!theme.trim()) {
      toast.error("Digite um tema ou assunto");
      return;
    }
    setLoading(true);
    setSermon(null);
    setShowSaved(false);
    const t = theme.trim();

    try {
      // Streaming via SSE — texto aparece em tempo real
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/generate-sermon`;
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ theme: t }),
      });

      if (!resp.ok || !resp.body) {
        const errText = await resp.text().catch(() => "");
        let msg = "Erro ao gerar pregação";
        try { msg = JSON.parse(errText).error || msg; } catch { /* */ }
        throw new Error(msg);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let content = "";
      // Mostrar logo o card com conteúdo vazio para streaming
      setSermon({ theme: t, title: `Pregação: ${t}`, content: "" });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              setSermon((prev) => prev ? { ...prev, content } : prev);
            }
          } catch { /* ignore */ }
        }
      }

      const titleMatch = content.match(/^#\s+(.+)/m);
      const finalTitle = titleMatch ? titleMatch[1].replace(/\*+/g, "").trim() : `Pregação: ${t}`;
      setSermon({ theme: t, title: finalTitle, content });
      trackSermon(t, finalTitle);
      toast.success("Pregação gerada!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao gerar pregação. Tente novamente.");
      setSermon(null);
    } finally {
      setLoading(false);
    }
  };

  const saveSermon = async () => {
    if (!sermon || !user) {
      toast.error("Faça login para salvar");
      return;
    }
    if (sermon.id) {
      toast.info("Esta pregação já está salva");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("sermons")
        .insert({
          user_id: user.id,
          theme: sermon.theme,
          title: sermon.title,
          content: sermon.content,
        })
        .select()
        .single();
      if (error) throw error;
      setSermon({ ...sermon, id: data.id, created_at: data.created_at });
      toast.success("Pregação salva!");
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao salvar pregação");
    }
  };

  const loadSavedSermons = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("sermons")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar pregações");
      return;
    }
    setSavedSermons((data as any) || []);
    setShowSaved(true);
    setSermon(null);
  };

  const deleteSermon = async (id: string) => {
    if (!confirm("Excluir esta pregação?")) return;
    setSavingId(id);
    const { error } = await supabase.from("sermons").delete().eq("id", id);
    setSavingId(null);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    setSavedSermons((prev) => prev.filter((s) => s.id !== id));
    toast.success("Excluída");
  };

  const loadComments = async (sermonId: string) => {
    const { data } = await supabase
      .from("sermon_comments")
      .select("*")
      .eq("sermon_id", sermonId)
      .order("created_at", { ascending: true });
    setComments((data as any) || []);
  };

  const addComment = async () => {
    if (!sermon?.id || !user || !newComment.trim()) return;
    const { error } = await supabase.from("sermon_comments").insert({
      sermon_id: sermon.id,
      user_id: user.id,
      content: newComment.trim(),
    });
    if (error) {
      toast.error("Erro ao comentar");
      return;
    }
    setNewComment("");
    loadComments(sermon.id);
    toast.success("Comentário adicionado");
  };

  const deleteComment = async (id: string) => {
    const { error } = await supabase.from("sermon_comments").delete().eq("id", id);
    if (error) return toast.error("Erro");
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const shareSermon = async () => {
    if (!sermon) return;
    const shareText = `*${sermon.title}*\n\nTema: ${sermon.theme}\n\n${sermon.content}\n\n— Compartilhado via BíbliaApp`;
    if (navigator.share) {
      try {
        await navigator.share({ title: sermon.title, text: shareText });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success("Pregação copiada para compartilhar");
    }
  };

  const copySermon = async () => {
    if (!sermon) return;
    await navigator.clipboard.writeText(`${sermon.title}\n\n${sermon.content}`);
    toast.success("Copiado para a área de transferência");
  };

  const downloadSermon = () => {
    if (!sermon) return;
    const blob = new Blob([`# ${sermon.title}\n\n${sermon.content}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sermon.title.replace(/[^a-z0-9]+/gi, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mentionSermon = async () => {
    if (!sermon) return;
    const ref = `📖 Pregação: "${sermon.title}" — tema: ${sermon.theme}`;
    await navigator.clipboard.writeText(ref);
    toast.success("Menção copiada — cole onde quiser citar");
  };

  const suggestRandom = () => {
    const random = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
    setTheme(random);
    toast.info(`Sugestão: ${random}`);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-20">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary shrink-0" />
              Pregação com IA
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Tema → capítulos, versículos explicados e texto pronto para pregar
            </p>
          </div>
          {user && (
            <button
              onClick={loadSavedSermons}
              className="px-3 py-2 rounded-xl bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors shrink-0 flex items-center gap-1.5"
            >
              <BookOpen className="h-4 w-4" />
              Salvas
            </button>
          )}
        </div>

        {/* Input */}
        {!showSaved && (
          <div className="glass-card rounded-xl p-5 space-y-4">
            <label className="text-sm font-medium text-foreground block">
              Qual tema ou assunto deseja pregar?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Amor de Deus, Fé, Perdão..."
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generateSermon()}
                className="flex-1 px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
              />
              <button
                onClick={generateSermon}
                disabled={loading}
                className="px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">Gerar</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={suggestRandom}
                className="px-3 py-1.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1"
              >
                <Lightbulb className="h-3 w-3" />
                Sugerir tema
              </button>
              {SUGGESTIONS.slice(0, 6).map((s) => (
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
        )}

        {/* Loading sem conteúdo ainda */}
        {loading && !sermon?.content && (
          <div className="glass-card rounded-xl p-8 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              Preparando pregação sobre <span className="text-foreground font-medium">"{theme}"</span>...
            </p>
            <p className="text-xs text-muted-foreground/70">Conectando ao modelo de IA</p>
          </div>
        )}

        {/* Result (também aparece durante streaming) */}
        {sermon && (sermon.content || !loading) && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-card rounded-xl p-5 sm:p-6 space-y-4">
              {/* Action bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-border/50">
                <h2 className="text-lg sm:text-xl font-display font-bold text-foreground flex-1 min-w-0">
                  {sermon.title}
                </h2>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {user && (
                    <button
                      onClick={saveSermon}
                      disabled={!!sermon.id}
                      title={sermon.id ? "Já salva" : "Salvar"}
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={shareSermon}
                    title="Compartilhar"
                    className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={copySermon}
                    title="Copiar"
                    className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={downloadSermon}
                    title="Baixar (.md)"
                    className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={mentionSermon}
                    title="Mencionar / citar"
                    className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <AtSign className="h-4 w-4" />
                  </button>
                  {sermon.id && (
                    <button
                      onClick={() => setShowComments((v) => !v)}
                      title="Comentários"
                      className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {comments.length > 0 && (
                        <span className="text-xs font-semibold">{comments.length}</span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Markdown content */}
              <article className="prose prose-sm sm:prose-base prose-invert max-w-none
                prose-headings:font-display prose-headings:text-foreground
                prose-h1:text-2xl prose-h2:text-xl prose-h2:text-primary prose-h2:mt-6
                prose-h3:text-base prose-h3:text-foreground/90
                prose-p:text-foreground/85 prose-p:leading-relaxed
                prose-strong:text-foreground
                prose-blockquote:border-primary prose-blockquote:bg-primary/5
                prose-blockquote:text-foreground/90 prose-blockquote:not-italic prose-blockquote:rounded-r-lg prose-blockquote:py-1
                prose-ul:text-foreground/85 prose-li:marker:text-primary
                prose-em:text-foreground/95">
                <ReactMarkdown>{sermon.content}</ReactMarkdown>
              </article>
            </div>

            {/* Comments */}
            {sermon.id && showComments && (
              <div className="glass-card rounded-xl p-5 space-y-3 animate-fade-in">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Comentários ({comments.length})
                </h3>
                <div className="space-y-2">
                  {comments.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>
                  )}
                  {comments.map((c) => (
                    <div key={c.id} className="rounded-lg bg-secondary/50 p-3 space-y-1">
                      <p className="text-sm text-foreground/90">{c.content}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.created_at).toLocaleString("pt-BR")}
                        </span>
                        {c.user_id === user?.id && (
                          <button
                            onClick={() => deleteComment(c.id)}
                            className="text-[10px] text-destructive hover:underline"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escreva uma reflexão ou comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addComment()}
                    className="flex-1 px-3 py-2 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none"
                  />
                  <button
                    onClick={addComment}
                    disabled={!newComment.trim()}
                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Saved Sermons list */}
        {showSaved && (
          <section className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Pregações Salvas ({savedSermons.length})
              </h2>
              <button
                onClick={() => setShowSaved(false)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" /> Voltar
              </button>
            </div>
            {savedSermons.length === 0 && (
              <div className="glass-card rounded-xl p-6 text-center text-sm text-muted-foreground">
                Você ainda não salvou nenhuma pregação.
              </div>
            )}
            {savedSermons.map((s) => (
              <div
                key={s.id}
                className="glass-card rounded-xl p-4 flex items-center justify-between gap-3 hover:border-primary/20 transition-colors"
              >
                <button
                  onClick={() => {
                    setSermon(s);
                    setShowSaved(false);
                  }}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-sm font-semibold text-foreground truncate">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">Tema: {s.theme}</p>
                  {s.created_at && (
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {new Date(s.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </button>
                <button
                  onClick={() => s.id && deleteSermon(s.id)}
                  disabled={savingId === s.id}
                  className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </section>
        )}
      </div>
    </Layout>
  );
};

export default PreachingPage;
