-- Script de diagnóstico: Verificar usuários sem org_members
-- Executar no Supabase SQL Editor

-- 1. Listar todos os usuários e suas organizações
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.user_type,
  om.org_id,
  om.role,
  om.status,
  o.name as org_name
FROM user_profiles up
LEFT JOIN org_members om ON up.id = om.user_id
LEFT JOIN organizations o ON om.org_id = o.id
ORDER BY up.user_type, up.created_at DESC;

-- 2. Contar usuários por tipo sem org_members
SELECT 
  up.user_type,
  COUNT(*) as total_users,
  COUNT(om.org_id) as users_with_org,
  COUNT(*) - COUNT(om.org_id) as users_without_org
FROM user_profiles up
LEFT JOIN org_members om ON up.id = om.user_id
GROUP BY up.user_type;

-- 3. Listar especificamente recruiters sem organização
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.created_at
FROM user_profiles up
LEFT JOIN org_members om ON up.id = om.user_id
WHERE up.user_type = 'recruiter'
  AND om.org_id IS NULL;

-- 4. OPCIONAL: Criar organizações para recruiters sem org_members
-- ⚠️ EXECUTAR APENAS APÓS REVISAR OS RESULTADOS ACIMA

/*
DO $$
DECLARE
  recruiter_record RECORD;
  new_org_id UUID;
BEGIN
  -- Buscar recruiters sem organização
  FOR recruiter_record IN
    SELECT up.id, up.email, up.full_name
    FROM user_profiles up
    LEFT JOIN org_members om ON up.id = om.user_id
    WHERE up.user_type = 'recruiter'
      AND om.org_id IS NULL
  LOOP
    -- Criar organização para o recruiter
    INSERT INTO organizations (name, org_type, status, email)
    VALUES (
      recruiter_record.full_name || ' - ' || SUBSTRING(recruiter_record.id::text, 1, 8),
      'headhunter',
      'active',
      recruiter_record.email
    )
    RETURNING id INTO new_org_id;

    -- Vincular recruiter à organização
    INSERT INTO org_members (org_id, user_id, role, status)
    VALUES (new_org_id, recruiter_record.id, 'admin', 'active');

    RAISE NOTICE 'Organização criada para recruiter: % (org_id: %)', recruiter_record.email, new_org_id;
  END LOOP;
END $$;
*/

-- 5. Verificar resultado
SELECT 
  'Diagnóstico concluído' as status,
  (SELECT COUNT(*) FROM user_profiles WHERE user_type = 'recruiter') as total_recruiters,
  (SELECT COUNT(DISTINCT om.user_id) 
   FROM org_members om 
   JOIN user_profiles up ON om.user_id = up.id 
   WHERE up.user_type = 'recruiter') as recruiters_with_org;
