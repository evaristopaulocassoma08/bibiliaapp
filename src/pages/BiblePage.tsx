import { useState } from "react";
import { Layout } from "@/components/Layout";
import { bibleBooks, addToReadingHistory } from "@/lib/bible-data";
import type { BibleBook } from "@/lib/bible-data";
import { ChevronRight, BookOpen } from "lucide-react";

const BiblePage = () => {
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [testament, setTestament] = useState<"old" | "new">("old");

  const filteredBooks = bibleBooks.filter((b) => b.testament === testament);

  const handleChapterSelect = (chapter: number) => {
    if (!selectedBook) return;
    setSelectedChapter(chapter);
    addToReadingHistory(`${selectedBook.name} ${chapter}`);
  };

  if (selectedChapter && selectedBook) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto animate-fade-in">
          <button
            onClick={() => setSelectedChapter(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            ← Voltar aos capítulos
          </button>

          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-display font-bold">
                {selectedBook.name} {selectedChapter}
              </h1>
            </div>

            <div className="verse-highlight rounded-lg p-5 space-y-4">
              <p className="text-base leading-8 text-foreground/90">
                Este capítulo estará disponível em breve com a integração completa da API da Bíblia. 
                Por enquanto, você pode usar a funcionalidade de busca para encontrar versículos específicos.
              </p>
              <p className="text-sm text-muted-foreground italic">
                💡 Dica: Use a busca para encontrar versículos por palavra-chave.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (selectedBook) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto animate-fade-in">
          <button
            onClick={() => setSelectedBook(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            ← Voltar aos livros
          </button>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-display font-bold">{selectedBook.name}</h1>
              <span className="text-sm text-muted-foreground">
                {selectedBook.chapters} capítulos
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((ch) => (
                <button
                  key={ch}
                  onClick={() => handleChapterSelect(ch)}
                  className="aspect-square rounded-lg glass-card flex items-center justify-center text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold">
          📖 <span className="text-primary">Bíblia</span>
        </h1>

        {/* Testament Toggle */}
        <div className="flex gap-2 p-1 rounded-xl bg-secondary">
          <button
            onClick={() => setTestament("old")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              testament === "old"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Antigo Testamento
          </button>
          <button
            onClick={() => setTestament("new")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              testament === "new"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Novo Testamento
          </button>
        </div>

        {/* Books List */}
        <div className="space-y-1">
          {filteredBooks.map((book) => (
            <button
              key={book.name}
              onClick={() => setSelectedBook(book)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-secondary transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {book.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {book.chapters} cap.
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default BiblePage;
