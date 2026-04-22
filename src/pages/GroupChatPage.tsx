import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Send,
  Image as ImageIcon,
  Mic,
  Square,
  Trash2,
  Users,
  Crown,
  X,
  LogOut,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface Group {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  owner_id: string | null;
}

interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string;
  created_at: string;
}

interface MemberProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
}

const GroupChatPage = () => {
  const { id: groupId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, MemberProfile>>({});
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const isOwner = group?.owner_id === user?.id;

  useEffect(() => {
    if (!groupId || !user) return;
    let mounted = true;

    (async () => {
      const { data: g } = await supabase.from("groups").select("*").eq("id", groupId).maybeSingle();
      if (!mounted) return;
      if (!g) {
        toast.error("Grupo não encontrado");
        navigate("/grupos");
        return;
      }
      setGroup(g as Group);

      await loadMessages();
      await loadMembers();
      setLoading(false);
    })();

    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "group_messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== (payload.old as Message).id));
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [groupId, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from("group_messages")
      .select("*")
      .eq("group_id", groupId!)
      .order("created_at", { ascending: true });
    setMessages((data || []) as Message[]);
  };

  const loadMembers = async () => {
    const { data: mems } = await supabase
      .from("group_members")
      .select("user_id, role")
      .eq("group_id", groupId!);
    if (!mems) return;
    const ids = mems.map((m) => m.user_id);
    if (ids.length === 0) {
      setMembers([]);
      return;
    }
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", ids);
    const list: MemberProfile[] = mems.map((m) => {
      const p = profs?.find((x) => x.user_id === m.user_id);
      return {
        user_id: m.user_id,
        display_name: p?.display_name || "Membro",
        avatar_url: p?.avatar_url || null,
        role: m.role,
      };
    });
    setMembers(list);
    const map: Record<string, MemberProfile> = {};
    list.forEach((m) => (map[m.user_id] = m));
    setProfilesById(map);
  };

  const sendText = async () => {
    if (!text.trim() || !user || !groupId) return;
    setSending(true);
    const { error } = await supabase.from("group_messages").insert({
      group_id: groupId,
      user_id: user.id,
      content: text.trim(),
      media_type: "none",
    });
    setSending(false);
    if (error) {
      toast.error("Erro ao enviar: " + error.message);
      return;
    }
    setText("");
  };

  const uploadAndSend = async (file: Blob, type: "image" | "audio", ext: string) => {
    if (!user || !groupId) return;
    setUploading(true);
    try {
      const path = `${groupId}/${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("group-media").upload(path, file, {
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("group-media").getPublicUrl(path);
      const { error } = await supabase.from("group_messages").insert({
        group_id: groupId,
        user_id: user.id,
        media_url: pub.publicUrl,
        media_type: type,
      });
      if (error) throw error;
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 5MB)");
      return;
    }
    const ext = file.name.split(".").pop() || "jpg";
    await uploadAndSend(file, "image", ext);
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        await uploadAndSend(blob, "audio", "webm");
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      toast.error("Permissão de microfone negada");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("group_messages").delete().eq("id", id);
    if (error) toast.error("Erro ao apagar");
  };

  const leaveGroup = async () => {
    if (!user || !groupId) return;
    if (isOwner) {
      toast.error("Dono não pode sair. Apague o grupo.");
      return;
    }
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
    toast("Saiu do grupo");
    navigate("/grupos");
  };

  const removeMember = async (memberId: string) => {
    if (!isOwner || !groupId) return;
    if (memberId === user?.id) return;
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", memberId);
    toast("Membro removido");
    loadMembers();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-3 glass-card rounded-xl mb-3">
          <button onClick={() => navigate("/grupos")} className="p-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
            {group?.icon || "⛪"}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">{group?.name}</h1>
            <p className="text-xs text-muted-foreground">{members.length} membros</p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-secondary">
                <Users className="h-5 w-5 text-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[380px]">
              <SheetHeader>
                <SheetTitle>Membros ({members.length})</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2 overflow-auto">
                {members.map((m) => {
                  const isMemberOwner = m.user_id === group?.owner_id;
                  return (
                    <div key={m.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {(m.display_name || "U").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                          {m.display_name}
                          {isMemberOwner && <Crown className="h-3 w-3 text-primary" />}
                          {m.user_id === user?.id && <span className="text-xs text-muted-foreground">(você)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{isMemberOwner ? "Admin" : "Membro"}</p>
                      </div>
                      {isOwner && !isMemberOwner && (
                        <button
                          onClick={() => removeMember(m.user_id)}
                          className="p-1.5 rounded-md text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 pt-4 border-t border-border">
                {!isOwner && (
                  <button
                    onClick={leaveGroup}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair do grupo
                  </button>
                )}
                {group?.description && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Descrição</p>
                    <p className="text-sm text-foreground">{group.description}</p>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 px-1 pb-3">
          {messages.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Sem mensagens ainda. Seja o primeiro!
            </div>
          )}
          {messages.map((m) => {
            const mine = m.user_id === user?.id;
            const author = profilesById[m.user_id];
            const canDelete = mine || isOwner;
            return (
              <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {(author?.display_name || "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`group max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                  {!mine && (
                    <span className="text-xs text-muted-foreground px-2">{author?.display_name || "Membro"}</span>
                  )}
                  <div
                    className={`relative px-3 py-2 rounded-2xl ${
                      mine
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary text-foreground rounded-bl-sm"
                    }`}
                  >
                    {m.media_type === "image" && m.media_url && (
                      <img
                        src={m.media_url}
                        alt="Mídia"
                        className="rounded-lg max-w-full max-h-72 mb-1"
                        loading="lazy"
                      />
                    )}
                    {m.media_type === "audio" && m.media_url && (
                      <audio controls src={m.media_url} className="max-w-full" />
                    )}
                    {m.content && <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>}
                    <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {canDelete && (
                      <button
                        onClick={() => deleteMessage(m.id)}
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-destructive text-destructive-foreground"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Composer */}
        <div className="glass-card rounded-xl p-2 flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImagePick}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || recording}
            className="p-2.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
          </button>

          {recording ? (
            <button
              onClick={stopRecording}
              className="p-2.5 rounded-lg bg-destructive text-destructive-foreground animate-pulse"
            >
              <Square className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={uploading}
              className="p-2.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
            >
              <Mic className="h-5 w-5" />
            </button>
          )}

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendText())}
            placeholder={recording ? "Gravando áudio..." : "Mensagem"}
            disabled={recording}
            className="flex-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground border-none outline-none text-sm disabled:opacity-50"
          />

          <button
            onClick={sendText}
            disabled={!text.trim() || sending || recording}
            className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 transition-opacity"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default GroupChatPage;
