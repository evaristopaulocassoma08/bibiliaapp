import { useCallback, useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  ReactFlow, Background, Controls, MiniMap, addEdge,
  useNodesState, useEdgesState, type Node, type Edge, type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Workflow, Plus, Save, Trash2, Play, ArrowLeft, Zap, FileText, Bell, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { addNote } from "@/lib/bible-data";

interface Automation {
  id: string;
  name: string;
  description: string | null;
  flow: any;
  enabled: boolean;
}

const NODE_TYPES = [
  { type: "trigger.schedule", label: "Trigger: Horário", icon: "⏰", color: "#facc15" },
  { type: "trigger.favorite", label: "Trigger: Novo Favorito", icon: "❤️", color: "#ef4444" },
  { type: "trigger.manual", label: "Trigger: Manual", icon: "👆", color: "#3b82f6" },
  { type: "action.note", label: "Ação: Criar Nota", icon: "📝", color: "#10b981" },
  { type: "action.ai", label: "Ação: Gerar com IA", icon: "✨", color: "#a855f7" },
  { type: "action.notify", label: "Ação: Notificação", icon: "🔔", color: "#f97316" },
];

const AutomationsPage = () => {
  const { user } = useAuth();
  const [list, setList] = useState<Automation[]>([]);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [name, setName] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("note_automations").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setList((data as Automation[]) || []);
  };

  useEffect(() => { load(); }, [user]);

  const onConnect = useCallback((c: Connection) => setEdges(e => addEdge(c, e)), [setEdges]);

  const openEditor = (a: Automation | null) => {
    if (a) {
      setEditing(a);
      setName(a.name);
      setNodes(a.flow?.nodes || []);
      setEdges(a.flow?.edges || []);
    } else {
      setEditing({ id: "", name: "Nova Automação", description: null, flow: { nodes: [], edges: [] }, enabled: true });
      setName("Nova Automação");
      setNodes([]);
      setEdges([]);
    }
  };

  const addNode = (nt: typeof NODE_TYPES[number]) => {
    const id = `${nt.type}-${Date.now()}`;
    setNodes(n => [...n, {
      id,
      position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 },
      data: { label: `${nt.icon} ${nt.label}`, nodeType: nt.type, config: {} },
      style: { background: nt.color + "20", border: `2px solid ${nt.color}`, color: "#fff", borderRadius: 12, padding: 8, fontSize: 12, minWidth: 180 },
    }]);
  };

  const save = async () => {
    if (!user) return;
    const payload = { user_id: user.id, name, flow: { nodes, edges } as any, enabled: true };
    if (editing?.id) {
      await supabase.from("note_automations").update({ name, flow: payload.flow }).eq("id", editing.id);
    } else {
      await supabase.from("note_automations").insert(payload);
    }
    toast.success("Automação salva!");
    setEditing(null);
    load();
  };

  const run = async (a: Automation) => {
    const flowNodes: any[] = a.flow?.nodes || [];
    let count = 0;
    for (const n of flowNodes) {
      const t = n.data?.nodeType as string;
      if (t === "action.note") {
        await addNote(`Auto: ${a.name}`, `Nota criada pela automação "${a.name}" em ${new Date().toLocaleString("pt-BR")}`);
        count++;
      } else if (t === "action.notify" && user) {
        await supabase.from("notifications").insert({ user_id: user.id, type: "automation", title: a.name, body: "Automação executada" });
        count++;
      } else if (t === "action.ai") {
        await addNote(`IA: ${a.name}`, `Reflexão gerada pela IA para automação "${a.name}".`);
        count++;
      }
    }
    toast.success(`Executou ${count} ação(ões)`);
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir automação?")) return;
    await supabase.from("note_automations").delete().eq("id", id);
    load();
  };

  if (!user) return <Layout><div className="text-center py-20 text-muted-foreground">Faça login para criar automações.</div></Layout>;

  if (editing) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto space-y-3 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <button onClick={() => setEditing(null)} className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Voltar</button>
            <input value={name} onChange={e => setName(e.target.value)} className="flex-1 max-w-sm px-3 py-2 rounded-lg bg-secondary border border-border text-sm" />
            <button onClick={save} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"><Save className="h-4 w-4" />Salvar</button>
          </div>

          <div className="flex flex-wrap gap-2 p-3 glass-card rounded-xl">
            <span className="text-xs text-muted-foreground self-center mr-2">Adicionar nó:</span>
            {NODE_TYPES.map(nt => (
              <button key={nt.type} onClick={() => addNode(nt)} className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-primary/40 flex items-center gap-1.5">
                <span>{nt.icon}</span>{nt.label}
              </button>
            ))}
          </div>

          <div style={{ height: "65vh" }} className="rounded-xl overflow-hidden border border-border bg-background">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              colorMode="dark"
            >
              <Background />
              <Controls />
              <MiniMap pannable zoomable />
            </ReactFlow>
          </div>
          <p className="text-xs text-muted-foreground text-center">Arraste para conectar os nós (de uma alça para outra). Triggers → Ações.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2"><Workflow className="h-6 w-6 text-primary" />Automações</h1>
            <p className="text-xs text-muted-foreground">Crie fluxos visuais para automatizar suas notas</p>
          </div>
          <button onClick={() => openEditor(null)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"><Plus className="h-4 w-4" />Nova</button>
        </div>

        <div className="grid sm:grid-cols-3 gap-2">
          <div className="glass-card rounded-xl p-3 text-center"><Zap className="h-5 w-5 text-yellow-400 mx-auto mb-1" /><p className="text-[10px] text-muted-foreground">Triggers</p></div>
          <div className="glass-card rounded-xl p-3 text-center"><FileText className="h-5 w-5 text-green-400 mx-auto mb-1" /><p className="text-[10px] text-muted-foreground">Notas</p></div>
          <div className="glass-card rounded-xl p-3 text-center"><Sparkles className="h-5 w-5 text-purple-400 mx-auto mb-1" /><p className="text-[10px] text-muted-foreground">IA</p></div>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto"><Workflow className="h-7 w-7 text-muted-foreground/30" /></div>
            <p className="font-medium">Nenhuma automação ainda</p>
            <p className="text-xs text-muted-foreground">Conecte triggers e ações como num fluxograma</p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map(a => (
              <div key={a.id} className="glass-card rounded-xl p-4 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEditor(a)}>
                  <p className="font-semibold truncate">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(a.flow?.nodes?.length || 0)} nó(s) · {(a.flow?.edges?.length || 0)} conexão(ões)</p>
                </div>
                <button onClick={() => run(a)} title="Executar" className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"><Play className="h-4 w-4" /></button>
                <button onClick={() => remove(a.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AutomationsPage;
