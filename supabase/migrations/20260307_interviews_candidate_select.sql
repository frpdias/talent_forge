-- Permite que candidatos vejam suas próprias entrevistas agendadas
-- candidates.user_id referencia auth.users(id) (backfillado em 20260122)

DROP POLICY IF EXISTS "Candidate can view own interviews" ON public.interviews;

CREATE POLICY "Candidate can view own interviews"
  ON public.interviews FOR SELECT
  TO authenticated
  USING (
    candidate_id IN (
      SELECT id FROM public.candidates
      WHERE user_id = auth.uid()
    )
  );

SELECT '✅ RLS: candidato pode ver suas entrevistas' AS status;
