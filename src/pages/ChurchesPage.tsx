import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Church, MapPin, Plus, X, Search, Phone, User as UserIcon, Shield } from "lucide-react";
import { toast } from "sonner";

interface ChurchRow {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  leader_name: string | null;
  leader_contact: string | null;
  photo_url: string | null;
  denomination: string | null;
  created_by: string;
}

const ChurchesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [churches, setChurches] = useState<ChurchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", address: "", latitude: "", longitude: "",
    leader_name: "", leader_contact: "", photo_url: "", denomination: "",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("churches").select("*").order("created_at", { ascending: false });
      setChurches((data as ChurchRow[]) || []);
      if (user) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
        setIsAdmin(!!roles?.some((r: any) => r.role === "admin"));
      }
      setLoading(false);
    })();
  }, [user]);

  const handleCreate = async () => {
    if (!user) { toast.error("Faça login"); return; }
    if (!isAdmin) { toast.error("Apenas administradores podem cadastrar igrejas"); return; }
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    const { data, error } = await supabase.from("churches").insert({
      name: form.name.trim(),
      description: form.description || null,
      address: form.address || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      leader_name: form.leader_name || null,
      leader_contact: form.leader_contact || null,
      photo_url: form.photo_url || null,
      denomination: form.denomination || null,
      created_by: user.id,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    toast.success("Igreja cadastrada!");
    setShowForm(false);
    setChurches([data as ChurchRow, ...churches]);
  };

  const filtered = search
    ? churches.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.address || "").toLowerCase().includes(search.toLowerCase()))
    : churches;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <Church className="h-7 w-7 text-primary" />
              Igrejas & Paróquias
            </h1>
            <p className="text-sm text-muted-foreground">Encontre uma comunidade de fé perto de você</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-lg shadow-primary/20">
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? "Cancelar" : "Cadastrar"}
            </button>
          )}
        </div>

        {!isAdmin && (
          <div className="glass-card rounded-xl p-4 flex items-start gap-3 border-primary/20">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Apenas administradores aprovados podem cadastrar novas igrejas. Entre em contacto com o suporte para se tornar administrador.
            </p>
          </div>
        )}

        {showForm && isAdmin && (
          <div className="glass-card rounded-xl p-5 space-y-3 animate-fade-in border-primary/20">
            <input className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm" placeholder="Nome da Igreja *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm" placeholder="Denominação (Católica, Evangélica, etc.)" value={form.denomination} onChange={e => setForm({...form, denomination: e.target.value})} />
            <textarea className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm resize-none" rows={3} placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <input className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm" placeholder="Endereço completo" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <input className="px-4 py-3 rounded-xl bg-secondary border border-border text-sm" placeholder="Latitude (GPS)" value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})} />
              <input className="px-4 py-3 rounded-xl bg-secondary border border-border text-sm" placeholder="Longitude (GPS)" value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})} />
            </div>
            <input className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm" placeholder="Nome do Líder / Pároco" value={form.leader_name} onChange={e => setForm({...form, leader_name: e.target.value})} />
            <input className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm" placeholder="Contacto do Líder (telefone/email)" value={form.leader_contact} onChange={e => setForm({...form, leader_contact: e.target.value})} />
            <input className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm" placeholder="URL da foto da igreja" value={form.photo_url} onChange={e => setForm({...form, photo_url: e.target.value})} />
            <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 shadow-lg shadow-primary/20">
              Cadastrar Igreja
            </button>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar igreja ou endereço..." className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border border-border text-sm" />
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
              <Church className="h-7 w-7 text-muted-foreground/30" />
            </div>
            <p className="text-foreground font-medium">Nenhuma igreja cadastrada ainda</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(c => (
              <button key={c.id} onClick={() => navigate(`/igrejas/${c.id}`)} className="glass-card rounded-xl p-4 text-left hover:border-primary/30 transition-colors">
                <div className="flex gap-4">
                  {c.photo_url ? (
                    <img src={c.photo_url} alt={c.name} className="h-20 w-20 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Church className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    {c.denomination && <p className="text-xs text-primary mt-0.5">{c.denomination}</p>}
                    {c.address && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />{c.address}
                      </p>
                    )}
                    {c.leader_name && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />{c.leader_name}
                      </p>
                    )}
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

export default ChurchesPage;
