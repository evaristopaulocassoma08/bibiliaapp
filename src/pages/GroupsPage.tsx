import { useState } from "react";
import { Layout } from "@/components/Layout";
import { defaultGroups } from "@/lib/bible-data";
import { Users, MessageCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";

const GroupsPage = () => {
  const [joined, setJoined] = useState<Set<string>>(new Set());

  const handleJoin = (groupId: string) => {
    setJoined((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
        toast("Você saiu do grupo");
      } else {
        next.add(groupId);
        toast("Você entrou no grupo! 🎉");
      }
      return next;
    });
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-bold">
            👥 <span className="text-primary">Grupos</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Conecte-se com outros irmãos na fé
          </p>
        </div>

        <div className="space-y-3">
          {defaultGroups.map((group) => {
            const isJoined = joined.has(group.id);
            return (
              <div
                key={group.id}
                className="glass-card rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{group.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {group.members + (isJoined ? 1 : 0)} membros
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      Ativo
                    </span>
                  </div>

                  <button
                    onClick={() => handleJoin(group.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isJoined
                        ? "bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {isJoined ? "Sair" : "Entrar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default GroupsPage;
