import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Church, MapPin, Phone, Calendar, Users, Plus, ArrowLeft, Clock, User as UserIcon, Trash2, Navigation as NavIcon, MessageCircle, Upload, Heart, Image as ImgIcon, Pin, Send } from "lucide-react";
import { toast } from "sonner";

interface ChurchData {
  id: string; name: string; description: string | null; address: string | null;
  latitude: number | null; longitude: number | null;
  leader_name: string | null; leader_contact: string | null;
  photo_url: string | null; denomination: string | null; created_by: string;
}
interface Ministry { id: string; church_id: string; name: string; category: string; description: string | null; leader_name: string | null; leader_contact: string | null; schedule: string | null; }
interface Event { id: string; church_id: string; title: string; description: string | null; starts_at: string; ends_at: string | null; location: string | null; recurrence: string | null; }
interface GroupRow { id: string; name: string; description: string | null; icon: string | null; church_id: string | null; }
interface Post { id: string; author_id: string; content: string; image_url: string | null; pinned: boolean; created_at: string; }
interface Photo { id: string; image_url: string; caption: string | null; uploader_id: string; created_at: string; }

const CATEGORIES = [
  { value: "coro", label: "🎵 Coro" },
  { value: "jovens", label: "🔥 Jovens" },
  { value: "escola_dominical", label: "📖 Escola Dominical" },
  { value: "infantil", label: "👶 Infantil" },
  { value: "intercessao", label: "🙏 Intercessão" },
  { value: "missoes", label: "✝️ Missões" },
  { value: "ministerio", label: "⛪ Ministério" },
  { value: "atividade", label: "📅 Atividade" },
];

type Tab = "info" | "feed" | "ministerios" | "eventos" | "grupos" | "galeria";

const ChurchDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [church, setChurch] = useState<ChurchData | null>(null);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState<Tab>("feed");
  const [showMin, setShowMin] = useState(false);
  const [showEvt, setShowEvt] = useState(false);
  const [showGrp, setShowGrp] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [postImg, setPostImg] = useState<string>("");

  const [minForm, setMinForm] = useState({ name: "", category: "ministerio", description: "", leader_name: "", leader_contact: "", schedule: "" });
  const [evtForm, setEvtForm] = useState({ title: "", description: "", starts_at: "", ends_at: "", location: "", recurrence: "" });
  const [grpForm, setGrpForm] = useState({ name: "", description: "", icon: "⛪" });

  const load = async () => {
    if (!id) return;
    const [{ data: c }, { data: m }, { data: e }, { data: g }, { data: p }, { data: gal }, { count: fc }] = await Promise.all([
      supabase.from("churches").select("*").eq("id", id).maybeSingle(),
      supabase.from("church_ministries").select("*").eq("church_id", id).order("created_at"),
      supabase.from("church_events").select("*").eq("church_id", id).order("starts_at"),
      supabase.from("groups").select("id,name,description,icon,church_id").eq("church_id", id).order("created_at"),
      supabase.from("church_posts").select("*").eq("church_id", id).order("pinned", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("church_gallery").select("*").eq("church_id", id).order("created_at", { ascending: false }),
      supabase.from("church_followers").select("*", { count: "exact", head: true }).eq("church_id", id),
    ]);
    setChurch(c as ChurchData);
    setMinistries((m as Ministry[]) || []);
    setEvents((e as Event[]) || []);
    setGroups((g as GroupRow[]) || []);
    setPosts((p as Post[]) || []);
    setPhotos((gal as Photo[]) || []);
    setFollowers(fc || 0);
    if (user) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      setIsAdmin(!!roles?.some((r: any) => r.role === "admin"));
      const { data: f } = await supabase.from("church_followers").select("user_id").eq("church_id", id).eq("user_id", user.id).maybeSingle();
      setFollowing(!!f);
    }
  };

  useEffect(() => { load(); }, [id, user]);

  const canManage = user && church && (isAdmin || church.created_by === user.id);

  const toggleFollow = async () => {
    if (!user || !id) { toast.error("Faça login para seguir"); return; }
    if (following) {
      await supabase.from("church_followers").delete().eq("church_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("church_followers").insert({ church_id: id, user_id: user.id });
    }
    load();
  };

  const submitPost = async () => {
    if (!user || !id || (!newPost.trim() && !postImg)) return;
    const { error } = await supabase.from("church_posts").insert({ church_id: id, author_id: user.id, content: newPost.trim() || "(imagem)", image_url: postImg || null });
    if (error) { toast.error(error.message); return; }
    setNewPost(""); setPostImg("");
    toast.success("Publicado!");
    load();
  };

  const uploadPostImg = async (f: File) => {
    if (!user) return;
    const path = `${user.id}/posts/${Date.now()}-${f.name}`;
    const { error } = await supabase.storage.from("church-photos").upload(path, f);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("church-photos").getPublicUrl(path);
    setPostImg(data.publicUrl);
  };

  const togglePin = async (p: Post) => {
    await supabase.from("church_posts").update({ pinned: !p.pinned }).eq("id", p.id);
    load();
  };

  const deletePost = async (pid: string) => {
    await supabase.from("church_posts").delete().eq("id", pid);
    load();
  };

  const uploadGallery = async (f: File) => {
    if (!user || !id) return;
    const path = `${user.id}/gallery/${Date.now()}-${f.name}`;
    const { error } = await supabase.storage.from("church-photos").upload(path, f);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("church-photos").getPublicUrl(path);
    await supabase.from("church_gallery").insert({ church_id: id, uploader_id: user.id, image_url: data.publicUrl });
    toast.success("Foto adicionada à galeria");
    load();
  };

  const deletePhoto = async (pid: string) => {
    await supabase.from("church_gallery").delete().eq("id", pid);
    load();
  };

  const addMinistry = async () => {
    if (!minForm.name.trim() || !id) return;
    const { error } = await supabase.from("church_ministries").insert({ church_id: id, ...minForm, description: minForm.description || null, leader_name: minForm.leader_name || null, leader_contact: minForm.leader_contact || null, schedule: minForm.schedule || null });
    if (error) { toast.error(error.message); return; }
    toast.success("Ministério adicionado!");
    setMinForm({ name: "", category: "ministerio", description: "", leader_name: "", leader_contact: "", schedule: "" });
    setShowMin(false);
    load();
  };

  const addEvent = async () => {
    if (!evtForm.title.trim() || !evtForm.starts_at || !id) { toast.error("Título e data obrigatórios"); return; }
    const { error } = await supabase.from("church_events").insert({
      church_id: id, title: evtForm.title, description: evtForm.description || null,
      starts_at: new Date(evtForm.starts_at).toISOString(),
      ends_at: evtForm.ends_at ? new Date(evtForm.ends_at).toISOString() : null,
      location: evtForm.location || null, recurrence: evtForm.recurrence || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Evento adicionado!");
    setEvtForm({ title: "", description: "", starts_at: "", ends_at: "", location: "", recurrence: "" });
    setShowEvt(false);
    load();
  };

  const addToMyAgenda = async (ev: Event) => {
    if (!user) { toast.error("Faça login"); return; }
    await supabase.from("scheduled_events").insert({
      user_id: user.id, title: ev.title, description: ev.description,
      starts_at: ev.starts_at, ends_at: ev.ends_at, location: ev.location,
      recurrence: ev.recurrence || "none", church_id: id, color: "blue",
    });
    toast.success("Adicionado à sua agenda!");
  };

  const deleteMinistry = async (mid: string) => { await supabase.from("church_ministries").delete().eq("id", mid); load(); };
  const deleteEvent = async (eid: string) => { await supabase.from("church_events").delete().eq("id", eid); load(); };

  const addGroup = async () => {
    if (!user) { toast.error("Faça login"); return; }
    if (!grpForm.name.trim() || !id) return;
    const { data, error } = await supabase.from("groups").insert({
      name: grpForm.name, description: grpForm.description || null, icon: grpForm.icon,
      owner_id: user.id, church_id: id, is_public: true,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    await supabase.from("group_members").insert({ group_id: data.id, user_id: user.id, role: "admin" });
    toast.success("Grupo criado!");
    setGrpForm({ name: "", description: "", icon: "⛪" });
    setShowGrp(false);
    load();
  };

  const uploadChurchPhoto = async (file: File) => {
    if (!user || !church) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("church-photos").upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("church-photos").getPublicUrl(path);
    await supabase.from("churches").update({ photo_url: data.publicUrl }).eq("id", church.id);
    load();
  };

  if (!church) return <Layout><div className="flex justify-center py-10"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-4 animate-fade-in pb-20">
        <button onClick={() => navigate("/igrejas")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="relative">
            {church.photo_url ? (
              <img src={church.photo_url} alt={church.name} className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-32 bg-primary/10 flex items-center justify-center"><Church className="h-16 w-16 text-primary/50" /></div>
            )}
            {canManage && (
              <label className="absolute bottom-2 right-2 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur text-xs cursor-pointer hover:bg-background">
                <Upload className="h-3 w-3" /> Trocar capa
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadChurchPhoto(f); }} />
              </label>
            )}
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-display font-bold text-foreground">{church.name}</h1>
                {church.denomination && <p className="text-sm text-primary">{church.denomination}</p>}
                <p className="text-xs text-muted-foreground mt-1">{followers} seguidor{followers !== 1 ? "es" : ""}</p>
              </div>
              <button onClick={toggleFollow} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${following ? "bg-secondary text-foreground" : "bg-primary text-primary-foreground"}`}>
                <Heart className={`h-4 w-4 ${following ? "fill-current text-primary" : ""}`} />
                {following ? "Seguindo" : "Seguir"}
              </button>
            </div>
            {church.description && <p className="text-sm text-muted-foreground">{church.description}</p>}
          </div>
        </div>

        <div className="flex gap-2 border-b border-border overflow-x-auto">
          {(["feed","info","ministerios","eventos","grupos","galeria"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
              {t === "feed" ? `Feed (${posts.length})` : t === "info" ? "Info" : t === "ministerios" ? `Ministérios (${ministries.length})` : t === "eventos" ? `Eventos (${events.length})` : t === "grupos" ? `Grupos (${groups.length})` : `Galeria (${photos.length})`}
            </button>
          ))}
        </div>

        {tab === "feed" && (
          <div className="space-y-3">
            {user ? (
              <div className="glass-card rounded-xl p-3 space-y-2">
                <textarea rows={2} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm resize-none" placeholder="Compartilhe algo com a comunidade..." value={newPost} onChange={e => setNewPost(e.target.value)} />
                {postImg && <img src={postImg} className="rounded-lg max-h-40" />}
                <div className="flex justify-between">
                  <label className="px-3 py-2 rounded-lg bg-secondary text-xs cursor-pointer flex items-center gap-1.5">
                    <ImgIcon className="h-3.5 w-3.5" /> Foto
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadPostImg(f); }} />
                  </label>
                  <button onClick={submitPost} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"><Send className="h-3.5 w-3.5" />Publicar</button>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground py-2">Faça login para publicar</p>
            )}
            {posts.map(p => (
              <div key={p.id} className={`glass-card rounded-xl p-4 ${p.pinned ? "border-primary/40" : ""}`}>
                {p.pinned && <p className="text-[10px] text-primary mb-1 flex items-center gap-1"><Pin className="h-3 w-3" />Destacado</p>}
                <p className="text-sm whitespace-pre-wrap">{p.content}</p>
                {p.image_url && <img src={p.image_url} className="mt-2 rounded-lg max-h-72 w-full object-cover" />}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                  <span className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleString("pt-BR")}</span>
                  {(canManage || p.author_id === user?.id) && (
                    <div className="flex gap-1">
                      {canManage && <button onClick={() => togglePin(p)} className="p-1.5 hover:bg-secondary rounded text-muted-foreground"><Pin className="h-3.5 w-3.5" /></button>}
                      <button onClick={() => deletePost(p.id)} className="p-1.5 hover:bg-destructive/10 rounded text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {posts.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Sem publicações ainda</p>}
          </div>
        )}

        {tab === "info" && (
          <div className="space-y-3">
            {church.address && (
              <div className="glass-card rounded-xl p-4 flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Endereço</p>
                  <p className="text-sm text-foreground">{church.address}</p>
                  {church.latitude && church.longitude && (
                    <a href={`https://www.google.com/maps?q=${church.latitude},${church.longitude}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline">
                      <NavIcon className="h-3 w-3" /> Abrir no Google Maps
                    </a>
                  )}
                </div>
              </div>
            )}
            {church.leader_name && (
              <div className="glass-card rounded-xl p-4 flex items-start gap-3">
                <UserIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div><p className="text-xs text-muted-foreground">Líder / Pároco</p><p className="text-sm">{church.leader_name}</p></div>
              </div>
            )}
            {church.leader_contact && (
              <a href={church.leader_contact.includes("@") ? `mailto:${church.leader_contact}` : `tel:${church.leader_contact}`} className="glass-card rounded-xl p-4 flex items-start gap-3 hover:border-primary/30">
                <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div><p className="text-xs text-muted-foreground">Contacto</p><p className="text-sm text-primary">{church.leader_contact}</p></div>
              </a>
            )}
          </div>
        )}

        {tab === "ministerios" && (
          <div className="space-y-3">
            {canManage && (
              <button onClick={() => setShowMin(!showMin)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-primary/40 text-sm text-primary hover:bg-primary/5">
                <Plus className="h-4 w-4" /> Novo Ministério / Coro / Atividade
              </button>
            )}
            {showMin && (
              <div className="glass-card rounded-xl p-4 space-y-3 border-primary/20">
                <input className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" placeholder="Nome" value={minForm.name} onChange={e => setMinForm({...minForm, name: e.target.value})} />
                <select className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" value={minForm.category} onChange={e => setMinForm({...minForm, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <textarea rows={2} className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm resize-none" placeholder="Descrição" value={minForm.description} onChange={e => setMinForm({...minForm, description: e.target.value})} />
                <input className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" placeholder="Líder responsável" value={minForm.leader_name} onChange={e => setMinForm({...minForm, leader_name: e.target.value})} />
                <input className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" placeholder="Contacto do líder" value={minForm.leader_contact} onChange={e => setMinForm({...minForm, leader_contact: e.target.value})} />
                <input className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" placeholder="Horário (ex: Sábado 18h)" value={minForm.schedule} onChange={e => setMinForm({...minForm, schedule: e.target.value})} />
                <button onClick={addMinistry} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Adicionar</button>
              </div>
            )}
            {ministries.map(m => {
              const cat = CATEGORIES.find(c => c.value === m.category);
              return (
                <div key={m.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-primary">{cat?.label || m.category}</p>
                      <h3 className="font-semibold">{m.name}</h3>
                      {m.description && <p className="text-xs text-muted-foreground mt-1">{m.description}</p>}
                      {m.leader_name && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><UserIcon className="h-3 w-3" />{m.leader_name}</p>}
                      {m.schedule && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3" />{m.schedule}</p>}
                      {m.leader_contact && <a href={`tel:${m.leader_contact}`} className="text-xs text-primary mt-1 flex items-center gap-1"><Phone className="h-3 w-3" />{m.leader_contact}</a>}
                    </div>
                    {canManage && <button onClick={() => deleteMinistry(m.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </div>
              );
            })}
            {ministries.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Nenhum ministério</p>}
          </div>
        )}

        {tab === "eventos" && (
          <div className="space-y-3">
            {canManage && (
              <button onClick={() => setShowEvt(!showEvt)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-primary/40 text-sm text-primary hover:bg-primary/5">
                <Plus className="h-4 w-4" /> Novo Culto / Evento
              </button>
            )}
            {showEvt && (
              <div className="glass-card rounded-xl p-4 space-y-3 border-primary/20">
                <input className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" placeholder="Título" value={evtForm.title} onChange={e => setEvtForm({...evtForm, title: e.target.value})} />
                <textarea rows={2} className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm resize-none" placeholder="Descrição" value={evtForm.description} onChange={e => setEvtForm({...evtForm, description: e.target.value})} />
                <input type="datetime-local" className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" value={evtForm.starts_at} onChange={e => setEvtForm({...evtForm, starts_at: e.target.value})} />
                <input type="datetime-local" className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" value={evtForm.ends_at} onChange={e => setEvtForm({...evtForm, ends_at: e.target.value})} />
                <input className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" placeholder="Local" value={evtForm.location} onChange={e => setEvtForm({...evtForm, location: e.target.value})} />
                <select className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" value={evtForm.recurrence} onChange={e => setEvtForm({...evtForm, recurrence: e.target.value})}>
                  <option value="">Sem repetição</option><option value="weekly">Semanal</option><option value="biweekly">Quinzenal</option><option value="monthly">Mensal</option>
                </select>
                <button onClick={addEvent} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Adicionar</button>
              </div>
            )}
            {events.map(ev => (
              <div key={ev.id} className="glass-card rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{ev.title}</h3>
                    <p className="text-xs text-primary mt-1 flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(ev.starts_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}{ev.recurrence && ` • ${ev.recurrence}`}</p>
                    {ev.location && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</p>}
                    {ev.description && <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>}
                    {user && <button onClick={() => addToMyAgenda(ev)} className="text-xs text-primary mt-2 flex items-center gap-1 hover:underline"><Plus className="h-3 w-3" />Adicionar à minha agenda</button>}
                  </div>
                  {canManage && <button onClick={() => deleteEvent(ev.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="h-4 w-4" /></button>}
                </div>
              </div>
            ))}
            {events.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Nenhum evento</p>}
          </div>
        )}

        {tab === "grupos" && (
          <div className="space-y-3">
            {user && (
              <button onClick={() => setShowGrp(!showGrp)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-primary/40 text-sm text-primary hover:bg-primary/5">
                <Plus className="h-4 w-4" /> Novo grupo de conversa
              </button>
            )}
            {showGrp && (
              <div className="glass-card rounded-xl p-4 space-y-3 border-primary/20">
                <div className="flex gap-2">
                  <input className="w-16 px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-center" maxLength={2} value={grpForm.icon} onChange={e => setGrpForm({...grpForm, icon: e.target.value})} />
                  <input className="flex-1 px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" placeholder="Nome do grupo" value={grpForm.name} onChange={e => setGrpForm({...grpForm, name: e.target.value})} />
                </div>
                <textarea rows={2} className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm resize-none" placeholder="Descrição" value={grpForm.description} onChange={e => setGrpForm({...grpForm, description: e.target.value})} />
                <button onClick={addGroup} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Criar grupo</button>
              </div>
            )}
            {groups.map(g => (
              <button key={g.id} onClick={() => navigate(`/grupos/${g.id}`)} className="w-full glass-card rounded-xl p-4 text-left hover:border-primary/30 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">{g.icon || "⛪"}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{g.name}</h3>
                  {g.description && <p className="text-xs text-muted-foreground truncate">{g.description}</p>}
                </div>
                <MessageCircle className="h-4 w-4 text-primary" />
              </button>
            ))}
            {groups.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Nenhum grupo ainda</p>}
          </div>
        )}

        {tab === "galeria" && (
          <div className="space-y-3">
            {user && (
              <label className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-primary/40 text-sm text-primary cursor-pointer hover:bg-primary/5">
                <Upload className="h-4 w-4" /> Enviar foto para a galeria
                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadGallery(f); }} />
              </label>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {photos.map(p => (
                <div key={p.id} className="relative group aspect-square rounded-lg overflow-hidden">
                  <img src={p.image_url} className="w-full h-full object-cover" />
                  {(canManage || p.uploader_id === user?.id) && (
                    <button onClick={() => deletePhoto(p.id)} className="absolute top-1 right-1 p-1.5 rounded-lg bg-black/60 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3.5 w-3.5" /></button>
                  )}
                </div>
              ))}
            </div>
            {photos.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Galeria vazia</p>}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChurchDetailPage;
