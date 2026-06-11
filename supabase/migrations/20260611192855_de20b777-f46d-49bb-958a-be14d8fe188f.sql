
-- ============ CHURCH FEED ============
CREATE TABLE public.church_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL,
  image_url text,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.church_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_posts TO authenticated;
GRANT ALL ON public.church_posts TO service_role;
ALTER TABLE public.church_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view posts" ON public.church_posts FOR SELECT USING (true);
CREATE POLICY "members post" ON public.church_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "author update" ON public.church_posts FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "author delete" ON public.church_posts FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER church_posts_upd BEFORE UPDATE ON public.church_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.church_followers (
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (church_id, user_id)
);
GRANT SELECT ON public.church_followers TO anon;
GRANT SELECT, INSERT, DELETE ON public.church_followers TO authenticated;
GRANT ALL ON public.church_followers TO service_role;
ALTER TABLE public.church_followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view followers" ON public.church_followers FOR SELECT USING (true);
CREATE POLICY "self follow" ON public.church_followers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "self unfollow" ON public.church_followers FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.church_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  uploader_id uuid NOT NULL,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.church_gallery TO anon;
GRANT SELECT, INSERT, DELETE ON public.church_gallery TO authenticated;
GRANT ALL ON public.church_gallery TO service_role;
ALTER TABLE public.church_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view gallery" ON public.church_gallery FOR SELECT USING (true);
CREATE POLICY "upload gallery" ON public.church_gallery FOR INSERT TO authenticated WITH CHECK (uploader_id = auth.uid());
CREATE POLICY "delete own" ON public.church_gallery FOR DELETE TO authenticated USING (uploader_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ============ GROUPS: custom roles, follows, DM ============
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS custom_role text;
ALTER TABLE public.group_members ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb;

CREATE TABLE public.user_follows (
  follower_id uuid NOT NULL,
  followed_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_follows TO authenticated;
GRANT ALL ON public.user_follows TO service_role;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view follows" ON public.user_follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "self follow user" ON public.user_follows FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY "self unfollow user" ON public.user_follows FOR DELETE TO authenticated USING (follower_id = auth.uid());

CREATE TABLE public.user_blocks (
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own blocks" ON public.user_blocks FOR ALL TO authenticated USING (blocker_id = auth.uid()) WITH CHECK (blocker_id = auth.uid());

CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  content text,
  image_url text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dm view" ON public.direct_messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "dm send" ON public.direct_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid()
  AND NOT EXISTS (SELECT 1 FROM public.user_blocks WHERE blocker_id = recipient_id AND blocked_id = auth.uid())
);
CREATE POLICY "dm update own" ON public.direct_messages FOR UPDATE TO authenticated USING (recipient_id = auth.uid() OR sender_id = auth.uid());
CREATE POLICY "dm delete own" ON public.direct_messages FOR DELETE TO authenticated USING (sender_id = auth.uid());
CREATE INDEX dm_pair_idx ON public.direct_messages (sender_id, recipient_id, created_at DESC);

-- ============ SCHEDULED EVENTS (personal) ============
CREATE TABLE public.scheduled_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  location text,
  color text DEFAULT 'gold',
  recurrence text DEFAULT 'none',
  reminder_minutes integer DEFAULT 0,
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_events TO authenticated;
GRANT ALL ON public.scheduled_events TO service_role;
ALTER TABLE public.scheduled_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own events" ON public.scheduled_events FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER scheduled_events_upd BEFORE UPDATE ON public.scheduled_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ NOTES: tags, image, color ============
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS color text DEFAULT 'default';

-- ============ NOTE AUTOMATIONS (visual flow) ============
CREATE TABLE public.note_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  flow jsonb NOT NULL DEFAULT '{"nodes":[],"edges":[]}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.note_automations TO authenticated;
GRANT ALL ON public.note_automations TO service_role;
ALTER TABLE public.note_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own auto" ON public.note_automations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER note_auto_upd BEFORE UPDATE ON public.note_automations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notif" ON public.notifications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX notif_user_idx ON public.notifications (user_id, created_at DESC);

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.church_posts;
