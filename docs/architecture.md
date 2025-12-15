# Arquitetura (rascunho)

## Visão geral
- Frontend (Next.js ou SvelteKit): SPA/SSR para portal de headhunter e portal da empresa. Comunicação via API REST; futura separação em App Router (Next) ou endpoints (SvelteKit).
- Backend (Node.js: Express ou Nest): camada BFF + serviços de domínio. Auth integrada ao Supabase (JWT). Roteiros: auth, organizações, vagas/pipeline, candidatos, aplicações, avaliações.
- Banco: Supabase (Postgres) com RLS. Buckets para currículos/vídeos. Webhooks para eventos (p.ex. mudança de etapa).
- IA: OpenAI para sumarizações/insights e modelo proprietário (fine-tuning) para teste comportamental. Fase inicial: prompt + scoring simples; fase avançada: embeddings + ajuste fino.
- Infra: Vercel/Fly.io para frontend/backend. Supabase gerencia DB/storage/auth. Observabilidade via logs APM (p.ex. OpenTelemetry) em futuras iterações.

## Contratos iniciais de API (MVP)
- `POST /auth/signup` (delegado ao Supabase)
- `POST /organizations` (cria consultoria/empresa)
- `POST /jobs` / `GET /jobs` / `PATCH /jobs/:id`
- `POST /jobs/:id/stages` / `PATCH /jobs/:id/stages/:stageId`
- `POST /candidates` / `GET /candidates`
- `POST /applications` (candidate → job) / `PATCH /applications/:id/stage` / `GET /applications`
- `POST /assessments` (dispara teste v1) / `GET /assessments/:id`
- `GET /reports/basic` (métricas simples por vaga/pipeline)

## Sequência de bootstrap
1) Escolher frontend (Next vs SvelteKit) e backend (Express vs Nest).  
2) Subir schema `docs/data-model.sql` no Supabase; habilitar RLS e policies por org.  
3) Scaffold backend com autenticação via Supabase JWT e middlewares de escopo por organização.  
4) Scaffold frontend com área do headhunter: criação de vaga, pipeline Kanban, cadastro de candidatos e drag-and-drop de aplicações.  
5) Implementar teste comportamental v1 (questionário curto + scoring) e armazenar em `assessments`.  
6) Relatórios simples (tempo por etapa, conversões).  

## Notas de segurança e multi-tenant
- RLS obrigatório em todas as tabelas; policies baseadas em `org_members`.
- Sempre incluir `org_id`/`owner_org_id` em filtros server-side; evitar confiar no client.
- JWT deve carregar `org_id` ativo; rotas validam se usuário pertence à org.
- Buckets: prefixo por `org_id/` para isolar currículos e vídeos.
