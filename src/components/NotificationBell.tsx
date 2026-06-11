import { useEffect, useState } from "react";
import { Bell, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setItems((data as Notif[]) || []);
  };

  useEffect(() => {
    if (!user) { setItems([]); return; }
    load();
    const ch = supabase
      .channel("notif-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  if (!user) return null;
  const unread = items.filter(i => !i.read_at).length;

  const markAll = async () => {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
    load();
  };

  const open_ = async (n: Notif) => {
    if (!n.read_at) await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
    load();
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">{unread}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-auto rounded-xl glass-card border border-border z-50 shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between p-3 border-b border-border bg-background/95 backdrop-blur">
              <span className="text-sm font-semibold">Notificações</span>
              <div className="flex gap-1">
                {unread > 0 && <button onClick={markAll} title="Marcar todas" className="p-1.5 hover:bg-secondary rounded"><Check className="h-3.5 w-3.5" /></button>}
                <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-secondary rounded"><X className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            {items.length === 0 ? (
              <p className="p-6 text-center text-xs text-muted-foreground">Nenhuma notificação</p>
            ) : (
              <ul>
                {items.map(n => (
                  <li key={n.id}>
                    <button onClick={() => open_(n)} className={`w-full text-left p-3 border-b border-border/30 hover:bg-secondary/50 ${!n.read_at ? "bg-primary/5" : ""}`}>
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                      <p className="text-[10px] text-muted-foreground/70 mt-1">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
