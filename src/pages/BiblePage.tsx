import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import {
  addToReadingHistory,
  CHAPTER_COLORS,
  getChapterFavorite,
  isChapterFavorite,
  removeChapterFavorite,
  setChapterFavorite,
  updateChapterNote,
  toggleFavorite,
  isFavorite,
  type ChapterColor,
  type BibleVerse,
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
import { ChevronRight, BookOpen, Download, Check, Heart, Share2, Palette, X, StickyNote } from "lucide-react";
import { toast } from "sonner";
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
  const [colorPicker, setColorPicker] = useState<{ chapter: number } | null>(null);
  const [chapFavTick, setChapFavTick] = useState(0); // força re-render quando muda

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
    if (!selectedBook || !selectedChapter) return;
    const reference = `${selectedBook.name} ${selectedChapter}:${v.verse}`;
    const verse: BibleVerse = {
      book: selectedBook.name,
      chapter: selectedChapter,
      verse: v.verse,
      text: v.text,
      reference,
    };
    const added = await toggleFavorite(verse);
    toast(added ? "Adicionado aos favoritos" : "Removido dos favoritos");
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

            <p className="text-xs text-muted-foreground">
              Toque para abrir · toque longo para marcar com cor ⭐
            </p>

            <div key={chapFavTick} className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {Array.from({ length: selectedBook.chapters_count }, (_, i) => i + 1).map((ch) => {
                const fav = getChapterFavorite(selectedBook.id, ch);
                const colorClass = fav ? CHAPTER_COLORS[fav.color].cellBg : "glass-card text-foreground hover:bg-primary hover:text-primary-foreground";
                let pressTimer: any;
                const openPicker = () => setColorPicker({ chapter: ch });
                return (
                  <button
                    key={ch}
                    onClick={() => handleChapterSelect(ch)}
                    onContextMenu={(e) => { e.preventDefault(); openPicker(); }}
                    onTouchStart={() => { pressTimer = setTimeout(openPicker, 500); }}
                    onTouchEnd={() => clearTimeout(pressTimer)}
                    onTouchMove={() => clearTimeout(pressTimer)}
                    className={`relative aspect-square rounded-lg border flex items-center justify-center text-sm font-medium transition-colors ${colorClass}`}
                  >
                    {ch}
                    {fav && (
                      <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Picker de cores */}
            {colorPicker && (
              <div
                onClick={() => setColorPicker(null)}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in"
              >
                <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold flex items-center gap-2 text-foreground">
                      <Palette className="h-4 w-4 text-primary" />
                      {selectedBook.name} {colorPicker.chapter}
                    </h3>
                    <button onClick={() => setColorPicker(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Escolha uma cor para marcar este capítulo</p>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(CHAPTER_COLORS) as ChapterColor[]).map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setChapterFavorite(selectedBook.id, selectedBook.name, colorPicker.chapter, c);
                          setChapFavTick((t) => t + 1);
                          setColorPicker(null);
                          toast.success(`Marcado com ${CHAPTER_COLORS[c].label.toLowerCase()}`);
                        }}
                        title={CHAPTER_COLORS[c].label}
                        className={`h-10 w-10 rounded-full ${CHAPTER_COLORS[c].btnBg} ring-2 ring-transparent hover:ring-foreground/40 transition-all`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-border/50">
                    <button
                      onClick={async () => {
                        const ref = `${selectedBook.name} ${colorPicker.chapter}`;
                        const text = `Estou lendo ${ref} na BíbliaApp 📖`;
                        try {
                          if (navigator.share) await navigator.share({ title: ref, text });
                          else { await navigator.clipboard.writeText(text); toast.success("Copiado!"); }
                        } catch { /* cancelado */ }
                        setColorPicker(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                    >
                      <Share2 className="h-4 w-4" /> Partilhar
                    </button>
                    {isChapterFavorite(selectedBook.id, colorPicker.chapter) && (
                      <button
                        onClick={() => {
                          removeChapterFavorite(selectedBook.id, colorPicker.chapter);
                          setChapFavTick((t) => t + 1);
                          setColorPicker(null);
                          toast("Marcação removida");
                        }}
                        className="flex-1 py-2 rounded-lg bg-destructive/15 text-destructive text-sm font-medium"
                      >
                        Remover cor
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
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
