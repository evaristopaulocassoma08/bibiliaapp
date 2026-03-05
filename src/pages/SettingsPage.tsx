import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Settings, Moon, Sun, Bell, BellOff, Type, ChevronRight, Trash2, Info, ExternalLink, Volume2, VolumeX, Smartphone } from "lucide-react";
import { toast } from "sonner";

const SettingsPage = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");
  const [sound, setSound] = useState(true);

  const handleClearFavorites = () => {
    localStorage.removeItem("bible-favorites");
    toast("Favoritos limpos com sucesso");
  };

  const handleClearNotes = () => {
    localStorage.removeItem("bible-notes");
    toast("Notas removidas com sucesso");
  };

  const handleClearHistory = () => {
    localStorage.removeItem("bible-reading-history");
    toast("Histórico limpo com sucesso");
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
                  <p className="text-xs text-muted-foreground">Tema escuro ativado</p>
                </div>
              </div>
              <button
                onClick={() => { setDarkMode(!darkMode); toast("Tema atualizado"); }}
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
                    onClick={() => { setFontSize(size); toast("Fonte atualizada"); }}
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
                onClick={() => { setSound(!sound); }}
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

        {/* About */}
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
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-foreground">Instalar App</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default SettingsPage;
