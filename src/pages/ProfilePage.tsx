import { Layout } from "@/components/Layout";
import { User, BookOpen, Heart, StickyNote, Calendar, ChevronRight, Award, Flame, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast("Sessão encerrada");
    navigate("/login");
  };

  const menuItems = [
    { icon: Heart, label: "Meus Favoritos", url: "/favoritos" },
    { icon: StickyNote, label: "Minhas Notas", url: "/notas" },
    { icon: BookOpen, label: "Histórico de Leitura", url: "/historico" },
    { icon: Settings, label: "Configurações", url: "/configuracoes" },
  ];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Profile Header */}
        <div className="glass-card rounded-2xl p-6 text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-gold-gradient flex items-center justify-center mx-auto shadow-lg shadow-primary/30">
            <User className="h-9 w-9 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Servo de Deus"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Membro desde {user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "hoje"}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Flame className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">Leitor Dedicado</span>
          </div>
        </div>

        {/* Menu */}
        <section className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.url)}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-secondary/50 transition-colors group"
            >
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </section>

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

export default ProfilePage;
