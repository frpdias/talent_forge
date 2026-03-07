-- Permite que candidatos leiam suas próprias entrevistas
-- A política anterior só cobria membros da org (recrutadores)

CREATE POLICY "Candidates can view own interviews"
  ON public.interviews FOR SELECT
  TO authenticated
  USING (
    candidate_id IN (
      SELECT id FROM public.candidates WHERE user_id = auth.uid()
    )
  );

SELECT '✅ Candidatos agora podem ver suas próprias entrevistas' AS status;
