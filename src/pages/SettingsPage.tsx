import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Moon, Sun, Bell, BellOff, Type, ChevronRight, Trash2, Info, Volume2, VolumeX, Smartphone, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") !== "false");
  const [notifications, setNotifications] = useState(() => localStorage.getItem("notifications") !== "false");
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">(() => (localStorage.getItem("fontSize") as any) || "medium");
  const [sound, setSound] = useState(() => localStorage.getItem("sound") !== "false");

  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));
    document.documentElement.classList.toggle("light", !darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("fontSize", fontSize);
    document.documentElement.style.fontSize = fontSize === "small" ? "14px" : fontSize === "large" ? "18px" : "16px";
  }, [fontSize]);

  useEffect(() => { localStorage.setItem("notifications", String(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem("sound", String(sound)); }, [sound]);

  const handleClearFavorites = async () => {
    if (user) {
      await supabase.from("favorites").delete().eq("user_id", user.id);
    }
    localStorage.removeItem("bible-favorites");
    toast("Favoritos limpos com sucesso");
  };

  const handleClearNotes = async () => {
    if (user) {
      await supabase.from("notes").delete().eq("user_id", user.id);
    }
    localStorage.removeItem("bible-notes");
    toast("Notas removidas com sucesso");
  };

  const handleClearHistory = () => {
    localStorage.removeItem("bible-reading-history");
    toast("Histórico limpo com sucesso");
  };

  const handleSignOut = async () => {
    await signOut();
    toast("Sessão encerrada");
    navigate("/login");
  };

  const handleInstallPWA = () => {
    const deferredPrompt = (window as any).__pwaInstallPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else {
      toast("Para instalar: abra o menu do navegador e toque em 'Adicionar à tela inicial'");
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-bold text-foreground">
            <Settings className="h-7 w-7 text-primary inline mr-2" />
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground">Personalize sua experiência</p>
        </div>

        {/* Appearance */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">Aparência</h2>
          <div className="glass-card rounded-xl overflow-hidden divide-y divide-border/50">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                <div>
                  <p className="text-sm font-medium text-foreground">Modo Escuro</p>
                  <p className="text-xs text-muted-foreground">{darkMode ? "Tema escuro ativado" : "Tema claro ativado"}</p>
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-7 rounded-full transition-colors relative ${darkMode ? "bg-primary" : "bg-secondary"}`}
              >
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-foreground transition-transform ${darkMode ? "left-[calc(100%-1.625rem)]" : "left-0.5"}`} />
              </button>
            </div>

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
                    onClick={() => setFontSize(size)}
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
          </div>
        </section>

        {/* Notifications */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">Notificações</h2>
          <div className="glass-card rounded-xl overflow-hidden divide-y divide-border/50">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {notifications ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium text-foreground">Versículo Diário</p>
                  <p className="text-xs text-muted-foreground">Receber versículo do dia</p>
                </div>
              </div>
              <button
                onClick={() => { setNotifications(!notifications); toast(notifications ? "Notificações desativadas" : "Notificações ativadas"); }}
                className={`w-12 h-7 rounded-full transition-colors relative ${notifications ? "bg-primary" : "bg-secondary"}`}
              >
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-foreground transition-transform ${notifications ? "left-[calc(100%-1.625rem)]" : "left-0.5"}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {sound ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium text-foreground">Sons</p>
                  <p className="text-xs text-muted-foreground">Feedback sonoro</p>
                </div>
              </div>
              <button
                onClick={() => { setSound(!sound); toast(sound ? "Sons desativados" : "Sons ativados"); }}
                className={`w-12 h-7 rounded-full transition-colors relative ${sound ? "bg-primary" : "bg-secondary"}`}
              >
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-foreground transition-transform ${sound ? "left-[calc(100%-1.625rem)]" : "left-0.5"}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Data */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">Dados</h2>
          <div className="glass-card rounded-xl overflow-hidden divide-y divide-border/50">
            <button onClick={handleClearFavorites} className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-destructive" />
                <p className="text-sm font-medium text-foreground">Limpar Favoritos</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </button>
            <button onClick={handleClearNotes} className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-destructive" />
                <p className="text-sm font-medium text-foreground">Limpar Notas</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </button>
            <button onClick={handleClearHistory} className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-destructive" />
                <p className="text-sm font-medium text-foreground">Limpar Histórico</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </button>
          </div>
        </section>

        {/* About & Install */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-1">Sobre</h2>
          <div className="glass-card rounded-xl overflow-hidden divide-y divide-border/50">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">BíbliaApp</p>
                  <p className="text-xs text-muted-foreground">Versão 1.0.0</p>
                </div>
              </div>
            </div>
            <button onClick={handleInstallPWA} className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-foreground">Instalar App</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </button>
          </div>
        </section>

        {/* Sign Out */}
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

export default SettingsPage;
