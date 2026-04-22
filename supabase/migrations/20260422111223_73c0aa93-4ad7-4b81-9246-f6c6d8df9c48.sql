-- ============ EXTENSÕES NAS TABELAS EXISTENTES ============

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 10),
  ADD COLUMN IF NOT EXISTS only_admins_post BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_message_id UUID;

ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS nickname TEXT,
  ADD COLUMN IF NOT EXISTS muted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ============ NOVA TABELA: CANAIS ============

CREATE TABLE IF NOT EXISTS public.group_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '#',
  created_by UUID NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_channels_group ON public.group_channels(group_id, position);
ALTER TABLE public.group_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view channels"
  ON public.group_channels FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Owner creates channels"
  ON public.group_channels FOR INSERT
  WITH CHECK (public.is_group_owner(group_id, auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Owner updates channels"
  ON public.group_channels FOR UPDATE
  USING (public.is_group_owner(group_id, auth.uid()));

CREATE POLICY "Owner deletes channels"
  ON public.group_channels FOR DELETE
  USING (public.is_group_owner(group_id, auth.uid()));

-- ============ EXTENSÃO: MENSAGENS COM RESPOSTA/EDIÇÃO/CANAL ============

ALTER TABLE public.group_messages
  ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.group_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.group_channels(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_messages_channel ON public.group_messages(channel_id, created_at);

-- Política UPDATE para autor editar
DROP POLICY IF EXISTS "Author can edit own messages" ON public.group_messages;
CREATE POLICY "Author can edit own messages"
  ON public.group_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Atualizar política de INSERT para respeitar only_admins_post, banned e muted
DROP POLICY IF EXISTS "Members can send messages" ON public.group_messages;
CREATE POLICY "Members can send messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_group_member(group_id, auth.uid())
    AND NOT EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_messages.group_id
        AND gm.user_id = auth.uid()
        AND (gm.banned = true OR gm.muted = true)
    )
    AND (
      NOT EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_messages.group_id AND g.only_admins_post = true)
      OR public.is_group_owner(group_messages.group_id, auth.uid())
    )
  );

-- ============ NOVA TABELA: PEDIDOS DE ENTRADA ============

CREATE TABLE IF NOT EXISTS public.group_join_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner sees requests"
  ON public.group_join_requests FOR SELECT
  USING (public.is_group_owner(group_id, auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "User creates own request"
  ON public.group_join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner manages requests"
  ON public.group_join_requests FOR UPDATE
  USING (public.is_group_owner(group_id, auth.uid()));

CREATE POLICY "Owner or user deletes request"
  ON public.group_join_requests FOR DELETE
  USING (public.is_group_owner(group_id, auth.uid()) OR auth.uid() = user_id);

-- ============ NOVA TABELA: TYPING INDICATOR ============

CREATE TABLE IF NOT EXISTS public.group_typing (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  channel_id UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE public.group_typing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view typing"
  ON public.group_typing FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "User upserts own typing"
  ON public.group_typing FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_group_member(group_id, auth.uid()));

CREATE POLICY "User updates own typing"
  ON public.group_typing FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "User deletes own typing"
  ON public.group_typing FOR DELETE
  USING (auth.uid() = user_id);

-- ============ ATUALIZAR group_members POLICIES (apelido/last_read) ============

DROP POLICY IF EXISTS "Member updates own settings" ON public.group_members;
CREATE POLICY "Member updates own settings"
  ON public.group_members FOR UPDATE
  USING (auth.uid() = user_id OR public.is_group_owner(group_id, auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_group_owner(group_id, auth.uid()));

-- Owner pode remover qualquer membro
DROP POLICY IF EXISTS "Owner can remove members" ON public.group_members;
CREATE POLICY "Owner can remove members"
  ON public.group_members FOR DELETE
  USING (public.is_group_owner(group_id, auth.uid()) OR auth.uid() = user_id);

-- ============ REALTIME ============

ALTER TABLE public.group_channels REPLICA IDENTITY FULL;
ALTER TABLE public.group_join_requests REPLICA IDENTITY FULL;
ALTER TABLE public.group_typing REPLICA IDENTITY FULL;
ALTER TABLE public.group_members REPLICA IDENTITY FULL;
ALTER TABLE public.groups REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.group_channels; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.group_join_requests; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.group_typing; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.groups; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ============ FUNÇÃO HELPER: ENTRAR POR CONVITE ============

CREATE OR REPLACE FUNCTION public.join_group_by_invite(_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _group_id UUID;
  _is_banned BOOLEAN;
  _requires BOOLEAN;
BEGIN
  SELECT id, requires_approval INTO _group_id, _requires
  FROM public.groups WHERE invite_code = _code;
  IF _group_id IS NULL THEN
    RAISE EXCEPTION 'Convite inválido';
  END IF;
  SELECT banned INTO _is_banned FROM public.group_members
    WHERE group_id = _group_id AND user_id = auth.uid();
  IF _is_banned THEN
    RAISE EXCEPTION 'Você foi banido deste grupo';
  END IF;
  IF EXISTS (SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = auth.uid()) THEN
    RETURN _group_id;
  END IF;
  IF _requires THEN
    INSERT INTO public.group_join_requests(group_id, user_id)
    VALUES (_group_id, auth.uid())
    ON CONFLICT (group_id, user_id) DO NOTHING;
  ELSE
    INSERT INTO public.group_members(group_id, user_id, role) VALUES (_group_id, auth.uid(), 'member');
  END IF;
  RETURN _group_id;
END;
$$;