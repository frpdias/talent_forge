# 🔧 Correção de Autenticação de Recrutadores

## 📋 Problema Identificado

**Sintoma:** Recrutadores são redirecionados para página de candidatos após login.

**Causas Encontradas:**

1. ✅ **Tabela `user_profiles` sem coluna `email`** - O trigger só salvava `id`, `full_name` e `user_type`
2. ✅ **Middleware redirecionando para `/candidate` por default** - Quando `user_type` era null
3. ✅ **Trigger não atualizava perfis existentes** - Apenas `ON CONFLICT DO NOTHING`
4. ✅ **RLS policies não permitiam leitura de todos os campos**

## 🔍 Análise das Tabelas

### Estrutura Atual Esperada:

```sql
-- Enum de tipos de usuário
CREATE TYPE user_type AS ENUM ('admin', 'recruiter', 'candidate');

-- Tabela principal de perfis
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,                    -- ⚠️ PODE ESTAR FALTANDO
  user_type user_type NOT NULL DEFAULT 'candidate',
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  linkedin_url TEXT,
  current_title TEXT,
  resume_url TEXT,
  salary_expectation NUMERIC,
  availability_date DATE,
  skills TEXT[],
  email_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Trigger Atual:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'candidate')
  )
  ON CONFLICT (id) DO NOTHING;  -- ⚠️ PROBLEMA: Não atualiza se já existe
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

**Problemas:**
- ❌ Não salva `email`
- ❌ `ON CONFLICT DO NOTHING` não atualiza perfis existentes
- ❌ Se o perfil já existir com `user_type` errado, não corrige

## 🛠️ Soluções Implementadas

### 1. **Arquivos Criados:**

#### `/supabase/diagnostico_auth.sql`
Script para diagnosticar problemas no banco. Execute no SQL Editor para ver:
- Se o enum existe
- Estrutura da tabela
- Trigger configurado
- Políticas RLS
- Usuários sem perfil
- Incompatibilidades entre `auth.users.raw_user_meta_data` e `user_profiles`

#### `/supabase/migrations/20260119_fix_recruiter_auth_complete.sql`
Migration completa que:
- ✅ Adiciona coluna `email` se não existir
- ✅ Atualiza trigger para salvar email e fazer `UPSERT` real
- ✅ Corrige perfis existentes baseado em `raw_user_meta_data`
- ✅ Cria políticas RLS corretas
- ✅ Cria funções auxiliares (`is_recruiter`, `get_user_type`)
- ✅ Gera relatório de verificação

### 2. **Código Atualizado:**

#### `/apps/web/src/middleware.ts`
- ✅ Agora usa `user_metadata` como fallback
- ✅ Logs para debug
- ✅ Não redireciona para `/candidate` se não souber o tipo

#### `/apps/web/src/app/(auth)/login/page.tsx`
- ✅ Busca `user_type` de múltiplas fontes (profile → metadata)
- ✅ Cria perfil se não existir
- ✅ Relê perfil após criar
- ✅ Logs detalhados para debug

#### `/apps/web/src/app/(auth)/register/page.tsx`
- ✅ Logs de debug ao registrar

## 📝 Como Aplicar as Correções

### Passo 1: Diagnóstico (Opcional mas Recomendado)

No **Supabase Dashboard** → **SQL Editor**:

```bash
# Cole o conteúdo de:
supabase/diagnostico_auth.sql
```

Execute e analise os resultados. Procure por:
- ⚠️ Usuários sem perfil
- ⚠️ Perfis com `user_type` = NULL
- ⚠️ Incompatibilidades entre metadata e profile

### Passo 2: Aplicar Migration

No **Supabase Dashboard** → **SQL Editor**:

```bash
# Cole o conteúdo de:
supabase/migrations/20260119_fix_recruiter_auth_complete.sql
```

Execute. Você verá mensagens de NOTICE com:
- Total de usuários
- Usuários com/sem perfil
- Quantidade de recrutadores e candidatos

### Passo 3: Verificar Usuário Específico

```sql
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'user_type' as metadata_type,
  up.user_type as profile_type,
  up.email as profile_email
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'frpdias@icloud.com';
```

### Passo 4: Corrigir Manualmente se Necessário

Se o usuário `frpdias@icloud.com` ainda estiver com `user_type` errado:

```sql
-- Opção 1: Atualizar baseado em metadata
UPDATE user_profiles up
SET user_type = (au.raw_user_meta_data->>'user_type')::user_type
FROM auth.users au
WHERE up.id = au.id AND au.email = 'frpdias@icloud.com';

-- Opção 2: Forçar para recruiter
UPDATE user_profiles
SET user_type = 'recruiter'
WHERE id = (SELECT id FROM auth.users WHERE email = 'frpdias@icloud.com');

-- Opção 3: Deletar e recriar (trigger vai criar correto)
DELETE FROM user_profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'frpdias@icloud.com');

-- Depois faça logout e login novamente
```

### Passo 5: Limpar Cache do Navegador

1. **F12** → **Application** → **Storage** → **Clear site data**
2. Ou use **modo anônito**
3. Faça logout e login novamente

### Passo 6: Verificar Logs

Após login, abra **F12** → **Console** e procure:

```
[MIDDLEWARE] User: frpdias@icloud.com | Profile user_type: recruiter | ...
👤 User data: { id: ..., email: ..., user_metadata: { user_type: 'recruiter' } }
📋 User profile encontrado: { user_type: 'recruiter', ... }
📌 User type FINAL detectado: recruiter
✅✅✅ Recrutador/Admin confirmado - redirecionando para /dashboard
```

## 🎯 Checklist de Verificação

- [ ] Migration aplicada com sucesso
- [ ] Relatório mostra usuários com perfil criado
- [ ] Coluna `email` existe em `user_profiles`
- [ ] Trigger `on_auth_user_created` existe e está ativo
- [ ] Políticas RLS criadas (5 políticas)
- [ ] Funções `is_recruiter` e `get_user_type` criadas
- [ ] Usuário `frpdias@icloud.com` tem `user_type = 'recruiter'`
- [ ] Middleware redireciona recrutador para `/dashboard`
- [ ] Login redireciona recrutador para `/dashboard`

## 🚨 Se Ainda Não Funcionar

1. **Delete o usuário e recrie:**
```sql
-- No Supabase SQL Editor
DELETE FROM auth.users WHERE email = 'frpdias@icloud.com';
```

2. **Registre novamente** em modo anônimo

3. **Verifique os logs** no console

4. **Envie os logs** para análise:
   - Mensagens do `[MIDDLEWARE]`
   - Mensagens do `📌 User type FINAL detectado`
   - Erros no console (se houver)

## 📞 Suporte

Se o problema persistir, forneça:
1. Resultado do script `diagnostico_auth.sql`
2. Logs do console do navegador (F12)
3. Query: `SELECT * FROM user_profiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'frpdias@icloud.com')`
