# 🚀 Instruções de Migração - TALENTFORGE para Novo Supabase

## 📋 Pré-requisitos

- Conta Supabase ativa
- Acesso ao Dashboard do Supabase
- Acesso ao projeto TALENTFORGE localmente

---

## 🎯 Passo a Passo da Migração

### **1. Criar Novo Projeto no Supabase**

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Clique em "New Project"
3. Preencha:
   - **Name**: TalentForge (ou nome de sua preferência)
   - **Database Password**: Crie uma senha forte e **ANOTE**
   - **Region**: Escolha a região mais próxima dos seus usuários
   - **Pricing Plan**: Escolha o plano adequado
4. Clique em "Create new project"
5. Aguarde a criação do projeto (~2 minutos)

---

### **2. Executar Script de Setup do Banco de Dados**

1. No dashboard do Supabase, vá em: **SQL Editor** (menu lateral esquerdo)
2. Clique em **"New Query"**
3. Abra o arquivo: `supabase/SETUP_COMPLETO_SUPABASE.sql`
4. **Copie TODO o conteúdo** do arquivo
5. **Cole** no editor SQL do Supabase
6. Clique em **"Run"** (ou pressione `Ctrl/Cmd + Enter`)
7. Aguarde a execução (~30 segundos)
8. Verifique se apareceu: **"Success. No rows returned"** ✅

---

### **3. Executar Script de Seed Data**

1. Ainda no **SQL Editor**, clique em **"New Query"** novamente
2. Abra o arquivo: `supabase/SEED_DATA.sql`
3. **Copie TODO o conteúdo** do arquivo
4. **Cole** no editor SQL do Supabase
5. Clique em **"Run"**
6. Aguarde a execução (~10 segundos)
7. Verifique se as perguntas foram inseridas:
   - 24 perguntas DISC
   - 80 perguntas Color Test ✅

---

### **4. Verificar a Estrutura Criada**

No dashboard do Supabase, acesse **"Table Editor"** e confirme que as seguintes tabelas foram criadas:

#### **Tabelas Principais:**
- ✅ `user_profiles` - Perfis de usuários
- ✅ `organizations` - Organizações
- ✅ `organization_members` - Membros das organizações
- ✅ `candidates` - Candidatos
- ✅ `jobs` - Vagas
- ✅ `applications` - Candidaturas

#### **Tabelas de Assessments:**
- ✅ `assessments` - Assessments gerais
- ✅ `disc_questions` - Perguntas DISC (24)
- ✅ `disc_responses` - Respostas DISC
- ✅ `disc_results` - Resultados DISC
- ✅ `color_questions` - Perguntas Color Test (80)
- ✅ `color_responses` - Respostas Color Test
- ✅ `color_results` - Resultados Color Test
- ✅ `pi_descriptors` - Descritores PI
- ✅ `pi_situational_questions` - Perguntas Situacionais PI
- ✅ `pi_responses` - Respostas PI
- ✅ `pi_results` - Resultados PI

#### **Tabelas de Relatórios:**
- ✅ `reports` - Relatórios consolidados
- ✅ `report_shares` - Compartilhamentos de relatórios

---

### **5. Configurar Autenticação**

1. No dashboard, vá em: **Authentication** > **Providers**
2. Configure os providers desejados:
   - **Email**: Já vem habilitado por padrão ✅
   - **Google/GitHub** (opcional): Configure se necessário

3. Em **Authentication** > **URL Configuration**:
   - **Site URL**: `http://localhost:3000` (desenvolvimento)
   - **Redirect URLs**: Adicione:
     ```
     http://localhost:3000/auth/callback
     http://localhost:3000
     ```

---

### **6. Obter Credenciais do Novo Projeto**

1. No dashboard, vá em: **Project Settings** > **API**
2. **Copie e ANOTE** as seguintes informações:

```
Project URL: https://[seu-projeto].supabase.co
anon public key: eyJhbGc...
service_role key: eyJhbGc...
```

---

