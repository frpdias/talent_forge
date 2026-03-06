-- Script para diagnosticar problemas de autenticação de recrutador
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o enum user_type existe e tem os valores corretos
SELECT 
  'user_type enum' as check_name,
  EXISTS(SELECT 1 FROM pg_type WHERE typname = 'user_type') as exists,
  (SELECT array_agg(enumlabel::text) FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'user_type') as values;

-- 2. Verificar estrutura da tabela user_profiles
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 3. Verificar se o trigger handle_new_user existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 4. Verificar o código da função handle_new_user
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 5. Verificar políticas RLS em user_profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 6. Verificar usuários existentes (apenas metadados, sem dados sensíveis)
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'user_type' as metadata_user_type,
  au.raw_user_meta_data->>'full_name' as metadata_full_name,
  up.user_type as profile_user_type,
  up.full_name as profile_full_name,
  up.created_at as profile_created_at
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
ORDER BY au.created_at DESC
LIMIT 10;

-- 7. Verificar se há usuários sem perfil
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'user_type' as should_be_type,
  'MISSING PROFILE' as status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;
