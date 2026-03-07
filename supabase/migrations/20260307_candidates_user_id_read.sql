-- Candidatos podem ler o próprio registro via user_id
-- Necessário para a subquery da policy "Candidates can view own interviews"
-- A policy anterior (candidates_email_self) usa auth.email() como critério,
-- mas a subquery de interviews filtra por candidates.user_id = auth.uid()

CREATE POLICY "candidates_user_id_self"
  ON public.candidates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

SELECT '✅ Policy candidates_user_id_self criada' AS status;
