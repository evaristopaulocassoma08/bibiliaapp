import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { getNotes, addNote, deleteNote, updateNote, syncNotesFromCloud } from "@/lib/bible-data";
import type { Note } from "@/lib/bible-data";
import {
  StickyNote, Plus, Trash2, X, BookOpen, Calendar, PenLine,
  Search, Download, Share2, Copy, Edit3, RefreshCw, Save,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const NotesPage = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);

  const loadCloud = async () => {
    setSyncing(true);
    const list = await syncNotesFromCloud();
    setNotes(list);
    setSyncing(false);
  };

  useEffect(() => {
    setNotes(getNotes());
    if (user) loadCloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = notes.filter((n) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.reference.toLowerCase().includes(q) || n.text.toLowerCase().includes(q);
  });

  const resetForm = () => {
    setReference("");
    setText("");
    setEditId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!reference.trim() || !text.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (editId) {
      await updateNote(editId, reference.trim(), text.trim());
      toast.success("Nota atualizada!");
    } else {
      await addNote(reference.trim(), text.trim());
      toast.success("Nota salva!");
    }
    setNotes(getNotes());
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta nota?")) return;
    await deleteNote(id);
    setNotes(getNotes());
    toast("Nota removida");
  };

  const handleEdit = (note: Note) => {
    setEditId(note.id);
    setReference(note.reference);
    setText(note.text);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleShare = async (note: Note) => {
    const txt = `📖 ${note.reference}\n\n${note.text}\n\n— BíbliaApp`;
    try {
      await navigator.share?.({ title: note.reference, text: txt });
    } catch {
      await navigator.clipboard?.writeText(txt);
      toast.success("Nota copiada!");
    }
  };

  const handleCopy = async (note: Note) => {
    await navigator.clipboard?.writeText(`${note.reference}\n${note.text}`);
    toast.success("Copiado!");
  };

  const handleExport = () => {
    if (!notes.length) return toast.error("Sem notas para exportar");
    const md = notes
      .map((n) => `## ${n.reference}\n_${new Date(n.createdAt).toLocaleDateString("pt-BR")}_\n\n${n.text}\n`)
      .join("\n---\n\n");
    const blob = new Blob([`# Minhas Notas Bíblicas\n\n${md}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notas-biblicas-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Notas exportadas");
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-20">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <StickyNote className="h-6 w-6 text-primary shrink-0" />
              Notas
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {notes.length} nota{notes.length !== 1 ? "s" : ""} de estudo{user && " · sincronizado"}
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            {user && (
              <button
                onClick={loadCloud}
                disabled={syncing}
                title="Sincronizar"
                className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 text-foreground ${syncing ? "animate-spin" : ""}`} />
              </button>
            )}
            <button
              onClick={handleExport}
              title="Exportar"
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <Download className="h-4 w-4 text-foreground" />
            </button>
            <button
              onClick={() => (showForm ? resetForm() : setShowForm(true))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span className="hidden sm:inline">{showForm ? "Cancelar" : "Nova"}</span>
            </button>
          </div>
        </div>

        {/* Search */}
        {notes.length > 0 && !showForm && (
          <div className="relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar nas notas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none"
            />
          </div>
        )}

        {showForm && (
          <div className="glass-card rounded-xl p-5 space-y-4 animate-fade-in border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <PenLine className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {editId ? "Editar nota" : "Nova anotação"}
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Referência ou título</label>
                <input
                  type="text"
                  placeholder="Ex: João 3:16"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Sua reflexão</label>
                <textarea
                  placeholder="Escreva suas reflexões, insights e aprendizados..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none transition-all"
                />
                <p className="text-[10px] text-muted-foreground mt-1">{text.length} caracteres</p>
              </div>
              <button
                onClick={handleSave}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                {editId ? "Salvar alterações" : "Salvar Nota"}
              </button>
            </div>
          </div>
        )}

        {notes.length === 0 && !showForm ? (
          <div className="text-center py-16 space-y-4">
            <div className="h-20 w-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
              <StickyNote className="h-9 w-9 text-muted-foreground/30" />
            </div>
            <div className="space-y-1">
              <p className="text-foreground font-semibold">Nenhuma nota ainda</p>
              <p className="text-sm text-muted-foreground">Registre suas reflexões e insights bíblicos</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-8 text-sm text-muted-foreground">Nenhum resultado.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((note, i) => (
              <div key={note.id} className="glass-card rounded-xl p-4 space-y-3 animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-primary truncate">{note.reference}</span>
                  </div>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(note.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(note)}
                      title="Copiar"
                      className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleShare(note)}
                      title="Compartilhar"
                      className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleEdit(note)}
                      title="Editar"
                      className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-primary"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      title="Excluir"
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotesPage;
