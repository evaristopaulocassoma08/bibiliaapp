import { useState } from "react";
import { Book, Heart, Home, Users, Search, StickyNote, Menu, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { title: "Início", url: "/", icon: Home },
  { title: "Bíblia", url: "/biblia", icon: Book },
  { title: "Buscar", url: "/buscar", icon: Search },
  { title: "Favoritos", url: "/favoritos", icon: Heart },
  { title: "Notas", url: "/notas", icon: StickyNote },
  { title: "Grupos", url: "/grupos", icon: Users },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className="flex flex-col items-center gap-1 px-3 py-1.5 text-muted-foreground transition-colors"
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

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-border/50">
      <div className="container flex h-14 items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="text-2xl">✝️</span>
          <span className="font-display text-lg font-bold text-primary">Bíblia Online</span>
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
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="md:hidden border-t border-border/50 py-2 animate-fade-in">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-secondary transition-colors"
              activeClassName="text-primary font-medium"
              onClick={() => setOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
