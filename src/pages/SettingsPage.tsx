import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Settings,
  Moon,
  Sun,
  Bell,
  BellOff,
  Type,
  ChevronRight,
  Trash2,
  Info,
  Volume2,
  VolumeX,
  Smartphone,
  LogOut,
  Download,
  Upload,
  History,
  Globe,
  Clock,
  Heart,
  StickyNote,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { sounds } from "@/lib/sound-effects";
import { exportActivity, clearAllActivity } from "@/lib/activity-tracker";
import { clearBibleCache } from "@/lib/bible-service";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") !== "false");
  const [notifications, setNotifications] = useState(() => localStorage.getItem("notifications") !== "false");
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">(
    () => (localStorage.getItem("fontSize") as any) || "medium",
  );
  const [sound, setSound] = useState(() => localStorage.getItem("sound") !== "false");
  const [dailyVerseTime, setDailyVerseTime] = useState(() => localStorage.getItem("dailyVerseTime") || "08:00");
  const [readingReminder, setReadingReminder] = useState(() => localStorage.getItem("readingReminder") === "true");
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "pt-BR");
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(
    () => (typeof Notification !== "undefined" ? Notification.permission : "default"),
  );

  // ── Effects: persist + apply ──
  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));
    document.documentElement.classList.toggle("light", !darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("fontSize", fontSize);
    document.documentElement.style.fontSize =
      fontSize === "small" ? "14px" : fontSize === "large" ? "18px" : "16px";
  }, [fontSize]);

  useEffect(() => { localStorage.setItem("notifications", String(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem("sound", String(sound)); }, [sound]);
  useEffect(() => { localStorage.setItem("dailyVerseTime", dailyVerseTime); }, [dailyVerseTime]);
  useEffect(() => { localStorage.setItem("readingReminder", String(readingReminder)); }, [readingReminder]);
  useEffect(() => { localStorage.setItem("language", language); }, [language]);

  // ── Actions ──
  const toggleDark = () => {
    setDarkMode((v) => !v);
    sounds.click();
    toast.success(darkMode ? "Modo claro ativado" : "Modo escuro ativado");
  };

  const toggleSound = () => {
    setSound((v) => {
      const next = !v;
      localStorage.setItem("sound", String(next));
      if (next) setTimeout(() => sounds.success(), 50);
      toast(next ? "Sons ativados" : "Sons desativados");
      return next;
    });
  };

  const toggleNotifications = async () => {
    if (!notifications) {
      // Ativando — pedir permissão se ainda não tiver
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        const perm = await Notification.requestPermission();
        setPushPermission(perm);
        if (perm !== "granted") {
          toast.error("Permissão de notificação negada pelo navegador");
          return;
        }
      }
      setNotifications(true);
      sounds.success();
      toast.success("Versículo diário ativado");
      // Notificação de teste imediata
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("BíbliaApp", {
          body: "Pronto! Você receberá um versículo todos os dias às " + dailyVerseTime,
        });
      }
    } else {
      setNotifications(false);
      sounds.click();
      toast("Notificações desativadas");
    }
  };

  const handleClearFavorites = async () => {
    if (!confirm("Apagar todos os favoritos?")) return;
    if (user) await supabase.from("favorites").delete().eq("user_id", user.id);
    localStorage.removeItem("bible-favorites");
    sounds.success();
    toast.success("Favoritos limpos");
  };

  const handleClearNotes = async () => {
    if (!confirm("Apagar todas as notas?")) return;
    if (user) await supabase.from("notes").delete().eq("user_id", user.id);
    localStorage.removeItem("bible-notes");
    sounds.success();
    toast.success("Notas removidas");
  };

  const handleClearHistory = () => {
    if (!confirm("Apagar histórico de leitura e buscas?")) return;
    localStorage.removeItem("bible-reading-history");
    clearAllActivity();
    sounds.success();
    toast.success("Histórico limpo");
  };

  const handleClearOfflineBible = () => {
    if (!confirm("Remover capítulos da Bíblia baixados offline?")) return;
    clearBibleCache();
    sounds.success();
    toast.success("Bíblia offline removida");
  };

  const handleExportData = () => {
    const data = {
      preferences: {
        darkMode, notifications, fontSize, sound, dailyVerseTime, readingReminder, language,
      },
      activity: exportActivity(),
      exportedAt: new Date().toISOString(),
      app: "BíbliaApp",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bibliaapp-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    sounds.success();
    toast.success("Backup baixado");
  };

  const handleImportData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.preferences) {
          Object.entries(data.preferences).forEach(([k, v]) => {
            localStorage.setItem(k, String(v));
          });
        }
        if (data.activity) {
          if (data.activity.reading) localStorage.setItem("activity:reading", JSON.stringify(data.activity.reading));
          if (data.activity.search) localStorage.setItem("activity:search", JSON.stringify(data.activity.search));
          if (data.activity.sermon) localStorage.setItem("activity:sermon", JSON.stringify(data.activity.sermon));
          if (data.activity.sessions) localStorage.setItem("activity:sessions", JSON.stringify(data.activity.sessions));
        }
        toast.success("Backup restaurado — recarregando...");
        setTimeout(() => window.location.reload(), 800);
      } catch {
        toast.error("Arquivo inválido");
      }
    };
    input.click();
  };

  const handleSignOut = async () => {
    await signOut();
    toast("Sessão encerrada");
    navigate("/login");
  };

  const handleInstallPWA = async () => {
    const deferredPrompt = (window as any).__pwaInstallPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === "accepted") {
        toast.success("App instalado!");
        (window as any).__pwaInstallPrompt = null;
      }
    } else {
      toast.info("Use o menu do navegador → 'Adicionar à tela inicial'");
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-20">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground">Personalize sua experiência</p>
        </div>

        {/* Aparência */}
        <Section title="Aparência">
          <Toggle
            icon={darkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
            label="Modo Escuro"
            sub={darkMode ? "Tema escuro ativado" : "Tema claro ativado"}
            value={darkMode}
            onToggle={toggleDark}
          />
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Type className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Tamanho da Fonte</p>
                <p className="text-xs text-muted-foreground">Ajuste a leitura</p>
              </div>
            </div>
            <div className="flex gap-2 ml-8">
              {(["small", "medium", "large"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => { setFontSize(size); sounds.click(); }}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                    fontSize === size
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {size === "small" ? "Pequena" : size === "medium" ? "Média" : "Grande"}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Idioma</p>
                <p className="text-xs text-muted-foreground">Idioma da interface</p>
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => { setLanguage(e.target.value); sounds.click(); toast.success("Idioma atualizado"); }}
              className="px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border border-border outline-none focus:border-primary"
            >
              <option value="pt-BR">Português (BR)</option>
              <option value="pt-PT">Português (PT)</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </Section>

        {/* Notificações */}
        <Section title="Notificações">
          <Toggle
            icon={notifications ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
            label="Versículo Diário"
            sub={
              notifications
                ? `Ativado · ${pushPermission === "granted" ? "permissão concedida" : "permissão pendente"}`
                : "Receber versículo todos os dias"
            }
            value={notifications}
            onToggle={toggleNotifications}
          />
          {notifications && (
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Horário do versículo</p>
                  <p className="text-xs text-muted-foreground">Quando enviar a notificação</p>
                </div>
              </div>
              <input
                type="time"
                value={dailyVerseTime}
                onChange={(e) => setDailyVerseTime(e.target.value)}
                className="px-3 py-2 rounded-lg bg-secondary text-sm text-foreground border border-border outline-none focus:border-primary"
              />
            </div>
          )}
          <Toggle
            icon={<Bell className="h-5 w-5 text-primary" />}
            label="Lembrete de Leitura"
            sub="Lembrete diário para abrir o app"
            value={readingReminder}
            onToggle={() => { setReadingReminder((v) => !v); sounds.click(); toast(readingReminder ? "Lembrete desativado" : "Lembrete ativado"); }}
          />
          <Toggle
            icon={sound ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
            label="Sons"
            sub="Feedback sonoro nos botões"
            value={sound}
            onToggle={toggleSound}
          />
        </Section>

        {/* Atalhos */}
        <Section title="Acesso rápido">
          <Row icon={<History className="h-5 w-5 text-primary" />} label="Histórico de Leitura" onClick={() => navigate("/historico")} />
          <Row icon={<Heart className="h-5 w-5 text-primary" />} label="Meus Favoritos" onClick={() => navigate("/favoritos")} />
          <Row icon={<StickyNote className="h-5 w-5 text-primary" />} label="Minhas Notas" onClick={() => navigate("/notas")} />
        </Section>

        {/* Dados */}
        <Section title="Dados">
          <Row icon={<Download className="h-5 w-5 text-primary" />} label="Exportar meus dados" onClick={handleExportData} />
          <Row icon={<Upload className="h-5 w-5 text-primary" />} label="Importar backup" onClick={handleImportData} />
          <Row icon={<Database className="h-5 w-5 text-destructive" />} label="Limpar Bíblia offline" onClick={handleClearOfflineBible} danger />
          <Row icon={<Trash2 className="h-5 w-5 text-destructive" />} label="Limpar Favoritos" onClick={handleClearFavorites} danger />
          <Row icon={<Trash2 className="h-5 w-5 text-destructive" />} label="Limpar Notas" onClick={handleClearNotes} danger />
          <Row icon={<Trash2 className="h-5 w-5 text-destructive" />} label="Limpar Histórico" onClick={handleClearHistory} danger />
        </Section>

        {/* Sobre */}
        <Section title="Sobre">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">BíbliaApp</p>
                <p className="text-xs text-muted-foreground">Versão 1.0.0 · NVI completa</p>
              </div>
            </div>
          </div>
          <Row icon={<Smartphone className="h-5 w-5 text-primary" />} label="Instalar App" onClick={handleInstallPWA} />
          <Row icon={<Info className="h-5 w-5 text-primary" />} label="Sobre o desenvolvedor" onClick={() => navigate("/sobre")} />
        </Section>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 text-destructive text-sm font-semibold hover:bg-destructive/20 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair da Conta
        </button>
      </div>
    </Layout>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">{title}</h2>
    <div className="glass-card rounded-xl overflow-hidden divide-y divide-border/50">{children}</div>
  </section>
);

const Toggle = ({
  icon, label, sub, value, onToggle,
}: { icon: React.ReactNode; label: string; sub: string; value: boolean; onToggle: () => void }) => (
  <div className="flex items-center justify-between p-4">
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
    <button
      onClick={onToggle}
      className={`w-12 h-7 rounded-full transition-colors relative ${value ? "bg-primary" : "bg-secondary"}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-foreground transition-transform ${
          value ? "left-[calc(100%-1.625rem)]" : "left-0.5"
        }`}
      />
    </button>
  </div>
);

const Row = ({
  icon, label, onClick, danger,
}: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
  >
    <div className="flex items-center gap-3">
      {icon}
      <p className={`text-sm font-medium ${danger ? "text-foreground" : "text-foreground"}`}>{label}</p>
    </div>
    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
  </button>
);

export default SettingsPage;
