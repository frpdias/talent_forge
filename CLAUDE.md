# TalentForge — Contexto para Claude Code

## Fonte da Verdade
**SEMPRE leia `docs/ARQUITETURA_CANONICA.md` antes de qualquer alteração.**
Score de conformidade atual: ✅ 100% (Sprint 16 + MCP v1.0)

## Stack
- **Frontend**: Next.js 15.5.x + React 18 + Tailwind CSS 4 (CSS-first) + Supabase JS
  - ⚠️ Next.js 16 é INCOMPATÍVEL (requer React 19). Não usar.
  - ⚠️ `eslint-config-next` DEVE ser versão igual ao `next` (ex: `15.5.9`)
  - ⚠️ `@types/react` e `@types/react-dom` DEVEM ser `^18` (não `^19`)
- **Backend**: NestJS 11 (apps/api) — instável em produção, frontend conecta direto ao Supabase
- **Banco**: Supabase Postgres + RLS obrigatório em TODAS as tabelas
- **MCP**: `@talentforge/mcp` em `packages/mcp/` — 10 tools via stdio
- **Deploy**: Vercel (web: https://web-eight-rho-84.vercel.app)

## Regras Críticas (resumo)
1. Nunca alterar estrutura de pastas sem aprovação
2. RLS em todas as tabelas novas
3. Migration SQL para qualquer mudança de schema
4. Atualizar `docs/ARQUITETURA_CANONICA.md` após mudanças arquiteturais
5. `applications` não tem `org_id` — acessar sempre via `jobs!inner(org_id)`
6. Commits semânticos em pt-BR: `feat(escopo): descrição imperativa`

## Paths Importantes
- Canonical: `docs/ARQUITETURA_CANONICA.md`
- Frontend recruiter: `apps/web/src/app/(recruiter)/`
- Frontend admin: `apps/web/src/app/(admin)/admin/`
- PHP module: `apps/web/src/app/(recruiter)/php/`
- API NestJS: `apps/api/src/`
- MCP server: `packages/mcp/src/server.ts`
- Design System: globals.css + Tailwind 4 CSS-first

## Design System (nunca alterar)
- Primary: `#141042` (roxo escuro)
- Secondary: `#10B981` (verde)
- Accent: `#3B82F6` (azul)
- Cards: `rounded-xl shadow-sm hover:shadow-md`

## Multi-tenant
- `organizations` + `org_members` (root do tenant)
- `is_org_member()` = SECURITY DEFINER (não alterar)
- Headers obrigatórios: `Authorization: Bearer <JWT>` + `x-org-id: <UUID>`

## MCP
- Build: `npm run build:mcp` (esbuild, ~10ms)
- Start: `packages/mcp/start.sh` (auto-sourcia apps/api/.env)
- Inspect: `npm run mcp:inspect`

## Módulo PHP (premium — Fartech only)
Guarda: `PhpModuleGuard` | 3 pilares: TFCI (30%) + NR-1 (40%) + COPC (30%)
Tabelas: `php_integrated_scores`, `tfci_cycles`, `tfci_assessments`, `nr1_risk_assessments`, `copc_*`

## Backlog Prioritário
- [x] Gráficos de tendência COPC (recharts instalado) — `/php/copc/trends` linkado
- [x] PDF de compliance NR-1 — `Nr1CompliancePDF.tsx` ativo em `/php/nr1`
- [x] NestJS API: startup silencioso (escuta em 127.0.0.1, não expõe porta)

## Dev Local — Troubleshooting Rápido
- **NUNCA** colocar `VERCEL_OIDC_TOKEN` em `.env.local` (causa hang do servidor)
- **NUNCA** adicionar `next` como dependência no `package.json` raiz (conflito de versão)
- Se `node_modules` corrompido: `rm -rf node_modules */*/node_modules package-lock.json && npm cache clean --force && npm install`
- Se servidor não responde: `rm -rf apps/web/.next` e reiniciar
- Primeira compilação Turbopack demora 60-120s (normal)
- Detalhes completos: `docs/ARQUITETURA_CANONICA.md` seção "Troubleshooting"

## ⚠️ Localização do Projeto (CRÍTICO)
- **Path correto**: `~/dev/talent_forge` (`/Users/fernandodias/dev/talent_forge`)
- **NUNCA usar**: `~/Desktop/PROJETO_TALENT_FORGE` — está no iCloud Drive e corrompe o `.git`
- **Causa raiz do problema de git**: Desktop sincronizado pelo iCloud cria arquivos duplicados (`HEAD 2`, `config 2`) e faz `git commit/status/read-tree` travarem indefinidamente
- **Config do git local já aplicada** (não reverter):
  - `commit.template = ""` → sobrescreve template do Sourcetree que causava hang
  - `core.editor = true` → editor não-interativo (nunca abre prompt de editor)
  - `commit.gpgsign = false` → sem assinatura GPG
