# Arquitetura Canônica — TalentForge

## 1) Stack e módulos (imutável)
- **Frontend**: Next.js 15 + React 19 + Tailwind 4 + Zustand + @dnd-kit (App Router).
- **Backend**: NestJS 11 (BFF + serviços de domínio) com Supabase JS e Swagger.
- **Banco**: Supabase Postgres + Auth + Storage, com **RLS obrigatório**.
- **Infra**: Vercel (web/api) + Supabase (DB/Auth/Storage).

## 2) Padrões essenciais (não desviar)
- **Multi-tenant**: `organizations` + `org_members`.
- **Escopo por organização**: `x-org-id` no backend + verificação de membership.
- **RLS em todas as tabelas**; filtros sempre com `org_id`/`owner_org_id`.
- **Função de membership**: `is_org_member` é `SECURITY DEFINER` com `row_security = off` para evitar recursão.
- **Auditoria/tempo**: `created_at` e `updated_at` com trigger.
- **Assessments**: DISC como padrão principal; convites por token.
- **Histórico**: `application_events` registra movimentações de etapas.

## 3) Schema canônico (tabelas oficiais)

### Core ATS / Multi-tenant
- `organizations`
- `org_members`
- `candidates`
- `jobs`
- `pipeline_stages`
- `applications`
- `application_events`
- `candidate_notes`

**Observação (candidate_notes)**
- Colunas oficiais: `candidate_id`, `author_id`, `note`, `created_at`.

### Perfil do candidato (portal)
- `candidate_profiles`
- `candidate_education`
- `candidate_experience`

**Observação (criação do perfil)**
- `candidate_profiles` é criado **somente no onboarding** do candidato.
- O cadastro inicial cria apenas `auth.users` + `user_profiles`.

### Assessments (DISC)
- `assessments`
- `disc_assessments`
- `disc_questions`
- `disc_responses`
- `assessment_invitations`

### Assessments adicionais (se habilitados)
- **Cores**: `color_questions`, `color_assessments`, `color_responses`
- **PI**: `pi_assessments`, `pi_descriptors`, `pi_situational_questions`, `pi_descriptor_responses`, `pi_situational_responses`

### Referências
- `ref_cbo` (FTS + RPC `search_cbo`)

## 4) Tabelas legadas (não usar)
- `candidate_applications_view`
- `candidate_saved_jobs`
- `invitations`
- enum `assessment_kind`

## 4.1) Tabelas obrigatórias de identidade
- `user_profiles` (perfil de autenticação e metadados do usuário)
## 5) Fluxos principais (resumo)
- **Auth**: Supabase Auth → trigger `handle_new_user` → `user_profiles`.
- **Cadastro candidato**: criar conta → onboarding → `candidate_profiles` + `candidate_education` + `candidate_experience`.
- **ATS**: vagas → pipeline → candidaturas → eventos.
- **Assessments**: convites → respostas → resultados DISC.

## 6) RLS e permissões mínimas
- Candidato pode **inserir** seus `assessments` quando `candidate_user_id = auth.uid()`.
- `candidate_education` e `candidate_experience` permitem CRUD quando `candidate_profile_id` pertence ao `auth.uid()`.

## 7) Regras de evolução
- Não introduzir novos módulos fora desta arquitetura sem revisão.
- Todo novo recurso deve respeitar **RLS** e **escopo de organização**.
- Manter compatibilidade com o frontend App Router.
