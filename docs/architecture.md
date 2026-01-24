# Arquitetura (canonica)

## Visão geral
- Frontend: Next.js 15 (App Router) em `apps/web`, com portais Admin, Recrutador e Candidato, SSR + client components, e endpoints internos em `/api/*` para funcoes administrativas.
- Backend: NestJS 11 em `apps/api`, expondo API REST `/api/v1/*` para dominios (organizations, jobs, candidates, applications, assessments, reports).
- Banco: Supabase (Postgres) com RLS habilitado por padrao; Auth via Supabase (JWT); storage para arquivos (curriculos, videos).
- Observabilidade e seguranca: audit_logs, security_events, user_activity e funcoes de metricas/checagens no banco.
- Infra: Vercel para web e API (monorepo); Node >= 20; Supabase gerencia DB/Auth/Storage.

## Componentes
- `apps/web`:
  - App Router com grupos `(auth)`, `(admin)`, `(dashboard)` e `(candidate)`.
  - Rota publica `/invite/[token]` para cadastro de candidato via link.
  - Endpoints internos em `/api/admin/*` para seguranca, auditoria e configuracoes.
  - Auth com `@supabase/ssr` (cookies e middleware).
- `apps/api`:
  - API REST `/api/v1/*` (NestJS) para dominios de negocio e integracoes.
  - Swagger em `/docs` no ambiente local.

## Contratos de API (atual)
- `POST /api/v1/auth/*` (auth delegada ao Supabase)
- `GET|POST /api/v1/organizations`
- `GET|POST|PATCH /api/v1/jobs`
- `GET|POST /api/v1/candidates`
- `GET|POST /api/v1/applications`
- `GET|POST /api/v1/assessments`
- `GET /api/v1/reports/*`
- `POST /api/v1/invite-links` (criar link publico do recrutador)
- `GET /api/v1/invite-links/:token` (validar token)

## Banco de dados e RLS
- Postgres com RLS habilitado em tabelas criticas (ex.: `audit_logs`, `security_events`, `system_settings`, `user_activity`).
- `system_settings` centraliza configuracoes; funcoes `get_setting` e `set_setting` para leitura/atualizacao.
- Politicas RLS por `user_profiles.user_type` e vinculo tenant/org.
- Multi-tenant: cada recrutador mapeia para um tenant/empresa; candidatos e aplicacoes isolados por `tenant_id`.

## Auth e autorizacao
- Supabase Auth como fonte de identidade.
- `user_profiles.user_type` define papeis (admin, recruiter, candidate).
- Middleware no web aplica redirecionamento e protecao de rotas.
- API valida JWT e escopo por organizacao/tenant.

## Fluxo de convite (recrutador -> candidato)
1) Recrutador cria um link publico com token unico.
2) Candidato acessa `https://app.com/invite/<token>`.
3) Frontend valida token e recebe `tenant_id`.
4) Cadastro do candidato grava `tenant_id` e vincula ao recrutador.
5) RLS garante isolamento entre tenants.

## Infra e deploy
- Vercel para `apps/web` e `apps/api`.
- Variaveis essenciais: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_API_URL`.
- Migrations em `supabase/migrations` aplicadas no Supabase SQL Editor.

## Notas de segurança e multi-tenant
- RLS obrigatório em todas as tabelas; policies por tenant/org e por papel.
- Sempre filtrar por `org_id`/`tenant_id` no backend; evitar confiar no client.
- JWT deve carregar tenant/org ativo; rotas validam membership.
- Buckets com prefixo por `org_id/` para isolar arquivos.

## Checklist de pre-implantacao (resumo)
- Fluxos criticos validados (login, cadastro, acao principal, logout).
- RLS e policies revisadas por papel.
- Variaveis de ambiente completas em prod.
- Endpoints criticos retornando 200.
- Teste de vazamento de dados entre tenants.
