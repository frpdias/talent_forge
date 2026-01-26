# Instruções para agentes (TalentForge)

## Fonte da verdade (arquitetura canônica)
- A referência oficial é [docs/ARQUITETURA_CANONICA.md](docs/ARQUITETURA_CANONICA.md); siga o esqueleto de pastas e as regras críticas antes de alterar qualquer coisa.
- Estrutura fixa: Web em [apps/web](apps/web) (Next.js App Router) e API em [apps/api](apps/api) (NestJS). Não mover/renomear pastas.
- Web usa grupos de rotas como (admin), (recruiter), (candidate), (public) e endpoints internos em /api/admin/* (ex.: [apps/web/src/app/api/admin/create-user/route.ts](apps/web/src/app/api/admin/create-user/route.ts)).
- API expõe REST em /api/v1 para domínios (organizations, jobs, candidates, applications, assessments, reports). Contratos em [docs/api.md](docs/api.md).

## Dados, segurança e multi-tenant
- Auth via Supabase JWT; rotas autenticadas exigem `Authorization: Bearer` + `x-org-id` (ver [docs/auth.md](docs/auth.md)).
- Sempre filtrar por `org_id`/`tenant_id` no backend; RLS é obrigatório por tabela.
- Exceção atual: RLS em `organizations` está desabilitado e tem TODO crítico para reativação (ver seção “Regras de Segurança” em [docs/ARQUITETURA_CANONICA.md](docs/ARQUITETURA_CANONICA.md)).
- Storage: buckets `cv` e `videos` com prefixo `org_id/...` (ver [supabase/README.md](supabase/README.md)).

## Migrations e validação
- Mudança de schema exige migration em [supabase/migrations](supabase/migrations) (padrão `YYYYMMDD_description.sql`).
- Após migrations, executar validação em [supabase/VALIDATE_IMPROVEMENTS.sql](supabase/VALIDATE_IMPROVEMENTS.sql).

## Workflows de desenvolvimento
- Dev monorepo: `npm run dev` (API + Web).
- Web: `npm run dev -w tf-web` (porta 3000). API: `npm run start:dev -w tf-api` (porta 3001, Swagger em /docs).
- Build/Lint/Test: `npm run build`, `npm run lint`, `npm run test` (API) — scripts em [package.json](package.json).

## Convenções do projeto
- Nomes: pastas em `kebab-case`, componentes React `PascalCase.tsx`, migrations `YYYYMMDD_*` (ver “Convenções” em [docs/ARQUITETURA_CANONICA.md](docs/ARQUITETURA_CANONICA.md)).
- Tipos compartilhados devem viver em [packages/types](packages/types).
- Web usa `@supabase/ssr` com cookies/middleware para auth SSR (ver [docs/architecture.md](docs/architecture.md)).

## Referências rápidas
- Arquitetura canônica: [docs/ARQUITETURA_CANONICA.md](docs/ARQUITETURA_CANONICA.md)
- Contratos da API: [docs/api.md](docs/api.md)
- Auth/tenant: [docs/auth.md](docs/auth.md)
- Deploy: [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md)
