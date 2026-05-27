import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import {
  addToReadingHistory,
  CHAPTER_COLORS,
  getChapterFavorite,
  isChapterFavorite,
  removeChapterFavorite,
  setChapterFavorite,
  type ChapterColor,
} from "@/lib/bible-data";
import { trackReading } from "@/lib/activity-tracker";
import {
  getBooks,
  getChapter,
  downloadBook,
  isBookDownloaded,
  type BibleBookRow,
  type BibleVerseRow,
} from "@/lib/bible-service";
import { ChevronRight, BookOpen, Download, Check, Heart, Share2, Palette, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const BiblePage = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<BibleBookRow[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [selectedBook, setSelectedBook] = useState<BibleBookRow | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<BibleVerseRow[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [testament, setTestament] = useState<"AT" | "NT">("AT");
  const [downloading, setDownloading] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadedMap, setDownloadedMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    getBooks()
      .then((b) => {
        setBooks(b);
        const map: Record<number, boolean> = {};
        b.forEach((book) => (map[book.id] = isBookDownloaded(book.id)));
        setDownloadedMap(map);
      })
      .catch((e) => toast.error("Erro ao carregar livros: " + e.message))
      .finally(() => setLoadingBooks(false));
  }, []);

  useEffect(() => {
    if (!selectedBook || !selectedChapter) return;
    setLoadingVerses(true);
    getChapter(selectedBook.id, selectedChapter)
      .then(setVerses)
      .catch((e) => toast.error("Erro ao carregar capítulo: " + e.message))
      .finally(() => setLoadingVerses(false));
  }, [selectedBook, selectedChapter]);

  const filteredBooks = books.filter((b) => b.testament === testament);

  const handleChapterSelect = (chapter: number) => {
    if (!selectedBook) return;
    setSelectedChapter(chapter);
    addToReadingHistory(`${selectedBook.name} ${chapter}`);
    trackReading(selectedBook.id, selectedBook.name, chapter);
  };

  const handleDownload = async (book: BibleBookRow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadedMap[book.id]) {
      toast.info(`${book.name} já está disponível offline`);
      return;
    }
    setDownloading(book.id);
    setDownloadProgress(0);
    try {
      await downloadBook(book.id, book.chapters_count, (done, total) =>
        setDownloadProgress(Math.round((done / total) * 100)),
      );
      setDownloadedMap((m) => ({ ...m, [book.id]: true }));
      toast.success(`${book.name} baixado para uso offline`);
    } catch (err: any) {
      toast.error("Erro ao baixar: " + err.message);
    } finally {
      setDownloading(null);
      setDownloadProgress(0);
    }
  };

  const handleFavoriteVerse = async (v: BibleVerseRow) => {
    if (!user || !selectedBook || !selectedChapter) return;
    const reference = `${selectedBook.name} ${selectedChapter}:${v.verse}`;
    const { error } = await supabase.from("favorites").insert({
      user_id: user.id,
      verse_reference: reference,
      verse_text: v.text,
    });
    if (error) toast.error("Erro ao favoritar");
    else toast.success("Adicionado aos favoritos");
  };

  // ── Verse view ──
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

            {loadingVerses ? (
              <div className="py-10 flex justify-center">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {verses.map((v) => (
                  <div
                    key={v.verse}
                    className="group flex gap-3 rounded-lg p-3 hover:bg-secondary/40 transition-colors"
                  >
                    <span className="text-xs font-bold text-primary mt-1 min-w-[1.5rem]">
                      {v.verse}
                    </span>
                    <p className="flex-1 text-base leading-7 text-foreground/90">
                      {v.text}
                    </p>
                    <button
                      onClick={() => handleFavoriteVerse(v)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
                      aria-label="Favoritar"
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // ── Chapter grid ──
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
            <div className="flex items-center gap-3 flex-wrap">
              <BookOpen className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-display font-bold">{selectedBook.name}</h1>
              <span className="text-sm text-muted-foreground">
                {selectedBook.chapters_count} capítulos
              </span>
              <button
                onClick={(e) => handleDownload(selectedBook, e)}
                disabled={downloading === selectedBook.id}
                className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground"
              >
                {downloadedMap[selectedBook.id] ? (
                  <><Check className="h-3.5 w-3.5 text-primary" /> Offline</>
                ) : downloading === selectedBook.id ? (
                  <>{downloadProgress}%</>
                ) : (
                  <><Download className="h-3.5 w-3.5" /> Baixar</>
                )}
              </button>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {Array.from({ length: selectedBook.chapters_count }, (_, i) => i + 1).map((ch) => (
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

  // ── Book list ──
  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <h1 className="text-3xl font-display font-bold">
          📖 <span className="text-primary">Bíblia</span> <span className="text-sm font-normal text-muted-foreground">NVI</span>
        </h1>

        <div className="flex gap-2 p-1 rounded-xl bg-secondary">
          <button
            onClick={() => setTestament("AT")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              testament === "AT" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Antigo Testamento
          </button>
          <button
            onClick={() => setTestament("NT")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              testament === "NT" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Novo Testamento
          </button>
        </div>

        {loadingBooks ? (
          <div className="py-10 flex justify-center">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-1">
            {filteredBooks.map((book) => (
              <button
                key={book.id}
                onClick={() => setSelectedBook(book)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-secondary transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {book.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{book.chapters_count} cap.</span>
                  {downloadedMap[book.id] && (
                    <Check className="h-3.5 w-3.5 text-primary" aria-label="Offline" />
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BiblePage;
