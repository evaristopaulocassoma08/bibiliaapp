import { Layout } from "@/components/Layout";
import { User, BookOpen, Heart, StickyNote, Calendar, ChevronRight, Award, Flame } from "lucide-react";
import { getFavorites, getNotes, getReadingHistory } from "@/lib/bible-data";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const navigate = useNavigate();
  const favCount = getFavorites().length;
  const noteCount = getNotes().length;
  const historyCount = getReadingHistory().length;

  const stats = [
    { icon: BookOpen, label: "Leituras", value: historyCount, color: "text-blue-400" },
    { icon: Heart, label: "Favoritos", value: favCount, color: "text-red-400" },
    { icon: StickyNote, label: "Notas", value: noteCount, color: "text-yellow-400" },
    { icon: Flame, label: "Dias ativos", value: Math.max(1, historyCount), color: "text-orange-400" },
  ];

  const menuItems = [
    { icon: Heart, label: "Meus Favoritos", desc: `${favCount} versículos salvos`, url: "/favoritos" },
    { icon: StickyNote, label: "Minhas Notas", desc: `${noteCount} anotações`, url: "/notas" },
    { icon: BookOpen, label: "Histórico de Leitura", desc: `${historyCount} leituras`, url: "/biblia" },
    { icon: Award, label: "Conquistas", desc: "Em breve", url: "#" },
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
            <h1 className="text-xl font-display font-bold text-foreground">Servo de Deus</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Membro desde {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Level Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Flame className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary">Leitor Dedicado</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-3 text-center">
              <stat.icon className={`h-5 w-5 mx-auto mb-1.5 ${stat.color}`} />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Menu */}
        <section className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => item.url !== "#" && navigate(item.url)}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-secondary/50 transition-colors group"
            >
              <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </section>
      </div>
    </Layout>
  );
};

export default ProfilePage;
