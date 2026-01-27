-- Diagnóstico: Usuários com múltiplas organizações
-- Data: 2026-01-27
-- Executar no Supabase SQL Editor

-- 1. Listar usuários com múltiplas organizações
SELECT 
  om.user_id,
  up.email,
  up.full_name,
  up.user_type,
  COUNT(*) as org_count,
  STRING_AGG(o.name, ', ' ORDER BY om.created_at DESC) as organizations,
  STRING_AGG(om.role::text, ', ' ORDER BY om.created_at DESC) as roles,
  STRING_AGG(om.status::text, ', ' ORDER BY om.created_at DESC) as statuses
FROM org_members om
JOIN user_profiles up ON om.user_id = up.id
LEFT JOIN organizations o ON om.org_id = o.id
GROUP BY om.user_id, up.email, up.full_name, up.user_type
HAVING COUNT(*) > 1
ORDER BY org_count DESC, up.email;

-- 2. Estatísticas de memberships por usuário
SELECT 
  membership_count,
  COUNT(*) as users_count
FROM (
  SELECT user_id, COUNT(*) as membership_count
  FROM org_members
  GROUP BY user_id
) counts
GROUP BY membership_count
ORDER BY membership_count;

-- 3. Usuários com múltiplas organizações ATIVAS
SELECT 
  om.user_id,
  up.email,
  COUNT(*) as active_org_count
FROM org_members om
JOIN user_profiles up ON om.user_id = up.id
WHERE om.status = 'active'
GROUP BY om.user_id, up.email
HAVING COUNT(*) > 1
ORDER BY active_org_count DESC;

-- 4. Detalhes completos do usuário específico (53e6b41f-1912-4f21-8682-1d1ca719b79a)
SELECT 
  om.id as membership_id,
  om.user_id,
  up.email,
  up.full_name,
  om.org_id,
  o.name as org_name,
  om.role,
  om.status,
  om.created_at as joined_at
FROM org_members om
JOIN user_profiles up ON om.user_id = up.id
LEFT JOIN organizations o ON om.org_id = o.id
WHERE om.user_id = '53e6b41f-1912-4f21-8682-1d1ca719b79a'
ORDER BY om.created_at DESC;

-- 5. RECOMENDAÇÃO: Remover organizações duplicadas (manter apenas a mais recente)
-- ⚠️ EXECUTAR APENAS APÓS REVISAR OS RESULTADOS ACIMA

/*
-- Este bloco está comentado por segurança
-- Descomente e execute apenas se necessário

DO $$
DECLARE
  user_record RECORD;
  org_to_keep UUID;
BEGIN
  FOR user_record IN
    SELECT user_id, COUNT(*) as org_count
    FROM org_members
    WHERE status = 'active'
    GROUP BY user_id
    HAVING COUNT(*) > 1
  LOOP
    -- Manter apenas a organização mais recente (última criada)
    SELECT om.org_id INTO org_to_keep
    FROM org_members om
    WHERE om.user_id = user_record.user_id
      AND om.status = 'active'
    ORDER BY om.created_at DESC
    LIMIT 1;

    -- Desativar as outras organizações
    UPDATE org_members
    SET status = 'inactive'
    WHERE user_id = user_record.user_id
      AND org_id != org_to_keep
      AND status = 'active';

    RAISE NOTICE 'User % - kept org %, deactivated % other orgs', 
      user_record.user_id, 
      org_to_keep, 
      user_record.org_count - 1;
  END LOOP;
END $$;
*/

-- 6. Verificação final
SELECT '=== VERIFICAÇÃO CONCLUÍDA ===' as status;
