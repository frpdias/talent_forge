# Copilot Instructions — Talent Forge

## 🔐 Canonical Architecture is the Source of Truth (MANDATORY)
- Before ANY action (code, schema, endpoint, component, migration), **consult the Canonical Architecture**.
- Source of truth: `docs/ARQUITETURA_CANONICA.md`.
- The code MUST converge to the architecture — never the opposite.
- If a change impacts architecture, **update the canonical doc first**, then implement.
- If something is unclear or divergent, STOP and propose an update to the canonical architecture.

## 🧭 Big Picture (why the system is structured this way)
- Talent Forge is a **multi-tenant SaaS** with strict isolation by organization.
- Core separation:
	- `account` → who operates/contracts (admins, recruiters, Fartech)
	- `organization` → company being evaluated (root tenant entity)
- All business data belongs to an `organization`.
- No shortcuts: many tables DO NOT have `org_id` and must resolve it via joins (e.g. applications → jobs → organizations).

## 🧩 Core Modules & Ownership
- **Recruiter Module**: multi-org operation, jobs, candidates, pipeline, reports.
- **Gestor Module**: organization view (teams, members, organogram, goals, results).
- **PHP Module (People, Health & Performance)**:
	- Integrates TFCI (30%) + NR-1 (40%) + COPC Adapted (30).
	- Activation is per-organization and Fartech-admin controlled.
	- Protected by `PhpModuleGuard`.

## 🗄️ Data & Security Rules (NON-NEGOTIABLE)
- RLS is mandatory on ALL tables and views.
- Never bypass RLS except in approved migrations.
- `is_org_member()` is the single source of truth for membership checks — NEVER modify lightly.
- `service_role` is backend-only (admin ops, migrations, batch jobs).
- Headers required on protected routes:
	- `Authorization: Bearer <JWT>`
	- `x-org-id: <UUID>`

## 📁 Project Structure (DO NOT CHANGE)
- Monorepo layout is fixed:
	- `apps/api` → NestJS 11 (BFF + domain services)
	- `apps/web` → Next.js 15 App Router
	- `supabase/migrations` → canonical DB evolution
	- `docs/*` → architectural and decision records
- Never create files or folders outside the defined structure.

## 🧠 Schema Navigation (critical patterns)
- Tables WITH `org_id`: `organizations`, `org_members`, `jobs`, `teams`, PHP tables.
- Tables WITHOUT `org_id` (resolve via joins):
	- `applications`, `assessments`, `application_events`, `pipeline_stages`
- Always resolve organization scope correctly before querying or applying RLS logic.

## 🚀 Development Workflow (expected by the project)
- Dev:
	- `npm run dev` → api + web
	- `npm run dev:api` → API only (3001)
	- `npm run dev:web` → Web only (3000)
- Schema changes:
	- Create migration in `supabase/migrations/YYYYMMDD_description.sql`
	- Apply and run `VALIDATE_IMPROVEMENTS.sql`
- Pre-merge checks:
	- `npm run build`
	- `npm run lint`
	- `npm run type-check`

## 🎨 UI & Conventions
- Follow `docs/design-system.md` strictly (colors, typography, components).
- Next.js App Router patterns only (`app/`, `layout.tsx`, route segments).
- Components: PascalCase; utilities: camelCase; DB objects: snake_case.

## 🧪 Tests & Validation
- PHP Module must pass:
	- `scripts/test-php-module.js`
	- `scripts/test-tfci-e2e.js`
	- `scripts/test-ai-e2e.js`
- Never assume correctness without running or preserving these validations.

## 🛑 Final Rule
- If your change violates ANY rule above, it is incorrect — even if it “works”.
