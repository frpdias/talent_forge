-- Vincula employees existentes a auth users via email
-- Aplica em todos os employees que têm email mas user_id = NULL.
-- Busca o auth user pelo email e preenche employees.user_id.
--
-- NOTA: Este script é seguro para rodar múltiplas vezes (idempotente via WHERE user_id IS NULL).
-- Executar pelo Supabase Dashboard > SQL Editor após o deploy.

UPDATE employees e
SET user_id = au.id
FROM auth.users au
WHERE e.email IS NOT NULL
  AND e.user_id IS NULL
  AND lower(e.email) = lower(au.email);

-- Relatório de quantos foram vinculados
DO $$
DECLARE
  total_linked INT;
  total_no_email INT;
  total_email_no_auth INT;
BEGIN
  SELECT COUNT(*) INTO total_linked
  FROM employees WHERE user_id IS NOT NULL;

  SELECT COUNT(*) INTO total_no_email
  FROM employees WHERE email IS NULL;

  SELECT COUNT(*) INTO total_email_no_auth
  FROM employees WHERE email IS NOT NULL AND user_id IS NULL;

  RAISE NOTICE 'Employees com user_id vinculado: %', total_linked;
  RAISE NOTICE 'Employees sem email (sem vínculo possível): %', total_no_email;
  RAISE NOTICE 'Employees com email mas sem auth user (precisam de convite): %', total_email_no_auth;
END $$;
