import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { getNotes, addNote, deleteNote } from "@/lib/bible-data";
import type { Note } from "@/lib/bible-data";
import { StickyNote, Plus, Trash2, X, BookOpen, Calendar, PenLine } from "lucide-react";
import { toast } from "sonner";

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [reference, setReference] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    setNotes(getNotes());
  }, []);

  const handleAdd = () => {
    if (!reference.trim() || !text.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    addNote(reference.trim(), text.trim());
    setNotes(getNotes());
    setReference("");
    setText("");
    setShowForm(false);
    toast.success("Nota salva com sucesso!");
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    setNotes(getNotes());
    toast("Nota removida");
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-bold text-foreground">
              <StickyNote className="h-7 w-7 text-primary inline mr-2" />
              Notas
            </h1>
            <p className="text-sm text-muted-foreground">{notes.length} nota{notes.length !== 1 ? "s" : ""} de estudo</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancelar" : "Nova Nota"}
          </button>
        </div>

        {showForm && (
          <div className="glass-card rounded-xl p-5 space-y-4 animate-fade-in border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <PenLine className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Nova anotação</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Referência bíblica</label>
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
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none transition-all"
                />
              </div>
              <button
                onClick={handleAdd}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                Salvar Nota
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
        ) : (
          <div className="space-y-3">
            {notes.map((note, i) => (
              <div key={note.id} className="glass-card rounded-xl p-4 space-y-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary">{note.reference}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{note.text}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(note.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
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
