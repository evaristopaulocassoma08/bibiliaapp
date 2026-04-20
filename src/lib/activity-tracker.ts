/**
 * Local activity tracker — records what the user does in the app
 * so we can show meaningful stats in the Reading History page.
 */

export type ReadingEntry = {
  bookId: number;
  bookName: string;
  chapter: number;
  timestamp: number;
};

export type SearchEntry = {
  query: string;
  timestamp: number;
};

export type SermonEntry = {
  theme: string;
  title: string;
  timestamp: number;
};

const READING_KEY = "activity:reading";
const SEARCH_KEY = "activity:search";
const SERMON_KEY = "activity:sermon";
const SESSION_KEY = "activity:sessions";
const MAX_ENTRIES = 500;

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]) {
  // Trim to last MAX_ENTRIES to keep storage bounded
  const trimmed = items.slice(-MAX_ENTRIES);
  localStorage.setItem(key, JSON.stringify(trimmed));
}

export function trackReading(bookId: number, bookName: string, chapter: number) {
  const items = read<ReadingEntry>(READING_KEY);
  items.push({ bookId, bookName, chapter, timestamp: Date.now() });
  write(READING_KEY, items);
  trackSession();
}

export function trackSearch(query: string) {
  const q = query.trim();
  if (!q || q.length < 2) return;
  const items = read<SearchEntry>(SEARCH_KEY);
  items.push({ query: q, timestamp: Date.now() });
  write(SEARCH_KEY, items);
  trackSession();
}

export function trackSermon(theme: string, title: string) {
  const items = read<SermonEntry>(SERMON_KEY);
  items.push({ theme, title, timestamp: Date.now() });
  write(SERMON_KEY, items);
  trackSession();
}

function trackSession() {
  const today = new Date().toISOString().slice(0, 10);
  const sessions: string[] = read(SESSION_KEY);
  if (!sessions.includes(today)) {
    sessions.push(today);
    write(SESSION_KEY, sessions);
  }
}

export function getReadingHistory(): ReadingEntry[] {
  return read<ReadingEntry>(READING_KEY).reverse();
}

export function getSearchHistory(): SearchEntry[] {
  return read<SearchEntry>(SEARCH_KEY).reverse();
}

export function getSermonHistory(): SermonEntry[] {
  return read<SermonEntry>(SERMON_KEY).reverse();
}

export type Counted<T> = T & { count: number };

export function getMostReadChapters(limit = 10): Counted<{ bookId: number; bookName: string; chapter: number }>[] {
  const items = read<ReadingEntry>(READING_KEY);
  const map = new Map<string, Counted<{ bookId: number; bookName: string; chapter: number }>>();
  for (const e of items) {
    const key = `${e.bookId}:${e.chapter}`;
    const cur = map.get(key);
    if (cur) cur.count++;
    else map.set(key, { bookId: e.bookId, bookName: e.bookName, chapter: e.chapter, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export function getMostReadBooks(limit = 5): Counted<{ bookId: number; bookName: string }>[] {
  const items = read<ReadingEntry>(READING_KEY);
  const map = new Map<number, Counted<{ bookId: number; bookName: string }>>();
  for (const e of items) {
    const cur = map.get(e.bookId);
    if (cur) cur.count++;
    else map.set(e.bookId, { bookId: e.bookId, bookName: e.bookName, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export function getTopSearches(limit = 10): Counted<{ query: string }>[] {
  const items = read<SearchEntry>(SEARCH_KEY);
  const map = new Map<string, Counted<{ query: string }>>();
  for (const e of items) {
    const k = e.query.toLowerCase();
    const cur = map.get(k);
    if (cur) cur.count++;
    else map.set(k, { query: e.query, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export function getTopSermonThemes(limit = 10): Counted<{ theme: string }>[] {
  const items = read<SermonEntry>(SERMON_KEY);
  const map = new Map<string, Counted<{ theme: string }>>();
  for (const e of items) {
    const k = e.theme.toLowerCase();
    const cur = map.get(k);
    if (cur) cur.count++;
    else map.set(k, { theme: e.theme, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export function getStreak(): { current: number; total: number; days: string[] } {
  const days: string[] = read(SESSION_KEY);
  const sorted = [...new Set(days)].sort();
  let current = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    if (sorted.includes(iso)) current++;
    else if (i > 0) break;
  }
  return { current, total: sorted.length, days: sorted };
}

export function getTotals() {
  return {
    readings: read<ReadingEntry>(READING_KEY).length,
    searches: read<SearchEntry>(SEARCH_KEY).length,
    sermons: read<SermonEntry>(SERMON_KEY).length,
  };
}

export function clearAllActivity() {
  localStorage.removeItem(READING_KEY);
  localStorage.removeItem(SEARCH_KEY);
  localStorage.removeItem(SERMON_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function exportActivity() {
  return {
    reading: read(READING_KEY),
    search: read(SEARCH_KEY),
    sermon: read(SERMON_KEY),
    sessions: read(SESSION_KEY),
    exportedAt: new Date().toISOString(),
  };
}