### **7. Atualizar Variáveis de Ambiente**

#### **No Backend (apps/api/.env):**

Crie ou edite o arquivo `.env`:

```bash
# Supabase Configuration
SUPABASE_URL=https://[seu-projeto].supabase.co
SUPABASE_KEY=[sua-anon-public-key]
SUPABASE_SERVICE_ROLE_KEY=[sua-service-role-key]

# JWT Configuration
JWT_SECRET=[gere-um-secret-forte]
JWT_EXPIRES_IN=7d

# Application
PORT=3001
NODE_ENV=development
```

#### **No Frontend (apps/web/.env.local):**

Crie ou edite o arquivo `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[seu-projeto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[sua-anon-public-key]

# Application
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

### **8. Testar a Aplicação**

1. **Inicie o Backend:**
   ```bash
   cd apps/api
   npm run start:dev
   ```

2. **Inicie o Frontend:**
   ```bash
   cd apps/web
   npm run dev
   ```

3. **Teste o Registro:**
   - Acesse: `http://localhost:3000/register`
   - Crie um novo usuário
   - Verifique se o perfil foi criado automaticamente em `user_profiles`

4. **Teste o Login:**
   - Acesse: `http://localhost:3000/login`
   - Faça login com o usuário criado

---

## 🔍 Verificações Importantes

### **No SQL Editor, execute:**

```sql
-- Verificar se as questions foram inseridas
SELECT COUNT(*) FROM disc_questions;
-- Deve retornar: 24

SELECT COUNT(*) FROM color_questions;
-- Deve retornar: 80

-- Verificar triggers
SELECT trigger_name FROM information_schema.triggers;

-- Verificar funções
SELECT routine_name FROM information_schema.routines 
WHERE routine_type = 'FUNCTION';

-- Verificar policies RLS
SELECT tablename, policyname FROM pg_policies;
```

---

## 📝 Notas Importantes

### **Segurança:**
- ✅ Todas as tabelas possuem **Row Level Security (RLS)** habilitada
- ✅ Policies configuradas para multi-tenancy (organizações)
- ✅ Triggers automáticos para `created_at` e `updated_at`
- ✅ Função automática para criar `user_profiles` na primeira autenticação

### **Dados de Teste:**
- 24 perguntas DISC prontas para uso
- 80 perguntas Color Test prontas para uso
- PI Assessment precisa de setup adicional (opcional)

### **Backups:**
- Recomenda-se configurar backups automáticos no Supabase
- Vá em **Project Settings** > **Database** > **Backups**

---

## 🐛 Troubleshooting

### **Erro: "permission denied for table"**
- Verifique se executou o `SETUP_COMPLETO_SUPABASE.sql` completamente
- Verifique se as policies RLS foram criadas

### **Erro: "insert or update violates foreign key constraint"**
- Execute o `SEED_DATA.sql` novamente
- Verifique se as tabelas de referência existem

### **Erro de autenticação no app:**
- Verifique se as variáveis de ambiente estão corretas
- Confirme que copiou a `anon public key` correta
- Verifique se o `NEXT_PUBLIC_SUPABASE_URL` não tem barra no final

### **User profiles não são criados automaticamente:**
- Verifique se o trigger `on_auth_user_created` existe:
  ```sql
  SELECT * FROM information_schema.triggers 
  WHERE trigger_name = 'on_auth_user_created';
  ```

---

## 🎉 Migração Completa!

Seu projeto **TALENTFORGE** está pronto para uso no novo Supabase!

### **Próximos Passos:**
1. ✅ Criar usuários de teste
2. ✅ Criar organizações
3. ✅ Testar os assessments (DISC, Color Test)
4. ✅ Configurar domínio personalizado (produção)
5. ✅ Configurar SMTP para emails (opcional)

---

## 📞 Suporte

Em caso de dúvidas:
- Documentação Supabase: [https://supabase.com/docs](https://supabase.com/docs)
- Documentação TalentForge: Ver `docs/` no repositório
