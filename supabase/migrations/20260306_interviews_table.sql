-- Migration: interviews table
-- Tabela de entrevistas agendadas pelo headhunter (integra com Google Calendar)

CREATE TABLE IF NOT EXISTS public.interviews (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id            UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  candidate_id      UUID REFERENCES public.candidates(id) ON DELETE SET NULL,
  application_id    UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  job_id            UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_minutes  INT NOT NULL DEFAULT 60,
  type              TEXT NOT NULL DEFAULT 'video' CHECK (type IN ('video', 'presencial', 'phone')),
  location          TEXT,
  notes             TEXT,
  meet_link         TEXT,
  google_event_id   TEXT,
  status            TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS interviews_org_id_idx ON public.interviews(org_id);
CREATE INDEX IF NOT EXISTS interviews_scheduled_at_idx ON public.interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS interviews_candidate_id_idx ON public.interviews(candidate_id);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage interviews"
  ON public.interviews FOR ALL
  TO authenticated
  USING (is_org_member(org_id))
  WITH CHECK (is_org_member(org_id));

SELECT '✅ Tabela interviews criada com RLS' AS status;
