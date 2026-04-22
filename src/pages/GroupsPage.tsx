import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Users, MessageCircle, UserPlus, UserMinus, Crown, Globe, Search, Plus, Settings, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Group {
  id: string;
  name: string;
  description: string;
  icon: string;
  owner_id: string | null;
  is_public: boolean;
}

interface GroupMember {
  group_id: string;
  user_id: string;
  role: string;
}

const GroupsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    const { data: groupData } = await supabase.from("groups").select("*").order("created_at");
    const { data: memberData } = await supabase.from("group_members").select("*");
    if (groupData) setGroups(groupData as Group[]);
    if (memberData) setMembers(memberData as GroupMember[]);
    setLoading(false);
  };

  const handleJoin = async (groupId: string) => {
    if (!user) return;
    const isMemberAlready = members.some((m) => m.group_id === groupId && m.user_id === user.id);

    if (isMemberAlready) {
      await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
      toast("Você saiu do grupo");
      loadGroups();
    } else {
      await supabase.from("group_members").insert({ group_id: groupId, user_id: user.id });
      toast.success("Você entrou no grupo!");
      await loadGroups();
      navigate(`/grupos/${groupId}`);
    }
  };

  const handleCreate = async () => {
    if (!user || !newName.trim()) {
      toast.error("Digite o nome do grupo");
      return;
    }
    const { error } = await supabase.from("groups").insert({
      name: newName.trim(),
      description: newDesc.trim(),
      owner_id: user.id,
    });
    if (error) {
      toast.error("Erro ao criar grupo");
      return;
    }
    toast.success("Grupo criado!");
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
    loadGroups();
  };

  const handleDelete = async (groupId: string) => {
    await supabase.from("groups").delete().eq("id", groupId);
    toast("Grupo removido");
    loadGroups();
  };

  const filteredGroups = searchQuery
    ? groups.filter((g) =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : groups;

  const memberCount = (groupId: string) => members.filter((m) => m.group_id === groupId).length;
  const isMember = (groupId: string) => user ? members.some((m) => m.group_id === groupId && m.user_id === user.id) : false;
  const isOwner = (group: Group) => user ? group.owner_id === user.id : false;
  const joinedGroups = groups.filter((g) => isMember(g.id));

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-bold text-foreground">
              <Users className="h-7 w-7 text-primary inline mr-2" />
              Grupos
            </h1>
            <p className="text-sm text-muted-foreground">Conecte-se com irmãos na fé</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCreate ? "Cancelar" : "Criar"}
          </button>
        </div>

        {/* Create Group Form */}
        {showCreate && (
          <div className="glass-card rounded-xl p-5 space-y-4 animate-fade-in border-primary/20">
            <input
              type="text"
              placeholder="Nome do grupo"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
            />
            <textarea
              placeholder="Descrição (opcional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none"
            />
            <button onClick={handleCreate} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 shadow-lg shadow-primary/20">
              Criar Grupo
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar grupos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
          />
        </div>

        {/* My Groups */}
        {joinedGroups.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              Meus Grupos ({joinedGroups.length})
            </h2>
            <div className="grid gap-3">
              {joinedGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => navigate(`/grupos/${group.id}`)}
                  className="w-full text-left glass-card rounded-xl p-4 border-primary/20 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                      {group.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                        {group.name}
                        {isOwner(group) && <Crown className="h-3.5 w-3.5 text-primary" />}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{memberCount(group.id)}</span>
                        <span className="flex items-center gap-1 text-primary"><MessageCircle className="h-3 w-3" />Abrir chat</span>
                      </div>
                    </div>
                    {isOwner(group) && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); if (confirm("Apagar grupo?")) handleDelete(group.id); }}
                        className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* All Groups */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Todos os Grupos
          </h2>
          <div className="grid gap-3">
            {filteredGroups.map((group) => {
              const joined = isMember(group.id);
              return (
                <div key={group.id} className="glass-card rounded-xl p-4 hover:border-primary/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0">
                      {group.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-foreground">{group.name}</h3>
                        <Globe className="h-3 w-3 text-muted-foreground/50" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {memberCount(group.id)} membros
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoin(group.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                        joined
                          ? "bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive"
                          : "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20"
                      }`}
                    >
                      {joined ? <UserMinus className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                      {joined ? "Sair" : "Entrar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {filteredGroups.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
              <Users className="h-7 w-7 text-muted-foreground/30" />
            </div>
            <p className="text-foreground font-medium">Nenhum grupo encontrado</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GroupsPage;
