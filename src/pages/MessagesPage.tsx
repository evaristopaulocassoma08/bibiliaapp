import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Search, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Conv {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  last: string | null;
  at: string;
  unread: number;
}

interface ProfileRow { user_id: string; display_name: string | null; avatar_url: string | null; }

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [searching, setSearching] = useState("");
  const [results, setResults] = useState<ProfileRow[]>([]);

  const load = async () => {
    if (!user) return;
    const { data: msgs } = await supabase
      .from("direct_messages")
      .select("sender_id,recipient_id,content,read_at,created_at")
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    if (!msgs) return;
    const map = new Map<string, Conv>();
    for (const m of msgs as any[]) {
      const other = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      if (!map.has(other)) {
        map.set(other, { user_id: other, display_name: null, avatar_url: null, last: m.content, at: m.created_at, unread: 0 });
      }
      if (m.recipient_id === user.id && !m.read_at) {
        const c = map.get(other)!; c.unread += 1;
      }
    }
    const ids = Array.from(map.keys());
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id,display_name,avatar_url").in("user_id", ids);
      (profs as ProfileRow[] || []).forEach(p => {
        const c = map.get(p.user_id); if (c) { c.display_name = p.display_name; c.avatar_url = p.avatar_url; }
      });
    }
    setConvs(Array.from(map.values()).sort((a,b) => +new Date(b.at) - +new Date(a.at)));
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase.channel("dm-list-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const search = async (q: string) => {
    setSearching(q);
    if (q.length < 2) { setResults([]); return; }
    const { data } = await supabase.from("profiles").select("user_id,display_name,avatar_url").ilike("display_name", `%${q}%`).limit(10);
    setResults(((data as ProfileRow[]) || []).filter(p => p.user_id !== user?.id));
  };

  if (!user) return <Layout><div className="text-center py-20 text-muted-foreground">Faça login para mensagens privadas.</div></Layout>;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in pb-20">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2"><MessageCircle className="h-6 w-6 text-primary" />Mensagens</h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={searching} onChange={e => search(e.target.value)} placeholder="Procurar membro pelo nome..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm" />
        </div>

        {results.length > 0 && (
          <div className="glass-card rounded-xl p-2 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1">Iniciar conversa</p>
            {results.map(p => (
              <button key={p.user_id} onClick={() => navigate(`/mensagens/${p.user_id}`)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary text-left">
                {p.avatar_url ? <img src={p.avatar_url} className="h-9 w-9 rounded-full" /> : <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">{(p.display_name || "?").charAt(0).toUpperCase()}</div>}
                <span className="text-sm">{p.display_name || "Sem nome"}</span>
              </button>
            ))}
          </div>
        )}

        {convs.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto"><MessageCircle className="h-7 w-7 text-muted-foreground/30" /></div>
            <p className="text-foreground font-medium">Sem conversas</p>
            <p className="text-xs text-muted-foreground">Procure um membro pelo nome para iniciar</p>
          </div>
        ) : (
          <div className="space-y-1">
            {convs.map(c => (
              <button key={c.user_id} onClick={() => navigate(`/mensagens/${c.user_id}`)} className="w-full glass-card rounded-xl p-3 flex items-center gap-3 hover:border-primary/30 transition-colors text-left">
                {c.avatar_url ? <img src={c.avatar_url} className="h-11 w-11 rounded-full object-cover" /> : <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">{(c.display_name || "?").charAt(0).toUpperCase()}</div>}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{c.display_name || "Membro"}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{new Date(c.at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate">{c.last || "—"}</p>
                    {c.unread > 0 && <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 min-w-[18px] text-center">{c.unread}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MessagesPage;
