-- Comentários em pregações
CREATE TABLE public.sermon_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sermon_id UUID NOT NULL REFERENCES public.sermons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sermon_comments_sermon ON public.sermon_comments(sermon_id, created_at DESC);

ALTER TABLE public.sermon_comments ENABLE ROW LEVEL SECURITY;

-- Comentários: visíveis apenas para o dono da pregação OU o autor do comentário
CREATE POLICY "View comments on own sermons or own comments"
  ON public.sermon_comments FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.sermons s WHERE s.id = sermon_id AND s.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own comments"
  ON public.sermon_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.sermon_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Permitir update do conteúdo da pregação (para mencionar/editar)
CREATE POLICY "Users can update own sermons"
  ON public.sermons FOR UPDATE
  USING (auth.uid() = user_id);
