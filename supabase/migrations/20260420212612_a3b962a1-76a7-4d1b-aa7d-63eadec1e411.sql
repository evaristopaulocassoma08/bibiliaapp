
-- Bible books table
CREATE TABLE public.bible_books (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  abbrev TEXT NOT NULL,
  testament TEXT NOT NULL CHECK (testament IN ('AT','NT')),
  chapters_count INTEGER NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bible verses table
CREATE TABLE public.bible_verses (
  id BIGSERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES public.bible_books(id) ON DELETE CASCADE,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'NVI',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (book_id, chapter, verse, version)
);

CREATE INDEX idx_bible_verses_book_chapter ON public.bible_verses(book_id, chapter);
CREATE INDEX idx_bible_verses_text_search ON public.bible_verses USING GIN (to_tsvector('portuguese', text));

ALTER TABLE public.bible_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;

-- Public read access (Bible content is public)
CREATE POLICY "Bible books readable by everyone"
  ON public.bible_books FOR SELECT USING (true);

CREATE POLICY "Bible verses readable by everyone"
  ON public.bible_verses FOR SELECT USING (true);
