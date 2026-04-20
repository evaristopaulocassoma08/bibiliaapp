import { supabase } from "@/integrations/supabase/client";

export type BibleBookRow = {
  id: number;
  name: string;
  abbrev: string;
  testament: "AT" | "NT";
  chapters_count: number;
  position: number;
};

export type BibleVerseRow = {
  verse: number;
  text: string;
};

const BOOKS_KEY = "bible:books:NVI";
const chapterKey = (bookId: number, chapter: number) =>
  `bible:chapter:NVI:${bookId}:${chapter}`;
const downloadedBookKey = (bookId: number) => `bible:downloaded:NVI:${bookId}`;

export async function getBooks(): Promise<BibleBookRow[]> {
  const cached = localStorage.getItem(BOOKS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      /* ignore */
    }
  }

  const { data, error } = await supabase
    .from("bible_books")
    .select("*")
    .order("position");

  if (error) throw error;
  localStorage.setItem(BOOKS_KEY, JSON.stringify(data));
  return data as BibleBookRow[];
}

export async function getChapter(
  bookId: number,
  chapter: number,
): Promise<BibleVerseRow[]> {
  const cached = localStorage.getItem(chapterKey(bookId, chapter));
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      /* ignore */
    }
  }

  const { data, error } = await supabase
    .from("bible_verses")
    .select("verse, text")
    .eq("book_id", bookId)
    .eq("chapter", chapter)
    .eq("version", "NVI")
    .order("verse");

  if (error) throw error;
  const rows = (data || []) as BibleVerseRow[];
  localStorage.setItem(chapterKey(bookId, chapter), JSON.stringify(rows));
  return rows;
}

export async function downloadBook(
  bookId: number,
  chaptersCount: number,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  for (let ch = 1; ch <= chaptersCount; ch++) {
    if (!localStorage.getItem(chapterKey(bookId, ch))) {
      await getChapter(bookId, ch);
    }
    onProgress?.(ch, chaptersCount);
  }
  localStorage.setItem(downloadedBookKey(bookId), "1");
}

export function isBookDownloaded(bookId: number): boolean {
  return localStorage.getItem(downloadedBookKey(bookId)) === "1";
}

export function clearBibleCache(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith("bible:"))
    .forEach((k) => localStorage.removeItem(k));
}

export async function searchVerses(query: string, limit = 50) {
  const { data, error } = await supabase
    .from("bible_verses")
    .select("book_id, chapter, verse, text, bible_books!inner(name, abbrev)")
    .ilike("text", `%${query}%`)
    .eq("version", "NVI")
    .limit(limit);

  if (error) throw error;
  return data;
}