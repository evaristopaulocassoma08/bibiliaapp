-- Roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'church_leader', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Churches
CREATE TABLE public.churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  leader_name TEXT,
  leader_contact TEXT,
  photo_url TEXT,
  denomination TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.churches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.churches TO authenticated;
GRANT ALL ON public.churches TO service_role;
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Churches viewable by all" ON public.churches FOR SELECT USING (true);
CREATE POLICY "Admins create churches" ON public.churches FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by);
CREATE POLICY "Admins or creator update" ON public.churches FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = created_by);
CREATE POLICY "Admins delete churches" ON public.churches FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_churches_updated BEFORE UPDATE ON public.churches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ministries (coros, jovens, escola dominical, etc.)
CREATE TABLE public.church_ministries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'ministerio',
  description TEXT,
  leader_name TEXT,
  leader_contact TEXT,
  schedule TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.church_ministries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_ministries TO authenticated;
GRANT ALL ON public.church_ministries TO service_role;
ALTER TABLE public.church_ministries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ministries viewable by all" ON public.church_ministries FOR SELECT USING (true);
CREATE POLICY "Admins/creator manage ministries" ON public.church_ministries FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.churches c WHERE c.id = church_id AND c.created_by = auth.uid())
) WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.churches c WHERE c.id = church_id AND c.created_by = auth.uid())
);

-- Events
CREATE TABLE public.church_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  location TEXT,
  recurrence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.church_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_events TO authenticated;
GRANT ALL ON public.church_events TO service_role;
ALTER TABLE public.church_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events viewable by all" ON public.church_events FOR SELECT USING (true);
CREATE POLICY "Admins/creator manage events" ON public.church_events FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.churches c WHERE c.id = church_id AND c.created_by = auth.uid())
) WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.churches c WHERE c.id = church_id AND c.created_by = auth.uid())
);

-- Motivational chapters
CREATE TABLE public.motivational_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_name TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_reference TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.motivational_chapters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.motivational_chapters TO authenticated;
GRANT ALL ON public.motivational_chapters TO service_role;
ALTER TABLE public.motivational_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Motivational viewable by all" ON public.motivational_chapters FOR SELECT USING (true);
CREATE POLICY "Admins manage motivational" ON public.motivational_chapters FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by);