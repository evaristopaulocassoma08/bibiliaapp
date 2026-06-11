import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Send, ArrowLeft, Ban, UserCheck, UserPlus, Image as ImgIcon } from "lucide-react";
import { toast } from "sonner";

interface Msg {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string | null;
  image_url: string | null;
  read_at: string | null;
  created_at: string;
}

const DMChatPage = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [following, setFollowing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!user || !userId) return;
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`)
      .order("created_at");
    setMsgs((data as Msg[]) || []);
    await supabase.from("direct_messages").update({ read_at: new Date().toISOString() }).eq("sender_id", userId).eq("recipient_id", user.id).is("read_at", null);
    const { data: p } = await supabase.from("profiles").select("display_name,avatar_url").eq("user_id", userId).maybeSingle();
    setProfile(p as any);
    const { data: b } = await supabase.from("user_blocks").select("blocked_id").eq("blocker_id", user.id).eq("blocked_id", userId).maybeSingle();
    setBlocked(!!b);
    const { data: f } = await supabase.from("user_follows").select("followed_id").eq("follower_id", user.id).eq("followed_id", userId).maybeSingle();
    setFollowing(!!f);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const ch = supabase.channel(`dm-${user.id}-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (p) => {
        const m = p.new as Msg;
        if ((m.sender_id === user.id && m.recipient_id === userId) || (m.sender_id === userId && m.recipient_id === user.id)) load();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, userId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (image_url: string | null = null) => {
    if (!user || !userId) return;
    if (blocked) { toast.error("Desbloqueie para enviar"); return; }
    const content = text.trim();
    if (!content && !image_url) return;
    setText("");
    const { error } = await supabase.from("direct_messages").insert({ sender_id: user.id, recipient_id: userId, content: content || null, image_url });
    if (error) { toast.error(error.message); return; }
    await supabase.from("notifications").insert({ user_id: userId, type: "dm", title: "Nova mensagem", body: content?.slice(0,80), link: `/mensagens/${user.id}` });
  };

  const uploadImg = async (f: File) => {
    if (!user) return;
    const path = `${user.id}/dm/${Date.now()}-${f.name}`;
    const { error } = await supabase.storage.from("group-media").upload(path, f);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("group-media").getPublicUrl(path);
    send(data.publicUrl);
  };

  const toggleBlock = async () => {
    if (!user || !userId) return;
    if (blocked) {
      await supabase.from("user_blocks").delete().eq("blocker_id", user.id).eq("blocked_id", userId);
      toast("Desbloqueado");
    } else {
      await supabase.from("user_blocks").insert({ blocker_id: user.id, blocked_id: userId });
      toast("Bloqueado — não receberá mais mensagens");
    }
    load();
  };

  const toggleFollow = async () => {
    if (!user || !userId) return;
    if (following) {
      await supabase.from("user_follows").delete().eq("follower_id", user.id).eq("followed_id", userId);
    } else {
      await supabase.from("user_follows").insert({ follower_id: user.id, followed_id: userId });
    }
    load();
  };

  if (!user) return <Layout><div className="text-center py-20 text-muted-foreground">Faça login</div></Layout>;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
        <div className="flex items-center gap-3 p-3 border-b border-border">
          <button onClick={() => navigate("/mensagens")} className="p-2"><ArrowLeft className="h-4 w-4" /></button>
          {profile?.avatar_url ? <img src={profile.avatar_url} className="h-9 w-9 rounded-full" /> : <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">{(profile?.display_name || "?").charAt(0).toUpperCase()}</div>}
          <span className="flex-1 font-semibold truncate">{profile?.display_name || "Membro"}</span>
          <button onClick={toggleFollow} title={following ? "Deixar de seguir" : "Seguir"} className={`p-2 rounded-lg ${following ? "text-primary" : "text-muted-foreground"} hover:bg-secondary`}>
            {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          </button>
          <button onClick={toggleBlock} title={blocked ? "Desbloquear" : "Bloquear"} className={`p-2 rounded-lg ${blocked ? "text-destructive" : "text-muted-foreground"} hover:bg-destructive/10`}>
            <Ban className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {msgs.map(m => {
            const mine = m.sender_id === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                  {m.image_url && <img src={m.image_url} className="rounded-lg mb-1 max-h-60" />}
                  {m.content && <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>}
                  <p className="text-[9px] opacity-70 mt-0.5">{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            );
          })}
          {msgs.length === 0 && <p className="text-center text-xs text-muted-foreground py-10">Sem mensagens. Diga olá!</p>}
          <div ref={endRef} />
        </div>

        <div className="p-2 border-t border-border flex gap-2">
          <label className="p-2.5 rounded-lg bg-secondary cursor-pointer hover:bg-secondary/80">
            <ImgIcon className="h-4 w-4" />
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadImg(f); }} />
          </label>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={blocked ? "Bloqueado" : "Mensagem..."} disabled={blocked} className="flex-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" />
          <button onClick={() => send()} disabled={blocked || !text.trim()} className="p-2.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" /></button>
        </div>
      </div>
    </Layout>
  );
};

export default DMChatPage;
