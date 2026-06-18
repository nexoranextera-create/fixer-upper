
-- Add medecin role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'medecin';

-- Enterprise documents for RAG
CREATE TABLE IF NOT EXISTS public.enterprise_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid,
  title text NOT NULL,
  category text DEFAULT 'general',
  content text NOT NULL,
  file_url text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.enterprise_documents TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.enterprise_documents TO authenticated;
GRANT ALL ON public.enterprise_documents TO service_role;
ALTER TABLE public.enterprise_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated can read enterprise docs"
  ON public.enterprise_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "RH/admin can manage enterprise docs"
  ON public.enterprise_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'rh') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'rh') OR public.has_role(auth.uid(),'admin'));

-- Mood pulse (weekly anonymous mood)
CREATE TABLE IF NOT EXISTS public.mood_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  note text,
  department text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.mood_checks TO authenticated;
GRANT ALL ON public.mood_checks TO service_role;
ALTER TABLE public.mood_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own mood" ON public.mood_checks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own mood" ON public.mood_checks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manager/RH read all mood (aggregated)" ON public.mood_checks
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'rh') OR public.has_role(auth.uid(),'admin')
  );

CREATE INDEX IF NOT EXISTS mood_checks_created_idx ON public.mood_checks(created_at DESC);
CREATE INDEX IF NOT EXISTS enterprise_documents_org_idx ON public.enterprise_documents(organisation_id);
