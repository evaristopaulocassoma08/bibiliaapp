import { useState } from "react";
import { Layout } from "@/components/Layout";
import { defaultGroups } from "@/lib/bible-data";
import { Users, MessageCircle, UserPlus, UserMinus, Crown, Globe, Lock, Search, Plus } from "lucide-react";
import { toast } from "sonner";

const GroupsPage = () => {
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const handleJoin = (groupId: string) => {
    setJoined((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
        toast("Você saiu do grupo");
      } else {
        next.add(groupId);
        toast.success("Você entrou no grupo!");
      }
      return next;
    });
  };

  const filteredGroups = searchQuery
    ? defaultGroups.filter((g) =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : defaultGroups;

  const joinedGroups = defaultGroups.filter((g) => joined.has(g.id));

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
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            Criar
          </button>
        </div>

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
                <div key={group.id} className="glass-card rounded-xl p-4 border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                      {group.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground">{group.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{group.members + 1}</span>
                        <span className="flex items-center gap-1 text-green-500"><MessageCircle className="h-3 w-3" />Ativo</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoin(group.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
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
              const isJoined = joined.has(group.id);
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
                          {group.members + (isJoined ? 1 : 0)} membros
                        </span>
                        <span className="flex items-center gap-1 text-xs text-green-500">
                          <MessageCircle className="h-3 w-3" />
                          Ativo agora
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoin(group.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                        isJoined
                          ? "bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive"
                          : "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20"
                      }`}
                    >
                      {isJoined ? <UserMinus className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                      {isJoined ? "Sair" : "Entrar"}
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
