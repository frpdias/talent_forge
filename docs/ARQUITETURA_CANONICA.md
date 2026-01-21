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

### Perfil do candidato (portal)
- `candidate_profiles`
- `candidate_education`
- `candidate_experience`

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
- `user_profiles`
- `candidate_applications_view`
- `candidate_saved_jobs`
- `invitations`
- enum `assessment_kind`

## 5) Fluxos principais (resumo)
- **Auth**: Supabase Auth → JWT → backend valida membership.
- **ATS**: vagas → pipeline → candidaturas → eventos.
- **Assessments**: convites → respostas → resultados DISC.

## 6) Regras de evolução
- Não introduzir novos módulos fora desta arquitetura sem revisão.
- Todo novo recurso deve respeitar **RLS** e **escopo de organização**.
- Manter compatibilidade com o frontend App Router.
