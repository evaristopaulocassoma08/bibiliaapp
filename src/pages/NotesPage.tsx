import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { getNotes, addNote, deleteNote } from "@/lib/bible-data";
import type { Note } from "@/lib/bible-data";
import { StickyNote, Plus, Trash2, X } from "lucide-react";
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
    toast("Nota salva! 📝");
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
          <h1 className="text-3xl font-display font-bold">
            📝 <span className="text-primary">Notas</span>
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancelar" : "Nova Nota"}
          </button>
        </div>

        {showForm && (
          <div className="glass-card rounded-xl p-4 space-y-3 animate-fade-in">
            <input
              type="text"
              placeholder="Referência (ex: João 3:16)"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none text-sm transition-colors"
            />
            <textarea
              placeholder="Sua reflexão ou anotação..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground border border-border focus:border-primary outline-none text-sm resize-none transition-colors"
            />
            <button
              onClick={handleAdd}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Salvar Nota
            </button>
          </div>
        )}

        {notes.length === 0 && !showForm ? (
          <div className="text-center py-16 space-y-4">
            <StickyNote className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <div className="space-y-1">
              <p className="text-foreground font-medium">Nenhuma nota ainda</p>
              <p className="text-sm text-muted-foreground">
                Crie notas para registrar suas reflexões
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="glass-card rounded-xl p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-medium text-primary">{note.reference}</span>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{note.text}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(note.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotesPage;
