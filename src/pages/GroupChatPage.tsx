import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  Plus,
  Hash,
  Settings,
  Reply,
  Copy,
  Pencil,
  Pin,
  PinOff,
  VolumeX,
  Volume2,
  Ban,
  Check,
  Link as LinkIcon,
  Shield,
  ShieldOff,
  CornerUpLeft,
  MoreVertical,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Group {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  owner_id: string | null;
  invite_code: string;
  only_admins_post: boolean;
  requires_approval: boolean;
  pinned_message_id: string | null;
  is_public: boolean;
}

interface Channel {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  position: number;
}

interface Message {
  id: string;
  group_id: string;
  channel_id: string | null;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string;
  reply_to_id: string | null;
  edited_at: string | null;
  created_at: string;
}

interface MemberProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  nickname: string | null;
  muted: boolean;
  banned: boolean;
  last_read_at: string;
}

interface JoinRequest {
  id: string;
  user_id: string;
  display_name?: string | null;
}

const MESSAGES_CACHE = (gid: string, cid: string | null) =>
  `groupmsg:${gid}:${cid || "main"}`;

const GroupChatPage = () => {
  const { id: groupId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, MemberProfile>>({});
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showNickname, setShowNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isOwner = group?.owner_id === user?.id;
  const myMember = members.find((m) => m.user_id === user?.id);
  const canPost = !myMember?.muted && !myMember?.banned && (!group?.only_admins_post || isOwner);

  // ============ LOAD ============
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
      await loadChannels();
      await loadMembers();
      if (g.owner_id === user.id) await loadRequests();
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [groupId, user]);

  // Set active channel from URL
  useEffect(() => {
    const ch = searchParams.get("c");
    if (ch !== activeChannelId) setActiveChannelId(ch || null);
  }, [searchParams]);

  // Load messages when channel changes
  useEffect(() => {
    if (!groupId) return;
    // Load from cache first (offline)
    const cached = localStorage.getItem(MESSAGES_CACHE(groupId, activeChannelId));
    if (cached) {
      try { setMessages(JSON.parse(cached)); } catch {}
    } else {
      setMessages([]);
    }
    loadMessages();
    markRead();
  }, [groupId, activeChannelId]);

  // Realtime subscriptions
  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`group-${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const m = payload.new as Message;
            if ((m.channel_id || null) !== activeChannelId) return;
            setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) => prev.map((x) => x.id === (payload.new as Message).id ? (payload.new as Message) : x));
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((x) => x.id !== (payload.old as Message).id));
          }
        })
      .on("postgres_changes", { event: "*", schema: "public", table: "group_typing", filter: `group_id=eq.${groupId}` },
        () => loadTyping())
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members", filter: `group_id=eq.${groupId}` },
        () => loadMembers())
      .on("postgres_changes", { event: "*", schema: "public", table: "group_channels", filter: `group_id=eq.${groupId}` },
        () => loadChannels())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "groups", filter: `id=eq.${groupId}` },
        (payload) => setGroup(payload.new as Group))
      .on("postgres_changes", { event: "*", schema: "public", table: "group_join_requests", filter: `group_id=eq.${groupId}` },
        () => isOwner && loadRequests())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, activeChannelId, isOwner]);

  // Cache messages
  useEffect(() => {
    if (!groupId || messages.length === 0) return;
    localStorage.setItem(MESSAGES_CACHE(groupId, activeChannelId), JSON.stringify(messages.slice(-200)));
  }, [messages, groupId, activeChannelId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadChannels = async () => {
    const { data } = await supabase.from("group_channels").select("*").eq("group_id", groupId!).order("position");
    setChannels((data || []) as Channel[]);
  };

  const loadMessages = async () => {
    let q = supabase.from("group_messages").select("*").eq("group_id", groupId!).order("created_at", { ascending: true }).limit(200);
    if (activeChannelId) q = q.eq("channel_id", activeChannelId);
    else q = q.is("channel_id", null);
    const { data } = await q;
    if (data) setMessages(data as Message[]);
  };

  const loadMembers = async () => {
    const { data: mems } = await supabase.from("group_members").select("user_id, role, nickname, muted, banned, last_read_at").eq("group_id", groupId!);
    if (!mems) return;
    const ids = mems.map((m: any) => m.user_id);
    if (!ids.length) { setMembers([]); return; }
    const { data: profs } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", ids);
    const list: MemberProfile[] = mems.map((m: any) => {
      const p = profs?.find((x: any) => x.user_id === m.user_id);
      return {
        user_id: m.user_id,
        display_name: p?.display_name || "Membro",
        avatar_url: p?.avatar_url || null,
        role: m.role,
        nickname: m.nickname,
        muted: m.muted,
        banned: m.banned,
        last_read_at: m.last_read_at,
      };
    });
    setMembers(list);
    const map: Record<string, MemberProfile> = {};
    list.forEach((m) => (map[m.user_id] = m));
    setProfilesById(map);
    const me = list.find((m) => m.user_id === user?.id);
    if (me?.nickname) setNicknameInput(me.nickname);
  };

  const loadRequests = async () => {
    const { data } = await supabase.from("group_join_requests").select("id, user_id").eq("group_id", groupId!).eq("status", "pending");
    if (!data) { setRequests([]); return; }
    const ids = data.map((r: any) => r.user_id);
    if (!ids.length) { setRequests([]); return; }
    const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
    setRequests(data.map((r: any) => ({ ...r, display_name: profs?.find((p: any) => p.user_id === r.user_id)?.display_name || "Utilizador" })));
  };

  const loadTyping = async () => {
    const cutoff = new Date(Date.now() - 5000).toISOString();
    const { data } = await supabase.from("group_typing").select("user_id, updated_at").eq("group_id", groupId!).gt("updated_at", cutoff);
    setTypingUsers((data || []).map((t: any) => t.user_id).filter((id: string) => id !== user?.id));
  };

  const markRead = async () => {
    if (!user || !groupId) return;
    await supabase.from("group_members").update({ last_read_at: new Date().toISOString() }).eq("group_id", groupId).eq("user_id", user.id);
  };

  // ============ ACTIONS ============
  const sendText = async () => {
    if (!text.trim() || !user || !groupId) return;
    if (editingId) {
      const { error } = await supabase.from("group_messages").update({ content: text.trim(), edited_at: new Date().toISOString() }).eq("id", editingId);
      if (error) toast.error("Erro: " + error.message);
      setEditingId(null); setText(""); return;
    }
    setSending(true);
    const { error } = await supabase.from("group_messages").insert({
      group_id: groupId,
      channel_id: activeChannelId,
      user_id: user.id,
      content: text.trim(),
      media_type: "none",
      reply_to_id: replyTo?.id || null,
    });
    setSending(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    setText(""); setReplyTo(null);
    clearTyping();
  };

  const handleTyping = (v: string) => {
    setText(v);
    if (!user || !groupId) return;
    supabase.from("group_typing").upsert({ group_id: groupId, user_id: user.id, channel_id: activeChannelId, updated_at: new Date().toISOString() });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => clearTyping(), 4000);
  };

  const clearTyping = async () => {
    if (!user || !groupId) return;
    await supabase.from("group_typing").delete().eq("group_id", groupId).eq("user_id", user.id);
  };

  const uploadAndSend = async (file: Blob, type: "image" | "audio", ext: string) => {
    if (!user || !groupId) return;
    setUploading(true);
    try {
      const path = `${groupId}/${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("group-media").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("group-media").getPublicUrl(path);
      const { error } = await supabase.from("group_messages").insert({
        group_id: groupId, channel_id: activeChannelId, user_id: user.id,
        media_url: pub.publicUrl, media_type: type, reply_to_id: replyTo?.id || null,
      });
      if (error) throw error;
      setReplyTo(null);
    } catch (e: any) { toast.error("Erro: " + e.message); }
    finally { setUploading(false); }
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem muito grande (máx 5MB)"); return; }
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
    } catch { toast.error("Permissão de microfone negada"); }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("group_messages").delete().eq("id", id);
    if (error) toast.error("Erro ao apagar");
  };

  const startEdit = (m: Message) => {
    setEditingId(m.id);
    setText(m.content || "");
    setReplyTo(null);
  };

  const copyMessage = (m: Message) => {
    navigator.clipboard.writeText(m.content || m.media_url || "");
    toast.success("Copiado");
  };

  const pinMessage = async (id: string | null) => {
    if (!isOwner) return;
    await supabase.from("groups").update({ pinned_message_id: id }).eq("id", groupId!);
    toast.success(id ? "Mensagem fixada" : "Desfixada");
  };

  const leaveGroup = async () => {
    if (!user || !groupId) return;
    if (isOwner) { toast.error("Dono não pode sair. Apague o grupo."); return; }
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
    toast("Saiu do grupo");
    navigate("/grupos");
  };

  const removeMember = async (memberId: string) => {
    if (!isOwner || !groupId || memberId === user?.id) return;
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", memberId);
    toast("Membro removido");
  };

  const toggleMute = async (m: MemberProfile) => {
    if (!isOwner || m.user_id === user?.id) return;
    await supabase.from("group_members").update({ muted: !m.muted }).eq("group_id", groupId!).eq("user_id", m.user_id);
    toast(m.muted ? "Desbloqueado de enviar" : "Silenciado");
  };

  const toggleBan = async (m: MemberProfile) => {
    if (!isOwner || m.user_id === user?.id) return;
    if (!m.banned) {
      await supabase.from("group_members").update({ banned: true }).eq("group_id", groupId!).eq("user_id", m.user_id);
      toast("Banido");
    } else {
      await supabase.from("group_members").update({ banned: false }).eq("group_id", groupId!).eq("user_id", m.user_id);
      toast("Desbanido");
    }
  };

  const saveNickname = async () => {
    if (!user || !groupId) return;
    await supabase.from("group_members").update({ nickname: nicknameInput.trim() || null }).eq("group_id", groupId).eq("user_id", user.id);
    toast.success("Apelido atualizado");
    setShowNickname(false);
  };

  const updateGroupSettings = async (patch: Partial<Group>) => {
    if (!isOwner) return;
    await supabase.from("groups").update(patch).eq("id", groupId!);
  };

  const regenerateInvite = async () => {
    const newCode = Math.random().toString(36).slice(2, 12);
    await updateGroupSettings({ invite_code: newCode } as any);
    toast.success("Novo código gerado");
  };

  const copyInvite = () => {
    if (!group) return;
    const url = `${window.location.origin}/grupos?invite=${group.invite_code}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  };

  const approveRequest = async (r: JoinRequest) => {
    await supabase.from("group_members").insert({ group_id: groupId!, user_id: r.user_id });
    await supabase.from("group_join_requests").update({ status: "approved" }).eq("id", r.id);
    toast.success("Aprovado");
  };

  const rejectRequest = async (r: JoinRequest) => {
    await supabase.from("group_join_requests").delete().eq("id", r.id);
    toast("Rejeitado");
  };

  const createChannel = async () => {
    if (!isOwner || !newChannelName.trim() || !user) return;
    const { error, data } = await supabase.from("group_channels").insert({
      group_id: groupId!, name: newChannelName.trim().toLowerCase().replace(/\s+/g, "-"),
      created_by: user.id, position: channels.length,
    }).select().single();
    if (error) { toast.error("Erro: " + error.message); return; }
    setNewChannelName(""); setShowCreateChannel(false);
    if (data) selectChannel(data.id);
  };

  const deleteChannel = async (id: string) => {
    if (!isOwner) return;
    if (!confirm("Apagar este canal e todas as mensagens?")) return;
    await supabase.from("group_channels").delete().eq("id", id);
    if (activeChannelId === id) selectChannel(null);
  };

  const selectChannel = (id: string | null) => {
    if (id) setSearchParams({ c: id }); else setSearchParams({});
  };

  // ============ RENDER ============
  if (loading) {
    return <Layout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div></Layout>;
  }

  const pinnedMsg = messages.find((m) => m.id === group?.pinned_message_id);
  const activeChannelName = activeChannelId ? channels.find((c) => c.id === activeChannelId)?.name : "geral";
  const typingNames = typingUsers.map((id) => profilesById[id]?.nickname || profilesById[id]?.display_name).filter(Boolean);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        {/* HEADER */}
        <div className="flex items-center gap-3 p-3 glass-card rounded-xl mb-3">
          <button onClick={() => navigate("/grupos")} className="p-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
            {group?.icon || "⛪"}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate flex items-center gap-1.5">
              {group?.name}
              {group?.only_admins_post && <Shield className="h-3.5 w-3.5 text-primary" />}
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              <Hash className="h-3 w-3 inline" />{activeChannelName} · {members.length} membros
            </p>
          </div>

          {isOwner && requests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">{requests.length}</span>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-secondary"><Users className="h-5 w-5 text-foreground" /></button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] sm:w-[400px] overflow-y-auto">
              <SheetHeader><SheetTitle>{group?.name}</SheetTitle></SheetHeader>
              <Tabs defaultValue="channels" className="mt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="channels" className="flex-1">Canais</TabsTrigger>
                  <TabsTrigger value="members" className="flex-1">Membros</TabsTrigger>
                  {isOwner && <TabsTrigger value="admin" className="flex-1">Admin</TabsTrigger>}
                </TabsList>

                {/* CHANNELS TAB */}
                <TabsContent value="channels" className="space-y-2 mt-4">
                  <button onClick={() => selectChannel(null)} className={`w-full flex items-center gap-2 p-2 rounded-lg ${!activeChannelId ? "bg-primary/15 text-primary" : "hover:bg-secondary"}`}>
                    <Hash className="h-4 w-4" /><span className="text-sm font-medium">geral</span>
                  </button>
                  {channels.map((c) => (
                    <div key={c.id} className="flex items-center gap-1">
                      <button onClick={() => selectChannel(c.id)} className={`flex-1 flex items-center gap-2 p-2 rounded-lg ${activeChannelId === c.id ? "bg-primary/15 text-primary" : "hover:bg-secondary"}`}>
                        <Hash className="h-4 w-4" /><span className="text-sm font-medium truncate">{c.name}</span>
                      </button>
                      {isOwner && (
                        <button onClick={() => deleteChannel(c.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {isOwner && (
                    <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
                      <DialogTrigger asChild>
                        <button className="w-full flex items-center justify-center gap-2 p-2 mt-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium">
                          <Plus className="h-4 w-4" />Novo canal
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Criar canal</DialogTitle></DialogHeader>
                        <input value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="ex: oração, avisos" className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground border border-border outline-none focus:border-primary text-sm" />
                        <button onClick={createChannel} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm">Criar</button>
                      </DialogContent>
                    </Dialog>
                  )}
                </TabsContent>

                {/* MEMBERS TAB */}
                <TabsContent value="members" className="space-y-2 mt-4">
                  <button onClick={() => setShowNickname(true)} className="w-full flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-medium mb-2">
                    <Edit3 className="h-4 w-4" />Mudar meu apelido
                  </button>
                  {members.map((m) => {
                    const isMemOwner = m.user_id === group?.owner_id;
                    const displayName = m.nickname || m.display_name;
                    return (
                      <div key={m.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {(displayName || "U").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                            {displayName}
                            {isMemOwner && <Crown className="h-3 w-3 text-primary" />}
                            {m.muted && <VolumeX className="h-3 w-3 text-muted-foreground" />}
                            {m.banned && <Ban className="h-3 w-3 text-destructive" />}
                            {m.user_id === user?.id && <span className="text-xs text-muted-foreground">(você)</span>}
                          </p>
                          {m.nickname && <p className="text-xs text-muted-foreground truncate">{m.display_name}</p>}
                        </div>
                        {isOwner && !isMemOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-md hover:bg-secondary"><MoreVertical className="h-4 w-4" /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => toggleMute(m)}>
                                {m.muted ? <Volume2 className="h-4 w-4 mr-2" /> : <VolumeX className="h-4 w-4 mr-2" />}
                                {m.muted ? "Permitir enviar" : "Silenciar"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleBan(m)}>
                                {m.banned ? <ShieldOff className="h-4 w-4 mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
                                {m.banned ? "Desbanir" : "Banir"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => removeMember(m.user_id)} className="text-destructive">
                                <X className="h-4 w-4 mr-2" />Remover do grupo
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    );
                  })}
                  {!isOwner && (
                    <button onClick={leaveGroup} className="w-full flex items-center justify-center gap-2 mt-4 py-2.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20">
                      <LogOut className="h-4 w-4" />Sair do grupo
                    </button>
                  )}
                </TabsContent>

                {/* ADMIN TAB */}
                {isOwner && (
                  <TabsContent value="admin" className="space-y-4 mt-4">
                    <div className="space-y-3 p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" />Só admins enviam</Label>
                        <Switch checked={group?.only_admins_post} onCheckedChange={(v) => updateGroupSettings({ only_admins_post: v })} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm flex items-center gap-2"><Check className="h-4 w-4" />Aprovação para entrar</Label>
                        <Switch checked={group?.requires_approval} onCheckedChange={(v) => updateGroupSettings({ requires_approval: v })} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm flex items-center gap-2">Grupo público</Label>
                        <Switch checked={group?.is_public} onCheckedChange={(v) => updateGroupSettings({ is_public: v })} />
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-secondary/30 space-y-2">
                      <Label className="text-xs text-muted-foreground">Link de convite</Label>
                      <div className="flex gap-2">
                        <input readOnly value={`${window.location.origin}/grupos?invite=${group?.invite_code}`} className="flex-1 px-2 py-1.5 rounded bg-background text-xs text-foreground border border-border outline-none" />
                        <button onClick={copyInvite} className="p-2 rounded bg-primary text-primary-foreground"><LinkIcon className="h-3.5 w-3.5" /></button>
                        <button onClick={regenerateInvite} className="p-2 rounded bg-secondary text-foreground" title="Gerar novo"><Settings className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>

                    {requests.length > 0 && (
                      <div className="p-3 rounded-lg bg-secondary/30 space-y-2">
                        <Label className="text-xs text-muted-foreground">Pedidos pendentes ({requests.length})</Label>
                        {requests.map((r) => (
                          <div key={r.id} className="flex items-center justify-between p-2 rounded bg-background">
                            <span className="text-sm text-foreground">{r.display_name}</span>
                            <div className="flex gap-1">
                              <button onClick={() => approveRequest(r)} className="p-1.5 rounded bg-primary text-primary-foreground"><Check className="h-3.5 w-3.5" /></button>
                              <button onClick={() => rejectRequest(r)} className="p-1.5 rounded bg-destructive/10 text-destructive"><X className="h-3.5 w-3.5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </SheetContent>
          </Sheet>
        </div>

        {/* PINNED MESSAGE */}
        {pinnedMsg && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
            <p className="text-xs text-foreground truncate flex-1">{pinnedMsg.content || "[mídia]"}</p>
            {isOwner && <button onClick={() => pinMessage(null)} className="text-muted-foreground hover:text-destructive"><PinOff className="h-3 w-3" /></button>}
          </div>
        )}

        {/* MESSAGES */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 px-1 pb-3">
          {messages.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">Sem mensagens em #{activeChannelName}</div>}
          {messages.map((m) => {
            const mine = m.user_id === user?.id;
            const author = profilesById[m.user_id];
            const authorName = author?.nickname || author?.display_name || "Membro";
            const canDelete = mine || isOwner;
            const replyMsg = m.reply_to_id ? messages.find((x) => x.id === m.reply_to_id) : null;
            return (
              <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{(authorName).slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`group max-w-[75%] flex flex-col gap-0.5 ${mine ? "items-end" : "items-start"}`}>
                  {!mine && <span className="text-xs text-muted-foreground px-2">{authorName}</span>}
                  <div className={`relative px-3 py-2 rounded-2xl ${mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"}`}>
                    {replyMsg && (
                      <div className={`mb-1.5 pl-2 border-l-2 ${mine ? "border-primary-foreground/40" : "border-primary"} text-xs opacity-75`}>
                        <p className="font-medium">{profilesById[replyMsg.user_id]?.nickname || profilesById[replyMsg.user_id]?.display_name || "Membro"}</p>
                        <p className="truncate max-w-[200px]">{replyMsg.content || "[mídia]"}</p>
                      </div>
                    )}
                    {m.media_type === "image" && m.media_url && <img src={m.media_url} alt="Mídia" className="rounded-lg max-w-full max-h-72 mb-1" loading="lazy" />}
                    {m.media_type === "audio" && m.media_url && <audio controls src={m.media_url} className="max-w-full" />}
                    {m.content && <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>}
                    <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {m.edited_at && " · editada"}
                    </p>

                    <div className={`absolute ${mine ? "-left-9" : "-right-9"} top-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded-full bg-secondary border border-border hover:bg-secondary/80"><MoreVertical className="h-3 w-3 text-foreground" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={mine ? "end" : "start"}>
                          <DropdownMenuItem onClick={() => setReplyTo(m)}><Reply className="h-3.5 w-3.5 mr-2" />Responder</DropdownMenuItem>
                          {m.content && <DropdownMenuItem onClick={() => copyMessage(m)}><Copy className="h-3.5 w-3.5 mr-2" />Copiar</DropdownMenuItem>}
                          {mine && m.content && <DropdownMenuItem onClick={() => startEdit(m)}><Pencil className="h-3.5 w-3.5 mr-2" />Editar</DropdownMenuItem>}
                          {isOwner && <DropdownMenuItem onClick={() => pinMessage(m.id)}><Pin className="h-3.5 w-3.5 mr-2" />Fixar</DropdownMenuItem>}
                          {canDelete && <DropdownMenuItem onClick={() => deleteMessage(m.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" />Apagar</DropdownMenuItem>}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {typingNames.length > 0 && (
            <div className="text-xs text-muted-foreground italic px-2 animate-pulse">
              {typingNames.join(", ")} {typingNames.length === 1 ? "está" : "estão"} digitando...
            </div>
          )}
        </div>

        {/* REPLY/EDIT BANNER */}
        {(replyTo || editingId) && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-primary/10 border-l-2 border-primary">
            {editingId ? <Pencil className="h-4 w-4 text-primary" /> : <CornerUpLeft className="h-4 w-4 text-primary" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary">{editingId ? "Editando" : `Respondendo a ${profilesById[replyTo!.user_id]?.nickname || profilesById[replyTo!.user_id]?.display_name}`}</p>
              <p className="text-xs text-muted-foreground truncate">{replyTo?.content || "[mídia]"}</p>
            </div>
            <button onClick={() => { setReplyTo(null); setEditingId(null); setText(""); }} className="p-1 hover:bg-secondary rounded">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* COMPOSER */}
        {!canPost ? (
          <div className="glass-card rounded-xl p-4 text-center text-sm text-muted-foreground">
            {myMember?.banned ? "Você foi banido deste grupo" : myMember?.muted ? "Você foi silenciado pelo admin" : "Apenas admins podem enviar mensagens"}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-2 flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading || recording} className="p-2.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors disabled:opacity-50">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
            </button>
            {recording ? (
              <button onClick={stopRecording} className="p-2.5 rounded-lg bg-destructive text-destructive-foreground animate-pulse"><Square className="h-5 w-5" /></button>
            ) : (
              <button onClick={startRecording} disabled={uploading || !!editingId} className="p-2.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"><Mic className="h-5 w-5" /></button>
            )}
            <input
              type="text"
              value={text}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendText())}
              placeholder={recording ? "Gravando..." : editingId ? "Editar mensagem" : `Mensagem em #${activeChannelName}`}
              disabled={recording}
              className="flex-1 px-3 py-2.5 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground border-none outline-none text-sm disabled:opacity-50"
            />
            <button onClick={sendText} disabled={!text.trim() || sending || recording} className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 transition-opacity">
              <Send className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* NICKNAME DIALOG */}
      <Dialog open={showNickname} onOpenChange={setShowNickname}>
        <DialogContent>
          <DialogHeader><DialogTitle>Meu apelido neste grupo</DialogTitle></DialogHeader>
          <input value={nicknameInput} onChange={(e) => setNicknameInput(e.target.value)} placeholder="Como aparecerá aqui" className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground border border-border outline-none focus:border-primary text-sm" />
          <button onClick={saveNickname} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm">Salvar</button>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default GroupChatPage;
