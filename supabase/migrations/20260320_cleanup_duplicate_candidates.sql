-- =============================================================================
-- Migration: Remover candidatos duplicados sem candidaturas (race condition)
-- Sprint 56 — Julia (juliaasseruy@hotmail.com, user_id: cc374127...)
-- Os registros 59867599 e 797f28da foram criados no mesmo segundo (17:27:14)
-- na mesma org (FARTECH), sem candidaturas nem entrevistas vinculadas.
-- =============================================================================

-- Segurança: verificar antes que não há candidaturas nesses IDs
DO $$
DECLARE
  app_count INT;
  int_count INT;
BEGIN
  SELECT COUNT(*) INTO app_count FROM applications
    WHERE candidate_id IN (
      '59867599-ceee-4f0f-a8b3-1dcebda1b238',
      '797f28da-fed0-4ef4-abdb-d2a833777181'
    );

  SELECT COUNT(*) INTO int_count FROM interviews
    WHERE candidate_id IN (
      '59867599-ceee-4f0f-a8b3-1dcebda1b238',
      '797f28da-fed0-4ef4-abdb-d2a833777181'
    );

  IF app_count > 0 OR int_count > 0 THEN
    RAISE EXCEPTION 'Abortando: candidatos têm % candidatura(s) e % entrevista(s) vinculadas.', app_count, int_count;
  END IF;
END $$;

-- Remover os dois candidatos duplicados sem referências
DELETE FROM candidates
WHERE id IN (
  '59867599-ceee-4f0f-a8b3-1dcebda1b238',
  '797f28da-fed0-4ef4-abdb-d2a833777181'
);
