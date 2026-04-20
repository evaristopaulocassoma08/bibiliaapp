import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import {
  History,
  BookOpen,
  Search,
  Sparkles,
  Flame,
  Calendar,
  TrendingUp,
  Trash2,
  Clock,
} from "lucide-react";
import {
  getReadingHistory,
  getSearchHistory,
  getSermonHistory,
  getMostReadChapters,
  getMostReadBooks,
  getTopSearches,
  getTopSermonThemes,
  getStreak,
  getTotals,
  clearAllActivity,
} from "@/lib/activity-tracker";
import { toast } from "sonner";

const HistoryPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"resumo" | "leitura" | "buscas" | "pregacoes">("resumo");
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  const totals = getTotals();
  const streak = getStreak();
  const topChapters = getMostReadChapters(8);
  const topBooks = getMostReadBooks(5);
  const topSearches = getTopSearches(8);
  const topThemes = getTopSermonThemes(8);
  const recentReading = getReadingHistory().slice(0, 20);
  const recentSearches = getSearchHistory().slice(0, 20);
  const recentSermons = getSermonHistory().slice(0, 20);

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const handleClear = () => {
    if (!confirm("Apagar TODO o histórico de atividade? Esta ação não pode ser desfeita.")) return;
    clearAllActivity();
    toast.success("Histórico apagado");
    refresh();
  };

  return (
    <Layout key={tick}>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-20">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <History className="h-6 w-6 text-primary" />
              Histórico
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Sua atividade no app: leitura, buscas e pregações
            </p>
          </div>
          <button
            onClick={handleClear}
            className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
            title="Limpar histórico"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard icon={<Flame className="h-4 w-4" />} value={streak.current} label="Sequência" suffix="dias" />
          <StatCard icon={<Calendar className="h-4 w-4" />} value={streak.total} label="Dias ativos" />
          <StatCard icon={<BookOpen className="h-4 w-4" />} value={totals.readings} label="Capítulos lidos" />
          <StatCard icon={<Sparkles className="h-4 w-4" />} value={totals.sermons} label="Pregações" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-secondary overflow-x-auto">
          {(["resumo", "leitura", "buscas", "pregacoes"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 min-w-[80px] py-2 px-3 rounded-lg text-xs font-medium transition-colors capitalize whitespace-nowrap ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "pregacoes" ? "Pregações" : t}
            </button>
          ))}
        </div>

        {/* Resumo */}
        {tab === "resumo" && (
          <div className="space-y-5">
            <Section title="Capítulos mais lidos" icon={<TrendingUp className="h-4 w-4" />}>
              {topChapters.length === 0 ? (
                <Empty text="Comece a ler para ver suas estatísticas" />
              ) : (
                topChapters.map((c) => (
                  <RankRow
                    key={`${c.bookId}:${c.chapter}`}
                    label={`${c.bookName} ${c.chapter}`}
                    count={c.count}
                    onClick={() => navigate("/biblia")}
                  />
                ))
              )}
            </Section>

            <Section title="Livros favoritos" icon={<BookOpen className="h-4 w-4" />}>
              {topBooks.length === 0 ? (
                <Empty text="Nenhum livro lido ainda" />
              ) : (
                topBooks.map((b) => (
                  <RankRow
                    key={b.bookId}
                    label={b.bookName}
                    count={b.count}
                    suffix="leituras"
                    onClick={() => navigate("/biblia")}
                  />
                ))
              )}
            </Section>

            <Section title="Temas mais pesquisados" icon={<Search className="h-4 w-4" />}>
              {topSearches.length === 0 ? (
                <Empty text="Faça buscas para ver suas tendências" />
              ) : (
                topSearches.map((s) => (
                  <RankRow
                    key={s.query}
                    label={s.query}
                    count={s.count}
                    suffix="buscas"
                    onClick={() => navigate("/buscar")}
                  />
                ))
              )}
            </Section>

            <Section title="Temas pregados" icon={<Sparkles className="h-4 w-4" />}>
              {topThemes.length === 0 ? (
                <Empty text="Gere pregações com IA para preencher" />
              ) : (
                topThemes.map((s) => (
                  <RankRow
                    key={s.theme}
                    label={s.theme}
                    count={s.count}
                    onClick={() => navigate("/pregacao")}
                  />
                ))
              )}
            </Section>
          </div>
        )}

        {/* Leitura recente */}
        {tab === "leitura" && (
          <Section title="Leituras recentes" icon={<Clock className="h-4 w-4" />}>
            {recentReading.length === 0 ? (
              <Empty text="Nenhuma leitura registrada ainda" />
            ) : (
              recentReading.map((r, i) => (
                <button
                  key={i}
                  onClick={() => navigate("/biblia")}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary/60 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {r.bookName} {r.chapter}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.timestamp)}</p>
                  </div>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </button>
              ))
            )}
          </Section>
        )}

        {/* Buscas recentes */}
        {tab === "buscas" && (
          <Section title="Buscas recentes" icon={<Clock className="h-4 w-4" />}>
            {recentSearches.length === 0 ? (
              <Empty text="Nenhuma busca registrada" />
            ) : (
              recentSearches.map((s, i) => (
                <button
                  key={i}
                  onClick={() => navigate("/buscar")}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary/60 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">"{s.query}"</p>
                    <p className="text-xs text-muted-foreground">{formatDate(s.timestamp)}</p>
                  </div>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </button>
              ))
            )}
          </Section>
        )}

        {/* Pregações recentes */}
        {tab === "pregacoes" && (
          <Section title="Pregações geradas" icon={<Clock className="h-4 w-4" />}>
            {recentSermons.length === 0 ? (
              <Empty text="Nenhuma pregação gerada ainda" />
            ) : (
              recentSermons.map((s, i) => (
                <button
                  key={i}
                  onClick={() => navigate("/pregacao")}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary/60 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.theme} · {formatDate(s.timestamp)}
                    </p>
                  </div>
                  <Sparkles className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                </button>
              ))
            )}
          </Section>
        )}
      </div>
    </Layout>
  );
};

const StatCard = ({
  icon,
  value,
  label,
  suffix,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
}) => (
  <div className="glass-card rounded-xl p-3 space-y-1">
    <div className="flex items-center gap-1.5 text-primary">
      {icon}
      <span className="text-xl font-bold text-foreground">{value}</span>
      {suffix && <span className="text-[10px] text-muted-foreground">{suffix}</span>}
    </div>
    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
  </div>
);

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="space-y-2">
    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-2">
      {icon}
      {title}
    </h2>
    <div className="glass-card rounded-xl p-2 space-y-1">{children}</div>
  </section>
);

const RankRow = ({
  label,
  count,
  suffix = "vezes",
  onClick,
}: {
  label: string;
  count: number;
  suffix?: string;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary/60 transition-colors text-left"
  >
    <span className="text-sm font-medium text-foreground truncate">{label}</span>
    <span className="text-xs font-semibold text-primary shrink-0 ml-2">
      {count} {suffix}
    </span>
  </button>
);

const Empty = ({ text }: { text: string }) => (
  <p className="text-xs text-muted-foreground text-center py-4">{text}</p>
);

export default HistoryPage;
