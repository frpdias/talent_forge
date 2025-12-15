# Decisões iniciais

## Stack selecionada
- Frontend: Next.js (App Router) + TypeScript + Tailwind (modo CSR/SSR híbrido). Motivos: DX forte, roteamento file-based, fácil deploy na Vercel, suporte a edge/middleware para org context.
- Backend: NestJS (REST) + TypeScript. Motivos: modularidade, injeção de dependência, pipes/guards para auth/tenant, fácil organizar domínios (organizations, jobs, candidates, assessments).
- Infra: Vercel (frontend) + Fly.io (backend) + Supabase (DB, Auth, Storage). Observabilidade posterior via OpenTelemetry.
- IA: OpenAI API para resumos/insights v1; fine-tuning posteriormente. Pipeline de vídeo/voz fica na etapa 3+.

## Convenções
- Monorepo simples: `/apps/web` (Next) e `/apps/api` (Nest). Shared types em `/packages/types`.
- Auth via Supabase JWT; backend verifica JWT com chave pública e aplica guard multi-tenant.
- Tabelas multi-tenant com `org_id`/`owner_org_id`; RLS obrigatório.
- Storage: prefixo de bucket por `org_id/` para isolar uploads (currículos/vídeos).

## Bootstrap (execução)
1) Criar projeto Supabase e aplicar `docs/data-model.sql` + `docs/rls-policies.sql`.  
2) Scaffold Nest: `nest new apps/api` (ou `npm create @nestjs/cli`). Configurar módulo `SupabaseAuthGuard` (ver doc `docs/auth.md`).  
3) Scaffold Next: `npx create-next-app apps/web --ts --app --eslint --tailwind --src-dir`. Adicionar variáveis Supabase no `.env.local`.  
4) Definir CI simples (lint/test) depois que os apps existirem.  
5) Entregar MVP features: organizations, jobs+stages, candidates, applications Kanban, assessments v1, reports básicos.  
