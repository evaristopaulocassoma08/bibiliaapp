import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Plus, Trash2, X, MapPin, Clock, Bell, Repeat, Church as ChurchIcon } from "lucide-react";
import { toast } from "sonner";

interface Evt {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  color: string | null;
  recurrence: string | null;
  reminder_minutes: number | null;
  church_id: string | null;
}

const COLORS = ["gold", "blue", "green", "red", "purple"];
const COLOR_CLASSES: Record<string, string> = {
  gold: "border-l-yellow-400",
  blue: "border-l-blue-400",
  green: "border-l-green-400",
  red: "border-l-red-400",
  purple: "border-l-purple-400",
};

const AgendaPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Evt[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", starts_at: "", ends_at: "", location: "",
    color: "gold", recurrence: "none", reminder_minutes: 0,
  });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("scheduled_events").select("*").eq("user_id", user.id).order("starts_at");
    setEvents((data as Evt[]) || []);
  };

  useEffect(() => { load(); }, [user]);

  // browser reminder check
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") Notification.requestPermission();
    const t = setInterval(() => {
      const now = Date.now();
      events.forEach(e => {
        const start = new Date(e.starts_at).getTime();
        const minBefore = (e.reminder_minutes || 0) * 60 * 1000;
        const diff = start - now;
        if (diff > 0 && diff < 60_000 && Notification.permission === "granted") {
          const key = `notified-${e.id}`;
          if (!sessionStorage.getItem(key) && diff <= minBefore + 60_000) {
            new Notification(e.title, { body: e.description || "Evento agora" });
            sessionStorage.setItem(key, "1");
          }
        }
      });
    }, 30_000);
    return () => clearInterval(t);
  }, [events]);

  const save = async () => {
    if (!user) { toast.error("Faça login"); return; }
    if (!form.title.trim() || !form.starts_at) { toast.error("Título e data obrigatórios"); return; }
    const { error } = await supabase.from("scheduled_events").insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description || null,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      location: form.location || null,
      color: form.color,
      recurrence: form.recurrence,
      reminder_minutes: Number(form.reminder_minutes) || 0,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Evento agendado!");
    setForm({ title: "", description: "", starts_at: "", ends_at: "", location: "", color: "gold", recurrence: "none", reminder_minutes: 0 });
    setShowForm(false);
    load();
  };

  const del = async (id: string) => {
    if (!confirm("Excluir evento?")) return;
    await supabase.from("scheduled_events").delete().eq("id", id);
    toast("Removido");
    load();
  };

  if (!user) {
    return <Layout><div className="text-center py-20 text-muted-foreground">Faça login para usar sua agenda pessoal.</div></Layout>;
  }

  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = events.filter(e => new Date(e.starts_at) >= today);
  const past = events.filter(e => new Date(e.starts_at) < today);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Agenda
            </h1>
            <p className="text-xs text-muted-foreground">{events.length} evento(s) pessoal(is)</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20">
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancelar" : "Novo"}
          </button>
        </div>

        {showForm && (
          <div className="glass-card rounded-xl p-4 space-y-3 border-primary/20">
            <input className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" placeholder="Título (ex: Culto, Estudo, Oração)" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            <textarea rows={2} className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm resize-none" placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Início</label>
                <input type="datetime-local" className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" value={form.starts_at} onChange={e => setForm({...form, starts_at: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fim</label>
                <input type="datetime-local" className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" value={form.ends_at} onChange={e => setForm({...form, ends_at: e.target.value})} />
              </div>
            </div>
            <input className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" placeholder="Local" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <select className="px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" value={form.recurrence} onChange={e => setForm({...form, recurrence: e.target.value})}>
                <option value="none">Sem repetição</option>
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
              <select className="px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm" value={form.reminder_minutes} onChange={e => setForm({...form, reminder_minutes: Number(e.target.value)})}>
                <option value={0}>Sem lembrete</option>
                <option value={5}>5 min antes</option>
                <option value={15}>15 min antes</option>
                <option value={30}>30 min antes</option>
                <option value={60}>1h antes</option>
                <option value={1440}>1 dia antes</option>
              </select>
            </div>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm({...form, color: c})} className={`h-8 w-8 rounded-full border-2 ${form.color === c ? "border-foreground" : "border-transparent"}`} style={{ background: c === "gold" ? "#facc15" : c }} />
              ))}
            </div>
            <button onClick={save} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Agendar</button>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Próximos</h2>
            {upcoming.map(e => (
              <div key={e.id} className={`glass-card rounded-xl p-4 border-l-4 ${COLOR_CLASSES[e.color || "gold"]}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{e.title}</h3>
                    <p className="text-xs text-primary mt-1 flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(e.starts_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
                    {e.location && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</p>}
                    {e.description && <p className="text-xs text-muted-foreground mt-1">{e.description}</p>}
                    <div className="flex gap-2 mt-2">
                      {e.recurrence && e.recurrence !== "none" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary flex items-center gap-1"><Repeat className="h-2.5 w-2.5" />{e.recurrence}</span>}
                      {(e.reminder_minutes || 0) > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary flex items-center gap-1"><Bell className="h-2.5 w-2.5" />{e.reminder_minutes}min</span>}
                      {e.church_id && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1"><ChurchIcon className="h-2.5 w-2.5" />Igreja</span>}
                    </div>
                  </div>
                  <button onClick={() => del(e.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {past.length > 0 && (
          <details className="space-y-2">
            <summary className="text-xs uppercase tracking-wider text-muted-foreground font-semibold cursor-pointer">Anteriores ({past.length})</summary>
            <div className="space-y-2 mt-2 opacity-60">
              {past.map(e => (
                <div key={e.id} className="glass-card rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm">{e.title}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(e.starts_at).toLocaleString("pt-BR")}</p>
                  </div>
                  <button onClick={() => del(e.id)} className="p-1.5 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </details>
        )}

        {events.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
              <Calendar className="h-7 w-7 text-muted-foreground/30" />
            </div>
            <p className="text-foreground font-medium">Nenhum evento na agenda</p>
            <p className="text-xs text-muted-foreground">Toque em "Novo" para agendar cultos, estudos ou eventos pessoais</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AgendaPage;
