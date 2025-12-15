# 📊 Mapeamento Completo de Tabelas - TalentForge

## Tabelas da Aplicação (UTILIZADAS)

### **Tier 1: Autenticação e Organização**

| Tabela | Propósito | Campos Principais | Status | Utilização |
|--------|-----------|------------------|--------|-----------|
| `auth.users` | Usuários Supabase nativos | email, password, id | ✅ Criada | Login, autenticação |
| `organizations` | Empresas/headhunters | name, org_type, slug | ✅ Criada | Contexto de trabalho |
| `org_members` | Membros da organização | org_id, user_id, role | ✅ Criada | Controle de acesso |

### **Tier 2: Candidatos e Vagas**

| Tabela | Propósito | Campos Principais | Status | Utilização |
|--------|-----------|------------------|--------|-----------|
| `candidates` | Base de candidatos | full_name, email, phone, location | ✅ Criada | Banco de candidatos |
| `candidate_profiles` | Perfil completo candidato | user_id, full_name, cpf, email, phone, onboarding_completed | ✅ Criada | **Dados de candidato logado** |
| `jobs` | Vagas abertas | title, description, location, salary | ✅ Criada | Listagem de oportunidades |
| `pipeline_stages` | Etapas do pipeline | job_id, name, position | ✅ Criada | Controle de processo |
| `applications` | Candidaturas | job_id, candidate_id, status, score | ✅ Criada | Rastreamento de candidatos |

### **Tier 3: Assessments (DISC)**

| Tabela | Propósito | Campos Principais | Status | Utilização |
|--------|-----------|------------------|--------|-----------|
| `assessments` | Registro principal de teste | candidate_id, assessment_type, status, started_at, completed_at | ✅ Criada | Histórico de avaliações |
| `disc_assessments` | Resultados DISC específicos | assessment_id, dominance_score, influence_score, steadiness_score, conscientiousness_score | ✅ Criada | **Resultados D/I/S/C** |
| `disc_questions` | Perguntas do teste DISC | question_number, description, option_d, option_i, option_s, option_c | ✅ Criada | **24 perguntas seeded** |
| `disc_responses` | Respostas do candidato | assessment_id, question_id, selected_option | ✅ Criada | Armazenar respostas |
| `assessment_invitations` | Convites para teste | assessment_id, token, invited_to_email, token_expires_at | ✅ Criada | Enviar convites |

---

## ⚠️ Tabelas NÃO UTILIZADAS (Remover)

| Tabela | Motivo | Recomendação |
|--------|--------|--------------|
| `user_profiles` | ❌ Conflita com `candidate_profiles` | **DELETAR** |
| `candidate_applications_view` | ❌ Não usada no frontend | **DELETAR** |
| `candidate_saved_jobs` | ❌ Feature não foi implementada | **REMOVER** |
| `invitations` | ⚠️ Substituída por `assessment_invitations` | **DELETAR** |
| `assessment_kind` (enum) | ❌ Não usada (temos `assessment_type`) | **REMOVER** |
| `application_events` | ❌ Não usada no frontend | **REMOVER** |

---

## 📋 Tabelas OBRIGATÓRIAS (Usar em Migration)

Essas são as ÚNICAS que você precisa executar em uma migration limpa:

### Migration Final (20241213_assessment_system_disc.sql)

Inclui:
- ✅ `assessments`
- ✅ `disc_assessments`
- ✅ `disc_questions` (com 24 perguntas seeded)
- ✅ `disc_responses`
- ✅ `assessment_invitations`
- ✅ RLS policies completas
- ✅ Triggers para `updated_at`

### Dependências já existentes (não criar novamente):
- ✅ `auth.users` (Supabase nativa)
- ✅ `organizations` (20241211_init_schema.sql)
- ✅ `org_members` (20241211_init_schema.sql)
- ✅ `candidates` (20241211_init_schema.sql)
- ✅ `candidate_profiles` (20241212_candidate_profiles.sql)
- ✅ `jobs` (20241211_init_schema.sql)

---

## 🔧 Limpeza Necessária

Para ter um banco de dados limpo e funcional:

```sql
-- DELETAR estas tabelas (geradas por erro):
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS candidate_applications_view CASCADE;
DROP TABLE IF EXISTS candidate_saved_jobs CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS application_events CASCADE;

-- REMOVER este enum (não usado):
DROP TYPE IF EXISTS assessment_kind CASCADE;
```

---

## ✅ Fluxo de Dados Correto

```
Login
  ↓
auth.users → candidate_profiles (onboarding_completed)
  ↓
/candidate → /disc (teste DISC)
  ↓
assessments → disc_assessments (scores)
disc_responses (respostas)
  ↓
/disc-results/[id] (visualizar resultados)
  ↓
Recruiter vê em /dashboard/assessments
```

---

## 📊 Relacionamentos de Chaves Estrangeiras

```
organizations
    ├── org_members (org_id)
    ├── candidates (owner_org_id)
    ├── jobs (org_id)
    └── assessment_invitations (via candidates)

candidates
    ├── candidate_profiles (via email/user_id)
    ├── applications (candidate_id)
    └── assessments (candidate_id)

assessments
    ├── disc_assessments (assessment_id) [1:1]
    ├── disc_responses (assessment_id)
    ├── assessment_invitations (assessment_id)
    └── candidate_id → candidates

disc_responses
    └── disc_questions (question_id)

auth.users
    ├── candidate_profiles (id)
    ├── org_members (user_id)
    └── assessments (candidate_user_id)
```

---

## 🎯 Próximos Passos

1. **DELETAR** tabelas não utilizadas
2. **EXECUTAR** apenas `20241213_assessment_system_disc.sql`
3. **VERIFICAR** que as 24 perguntas foram seeded em `disc_questions`
4. **VALIDAR** RLS policies
5. **TESTAR** fluxo completo

---

**Última atualização:** 13/12/2025  
**Status:** Pronto para limpeza do banco
