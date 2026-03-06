-- Transferir aplicação para o candidato correto (frpdias@hotmail.com)
-- Date: 2026-01-22
-- A candidatura foi criada com o usuário errado, transferindo para o candidato alvo correto

DO $$
DECLARE
  v_target_user_id uuid := '93f6e2cd-f13b-4fd6-bea3-915e3a99c62f'; -- frpdias@hotmail.com (candidato alvo)
  v_target_email text := 'frpdias@hotmail.com';
  v_application_id uuid := '006127a9-9eb3-4106-8dbc-5ebb8add8782';
  v_old_candidate_id uuid;
  v_new_candidate_id uuid;
  v_org_id uuid;
BEGIN
  -- Pegar dados da aplicação
  SELECT a.candidate_id, j.org_id 
  INTO v_old_candidate_id, v_org_id
  FROM applications a
  JOIN jobs j ON j.id = a.job_id
  WHERE a.id = v_application_id;

  -- Buscar candidate existente para o usuário alvo
  SELECT id INTO v_new_candidate_id
  FROM candidates
  WHERE owner_org_id = v_org_id
    AND (user_id = v_target_user_id OR email = v_target_email)
  LIMIT 1;

  -- Se não existir, criar novo candidate com dados do usuário alvo
  IF v_new_candidate_id IS NULL THEN
    INSERT INTO candidates (
      owner_org_id,
      user_id,
      email,
      full_name,
      created_by
    )
    SELECT 
      v_org_id,
      v_target_user_id,
      v_target_email,
      COALESCE(
        (SELECT full_name FROM candidates WHERE id = v_old_candidate_id),
        'Candidato'
      ),
      v_target_user_id
    RETURNING id INTO v_new_candidate_id;
  END IF;

  -- Transferir a aplicação para o candidato correto
  UPDATE applications
  SET 
    candidate_id = v_new_candidate_id,
    created_by = v_target_user_id
  WHERE id = v_application_id;

  RAISE NOTICE 'Aplicação transferida de % para %', v_old_candidate_id, v_new_candidate_id;
END $$;

-- Verificar o resultado
SELECT 
  a.id as application_id,
  a.created_by,
  c.user_id as candidate_user_id,
  c.email as candidate_email,
  j.title as job_title
FROM applications a
JOIN candidates c ON c.id = a.candidate_id
JOIN jobs j ON j.id = a.job_id
WHERE a.id = '006127a9-9eb3-4106-8dbc-5ebb8add8782';
