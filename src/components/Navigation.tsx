import { useState } from "react";
import { Book, Heart, Home, Users, Search, StickyNote, Menu, X, User, Settings, Flame, Sparkles, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const navItems = [
  { title: "Início", url: "/", icon: Home },
  { title: "Bíblia", url: "/biblia", icon: Book },
  { title: "Buscar", url: "/buscar", icon: Search },
  { title: "Pregação IA", url: "/pregacao", icon: Sparkles },
  { title: "Favoritos", url: "/favoritos", icon: Heart },
  { title: "Notas", url: "/notas", icon: StickyNote },
  { title: "Grupos", url: "/grupos", icon: Users },
  { title: "Perfil", url: "/perfil", icon: User },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

const bottomItems = [
  { title: "Início", url: "/", icon: Home },
  { title: "Bíblia", url: "/biblia", icon: Book },
  { title: "IA", url: "/pregacao", icon: Sparkles },
  { title: "Favoritos", url: "/favoritos", icon: Heart },
  { title: "Perfil", url: "/perfil", icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 md:hidden safe-bottom">
      <div className="flex items-center justify-around py-1.5">
        {bottomItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted-foreground transition-all duration-200 rounded-lg"
            activeClassName="text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function TopNav() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast("Sessão encerrada");
    navigate("/login");
  };

  const handleSignIn = () => navigate("/login");

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-border/50">
      <div className="container flex h-14 items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gold-gradient flex items-center justify-center">
            <Flame className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">
            Bíblia<span className="text-primary">App</span>
          </span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors"
              activeClassName="bg-secondary text-primary font-medium"
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </NavLink>
          ))}
          {user ? (
            <button onClick={handleSignOut} title="Sair" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors ml-1">
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleSignIn} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity ml-1">
              Entrar
            </button>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="md:hidden border-t border-border/50 py-2 animate-fade-in bg-background/95 backdrop-blur-xl">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-secondary transition-colors"
              activeClassName="text-primary font-medium bg-secondary/50"
              onClick={() => setOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </NavLink>
          ))}
          {user ? (
            <button
              onClick={() => { setOpen(false); handleSignOut(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          ) : (
            <button
              onClick={() => { setOpen(false); handleSignIn(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-primary font-medium hover:bg-primary/10 transition-colors"
            >
              <User className="h-4 w-4" />
              Entrar / Criar conta
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
