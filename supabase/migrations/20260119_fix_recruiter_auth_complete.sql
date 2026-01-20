-- MIGRATION COMPLETA: Corrige autenticação de recrutadores
-- Data: 2026-01-19
-- Problema: Recrutadores sendo redirecionados para página de candidatos
-- Causa: user_profiles não sendo criado corretamente ou user_type não sendo salvo

-- ============================================
-- PARTE 1: GARANTIR QUE O ENUM EXISTE
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
    CREATE TYPE user_type AS ENUM ('admin', 'recruiter', 'candidate');
  END IF;
END $$;

-- ============================================
-- PARTE 2: GARANTIR QUE A TABELA EXISTE COM TODAS AS COLUNAS
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_type user_type NOT NULL DEFAULT 'candidate',
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  linkedin_url TEXT,
  -- For candidates
  current_title TEXT,
  resume_url TEXT,
  salary_expectation NUMERIC,
  availability_date DATE,
  skills TEXT[],
  -- Metadata
  email_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adicionar coluna email se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'user_profiles' 
      AND column_name = 'email'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- Atualizar email NULL com dados de auth.users
UPDATE user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.id = au.id AND up.email IS NULL;

-- Tornar email NOT NULL após preencher
ALTER TABLE user_profiles ALTER COLUMN email SET NOT NULL;

-- Criar índices
CREATE INDEX IF NOT EXISTS user_profiles_type_idx ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles(email);

-- ============================================
-- PARTE 3: RECRIAR FUNÇÃO DE TRIGGER ROBUSTA
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log para debug
  RAISE LOG 'handle_new_user triggered for user: %, metadata: %', NEW.id, NEW.raw_user_meta_data;
  
  -- Inserir ou atualizar user_profile
  INSERT INTO public.user_profiles (
    id, 
    email, 
    full_name, 
    user_type
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1),
      'Usuário'
    ),
    COALESCE(
      (NEW.raw_user_meta_data->>'user_type')::user_type,
      'candidate'::user_type
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    user_type = COALESCE(EXCLUDED.user_type, user_profiles.user_type),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- ============================================
-- PARTE 4: RECRIAR TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- PARTE 5: POLÍTICAS RLS
-- ============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Dropar políticas antigas
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Service role can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Recruiters can view candidate profiles" ON user_profiles;

-- SELECT: Usuários podem ver próprio perfil
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- INSERT: Usuários podem criar próprio perfil (fallback caso trigger falhe)
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- UPDATE: Usuários podem atualizar próprio perfil
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- SELECT: Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.id = auth.uid() 
        AND up.user_type IN ('admin', 'recruiter')
    )
  );

-- SELECT: Recrutadores podem ver perfis de candidatos
CREATE POLICY "Recruiters can view candidate profiles" ON user_profiles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.id = auth.uid() 
        AND up.user_type = 'recruiter'
    )
    AND user_type = 'candidate'
  );

-- ============================================
-- PARTE 6: CORRIGIR PERFIS EXISTENTES
-- ============================================

-- Criar perfis para usuários que não têm
INSERT INTO user_profiles (id, email, full_name, user_type)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    SPLIT_PART(au.email, '@', 1),
    'Usuário'
  ),
  COALESCE(
    (au.raw_user_meta_data->>'user_type')::user_type,
    'candidate'::user_type
  )
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Atualizar user_type de perfis existentes baseado em metadata
UPDATE user_profiles up
SET 
  user_type = (au.raw_user_meta_data->>'user_type')::user_type,
  updated_at = NOW()
FROM auth.users au
WHERE up.id = au.id
  AND au.raw_user_meta_data->>'user_type' IS NOT NULL
  AND up.user_type != (au.raw_user_meta_data->>'user_type')::user_type;

-- ============================================
-- PARTE 7: CRIAR FUNÇÕES AUXILIARES
-- ============================================

-- Função para verificar se usuário é recrutador
CREATE OR REPLACE FUNCTION is_recruiter(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = user_id 
      AND user_type IN ('recruiter', 'admin')
  );
$$;

-- Função para obter tipo de usuário
CREATE OR REPLACE FUNCTION get_user_type(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT user_type::text FROM user_profiles WHERE id = user_id;
$$;

-- ============================================
-- PARTE 8: RELATÓRIO DE VERIFICAÇÃO
-- ============================================

-- Esta query deve ser executada após a migration para verificar
DO $$
DECLARE
  total_users INT;
  users_with_profile INT;
  users_without_profile INT;
  recruiters INT;
  candidates INT;
BEGIN
  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(*) INTO users_with_profile FROM user_profiles;
  SELECT COUNT(*) INTO users_without_profile 
    FROM auth.users au 
    LEFT JOIN user_profiles up ON au.id = up.id 
    WHERE up.id IS NULL;
  SELECT COUNT(*) INTO recruiters FROM user_profiles WHERE user_type = 'recruiter';
  SELECT COUNT(*) INTO candidates FROM user_profiles WHERE user_type = 'candidate';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RELATÓRIO DE MIGRAÇÃO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de usuários: %', total_users;
  RAISE NOTICE 'Usuários com perfil: %', users_with_profile;
  RAISE NOTICE 'Usuários SEM perfil: %', users_without_profile;
  RAISE NOTICE 'Recrutadores: %', recruiters;
  RAISE NOTICE 'Candidatos: %', candidates;
  RAISE NOTICE '========================================';
END $$;
