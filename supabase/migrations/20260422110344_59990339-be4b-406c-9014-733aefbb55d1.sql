-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_messages_group_created
  ON public.group_messages (group_id, created_at);

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Função helper: é membro?
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = _user_id
  );
$$;

-- Função helper: é dono do grupo?
CREATE OR REPLACE FUNCTION public.is_group_owner(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id AND owner_id = _user_id
  );
$$;

-- Policies
CREATE POLICY "Members can view group messages"
  ON public.group_messages FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Members can send messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_group_member(group_id, auth.uid())
  );

CREATE POLICY "Author or owner can delete messages"
  ON public.group_messages FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.is_group_owner(group_id, auth.uid())
  );

-- Realtime
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-media', 'group-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Group media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'group-media');

CREATE POLICY "Auth users upload group media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'group-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users delete own group media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'group-media' AND auth.uid() IS NOT NULL);