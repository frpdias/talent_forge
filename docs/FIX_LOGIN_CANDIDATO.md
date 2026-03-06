# 🔧 Fix do Login do Candidato

## Problema Identificado

Os usuários existentes no `auth.users` não possuem registros correspondentes na tabela `user_profiles`, causando:
- `Profile user_type: undefined` no middleware
- Login redirecionando incorretamente
- Proteção de rotas falhando

## Solução

### Passo 1: Executar a Migration no Supabase

1. Acesse o **Supabase Dashboard**: https://fjudsjzfnysaztcwlwgm.supabase.co
2. Vá em **SQL Editor**
3. Cole e execute o seguinte SQL:

```sql
-- Fix existing users without profiles
-- This migration ensures all existing auth.users have corresponding user_profiles entries

-- Insert missing user profiles for existing users
INSERT INTO user_profiles (id, full_name, user_type, email_verified, onboarding_completed, created_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email
  ) as full_name,
  COALESCE(
    (au.raw_user_meta_data->>'user_type')::user_type,
    'candidate'
  ) as user_type,
  au.email_confirmed_at IS NOT NULL as email_verified,
  COALESCE((au.raw_user_meta_data->>'onboarding_completed')::boolean, false) as onboarding_completed,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Verificar resultados
SELECT COUNT(*) as total_profiles FROM user_profiles;
SELECT id, full_name, user_type FROM user_profiles ORDER BY created_at DESC;
```

### Passo 2: Verificar os Perfis Criados

Execute no SQL Editor:

```sql
-- Ver todos os perfis
SELECT 
  up.id,
  up.full_name,
  up.user_type,
  au.email,
  up.created_at
FROM user_profiles up
INNER JOIN auth.users au ON au.id = up.id
ORDER BY up.created_at DESC;
```

### Passo 3: Testar o Login

1. Faça logout de todos os usuários
2. Tente fazer login novamente com:
   - **Candidato**: frpdias@hotmail.com
   - **Recrutador**: frpdias@icloud.com
3. Verifique se o redirecionamento está correto:
   - Candidatos → `/candidate`
   - Recrutadores/Admins → `/dashboard`

## Alterações Feitas no Código

### 1. Middleware (`apps/web/src/middleware.ts`)
- ✅ Adicionada proteção de rotas por tipo de usuário
- ✅ Bloqueio de acesso de candidatos ao `/dashboard`
- ✅ Bloqueio de acesso de recrutadores ao `/candidate`
- ✅ Fallback para `'candidate'` se user_type não existir
- ✅ Adicionadas rotas públicas: `/jobs`, `/onboarding`

### 2. Login (`apps/web/src/app/(auth)/login/page.tsx`)
- ✅ Busca user_type da tabela `user_profiles` após login
- ✅ Delay aumentado para 500ms para garantir persistência da sessão
- ✅ Redirecionamento usando `window.location.href` (mais confiável)
- ✅ Logs detalhados para debug

### 3. Migration Criada
- ✅ `20260120_fix_existing_user_profiles.sql` - Popula perfis faltantes

## Logs do Middleware

Antes da correção:
```
[MIDDLEWARE] User: frpdias@hotmail.com | Profile user_type: undefined | Metadata user_type: candidate | Final userType: candidate
```

Depois da migration (esperado):
```
[MIDDLEWARE] User: frpdias@hotmail.com | Profile user_type: candidate | Metadata user_type: candidate | Final userType: candidate
```

## Teste Rápido

Após executar a migration SQL, recarregue a página de login e tente entrar novamente.

---

**Criado em:** 20/01/2026  
**Arquivos modificados:**
- `apps/web/src/middleware.ts`
- `apps/web/src/app/(auth)/login/page.tsx`
- `supabase/migrations/20260120_fix_existing_user_profiles.sql`
- `scripts/sync-user-profiles.js`
