-- DEBUG: Verificar aplicações e contexto de autenticação
-- Execute estas queries NO SUPABASE SQL EDITOR enquanto logado como candidato

-- 1. Verificar seu contexto de autenticação atual
SELECT 
  auth.uid() as my_user_id,
  auth.email() as my_email;

-- 2. Verificar todas as aplicações criadas
SELECT 
  a.id as application_id,
  a.created_by,
  a.job_id,
  a.status,
  a.created_at,
  c.id as candidate_id,
  c.user_id as candidate_user_id,
  c.email as candidate_email
FROM applications a
LEFT JOIN candidates c ON c.id = a.candidate_id
ORDER BY a.created_at DESC
LIMIT 10;

-- 3. Testar a função RPC diretamente
SELECT * FROM public.get_my_applications();

-- 4. Verificar se há match com QUALQUER uma das condições
SELECT 
  a.id,
  a.created_by,
  c.user_id,
  c.email,
  auth.uid() as current_user_id,
  auth.email() as current_user_email,
  -- Verificar cada condição individualmente
  (c.user_id = auth.uid()) as match_user_id,
  (c.email IS NOT NULL AND c.email = auth.email()) as match_email,
  (a.created_by = auth.uid()) as match_created_by
FROM applications a
JOIN candidates c ON c.id = a.candidate_id
WHERE a.id = '006127a9-9eb3-4106-8dbc-5ebb8add8782';
