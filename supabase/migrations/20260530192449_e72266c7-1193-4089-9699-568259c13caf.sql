
-- Link groups to churches
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES public.churches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_groups_church_id ON public.groups(church_id);

-- Public storage bucket for church photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('church-photos', 'church-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Church photos public read" ON storage.objects;
CREATE POLICY "Church photos public read" ON storage.objects FOR SELECT USING (bucket_id = 'church-photos');

DROP POLICY IF EXISTS "Auth users upload church photos" ON storage.objects;
CREATE POLICY "Auth users upload church photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'church-photos');

DROP POLICY IF EXISTS "Users update own church photos" ON storage.objects;
CREATE POLICY "Users update own church photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'church-photos' AND owner = auth.uid());

DROP POLICY IF EXISTS "Users delete own church photos" ON storage.objects;
CREATE POLICY "Users delete own church photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'church-photos' AND owner = auth.uid());
