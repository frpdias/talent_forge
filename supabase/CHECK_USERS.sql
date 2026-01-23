-- Verificar os dois usuários
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE id IN (
  '53e6b41f-1912-4f21-8682-1d1ca719b79a',  -- Criou a aplicação
  '93f6e2cd-f13b-4fd6-bea3-915e3a99c62f'   -- Atualmente logado
)
ORDER BY created_at;
