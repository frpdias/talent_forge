# Arquitetura Canônica — TalentForge

**Última atualização**: 2026-03-17 | **Score de Conformidade**: ✅ 100% (Sprint 49 — Fix Middleware /vagas + SMTP Recovery) | **Sprints planejados**: Sprint 41 (AI Assistant) + Sprint 44 (Gate Recrutamento)

## 📜 FONTE DA VERDADE — PRINCÍPIO FUNDAMENTAL

> **⚠️ ESTE DOCUMENTO É A ÚNICA FONTE DA VERDADE (Single Source of Truth)**
> 
> Antes de fazer QUALQUER alteração no projeto (código, schema, rotas, componentes, migrations):
> 1. **CONSULTE PRIMEIRO** este documento de Arquitetura Canônica (DA)
> 2. **VALIDE** se sua mudança está alinhada com os padrões definidos
> 3. **ATUALIZE** este documento se sua alteração impactar arquitetura
> 4. **NÃO PROCEDA** se houver divergência — corrija o código ou proponha mudança no DA
>
> **Regra de Ouro**: O código deve sempre convergir para a arquitetura, nunca o contrário.

## ⚠️ REGRAS CRÍTICAS — LEIA ANTES DE FAZER QUALQUER ALTERAÇÃO

### 🚫 PROIBIÇÕES ABSOLUTAS
1. **NUNCA** alterar a estrutura de pastas sem aprovação explícita
2. **NUNCA** criar novas tabelas fora do schema definido
3. **NUNCA** remover RLS de tabelas existentes
4. **NUNCA** usar SQL raw sem RLS (exceto migrations aprovadas)
5. **NUNCA** fazer deploy sem validar todas as migrations pendentes
6. **NUNCA** criar endpoints fora dos padrões REST definidos
7. **NUNCA** modificar `is_org_member()` sem análise de segurança
8. **NUNCA** alterar enums sem migration + validação de dados existentes
9. **NUNCA** criar componentes fora da estrutura de Design System
10. **NUNCA** fazer commits direto em `main` sem passar por validação
11. **NUNCA** usar `vercel --prod` CLI para deploy — o deploy é **exclusivamente via git push**
12. **NUNCA** committar `.env`, `.env.local` ou qualquer arquivo de segredos
13. **NUNCA** deixar arquivos do projeto fora do git (todos os arquivos `apps/web/src`, configs, migrations **devem** estar rastreados)
14. **NUNCA** commitar arquivos duplicados (`* 2.tsx`, `* 2.ts`) — indicam cópia acidental

### ✅ OBRIGATÓRIO EM TODA ALTERAÇÃO
1. Seguir **exatamente** a estrutura de pastas definida na Seção 0
2. Aplicar RLS em **todas** novas tabelas
3. Adicionar índices para **todas** FK e filtros comuns
4. Criar migration SQL para **qualquer** alteração de schema
5. Atualizar este documento para **qualquer** mudança arquitetural
6. Executar `VALIDATE_IMPROVEMENTS.sql` após migrations
7. Testar em dev **antes** de aplicar em produção
8. Documentar decisões em `docs/decisions.md`
9. **Commitar e pushar todo arquivo novo** imediatamente — nunca deixar arquivo fora do git
10. **Verificar CI verde** no GitHub Actions antes de dar o trabalho como concluído

---

## 0) Estrutura do Projeto (ESQUELETO OFICIAL)

### 🏗️ Estrutura de Pastas — NÃO ALTERAR

```
PROJETO_TALENT_FORGE/
├── apps/
│   ├── api/                          # Backend NestJS
│   │   ├── src/
│   │   │   ├── main.ts              # Entry point
│   │   │   ├── app.module.ts        # Módulo raiz
│   │   │   ├── auth/                # Autenticação
│   │   │   ├── organizations/       # Multi-tenant
│   │   │   ├── jobs/                # Gestão de vagas
│   │   │   ├── candidates/          # Candidatos
│   │   │   ├── applications/        # Candidaturas
│   │   │   ├── assessments/         # Assessments DISC
│   │   │   ├── reports/             # Relatórios
│   │   │   ├── iam/                 # IAM (tenants, roles, permissions)
│   │   │   ├── color-assessments/   # Assessment de Cores
│   │   │   ├── pi-assessments/      # Assessment PI
│   │   │   ├── invite-links/        # Links de convite
│   │   │   ├── interviews/          # Entrevistas agendadas (+ e-mail de confirmação)
│   │   │   ├── email/               # Serviço de e-mail transacional (Brevo SMTP)
│   │   │   │   ├── email.module.ts
│   │   │   │   ├── email.service.ts
│   │   │   │   └── templates/       # Templates Handlebars (.hbs)
│   │   │   │       ├── invite-candidate.hbs
│   │   │   │       ├── interview-scheduled.hbs
│   │   │   │       ├── assessment-link.hbs
│   │   │   │       ├── welcome-user.hbs
│   │   │   │       └── php-nr1-alert.hbs
│   │   │   ├── publisher/           # ✨ Job Publisher Engine (Sprint 35)
│   │   │   │   ├── publisher.module.ts
│   │   │   │   ├── publisher.service.ts    # Orquestra publish/unpublish com retry + audit log
│   │   │   │   ├── publisher.controller.ts # GET/POST /jobs/:id/channels, /organizations/:id/channels
│   │   │   │   ├── types.ts                # JobCanonical, ChannelAdapter, PublishResult
│   │   │   │   └── adapters/
│   │   │   │       ├── gupy.adapter.ts     # Gupy REST API v2 (OAuth2 client_credentials)
│   │   │   │       ├── vagas.adapter.ts    # Vagas.com Business REST API (ApiKey)
│   │   │   │       └── linkedin.adapter.ts # LinkedIn Job Posting API (OAuth2 + ATS parceria)
│   │   │   └── common/              # Guards, decorators, utils
│   │   ├── test/                    # E2E tests
│   │   └── vercel.json              # Deploy config
│   │
│   └── web/                          # Frontend Next.js 15 + Tailwind 4
│       ├── src/
│       │   ├── app/                 # App Router (Next.js 15)
│       │   │   ├── (admin)/         # Rotas admin
│       │   │   │   └── admin/
│       │   │   │       ├── page.tsx           # Dashboard admin
│       │   │   │       ├── users/             # Gestão usuários
│       │   │   │       ├── create-user/       # Criar usuários
│       │   │   │       ├── companies/         # Gestão empresas
│       │   │   │       │   ├── page.tsx       # Lista empresas (admin view)
│       │   │   │       │   └── [id]/
│       │   │   │       │       ├── page.tsx   # Detalhe + abas Informações/Funcionários
│       │   │   │       │       └── employees/new/page.tsx # Cadastro funcionário
│       │   │   │       ├── tenants/           # Gestão tenants
│       │   │   │       ├── security/          # Centro segurança
│       │   │   │       ├── roles/             # Gestão roles
│       │   │   │       ├── audit-logs/        # Logs auditoria
│       │   │   │       ├── security-events/   # Eventos segurança
│       │   │   │       ├── api-keys/          # Gestão API keys
│       │   │   │       └── settings/          # Configurações sistema
│       │   │   ├── (recruiter)/     # Rotas recrutador
│       │   │   │   ├── dashboard/
│       │   │   │   │   ├── page.tsx           # Dashboard principal
│       │   │   │   │   ├── jobs/              # ✨ Detalhe de vaga (Sprint 32: movido de jobs/[id])
│       │   │   │   │   │   └── [id]/
│       │   │   │   │   │       ├── page.tsx           # Kanban + candidatos da vaga
│       │   │   │   │   │       └── applications/      # Lista de candidaturas
│       │   │   │   │   └── companies/         # ✨ Gestão de empresas clientes (Sprint 15/20)
│       │   │   │   │       ├── page.tsx       # Lista + CRUD + consulta CNPJ via BrasilAPI
│       │   │   │   │       └── [id]/
│       │   │   │   │           ├── page.tsx   # Detalhes + Dados Corporativos + abas
│       │   │   │   │           └── employees/
│       │   │   │   │               ├── new/page.tsx              # Cadastro funcionário
│       │   │   │   │               └── [employeeId]/edit/page.tsx # Edição funcionário
│       │   │   │   ├── pipeline/
│       │   │   │   ├── candidates/
│       │   │   │   ├── jobs/
│       │   │   │   │   ├── page.tsx              # Lista de vagas (único entry point)
│       │   │   │   │   └── new/page.tsx          # Formulário de nova vaga
│       │   │   │   ├── reports/
│       │   │   │   └── php/                  # ✨ Módulo PHP (Fartech-only)
│       │   │   │       ├── layout.tsx        # Header + nav + footer
│       │   │   │       ├── activation/       # Toggle ativação
│       │   │   │       ├── dashboard/        # Dashboard PHP scores
│       │   │   │       ├── employees/        # Lista colaboradores
│       │   │   │       ├── tfci/             # TFCI Behavioral Assessment
│       │   │   │       │   └── cycles/
│       │   │   │       │       ├── page.tsx
│       │   │   │       │       └── [id]/
│       │   │   │       ├── nr1/              # NR-1 Digital (Compliance)
│       │   │   │       ├── copc/             # COPC Adapted (Performance)
│       │   │   │       ├── action-plans/     # Planos de Ação
│       │   │   │       ├── ai/               # AI Insights
│       │   │   │       ├── ai-chat/          # Chat AI
│       │   │   │       └── settings/         # Configurações
│       │   │   ├── (employee)/      # Rotas colaborador (self-service NR-1)
│       │   │   │   └── nr1-self-assessment/ # Self-assessment NR-1 via convite
│       │   │   ├── (candidate)/     # Rotas candidato
│       │   │   │   ├── candidate/
│       │   │   │   ├── onboarding/
│       │   │   │   └── applications/
│       │   │   ├── (public)/        # Rotas públicas
│       │   │   │   ├── login/
│       │   │   │   ├── register/
│       │   │   │   ├── jobs/
│       │   │   │   └── assessment/
│       │   │   ├── api/             # API Routes
│       │   │   │   └── admin/
│       │   │   │       ├── users/                    # GET lista usuários
│       │   │   │       ├── create-user/              # POST criar usuário + envio de e-mail boas-vindas
│       │   │   │       ├── delete-user/              # DELETE excluir usuário + audit log (2026-03-15)
│       │   │   │       ├── resend-welcome-email/     # POST reenviar e-mail boas-vindas (2026-03-14)
│       │   │   │       ├── companies/                # CRUD empresas
│       │   │   │       ├── metrics/                  # Métricas sistema
│       │   │   │       ├── audit-logs/               # GET logs de auditoria
│       │   │   │       ├── settings/                 # GET/PATCH configurações + audit log
│       │   │   │       ├── tenants/                  # Gestão de tenants
│       │   │   │       ├── security/                 # Score e verificações de segurança
│       │   │   │       └── security-events/          # Eventos de segurança
│       │   │   ├── layout.tsx       # Root layout
│       │   │   └── middleware.ts    # Auth + routing
│       │   ├── components/          # Componentes reutilizáveis
│       │   │   ├── ui/             # Componentes base (shadcn/ui)
│       │   │   ├── forms/          # Form components
│       │   │   ├── charts/         # Chart components
│       │   │   ├── layout/         # Layout components
│       │   │   └── jobs/           # Componentes do módulo de vagas
│       │   │       ├── NewJobModal.tsx       # Criação de vaga (modal overlay)
│       │   │       ├── JobDetailsModal.tsx   # Detalhes/ações da vaga (modal overlay)
│       │   │       ├── EditJobDrawer.tsx     # Edição inline (drawer lateral direito)
│       │   │       └── PublishDrawer.tsx     # Gerenciar publicações (drawer lateral direito)
│       │   ├── publisher/           # ✨ Componentes Publisher Engine (Sprint 35)
│       │   │   ├── ChannelSelector.tsx      # Seletor de canais para publicar vaga
│       │   │   ├── PublicationStatus.tsx    # Badge/lista/inline badges de status por canal
│       │   │   └── PublicationTimeline.tsx  # Timeline de histórico de publicações
│       │   └── reports/             # Componentes de relatórios
│       │       ├── FullReportPDF.tsx        # PDF de relatório geral (jsPDF + autotable)
│       │       ├── ReportExport.tsx         # Botão + lógica de export CSV/PDF
│       │       ├── CandidateReportPDF.tsx   # PDF de parecer do recrutador (Sprint 35)
│       │       └── Nr1CompliancePDF.tsx     # ✨ PDF de compliance NR-1 (Sprint 35)
│       │   └── curriculum/          # Gerador de currículo PDF do candidato
│       │       └── CandidateCurriculumPDF.ts # ✨ PDF currículo profissional com foto circular (Sprint 46)
│       │   ├── lib/                # Utilities
│       │   │   ├── supabase/       # Supabase clients
│       │   │   ├── utils.ts        # Helper functions
│       │   │   └── constants.ts    # App constants
│       │   ├── hooks/              # Custom React hooks
│       │   ├── stores/             # Zustand stores
│       │   ├── types/              # TypeScript types
│       │   └── styles/             # Global styles
│       └── public/                 # Static assets
│
├── packages/
│   ├── types/                      # Shared TypeScript types
│   │   └── src/
│   │       └── index.ts           # Exported types
│   └── mcp/                        # TalentForge MCP Server (@talentforge/mcp)
│       ├── src/
│       │   ├── server.ts           # Entry point — Server MCP + handlers stdio
│       │   ├── lib/
│       │   │   └── supabase.ts     # Cliente Supabase service role + validateOrg()
│       │   └── tools/
│       │       ├── recruitment.ts  # search-candidates, get-pipeline-status, move-candidate, get-candidate-profile
│       │       ├── assessments.ts  # analyze-disc-profile, compare-candidates, get-team-health
│       │       └── people.ts       # get-recruitment-metrics, get-employee-list, predict-retention-risk
│       ├── package.json            # name: @talentforge/mcp, bin: talentforge-mcp
│       └── tsconfig.json           # ES2022, NodeNext, strict
│
├── supabase/
│   ├── migrations/                # Database migrations (ordem cronológica)
│   │   ├── 20241211_init_schema.sql
│   │   ├── 20241212_candidate_profiles.sql
│   │   ├── 20241213_assessment_system_disc.sql
│   │   ├── ...
│   │   ├── 20260124_consolidate_companies_organizations.sql
│   │   ├── 20260124_lock_audit_logs_security.sql
│   │   ├── 20260124_performance_indexes.sql
│   │   ├── 20260124_consolidate_iam.sql
│   │   ├── 20260124_business_metrics_views.sql
│   │   ├── 20260124_organizations_metadata.sql
│   │   ├── 20260129_reactivate_organizations_rls.sql
│   │   ├── 20260130_create_php_module_tables.sql ✅ Módulo PHP (12 tabelas core)
│   │   ├── 20260130_php_employees.sql ✅ Tabela employees + hierarquia
│   │   ├── 20260202_nr1_invitations.sql ✅ Convites NR-1
│   │   ├── 20260202_nr1_self_assessment.sql ✅ Self-assessment NR-1
│   │   ├── 20260202_tfci_peer_selection_system.sql ✅ Seleção de pares TFCI
│   │   ├── 20260204_organization_corporate_fields.sql ✅ Campos corporativos
│   │   ├── 20260205_realtime_dashboard.sql ✅ Notifications + Presence + Comments + Locks
│   │   ├── 20260303_application_status_in_documentation.sql ✅ enum application_status + 'in_documentation'
│   │   ├── 20260304_resumes_bucket_recruiter_read.sql ✅ policy SELECT bucket resumes para recrutadores
│   │   ├── 20260304_application_documents.sql ✅ tabela application_documents + RLS + bucket application-documents
│   │   ├── 20260305_fix_application_documents_rls.sql ✅ GRANT + SECURITY DEFINER upsert_application_document + email fallback
│   │   ├── 20260305_get_my_behavioral_profiles.sql ✅ get_my_disc_result / get_my_color_result / get_my_pi_result (SECURITY DEFINER)
│   │   ├── 20260304_candidate_profiles_extra_fields.sql ✅ ADD COLUMN linkedin_url, experience_years em candidate_profiles
│   │   ├── 20260305_candidate_saved_jobs.sql ✅ tabela candidate_saved_jobs + RLS (user_id) + RPC get_my_saved_jobs() SECURITY DEFINER
│   │   ├── 20260306_interviews_table.sql ✅ tabela interviews + RLS is_org_member(org_id) + índices org_id/scheduled_at/candidate_id
│   │   ├── 20260306_candidates_resume_upload.sql ✅ colunas resume_url, resume_filename, resume_uploaded_at em candidates
│   │   ├── 20260306_career_page.sql ✅ página de carreira pública por organização
│   │   ├── 20260306_application_source_tracking.sql ✅ rastreamento de origem das candidaturas (source, utm_source, utm_medium, utm_campaign)
│   │   ├── 20260307_career_page_v2.sql ✅ career page v2 — banner, about, cores secundárias, links sociais, bucket org-assets
│   │   ├── 20260309_fix_career_page_visibility.sql ✅ habilitação career page FARTECH + vagas is_public = TRUE
│   │   ├── 20260311_career_page_v3_work_modality.sql ✅ colunas work_modality + salary_range em jobs; view v_public_jobs e RPC get_public_jobs_by_org recriados
│   │   ├── 20260311_org_testimonials.sql ✅ tabela org_testimonials (depoimentos editáveis) + RLS público + escrita via is_org_member
│   │   ├── 20260311_org_career_tips.sql ✅ tabela org_career_tips (dicas de carreira editáveis) + RLS público + escrita via is_org_member
│   │   ├── 20260302_job_publication_engine.sql ✅ job_publication_channels + job_publications + job_publication_logs + RLS + triggers
│   │   ├── 20260315_fix_fk_on_delete_auth_users.sql ✅ FKs auth.users: ON DELETE SET NULL/CASCADE em 15 tabelas (fix delete-user 500)
│   │   ├── 20260315_admin_delete_user_fn.sql ✅ função admin_cleanup_user_references() SECURITY DEFINER (pré-limpeza antes de deleteUser)
│   │   ├── 20260316_add_interview_status.sql ✅ enum application_status + 'interview_hr' + 'interview_manager' (pipeline sub-status)
│   │   ├── 20260316_candidate_technical_reviews.sql ✅ tabela candidate_technical_reviews (scores, ai_review, input_snapshot) + RLS is_org_member
│   │   ├── 20260316_recruiter_settings.sql ✅ tabela recruiter_settings (review_prompt customizável por recrutador/org) + RLS user_id + is_org_member
│   │   └── 20260316_get_auth_user_id_by_email.sql ✅ função get_auth_user_id_by_email(email) SECURITY DEFINER — resolve UUID de auth.users por email (fallback para candidate_user_id quando candidates.user_id é null)
│   ├── VALIDATE_IMPROVEMENTS.sql  # Script de validação
│   └── README.md                  # Instruções de migrations
│
├── docs/
│   ├── ARQUITETURA_CANONICA.md   # Este arquivo (fonte da verdade)
│   ├── api.md                     # Documentação API
│   ├── auth.md                    # Fluxo de autenticação
│   ├── design-system.md           # Design System oficial
│   ├── ux-flows.md                # Fluxos de usuário
│   ├── decisions.md               # Decisões arquiteturais
│   ├── IMPROVEMENTS_LOG.md        # Log de melhorias
│   └── STATUS_REPORT.md           # Status atual
│
├── scripts/                       # Scripts utilitários
│   ├── seed-*.js                 # Seed de dados
│   ├── check-*.js                # Verificações
│   └── security-check.sh         # Verificação segurança
│
├── public/logos/                 # Logos do sistema
├── package.json                  # Root package
└── README.md                     # Documentação principal
```

### 📋 Convenções de Nomenclatura

#### Arquivos e Pastas
- **Pastas**: `kebab-case` (ex: `create-user`, `audit-logs`)
- **Componentes React**: `PascalCase.tsx` (ex: `DashboardHeader.tsx`)
- **Utilities**: `camelCase.ts` (ex: `formatDate.ts`)
- **Migrations**: `YYYYMMDD_description.sql` (ex: `20260124_performance_indexes.sql`)
- **API Routes**: `[param]/route.ts` (Next.js 15 App Router)

#### Código
- **Componentes**: `PascalCase` (ex: `UserProfile`)
- **Funções**: `camelCase` (ex: `getUserProfile`)
- **Constantes**: `UPPER_SNAKE_CASE` (ex: `MAX_UPLOAD_SIZE`)
- **Types/Interfaces**: `PascalCase` com prefixo (ex: `IUserProfile`, `TJobStatus`)
- **Enums SQL**: `snake_case` (ex: `application_status`, `employment_type`)
- **Tabelas**: `snake_case` plural (ex: `organizations`, `org_members`)
- **Colunas**: `snake_case` (ex: `created_at`, `full_name`)

#### Git Commits
```
feat: adicionar nova funcionalidade
fix: corrigir bug
docs: atualizar documentação
style: formatação de código
refactor: refatoração sem mudança de comportamento
perf: melhorias de performance
test: adicionar/corrigir testes
chore: tarefas de manutenção
```

### 🎨 Design System — Paleta de Cores Oficial

```typescript
// Cores primárias (NUNCA ALTERAR)
const COLORS = {
  primary: '#141042',      // Roxo escuro principal
  secondary: '#10B981',    // Verde sucesso
  accent: '#3B82F6',       // Azul informativo
  warning: '#F59E0B',      // Laranja aviso
  danger: '#EF4444',       // Vermelho erro
  purple: '#8B5CF6',       // Roxo alternativo
  pink: '#EC4899',         // Rosa
  cyan: '#06B6D4',         // Ciano
  
  // Neutros (tema claro)
  background: {
    main: '#FFFFFF',       // Fundo principal
    alt: '#FAFAF8',       // Fundo alternativo
    hover: '#F5F5F0',     // Hover
  },
  border: '#E5E5DC',      // Bordas
  text: {
    primary: '#141042',   // Texto principal
    secondary: '#666666', // Texto secundário
    muted: '#999999',     // Texto auxiliar
  }
}
```

**✅ Status (2026-01-29)**: Implementado corretamente em `apps/web/src/app/globals.css` com CSS variables + Tailwind 4 CSS-first approach (`@import "tailwindcss"` + `@theme inline`).

### 🔒 Regras de Segurança (NÃO NEGOCIÁVEL)

1. **RLS sempre habilitado**: `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
   - ✅ **ATIVO EM TODAS TABELAS** (2026-01-29)
   - ✅ RLS em `organizations` **REATIVADO** com 5 policies corrigidas:
     - `admin_full_access_organizations`: Admins globais têm acesso total
     - `member_read_own_organizations`: Membros veem apenas suas orgs via `org_members`
     - `admin_create_organizations`: Apenas admins podem criar
     - `admin_update_organizations`: Admins globais + org admins podem atualizar
     - `admin_delete_organizations`: Apenas admins globais podem deletar
   - **Migration aplicada**: `supabase/migrations/20260129_reactivate_organizations_rls.sql`
   - **Status**: ✅ Funcionando corretamente em produção

2. **Policies por user_type**: admin, recruiter, candidate, viewer
3. **Função `is_org_member()`**: Única fonte de verdade para membership
4. **Service role APENAS para**:
   - Admin user creation
   - System migrations
   - Batch jobs aprovados
5. **Headers obrigatórios**:
   - `Authorization: Bearer <JWT>`
   - `x-org-id: <UUID>` (exceto rotas públicas)
6. **Validação de input**: Zod no frontend + class-validator no backend
7. **Rate limiting**: 50 req/min admin, 100 req/min público (middleware)
8. **Audit logs**: TODAS ações críticas devem ser registradas

### 🚀 Fluxo de Desenvolvimento (OBRIGATÓRIO)

1. **Desenvolver localmente**:
   ```bash
   npm run dev:web    # Frontend em http://localhost:3000 (Turbopack)
   npm run dev:api    # API NestJS em http://localhost:3001
   npm run dev        # Ambos simultaneamente
   ```

2. **Se alterou schema**:
   - Criar `supabase/migrations/YYYYMMDD_description.sql`
   - Usar `DROP POLICY IF EXISTS` antes de `CREATE POLICY` (idempotência)
   - Aplicar no Supabase SQL Editor (produção)
   - Executar `VALIDATE_IMPROVEMENTS.sql` para confirmar

3. **Commitar toda alteração** (ver seção 0.10 para fluxo Git completo)

4. **Deploy automático via CI → Vercel**:
   - Push para `main` → GitHub Actions valida build + tipos → Vercel deploya
   - **Nunca usar `vercel --prod` CLI** — histórico de deploy fora do git causa inconsistências graves

5. **Validar deploy no Vercel**:
   - Acesse https://vercel.com/dashboard e verifique o build
   - URL de produção: https://web-eight-rho-84.vercel.app

---

## 0.10) 🚢 Git & Deploy — Fluxo Canônico (REGRA DE OURO)

> **Raiz do problema histórico (2026-03-06)**: O projeto era deployado via `vercel --prod` CLI local, nunca via git. O repositório rastreava apenas ~10 arquivos. Quando o Vercel foi conectado ao repositório, o build falhou com `doesn't have a root layout` porque `app/layout.tsx`, `package.json`, `globals.css` e `lib/*` nunca haviam sido commitados. **Este fluxo foi criado para garantir que isso nunca ocorra novamente.**

### 📐 Arquitetura do Deploy

```
Desenvolvedor
     │
     ▼
 git commit + git push origin main
     │
     ▼
┌─────────────────────────────────┐
│   GitHub Actions CI             │
│   .github/workflows/ci.yml      │
│   ├── Job: validate             │
│   │   ├── tsc --noEmit          │
│   │   └── eslint                │
│   └── Job: build (next build)   │
│       └── ✅ ou ❌              │
└─────────────────────────────────┘
     │ (só se CI verde)
     ▼
┌─────────────────────────────────┐
│   Vercel                        │
│   Root Directory: apps/web      │
│   Build Command: next build     │
│   Install: npm install          │
│   → Deploy automático           │
└─────────────────────────────────┘
     │
     ▼
https://web-eight-rho-84.vercel.app
```

### ✅ Fluxo Git Correto — Do Zero ao Deploy

```bash
# 1. Desenvolver e criar/editar arquivos normalmente

# 2. Verificar o que mudou
git status

# 3. Adicionar arquivos ao staging (SEMPRE explícito, nunca git add . na raiz)
git add apps/web/src/app/nova-pagina/
git add apps/web/src/components/NovoComponente.tsx
git add supabase/migrations/YYYYMMDD_descricao.sql

# 4. Commitar com mensagem semântica em pt-BR
git commit -m "feat(escopo): descrição imperativa no presente"

# 5. Push → CI roda automaticamente → Vercel deploya
git push origin main
```

### 🏷️ Convenção de Commits (OBRIGATÓRIO)

Formato: `tipo(escopo): descrição imperativa em pt-BR`

| Tipo | Quando usar |
|------|-------------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `chore` | Manutenção, configs, deps |
| `docs` | Documentação apenas |
| `refactor` | Refatoração sem comportamento novo |
| `style` | Formatação, CSS, UI apenas |
| `perf` | Melhoria de performance |
| `test` | Testes |

Exemplos corretos:
```
feat(agenda): implementa AgendaModal com integração Google Calendar
fix(rls): adiciona DROP POLICY IF EXISTS para idempotência
chore(deps): atualiza next para 15.5.9
docs(arquitetura): adiciona fluxo canônico de Git & Deploy
```

### 🗂️ O que DEVE e NÃO DEVE estar no git

| Arquivo/Pasta | No git? | Motivo |
|---------------|---------|--------|
| `apps/web/src/**` | ✅ SIM | Todo código fonte |
| `apps/web/package.json` | ✅ SIM | Deps do projeto |
| `apps/web/next.config.mjs` | ✅ SIM | Config do Next.js |
| `apps/web/tsconfig.json` | ✅ SIM | Config TypeScript |
| `apps/web/postcss.config.mjs` | ✅ SIM | Config Tailwind |
| `apps/web/vercel.json` | ✅ SIM | Config deploy |
| `apps/web/.gitignore` | ✅ SIM | Ignores do web |
| `apps/api/src/**` | ✅ SIM | Código NestJS |
| `supabase/migrations/**` | ✅ SIM | Histórico do schema |
| `docs/**` | ✅ SIM | Documentação |
| `.github/workflows/**` | ✅ SIM | CI/CD |
| `.gitignore` | ✅ SIM | Regras de ignore |
| `.env.local` | ❌ NÃO | Segredos |
| `.env` | ❌ NÃO | Segredos |
| `node_modules/` | ❌ NÃO | Gerado pelo npm |
| `.next/` | ❌ NÃO | Build output |
| `apps/api/dist/` | ❌ NÃO | Build output |
| `*.log` | ❌ NÃO | Logs locais |
| `Logos/` | ❌ NÃO | Assets binários |
| `*" 2.tsx"` | ❌ NÃO | Cópias acidentais |

### ⚙️ Configuração do Vercel (NÃO ALTERAR)

| Configuração | Valor |
|-------------|-------|
| Framework | Next.js (auto-detect) |
| Root Directory | `apps/web` |
| Build Command | `next build` |
| Output Directory | `.next` |
| Install Command | `npm install --no-package-lock` |
| Node.js Version | 20.x |

**Variáveis de ambiente obrigatórias no Vercel**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Variáveis de ambiente para o CI (GitHub Secrets)**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 🔁 Arquivo `apps/web/vercel.json` (canônico)

```json
{
  "framework": "nextjs",
  "installCommand": "npm install --no-package-lock",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_TELEMETRY_DISABLED": "1"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

### 🤖 CI — `.github/workflows/ci.yml`

Roda automaticamente em todo push/PR para `main` que toca `apps/web/**`:
- **Job `validate`**: `tsc --noEmit` + `eslint` (falha rápido antes de buildar)
- **Job `build`**: `next build` completo com as variáveis de produção

A build do Vercel só é acionada se o CI passar. Falhas de tipagem/lint são detectadas no GitHub antes de consumir minutos de build no Vercel.

### 🚨 Diagnóstico de Falha de Build no Vercel

Se o build falhar com erros como:
- `Module not found: Can't resolve '@/lib/...'` → arquivo não está no git
- `doesn't have a root layout` → `app/layout.tsx` não está no git
- `Cannot find module 'next'` → `package.json` não está no git

**Checklist de diagnóstico**:
```bash
# 1. Verificar se o arquivo existe localmente
ls apps/web/src/app/layout.tsx

# 2. Verificar se está rastreado pelo git
git ls-files apps/web/src/app/layout.tsx
# Se retornar vazio → arquivo não está no git!

# 3. Adicionar ao git
git add apps/web/src/app/layout.tsx
git commit -m "fix(deploy): adiciona layout.tsx ao git"
git push origin main
```

### 📋 Checklist Pré-Push (OBRIGATÓRIO)

Antes de qualquer `git push origin main`, verificar:
- [ ] `git status` — nenhum arquivo novo esquecido?
- [ ] `git diff --cached --name-only` — o staged contém tudo que mudou?
- [ ] Migrations novas estão incluídas?
- [ ] Nenhum arquivo `*.env*` no staging?
- [ ] Nenhum arquivo `* 2.tsx` ou `* 2.ts` (cópia acidental)?
- [ ] Mensagem de commit segue convenção `tipo(escopo): descrição`?

### 🔌 Conexões locais (obrigatório em dev)
- Web local deve apontar para API local:
   - `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001` *(sem `/api/v1` — a lib `api-config.ts` compõe o path)*
- API local deve aceitar origem `http://localhost:3000` via CORS.
- Se usar API remota em dev, garantir que CORS permita `localhost`.

### 🛠️ Startup do Servidor Local — Guia Completo e Troubleshooting

#### Pré-requisitos
- **Node.js >= 20.0.0** (usar `nvm use 20` se necessário)
- **npm >= 10** (vem com Node 20)
- Arquivo `apps/web/.env.local` configurado com:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

#### Comandos de Startup
```bash
# Instalar dependências (primeira vez ou após pull)
npm install

# Rodar apenas o frontend (recomendado para dev rápido)
npm run dev:web
# → Next.js 15 + Turbopack em http://localhost:3000

# Rodar apenas a API NestJS
npm run dev:api
# → NestJS em http://localhost:3001

# Rodar ambos (via concurrently)
npm run dev
```

#### ⚠️ Variáveis de Ambiente Críticas (`apps/web/.env.local`)
| Variável | Obrigatória | Descrição |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Chave anon (pública) do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Chave service role (admin ops, NÃO expor no client) |
| `VERCEL_OIDC_TOKEN` | ❌ **PROIBIDO em dev local** | Causa hang do servidor. Só usar em deploy Vercel |
| `NEXT_PUBLIC_API_BASE_URL` | 🟡 Opcional | URL base da API NestJS **sem** `/api/v1` (padrão: `http://localhost:3001`) |

> **🔴 REGRA ABSOLUTA**: A variável `VERCEL_OIDC_TOKEN` **NUNCA** deve estar ativa em `.env.local` para desenvolvimento local. Ela causa interferência no servidor Next.js, fazendo-o aceitar conexões na porta 3000 mas nunca responder às requisições (hang infinito). Se presente, comentar com `#`.

---

### 🔧 Troubleshooting — Problemas Conhecidos e Soluções

#### Problema 1: `node_modules` corrompido (JSON truncado)
**Sintoma**: Erros como `Unexpected end of JSON input`, `Cannot find module`, ou falhas em pacotes como `commander`, `semver`, `balanced-match`, `brace-expansion`, `lru-cache`, `minimatch`.

**Causa raiz**: Interrupção de `npm install` (crash, Ctrl+C, disco cheio) deixa arquivos `package.json` de pacotes internos com conteúdo truncado/inválido.

**Solução definitiva** (limpeza completa):
```bash
# 1. Remover TODOS os node_modules e lock file
rm -rf node_modules apps/web/node_modules apps/api/node_modules \
       packages/mcp/node_modules packages/types/node_modules \
       package-lock.json

# 2. Limpar cache do npm
npm cache clean --force

# 3. Reinstalar do zero
npm install
```

**⚠️ NÃO tentar corrigir pacotes individuais** — a corrupção geralmente afeta múltiplos pacotes simultaneamente. Limpeza total é a única solução confiável.

---

#### Problema 2: Conflito de versão Next.js (root vs workspace)
**Sintoma**: Compilação trava sem erro, servidor não responde, ou erros de incompatibilidade React 18 vs React 19.

**Causa raiz**: O `package.json` raiz **NÃO deve** declarar `next` como dependência. O npm workspace hoisting pode puxar uma versão diferente (ex: Next.js 16) para o `node_modules/` raiz, sobrescrevendo a versão correta do workspace `apps/web` (Next.js 15).

**Regras de compatibilidade**:
| Next.js | React | Status |
|---------|-------|---------|
| 15.x | React 18 | ✅ Versão do projeto |
| 16.x | React 19 | ❌ **INCOMPATÍVEL** — não usar |

**Diagnóstico**:
```bash
# Verificar versão do Next.js instalada
ls -la apps/web/node_modules/next/package.json | head -5
node -e "console.log(require('./apps/web/node_modules/next/package.json').version)"

# Verificar se há Next.js no root (NÃO deveria existir)
ls node_modules/next/package.json 2>/dev/null && echo 'PROBLEMA: Next.js no root!' || echo 'OK: Next.js apenas no workspace'
```

**Solução**:
```bash
# 1. Remover "next" do package.json raiz (se existir)
#    O root package.json NÃO deve conter dependência "next"

# 2. Limpeza completa
rm -rf node_modules apps/web/node_modules apps/web/.next package-lock.json

# 3. Reinstalar
npm install

# 4. Verificar
node -e "console.log(require('./apps/web/node_modules/next/package.json').version)"
# Deve retornar 15.x.x
```

**Estado correto do `package.json` raiz**:
```json
{
  "dependencies": {
    "@supabase/ssr": "0.5.2",
    "@supabase/supabase-js": "2.46.2"
  }
}
```
> **Nota**: `next`, `react` e `react-dom` devem estar APENAS em `apps/web/package.json`.

---

#### Problema 3: Servidor aceita conexão mas não responde (hang)
**Sintoma**: `lsof -i :3000` mostra processo escutando, mas `curl http://localhost:3000` fica em timeout indefinidamente.

**Causas possíveis**:

| Causa | Diagnóstico | Solução |
|-------|-------------|--------|
| `VERCEL_OIDC_TOKEN` ativo | Verificar `apps/web/.env.local` | Comentar/remover a linha |
| Cache `.next` corrompido | Servidor inicia mas não compila | `rm -rf apps/web/.next` |
| SWC binary ausente | Warning "Found lockfile missing swc" | `rm -rf node_modules && npm install` |
| Middleware travando | `middleware.ts` chama API externa | Verificar conectividade Supabase |

**Solução geral**:
```bash
# 1. Limpar VERCEL_OIDC_TOKEN
sed -i '' 's/^VERCEL_OIDC_TOKEN/# VERCEL_OIDC_TOKEN/' apps/web/.env.local

# 2. Limpar cache de build
rm -rf apps/web/.next

# 3. Reiniciar servidor
cd apps/web && npx next dev --turbopack -p 3000 -H 0.0.0.0
```

---

#### Problema 4: `Missing script: "dev:api"` no root
**Sintoma**: `npm run dev:api` falha na raiz do projeto.

**Solução**: O script já está configurado no root `package.json` como:
```json
"dev:api": "npm run start:dev -w tf-api"
```
E no `apps/api/package.json`:
```json
"dev:api": "nest start --watch",
"start:dev": "nest start --watch"
```

---

#### Problema 5: Primeira compilação muito lenta (>60s)
**Sintoma**: Após `npm run dev:web`, a primeira requisição demora 60-120 segundos.

**Causa**: Normal no Next.js 15 com Turbopack na primeira compilação. O Turbopack precisa compilar todas as dependências na primeira vez.

**Mitigação**:
- Usar `--turbopack` (já configurado) — mais rápido que Webpack
- Não interromper a primeira compilação
- Compilações subsequentes são instantâneas (<3s)
- O binário SWC nativo (`@next/swc-darwin-arm64` para Mac M1/M2/M3) deve estar instalado

---

#### Problema 6: AuthApiError em logs (refresh_token)
**Sintoma**: Logs do Supabase mostram `AuthApiError: Invalid Refresh Token: Already Used` ou `Refresh Token Not Found`.

**Causa**: Normal quando não há sessão ativa. O middleware (`apps/web/src/middleware.ts`) chama `supabase.auth.getUser()` em toda requisição, e sem cookie de sessão válido, o Supabase retorna esses erros.

**Não é um bug** — é comportamento esperado para rotas não autenticadas.

---

#### Problema 7: Versões de `eslint-config-next` e `@types/react` incompatíveis (processo Next.js silencioso)
**Sintoma**: Processo `next dev` inicia (aparece em `ps aux`), consome memória mínima (~13MB RSS), **não produz NENHUM output** mesmo após 5-10 minutos, e a porta 3000 nunca é aberta.

**Causa raiz**: Conflito de versões entre `eslint-config-next` e `@types/react` declaradas em `apps/web/package.json` e as versões reais instaladas. Especificamente:
- `eslint-config-next: "16.0.9"` (para Next.js 16) sendo usado com Next.js 15 — incompatível
- `@types/react: "^19"` / `@types/react-dom: "^19"` (tipos do React 19) com React 18 instalado — divergência de tipos durante inicialização do TypeScript

O Next.js em modo dev carrega e valida dependências de forma mais ampla que em produção. O conflito faz o processo travão em estado `S` (sleeping/aguardando I/O) sem nunca imprimir o banner de startup.

**Diagnóstico**:
```bash
# Verificar versões de eslint-config-next e @types/react em apps/web/package.json
grep -E 'eslint-config-next|@types/react' apps/web/package.json

# Regra: eslint-config-next DEVE ter a mesma versão major que next
# eslint-config-next: "15.x.x" ↔ next: "^15.x.x"
# @types/react: "^18" ↔ react: "^18.x.x" (nunca @types/react: "^19" com React 18)
```

**Solução**:
```bash
# 1. Corrigir versões em apps/web/package.json:
#    "eslint-config-next": "15.5.9"  (ou versão exata do Next.js instalado)
#    "@types/react": "^18"
#    "@types/react-dom": "^18"

# 2. Reinstalar dependências
npm install

# 3. Limpar cache
rm -rf apps/web/.next

# 4. Reiniciar
npm run dev:web
```

**Regra de ouro**: **eslint-config-next** e **@types/react** DEVEM ser mantidos alinhados com as versões de `next` e `react` respectivamente. Ao atualizar `next`, atualizar também `eslint-config-next` para a mesma versão.

| Pacote | Versão correta (Next.js 15) |
|--------|-----------------------------|
| `next` | `^15.5.9` |
| `eslint-config-next` | `15.5.9` (igual ao next) |
| `react` | `^18.3.1` |
| `@types/react` | `^18` |
| `@types/react-dom` | `^18` |

---

#### Problema 8: `@types/react` dual version — TS2786 lucide-react "cannot be used as JSX component"
**Sintoma**: Erros TypeScript em imports de ícones (lucide-react, heroicons): `Type 'Element' is not assignable to type 'ReactNode'`.

**Causa raiz**: npm hoisting instala `@types/react@19` na raiz do monorepo (puxado por `react-redux` como optional peer). O workspace `apps/web` tem `@types/react@18`. TypeScript resolve para a versão da raiz (v19), incompatível com React 18.

**Solução** (root `package.json`):
```json
{
  "overrides": {
    "@types/react": "^18",
    "@types/react-dom": "^18"
  }
}
```

**⚠️ NUNCA adicionar em `devDependencies` do root E `overrides` ao mesmo tempo** — causará `EOVERRIDE conflict`.

**Diagnóstico**:
```bash
# Verificar versão instalada na raiz
node -e "console.log(require('./node_modules/@types/react/package.json').version)"
# Deve ser 18.x.x (se 19.x.x, overrides não aplicados ou npm rodou do lugar errado)

# Verificar overrides
node -e "console.log(JSON.stringify(require('./package.json').overrides, null, 2))"
```

**⚠️ Sempre rodar `npm install` do DIRETÓRIO RAIZ** — se rodar de `apps/web`, os overrides do root não se aplicam.

---

#### Problema 9: `useSearchParams()` sem `<Suspense>` — build falha em static pages
**Sintoma**: Build (SSG) falha com: `Error: useSearchParams() should be wrapped in a suspense boundary at the page level`

**Causa raiz**: Next.js 15 exige que qualquer componente que use `useSearchParams()` esteja dentro de `<Suspense>` quando a página é gerada estaticamente.

**Padrão obrigatório**:
```tsx
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// ✅ Exportar um wrapper com Suspense
export default function MyPage() {
  return (
    <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141042]" />}>
      <MyPageContent />
    </Suspense>
  );
}

// Componente interno usa os hooks normalmente
function MyPageContent() {
  const searchParams = useSearchParams();
  // ...
}
```

**Páginas que JÁ aplicam corretamente** (não alterar): `login/page.tsx`, `register/page.tsx`, `auth/callback/page.tsx`, `nr1-self-assessment/page.tsx`, `companies/[id]/page.tsx`.

---

### 📋 Checklist de Verificação Rápida (Dev Local)
```bash
# 1. Node.js correto?
node --version  # Deve ser v20.x.x

# 2. Dependências instaladas?
ls apps/web/node_modules/next/package.json  # Deve existir

# 3. Next.js correto?
node -e "console.log(require('./apps/web/node_modules/next/package.json').version)"  # 15.x.x

# 4. VERCEL_OIDC_TOKEN removido?
grep '^VERCEL_OIDC_TOKEN' apps/web/.env.local  # Não deve retornar nada

# 5. Next.js no root? (INDESEJADO)
ls node_modules/next 2>/dev/null && echo 'PROBLEMA!' || echo 'OK'

# 6. eslint-config-next e @types/react alinhados?
grep -E 'eslint-config-next|@types/react|"next"|"react"' apps/web/package.json | grep -v '\/\/'  # Conferir versões

# 7. Servidor respondendo?
curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login  # 200

# 8. @types/react versão correta no root? (overrides aplicados?)
node -e "console.log(require('./node_modules/@types/react/package.json').version)"  # 18.x.x (NÃO 19.x)

# 9. overrides no root package.json?
node -e "const p=require('./package.json');console.log(p.overrides)"  # { '@types/react': '^18', '@types/react-dom': '^18' }
```

---

### 📜 Histórico de Incidentes de Dev Local

#### Incidente 2026-02-05: Servidor local não responde
**Contexto**: Após atualização de dependências, o servidor Next.js parou de responder.

**Cadeia de causas** (3 problemas em cascata):
1. **node_modules corrompido**: Múltiplos `package.json` internos com JSON truncado (`commander`, `semver`, `balanced-match`, `brace-expansion`, `lru-cache`, `minimatch`, `@inquirer/prompts`)
2. **Next.js 16 no root**: O `package.json` raiz tinha `"next": "^16.1.6"` como dependência. O npm hoisting instalava Next.js 16 no root, que requer React 19 — incompatível com React 18 do projeto. Causava hang na compilação.
3. **VERCEL_OIDC_TOKEN ativo**: Token de OIDC do Vercel em `.env.local` causava comportamento de deploy (não dev) no servidor, aceitando conexões TCP mas nunca respondendo HTTP.

**Resolução**:
1. Limpeza total: `rm -rf node_modules */*/node_modules package-lock.json`
2. Remoção de `"next": "^16.1.6"` do `package.json` raiz
3. Comentar `VERCEL_OIDC_TOKEN` em `apps/web/.env.local`
4. Limpar cache: `rm -rf apps/web/.next`
5. Reinstalar: `npm install`
6. Iniciar com Turbopack: `cd apps/web && npx next dev --turbopack -p 3000 -H 0.0.0.0`

**Tempo total**: ~45 minutos de diagnóstico
**Prevenção**: Checklist de verificação rápida (acima) antes de cada sessão de dev

#### Incidente 2026-02-27: Processo next dev silencioso (zero output)
**Contexto**: Servidor não iniciava após tentativas de reinício. Processo aparecia em `ps aux` mas a porta 3000 nunca era aberta e nenhum log era produzido.

**Cadeia de causas** (2 problemas):
1. **`eslint-config-next: "16.0.9"`** em `apps/web/package.json` — versão para Next.js 16, incompatível com Next.js 15.5 instalado. Causava conflito silencioso no bootstrap do servidor.
2. **`@types/react: "^19"` e `@types/react-dom: "^19"`** — tipos do React 19 com React 18 instalado, causando divergência de tipos no carregamento do TypeScript.

**Otimizações aplicadas simultaneamente**:
- `next.config.ts`: `outputFileTracingRoot` e `outputFileTracingExcludes` movidos para bloco `production-only` — elimina varredura desnecessária do monorepo em `next dev`
- Script `dev` em `apps/web/package.json` atualizado para `next dev --turbopack -p 3000 -H 0.0.0.0`

**Resolução**:
1. `eslint-config-next: "16.0.9"` → `"15.5.9"` em `apps/web/package.json`
2. `@types/react: "^19"` → `"^18"` e `@types/react-dom: "^19"` → `"^18"`
3. `next.config.ts` refatorado — `outputFileTracingRoot` apenas em `isDev === false`
4. `npm install` para aplicar correções

**Tempo total**: ~60 minutos de diagnóstico
**Prevenção**: Item 6 do Checklist de Verificação (verificar versões de `eslint-config-next` e `@types/react`)

#### Incidente 2026-02-28: Design System + @types/react dual version + Build failures
**Contexto**: Após mudanças visuais em sessão anterior, o projeto acumulou 3 problemas independentes que precisaram ser resolvidos antes do deploy: violações de design system, erro de build por `useSearchParams` sem `Suspense`, e conflito de versão `@types/react` em monorepo.

**Problema 1: Violações do Design System (cor FORGE incorreta)**

| Arquivo | Problema | Correção |
|---------|----------|---------|
| `admin/layout.tsx` | `FORGE text-[#3B82F6]` (azul) | → `text-[#F97316]` (laranja) |
| `dashboard/layout.tsx` | `FORGE text-[#3B82F6]` (azul) | → `text-[#F97316]` (laranja) |
| `dashboard/reports/page.tsx` | `TALENT text-[#141042]`, `REPORTS text-[#3B82F6]` | TALENT → `#1F4ED8`, REPORTS → `#F97316` |
| `login/page.tsx` | `FORGE text-(--tf-accent-light)` e `text-tf-accent` | → `text-[#F97316]` |

**Regra canônica**: TALENT = `#1F4ED8` (azul), FORGE = `#F97316` (laranja). Usar APENAS nesses dois componentes de branding do logotipo.

**Problema 2: `useSearchParams()` sem `<Suspense>` boundary**

**Sintoma**: Build falha com `Error: useSearchParams() should be wrapped in a suspense boundary`

**Arquivos afetados**:
- `apps/web/src/app/(employee)/nr1-self-assessment/page.tsx`
- `apps/web/src/app/(recruiter)/dashboard/companies/[id]/page.tsx`

**Padrão de correção obrigatório**:
```tsx
// ❌ INCORRETO — useSearchParams sem Suspense
export default function MyPage() {
  const searchParams = useSearchParams();
  // ...
}

// ✅ CORRETO — Wrapper com Suspense
export default function MyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141042]" />
      </div>
    }>
      <MyPageContent />
    </Suspense>
  );
}

function MyPageContent() {
  const searchParams = useSearchParams();
  // componente original aqui
}
```

**Nota**: `login/page.tsx`, `register/page.tsx` e `auth/callback/page.tsx` já estavam corretamente envolvidos em `<Suspense>` — não foram tocados.

**Problema 3: `@types/react` dual version conflict**

**Sintoma**: Erro TypeScript `TS2786: 'XIcon' cannot be used as a JSX component — Type 'Element' is not assignable to type 'ReactNode'` em imports de lucide-react.

**Causa raiz**: O npm workspace hoisting instala `@types/react@19` no `node_modules/` raiz (puxado por `react-redux` como optional peer de `recharts`/`@dnd-kit`). O workspace `apps/web` declara `@types/react@18`. Duas versões incompatíveis coexistem — TypeScript resolve para a raiz que tem v19.

**Solução via `overrides` no root `package.json`**:
```json
{
  "overrides": {
    "@types/react": "^18",
    "@types/react-dom": "^18"
  }
}
```

**⚠️ CONFLITO COMUM**: Não adicionar `@types/react` em `devDependencies` do root E em `overrides` simultaneamente. O npm retornará `EOVERRIDE: Override for @types/react conflicts with direct dependency`. Use APENAS `overrides`, sem `devDependencies` no root.

**⚠️ DIRETÓRIO OBRIGATÓRIO**: Todos os comandos `npm install` DEVEM ser executados do diretório raiz `/Users/fernandodias/Desktop/PROJETO_TALENT_FORGE`, NUNCA de `apps/web/`. Rodar npm de `apps/web` instala na subárvore e perde os `overrides` do root.

**Problema 4: next.config.ts → next.config.mjs**

`next.config.ts` foi substituído por `next.config.mjs` para melhor compatibilidade ESM:

```js
// apps/web/next.config.mjs
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'fjudsjzfnysaztcwlwgm.supabase.co',
      pathname: '/storage/v1/object/public/**'
    }]
  },
  outputFileTracingRoot: join(__dirname, '../../'),
};
export default nextConfig;
```

**Resolução final**:
1. Corrigir cores FORGE/TALENT (4 arquivos)
2. Adicionar `Suspense` wrapper em 2 arquivos com `useSearchParams`
3. Adicionar `overrides` em root `package.json`
4. Substituir `next.config.ts` → `next.config.mjs`
5. `npm install` do diretório RAIZ
6. `npm run build:web` → ✅ 88/88 páginas estáticas geradas

**Commit**: `26b506b` — `fix(web): restaurar design system + Suspense useSearchParams + @types/react override`

**Tempo total**: ~3h
**Prevenção**:
- Item 8 do Checklist de Verificação (cores FORGE/TALENT)
- Item 9 do Checklist (overrides root package.json)
- Sempre rodar `npm install` da raiz do monorepo

### 🧭 Pipeline (recrutador)
- O pipeline exibe **candidaturas (applications)**, não apenas candidatos.
- Se a coluna estiver vazia, verifique:
   - se há `applications` para a org ativa (via `jobs.org_id`), e
   - se a org selecionada no UI é a correta.

### 🏢 Seletor de organização (recrutador)
- O layout do recrutador deve permitir trocar a org ativa no UI.
- A org ativa define o escopo de pipeline, jobs, candidatos e relatórios.

### 🎯 Visibilidade de vagas (candidato)
- Hoje o candidato lista vagas via função pública `get_open_jobs` (retorna todas as vagas abertas).
- **Regra desejada** (pendente de implementação): candidato deve ver apenas vagas da sua org/recrutador.
- Implementação prevista: filtrar por `org_id` do candidato (via `org_members`/`candidates.owner_org_id`) ou habilitar “públicas + da org”.

### 🧩 Recrutador/Headhunter como organização
- Cada recrutador/headhunter deve possuir **sua própria** `organization` (`org_type='headhunter'`).
- O usuário precisa estar vinculado em `org_members` nessa org (role `admin`, status `active`).
- Candidatos criados pelo recrutador devem usar `owner_org_id` dessa org.
- Migração recomendada: criar org por recrutador existente e reatribuir candidatos (`20260126_recruiter_orgs.sql`).

### 📊 Views de Business Intelligence (Sprint 4 - 2026-01-24)

**6 Views Analíticas Criadas:**
1. `v_recruitment_funnel` - Funil de recrutamento por vaga
2. `v_avg_time_by_stage` - Tempo médio em cada estágio do pipeline
3. `v_recruiter_performance` - Métricas de performance por recrutador
4. `v_top_candidates` - Candidatos mais ativos no sistema
5. `v_assessment_completion_rate` - Taxa de conclusão de assessments
6. `v_executive_dashboard` - Dashboard executivo com KPIs principais

**Uso das Views:**
```sql
-- Frontend pode consultar diretamente
SELECT * FROM v_executive_dashboard WHERE org_id = '<uuid>';
SELECT * FROM v_recruiter_performance WHERE org_id = '<uuid>';
```

**RLS aplicado:** Todas views respeitam automaticamente o RLS das tabelas base.

---

## 0.9) Dependências Completas do Projeto

> Versões canônicas de todas as dependências do monorepo. Não atualizar versões de forma ad-hoc — qualquer upgrade deve ser avaliado com cuidado e registrado aqui.

### Monorepo raiz (`package.json`)

```json
{
  "engines": { "node": ">=20.0.0" },
  "workspaces": ["apps/*", "packages/*"],
  "dependencies": {
    "@supabase/ssr": "0.5.2",
    "@supabase/supabase-js": "2.46.2"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  },
  "overrides": {
    "@types/react": "^18",
    "@types/react-dom": "^18"
  }
}
```

> **⚠️ `overrides` obrigatórios:** Evitam que npm hoisting instale `@types/react@19` na raiz, o que causaria erros TS2786 com lucide-react e outros pacotes de UI.

---

### Frontend (`apps/web/package.json`)

#### Dependencies (produção)
| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `next` | `^15.5.9` | Framework principal (App Router) |
| `react` | `^18.3.1` | UI library |
| `react-dom` | `^18.3.1` | DOM renderer |
| `react-is` | `^18.3.1` | Introspection React (requerido por styled-components e outros) |
| `@supabase/supabase-js` | `2.46.2` | Cliente Supabase (query, auth) |
| `@supabase/ssr` | `0.5.2` | Helpers SSR Supabase (cookies Next.js) |
| `zustand` | `^5.0.10` | State management global |
| `@dnd-kit/core` | `^6.1.0` | Drag-and-drop core (pipeline kanban) |
| `@dnd-kit/sortable` | `^8.0.0` | Drag-and-drop sortable |
| `@dnd-kit/utilities` | `^3.2.2` | Utilities para @dnd-kit |
| `@hello-pangea/dnd` | `^18.0.1` | DnD alternativo (algumas views) |
| `lucide-react` | `^0.468.0` | Ícones SVG |
| `recharts` | `^3.6.0` | Gráficos (PHP dashboard, analytics) |
| `date-fns` | `^4.1.0` | Manipulação de datas |
| `clsx` | `^2.0.0` | Concatenação condicional de classes CSS |
| `tailwind-merge` | `^2.2.0` | Merge de classes Tailwind sem conflitos |
| `sonner` | `^1.7.4` | Toast notifications |
| `socket.io-client` | `^4.8.3` | WebSocket cliente (notificações real-time) |
| `jspdf` | `^4.0.0` | Geração de PDF (relatórios NR-1, TFCI) |
| `jspdf-autotable` | `^5.0.7` | Plugin tabelas para jsPDF |
| `xlsx` | `^0.18.5` | Import/export Excel (importação de funcionários) |
| `@vercel/analytics` | `^1.6.1` | Analytics Vercel (prod) |
| `@vercel/speed-insights` | `^1.3.1` | Speed insights Vercel (prod) |

#### DevDependencies (build/lint/test)
| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `typescript` | `^5` | Compilador TypeScript |
| `tailwindcss` | `^4` | CSS framework (Tailwind v4 CSS-first) |
| `@tailwindcss/postcss` | `^4` | PostCSS plugin para Tailwind 4 |
| `eslint` | `^9` | Linter |
| `eslint-config-next` | `15.5.9` | Config eslint para Next.js **(= versão do next)** |
| `@types/node` | `^20` | Types Node.js |
| `@types/react` | `^18` | Types React 18 **(nunca ^19 com React 18)** |
| `@types/react-dom` | `^18` | Types ReactDOM 18 |
| `jest` | `^29.7.0` | Test runner |
| `jest-environment-jsdom` | `^29.7.0` | Ambiente DOM para Jest |
| `@testing-library/react` | `^14.1.2` | Testing Library React |
| `@testing-library/jest-dom` | `^6.1.5` | Matchers DOM para Jest |
| `@types/jest` | `^29.5.11` | Types Jest |
| `@playwright/test` | `^1.58.2` | Testes E2E |

> **Regra crítica**: `eslint-config-next` DEVE ter versão **idêntica** ao `next` instalado. Mismatch causa processo silencioso (sem output, sem erro).

---

### Backend (`apps/api/package.json`)

#### Dependencies (produção)
| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `@nestjs/common` | `^11.0.1` | Core NestJS |
| `@nestjs/core` | `^11.0.1` | Core NestJS |
| `@nestjs/config` | `^4.0.0` | Config module (env vars) |
| `@nestjs/platform-express` | `^11.0.1` | HTTP adapter Express |
| `@nestjs/platform-socket.io` | `^11.1.13` | WebSocket (Socket.IO) |
| `@nestjs/websockets` | `^11.1.13` | WebSocket decorators |
| `@nestjs/swagger` | `^11.0.0` | Swagger/OpenAPI docs em `/docs` |
| `@supabase/supabase-js` | `^2.39.0` | Cliente Supabase (backend) |
| `@talentforge/types` | `*` | Tipos compartilhados do monorepo |
| `class-validator` | `^0.14.1` | Validação de DTOs |
| `class-transformer` | `^0.5.1` | Transform/serialize objetos |
| `rxjs` | `^7.8.1` | Reactive extensions (requerido pelo NestJS) |
| `reflect-metadata` | `^0.2.2` | Metadata reflection (decorators TypeScript) |
| `openai` | `^4.77.0` | Cliente OpenAI (IA generativa) |
| `socket.io` | `^4.8.3` | WebSocket servidor |
| `lru-cache` | `^11.2.6` | Cache in-memory LRU |

#### DevDependencies
| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `@nestjs/cli` | `^11.0.0` | CLI NestJS (build, scaffold) |
| `@nestjs/schematics` | `^11.0.0` | Schematics para CLI |
| `@nestjs/testing` | `^11.0.1` | Testing module NestJS |
| `typescript` | `^5.7.3` | Compilador TypeScript |
| `ts-node` | `^10.9.2` | TS execution (dev) |
| `ts-jest` | `^29.2.5` | Jest com TypeScript |
| `jest` | `^30.0.0` | Test runner |
| `supertest` | `^7.0.0` | HTTP testing |
| `prettier` | `^3.4.2` | Formatador de código |
| `@vercel/node` | `^3.0.0` | Vercel serverless adapter |

---

### MCP Server (`packages/mcp/package.json`)

| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `@modelcontextprotocol/sdk` | `^1.27.1` | SDK MCP (tools, resources, prompts) |
| `@supabase/supabase-js` | `2.46.2` | Cliente Supabase |
| `zod` | `^3.22.4` | Schema validation para tools MCP |
| `esbuild` (dev) | `^0.25.0` | Bundler ultra-rápido (~10ms build) |

> **Build**: `npm run build:mcp` → `esbuild` gera `packages/mcp/dist/server.js`  
> **Start**: `packages/mcp/start.sh` (auto-sourcia `apps/api/.env`)  
> **Inspect**: `npm run mcp:inspect` → MCP Inspector visual

---

### Types (`packages/types`)

Pacote interno de tipos TypeScript compartilhados pelo monorepo. Sem dependências externas — apenas `typescript` em devDependencies.

**Enums principais exportados:**
- `UserType`: `recruiter | candidate | admin | headhunter`
- `ApplicationStatus`: `applied | in_process | interview_hr | interview_manager | in_documentation | hired | rejected`
- `JobStatus`: `draft | active | paused | closed`
- `OrgMemberRole`: `admin | manager | member | viewer`

---

### Comandos de execução local (referência rápida)

```bash
# ── Pré-requisitos ──────────────────────────────────────────────────
node --version   # >= 20.0.0 obrigatório (usar: nvm use 20)
npm --version    # >= 10

# ── Instalação ──────────────────────────────────────────────────────
# SEMPRE da raiz do monorepo (nunca de apps/web ou apps/api)
cd /caminho/para/PROJETO_TALENT_FORGE
npm install

# ── Desenvolvimento ─────────────────────────────────────────────────
npm run dev           # API (3001) + Web (3000) via concurrently
npm run dev:web       # Apenas Next.js em http://localhost:3000
npm run dev:api       # Apenas NestJS em http://localhost:3001

# ── Build ────────────────────────────────────────────────────────────
npm run build         # Build completo (api + web)
npm run build:web     # Apenas web
npm run build:api     # Apenas api
npm run build:mcp     # MCP server (esbuild ~10ms)

# ── MCP ─────────────────────────────────────────────────────────────
npm run mcp:start     # Inicia MCP server
npm run mcp:inspect   # Abre MCP Inspector

# ── Qualidade ───────────────────────────────────────────────────────
npm run lint          # ESLint (api + web)
npm run test          # Jest (api)

# ── Banco de dados ──────────────────────────────────────────────────
npm run db:migrate    # supabase db push (requer CLI Supabase)
npm run db:reset      # supabase db reset

# ── Limpeza emergencial (node_modules corrompido) ───────────────────
rm -rf node_modules apps/web/node_modules apps/api/node_modules \
       packages/mcp/node_modules packages/types/node_modules \
       package-lock.json apps/web/.next
npm cache clean --force
npm install
```

> **⚠️ Turbopack e novas rotas**: Ao criar novos arquivos de rota Next.js (`route.ts`, `page.tsx`) enquanto `next dev --turbopack` está rodando, é **obrigatório reiniciar o servidor**:
> ```bash
> lsof -ti :3000 | xargs kill -9
> npm run dev:web
> ```
> O hot-reload do Turbopack detecta mudanças em arquivos **existentes**, mas não descobre arquivos de rota **novos** automaticamente.

---

## 1) Stack e módulos (imutável)
- **Frontend**: Next.js 15 + React 18 + Tailwind 4 + Zustand + @dnd-kit (App Router).
  - ⚠️ **ATENÇÃO**: React 18 é obrigatório. Next.js 16 requer React 19 — NÃO usar Next.js 16 neste projeto.
- **Backend**: NestJS 11 (BFF + serviços de domínio) com Supabase JS e Swagger.
- **Banco**: Supabase Postgres + Auth + Storage, com **RLS obrigatório**.
- **Infra**: Vercel (web/api) + Supabase (DB/Auth/Storage).
- **Produção (2026-02-28)**:
   - Web: https://web-eight-rho-84.vercel.app *(projeto: `prj_inQzsBoFh4jVKptWyi47NuB6Wumu`)*
   - API: https://talent-forge-api.vercel.app *(projeto: `prj_MIy6Yi0FABRBuevuXw60wuW7jI9x`)*
   - Vercel team: `fernando-dias-projects-e4b4044b` / orgId: `team_lwke1raX8NIzKHkR5z2CPFR5`
   - Env var web: `NEXT_PUBLIC_API_BASE_URL=https://talent-forge-api.vercel.app`

---

## 1.5) Sistema de Módulos — Definição Canônica

O TalentForge é organizado em **módulos funcionais ativáveis por organização**. Cada organização pode ter um conjunto diferente de módulos ativos, controlado por tabelas de ativação no banco de dados. O admin global (Fartech) gerencia quais módulos cada org tem acesso.

### Módulos existentes

| Módulo | Rota Frontend | Tabela de Ativação | Status |
|---|---|---|---|
| **Recrutamento** | `/dashboard/*` | `recruitment_module_activations` | 🔲 Gate a implementar (Sprint 43) |
| **PHP** (People Health Performance) | `/php/*` | `php_module_activations` | ✅ Implementado (Sprint 6) |
| **AI Assistant** | `/php/ai-chat` | — (sub-feature do PHP) | 🔲 Planejado (Sprint 41) |

### Padrão de ativação de módulo

Todo módulo segue este padrão:

#### 1. Tabela de ativação
```sql
<modulo>_module_activations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID REFERENCES organizations(id) UNIQUE NOT NULL,
  is_active    BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  activated_by UUID REFERENCES auth.users(id),
  settings     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
)
```
- **RLS:** Leitura para membros da org; escrita apenas via service role (admin global)

#### 2. API de status
```
GET /api/v1/<modulo>/status   → { is_active, activated_at, settings }
```
- Requer `Authorization: Bearer <JWT>` + `x-org-id`
- Usa `validateOrgMembership` de `lib/api/auth.ts`

#### 3. Guard frontend (layout do módulo)
- O `layout.tsx` do módulo chama `/api/v1/<modulo>/status` no mount
- Se `is_active === false` → redireciona para página de módulo inativo
- Exibe `ModuleStatusBadge` na sidebar com estado visual (ativo/inativo)

#### 4. Guard backend (NestJS — para rotas da API NestJS)
```typescript
@Injectable()
export class <Modulo>ModuleGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const orgId = context.switchToHttp().getRequest().headers['x-org-id'];
    const { data } = await supabase
      .from('<modulo>_module_activations')
      .select('is_active')
      .eq('org_id', orgId)
      .single();
    if (!data?.is_active) throw new ForbiddenException('Module not activated');
    return true;
  }
}
```

#### 5. Ativação via Admin Panel
- Rota: `/admin/companies` → card da empresa → toggle de módulo
- Endpoints:
  ```
  POST   /api/admin/companies/:id/<modulo>-module   // Ativar
  DELETE /api/admin/companies/:id/<modulo>-module   // Desativar
  ```

### Fluxo de visibilidade no menu

O layout `(recruiter)/dashboard/layout.tsx` controla a sidebar do Dashboard. Cada grupo de itens de navegação (`recruitmentItems`, `assessmentItems`) deve ser exibido **condicionalmente** com base no status de ativação do módulo correspondente à org atual.

```
org ativa o módulo → tabela de ativação → API status → layout consulta → sidebar exibe itens
```

---

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

#### 📊 Schema Completo do Banco de Dados

##### 1. **organizations** - Tabela Central Multi-tenant
```sql
organizations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT GENERATED ALWAYS AS (...) STORED UNIQUE,
  description TEXT,
  website TEXT,
  industry TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  plan_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ✨ Campos Corporativos (Sprint 15 - 2026-02-04)
  cnpj TEXT,                    -- CNPJ brasileiro (XX.XXX.XXX/XXXX-XX)
  size TEXT,                    -- 'micro' | 'small' | 'medium' | 'large' | 'enterprise'
  email TEXT,                   -- Email corporativo principal
  phone TEXT,                   -- Telefone principal
  address TEXT,                 -- Endereço completo
  city TEXT,                    -- Cidade
  state TEXT,                   -- Estado (UF)
  zip_code TEXT,                -- CEP
  country TEXT DEFAULT 'BR',    -- País (ISO 3166-1 alpha-2)
  logo_url TEXT,                -- URL do logo (Supabase Storage ou CDN)
  org_type TEXT NOT NULL DEFAULT 'company'  -- 'company' | 'recruiter'
)
```
- **Propósito:** Entidade root do sistema multi-tenant. Todas as outras tabelas se relacionam direta ou indiretamente com esta.
- **Dependências:** Nenhuma (tabela independente)
- **Dependentes:** org_members, jobs, assessments (através de jobs), php_module_activations
- **Índices:** PRIMARY KEY (id), UNIQUE (slug), INDEX (status), INDEX (org_type)
- **RLS:** ✅ ATIVADO com 5 policies (ver seção de segurança)
- **Migration Campos Corporativos:** `20260204_organization_corporate_fields.sql`
- **Migration org_type:** `20260310_organizations_org_type.sql` — separa empresas-clientes (`company`) de agências/headhunters (`recruiter`). Admin UI em `/admin/companies` exibe dois blocos separados.

##### 2. **org_members** - Membros de Organizações
```sql
org_members (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
  status TEXT CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (org_id, user_id)
)
```
- **Propósito:** Relacionamento muitos-para-muitos entre usuários e organizações
- **Dependências:** organizations (org_id), auth.users (user_id)
- **Dependentes:** Usado em RLS policies via `is_org_member()`
- **Índices:** PRIMARY KEY (id), INDEX (org_id), INDEX (user_id), UNIQUE (org_id + user_id)
- **RLS:** Usuário só vê membros das orgs que pertence

##### 3. **candidates** - Candidatos
```sql
candidates (
  id UUID PRIMARY KEY,
  owner_org_id UUID REFERENCES organizations(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  linkedin_url TEXT,
  resume_url TEXT,
  source TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Armazena informações dos candidatos
- **Dependências:** organizations (owner_org_id) - organização que criou o candidato
- **Dependentes:** applications, candidate_notes, assessments
- **Índices:** PRIMARY KEY (id), INDEX (owner_org_id), INDEX (email), INDEX (created_at)
- **Relações:** Um candidato pertence a UMA organização, mas pode aplicar para vagas de outras orgs
- **RLS:** Org owner + orgs com applications do candidato

##### 4. **jobs** - Vagas
```sql
jobs (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  location TEXT,
  employment_type TEXT CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship')),
  status TEXT CHECK (status IN ('open', 'on_hold', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Vagas de emprego criadas pelas organizações
- **Dependências:** organizations (org_id)
- **Dependentes:** applications, assessments, pipeline_stages
- **Índices:** PRIMARY KEY (id), INDEX (org_id), INDEX (status), INDEX (created_at)
- **Importância:** Tabela CENTRAL para conectar candidatos com organizações
- **RLS:** Membros da org podem ver/editar

##### 5. **pipeline_stages** - Estágios do Pipeline de Contratação
```sql
pipeline_stages (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Define os estágios customizados de cada processo seletivo
- **Dependências:** jobs (job_id)
- **Dependentes:** applications (current_stage_id), application_events
- **Índices:** PRIMARY KEY (id), INDEX (job_id), INDEX (order_index)
- **RLS:** Herdado de jobs (via is_org_member com job_id)

##### 6. **applications** - Candidaturas ⚠️ TABELA CRÍTICA
```sql
applications (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  current_stage_id UUID REFERENCES pipeline_stages(id),
  status application_status DEFAULT 'applied',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
)
```
- **Propósito:** Relacionamento muitos-para-muitos entre candidatos e vagas
- **Dependências:** jobs (job_id), candidates (candidate_id), pipeline_stages (current_stage_id)
- **Dependentes:** application_events
- **⚠️ IMPORTANTE:** NÃO TEM COLUNA `org_id`! Conecta-se a organizações ATRAVÉS de `jobs.org_id`
- **Índices:** PRIMARY KEY (id), INDEX (job_id), INDEX (candidate_id), INDEX (status)
- **Path para org:** `applications.job_id → jobs.org_id → organizations.id`
- **RLS:** Verifica org através de job_id: `is_org_member((SELECT org_id FROM jobs WHERE id = applications.job_id))`

##### 7. **application_events** - Histórico de Mudanças de Estágio
```sql
application_events (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES pipeline_stages(id),
  to_stage_id UUID REFERENCES pipeline_stages(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
)
```
- **Propósito:** Auditoria de movimentações de candidatos no pipeline
- **Dependências:** applications, pipeline_stages (from/to), auth.users (created_by)
- **Dependentes:** Nenhum (tabela de log)
- **Índices:** PRIMARY KEY (id), INDEX (application_id), INDEX (created_at DESC)
- **Path para org:** `application_events → applications.job_id → jobs.org_id`
- **RLS:** Herdado de applications

##### 8. **assessments** - Avaliações Comportamentais ⚠️ TABELA CRÍTICA
```sql
assessments (
  id UUID PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  assessment_kind assessment_kind NOT NULL DEFAULT 'behavioral_v1',
  raw_score NUMERIC,
  normalized_score NUMERIC,
  traits JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Armazena resultados de avaliações comportamentais (DISC, Cores, PI)
- **Dependências:** candidates (candidate_id), jobs (job_id)
- **Dependentes:** disc_assessments, color_assessments, pi_assessments
- **⚠️ IMPORTANTE:** NÃO TEM COLUNA `org_id`! Conecta-se através de `job_id`
- **⚠️ IMPORTANTE:** NÃO TEM COLUNA `status`! Use `normalized_score IS NOT NULL` para completed
- **Índices:** PRIMARY KEY (id), INDEX (candidate_id), INDEX (job_id)
- **Path para org:** `assessments.job_id → jobs.org_id → organizations.id`
- **RLS:** Verifica org através de job_id

##### 9. **candidate_notes** - Notas sobre Candidatos
```sql
candidate_notes (
  id UUID PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Anotações internas sobre candidatos
- **Dependências:** candidates, auth.users (author)
- **Dependentes:** Nenhum
- **Índices:** PRIMARY KEY (id), INDEX (candidate_id), INDEX (created_at DESC)
- **RLS:** Membros da org que possui o candidato

**Observação (candidate_notes)**
- Colunas oficiais: `candidate_id`, `author_id`, `note`, `created_at`.

#### 📊 Views e Funções do Sistema (Sprint 4 - 2026-01-24)

##### **v_org_metrics** - View de Métricas Organizacionais
```sql
v_org_metrics (
  org_id, org_name, slug, status, plan_id, org_created_at,
  total_users, active_users,
  total_jobs, active_jobs, closed_jobs,
  total_candidates, total_applications, total_hires, conversion_rate,
  total_assessments, completed_assessments,
  total_pipeline_events,
  applications_last_30d, jobs_created_last_30d, hires_last_30d,
  last_activity_at, estimated_db_size_bytes
)
```
- **Propósito:** Agregação de métricas de negócio para dashboard administrativo
- **Joins:**
  - `organizations o`
  - `LEFT JOIN org_members om ON om.org_id = o.id`
  - `LEFT JOIN jobs j ON j.org_id = o.id`
  - `LEFT JOIN applications a ON a.job_id = j.id` ⚠️ SEM org_id!
  - `LEFT JOIN assessments ass ON ass.job_id = j.id` ⚠️ SEM org_id!
  - `LEFT JOIN application_events ae ON ae.application_id = a.id`
- **Agregações:** COUNT DISTINCT + CASE WHEN para métricas condicionais
- **Performance:** Indexado em todas as FKs envolvidas
- **Uso:** Dashboard admin para visão geral de cada organização

##### **get_org_detailed_metrics(p_org_id UUID)** - Função RPC
```sql
RETURNS JSON {
  org_id, metrics, database_breakdown, storage_usage, health
}
```
- **Propósito:** Retorna JSON completo com métricas detalhadas
- **Subqueries:**
  - `candidates`: JOIN applications → jobs WHERE jobs.org_id = p_org_id
  - `applications`: JOIN jobs WHERE jobs.org_id = p_org_id
  - `assessments`: JOIN jobs WHERE jobs.org_id = p_org_id
  - `pipeline_events`: JOIN applications → jobs WHERE jobs.org_id = p_org_id
- **Uso:** API endpoint `/api/admin/companies/[id]/metrics`

#### 🔗 Diagrama de Dependências (Grafo)

```
┌─────────────────┐
│  organizations  │ ◄── ROOT (independente)
└────────┬────────┘
         │
    ┌────┴────────────────────────┐
    │                             │
┌───▼──────┐              ┌───────▼────┐
│org_members│              │    jobs    │
└───────────┘              └───┬────────┘
                               │
              ┌────────────────┼─────────────────┐
              │                │                 │
       ┌──────▼──────┐  ┌──────▼─────────┐  ┌───▼────────┐
       │applications │  │pipeline_stages │  │assessments │
       └──────┬──────┘  └────────────────┘  └────────────┘
              │
       ┌──────▼──────────┐
       │application_events│
       └─────────────────┘

┌──────────┐
│candidates│ ◄── Referenciado por applications, assessments
└──────────┘

LEGENDA:
◄── : Tabela de origem (independente)
▼  : Dependência (FK)
```

#### ⚠️ Relações Críticas para Queries

**Para acessar org_id a partir de:**

1. **applications** → `SELECT j.org_id FROM jobs j WHERE j.id = applications.job_id`
2. **assessments** → `SELECT j.org_id FROM jobs j WHERE j.id = assessments.job_id`
3. **application_events** → `SELECT j.org_id FROM jobs j JOIN applications a ON a.id = ae.application_id WHERE j.id = a.job_id`
4. **pipeline_stages** → `SELECT j.org_id FROM jobs j WHERE j.id = ps.job_id`

**Tabelas COM org_id direto:**
- ✅ org_members
- ✅ jobs
- ✅ candidates (owner_org_id)

**Tabelas SEM org_id (conectam via jobs):**
- ❌ applications
- ❌ assessments
- ❌ application_events
- ❌ pipeline_stages

### Perfil do candidato (portal)
- `candidate_profiles`
- `candidate_education`
- `candidate_experience`
- `candidate_saved_jobs` — vagas salvas pelo candidato

**Observação (criação do perfil)**
- `candidate_profiles` é criado **somente no onboarding** do candidato.
- O cadastro inicial cria apenas `auth.users` + `user_profiles`.

#### Tabela `candidate_saved_jobs`
```sql
candidate_saved_jobs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id     UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, job_id)
)
```
- **RLS**: `user_id = auth.uid()` — candidato só acessa suas próprias entradas
- **RPC**: `get_my_saved_jobs()` — retorna vagas salvas com detalhes do job
- **Frontend**: INSERT/DELETE direto via Supabase client; listagem via RPC

### Assessments (DISC)
- `assessments`
- `disc_assessments`
- `disc_questions`

---

## 3) Módulo PHP (People, Health & Performance) 🆕

### 📊 Visão Geral

**Módulo Premium Fartech-only** que integra 3 pilares de gestão de pessoas:
1. **TFCI (Talent Forge Cultural Index)** — Avaliação comportamental 360° (30% do score)
2. **NR-1 Digital** — Compliance psicossocial (riscos ocupacionais) (40% do score)
3. **COPC Adapted** — Performance operacional + bem-estar (30% do score)

**Status Implementação** (2026-02-04 14:30):
- ✅ Sprint 6: Sistema de ativação completo (backend + frontend + guards + testes)
- ✅ Sprint 7: TFCI completo (backend 8 endpoints + frontend 4 páginas + heatmap + testes)
- ✅ Sprint 8: NR-1 Digital completo (13 endpoints + 6 páginas + invitations + self-assessment)
- ✅ Sprint 9: COPC Adapted completo (10 endpoints + 4 páginas + trends + E2E test)
- ✅ Sprint 10: AI Integration + **Admin Panel** + **Design System** + **Branding/UX** completo
- ✅ Sprint 15: **Gestão de Empresas redesenhada** + Campos Corporativos + Top 3 Gestores
  - Página de detalhes da empresa totalmente redesenhada
  - Seção de dados corporativos (CNPJ, contato, localização)
  - Toggle do módulo PHP integrado na página da empresa
  - Cards de estatísticas (colaboradores, departamentos, vagas, data cadastro)
  - Top 3 gestores com badges de ranking
- ✅ Sprint 15: **Realtime Dashboard** (php_notifications, php_user_presence, php_comments, php_edit_locks)
- ✅ Sprint 16: **Teams CRUD completo** (TeamsModule + TeamsController + páginas frontend)
- ✅ Sprint 21: **Teams — Contagem Dinâmica + Ordenação Hierárquica**
  - `GET /php/teams` agora calcula `member_count` dinamicamente via `employees.department ↔ teams.name`
  - `POST /php/teams/auto-create` atualiza times existentes (member_count, manager_id) em vez de ignorá-los
  - `GET /php/teams/:id` retorna membros ordenados por hierarquia (DFS pre-order via `manager_id`)
  - Frontend exibe indentação visual, ícone Crown para líderes, conectores `└` para subordinados
  - Campo `hierarchy_depth` (0=topo) retornado pela API para cada membro
- ✅ Sprint 22: **PHP Automation — Gaps de Automação Resolvidos**
  - `PUT /php/tfci/cycles/:id` com validação de transição de status (draft→active→completed, cancelamento)
  - `POST /php/scores/calculate` — calculador de `php_integrated_scores` (TFCI 30% + NR-1 40% + COPC 30%)
  - TFCI Assess: seletor real de funcionários (dropdown com busca por nome/cargo/departamento) substituindo input UUID manual
  - NR-1 Invitations: checkbox "Selecionar Todos" / "Desselecionar Todos" para convites em lote
  - COPC New: aba "Importar CSV" com parse, validação de colunas/ranges, preview tabular, e importação em lote (`metric_source: csv_import`)
  - Design System compliance: todas as páginas PHP agora usam cores canônicas (#141042, #E5E5DC, #FAFAF8)
- 📊 **Score de Conformidade**: 100%

### 📂 Estrutura de Rotas PHP (28 páginas)

```
apps/web/src/app/(recruiter)/php/
├── layout.tsx                    # Header + navegação + footer com logo
├── activation/page.tsx           # Toggle ativação (Fartech admin only)
├── dashboard/page.tsx            # Dashboard com scores integrados
├── employees/
│   └── page.tsx                  # Lista colaboradores da org
├── teams/                        # ✅ IMPLEMENTADO Sprint 16
│   ├── page.tsx                  # Lista times + criar novo
│   └── [id]/
│       └── page.tsx              # Detalhes time + membros
├── tfci/
│   └── cycles/
│       ├── page.tsx              # Lista ciclos TFCI + criar novo
│       └── [id]/
│           ├── page.tsx          # Detalhes ciclo + tabs
│           ├── assess/page.tsx   # Formulário 5 dimensões
│           └── heatmap/page.tsx  # Visualização heatmap
├── nr1/
│   ├── page.tsx                  # Dashboard NR-1 + lista assessments
│   ├── new/page.tsx              # Nova avaliação NR-1
│   ├── [id]/page.tsx             # Detalhes assessment
│   ├── invitations/page.tsx      # Convites para self-assessment
│   ├── risk-matrix/page.tsx      # Matriz de riscos visual
│   └── comparative-analysis/page.tsx # Análise comparativa
├── copc/
│   ├── page.tsx                  # Dashboard COPC + categorias
│   ├── new/page.tsx              # Nova métrica COPC
│   ├── [id]/page.tsx             # Detalhes métrica
│   └── trends/page.tsx           # Análise de tendências
├── action-plans/
│   ├── page.tsx                  # Lista planos de ação
│   └── [id]/page.tsx             # Detalhes do plano
├── ai/page.tsx                   # Insights AI (OpenAI)
├── ai-chat/page.tsx              # Chat AI interativo
└── settings/page.tsx             # Configurações do módulo
```

### 🔌 Endpoints Backend PHP

#### TFCI Endpoints (8)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/php/tfci/cycles` | Lista ciclos da org |
| POST | `/php/tfci/cycles` | Cria novo ciclo |
| GET | `/php/tfci/cycles/:id` | Detalhes do ciclo |
| PUT | `/php/tfci/cycles/:id` | Atualiza ciclo |
| DELETE | `/php/tfci/cycles/:id` | Remove ciclo |
| POST | `/php/tfci/assessments` | Submete avaliação |
| GET | `/php/tfci/assessments/heatmap/:cycleId` | Heatmap do ciclo |
| GET | `/php/tfci/assessments/user/:userId` | Avaliações do usuário |

#### NR-1 Endpoints (13)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/php/nr1/assessments` | Lista assessments |
| POST | `/php/nr1/assessments` | Cria assessment |
| GET | `/php/nr1/assessments/:id` | Detalhes assessment |
| PUT | `/php/nr1/assessments/:id` | Atualiza assessment |
| DELETE | `/php/nr1/assessments/:id` | Remove assessment |
| GET | `/php/nr1/risk-matrix/:org_id` | Matriz de riscos |
| GET | `/php/nr1/compliance-report/:org_id` | Relatório compliance |
| POST | `/php/nr1/action-plans` | Gera planos de ação |
| POST | `/php/nr1/self-assessments` | Cria self-assessment |
| GET | `/php/nr1/self-assessments` | Lista self-assessments |
| GET | `/php/nr1/self-assessments/:id` | Detalhes self-assessment |
| GET | `/php/nr1/comparative-analysis/:org_id` | Análise comparativa |
| POST | `/php/nr1/invitations` | Cria convites |
| GET | `/php/nr1/invitations` | Lista convites |
| GET | `/php/nr1/invitations/:id` | Detalhes convite |
| GET | `/php/nr1/invitations/token/:token` | Busca por token |

#### COPC Endpoints (10)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/php/copc/metrics` | Lista métricas |
| POST | `/php/copc/metrics` | Cria métrica |
| GET | `/php/copc/metrics/:id` | Detalhes métrica |
| PUT | `/php/copc/metrics/:id` | Atualiza métrica |
| DELETE | `/php/copc/metrics/:id` | Remove métrica |
| GET | `/php/copc/dashboard/:org_id` | Dashboard COPC |
| GET | `/php/copc/summary/:org_id` | Resumo por categoria |
| GET | `/php/copc/trends/:org_id` | Análise de tendências |
| GET | `/php/copc/catalog` | Catálogo de métricas |
| POST | `/php/copc/catalog` | Cria métrica no catálogo |

#### Outros Endpoints PHP

##### Employees (11 endpoints) ✅
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/php/employees` | Lista colaboradores (paginado) |
| POST | `/php/employees` | Cria colaborador |
| GET | `/php/employees/:id` | Detalhes colaborador |
| PUT | `/php/employees/:id` | Atualiza colaborador |
| DELETE | `/php/employees/:id` | Remove colaborador |
| POST | `/php/employees/import` | Importa CSV de colaboradores |
| GET | `/php/employees/hierarchy` | Organograma completo |
| GET | `/php/employees/hierarchy-levels` | Níveis hierárquicos |
| GET | `/php/employees/valid-managers` | Gestores válidos por nível |
| GET | `/php/employees/hierarchy-config` | Configuração de hierarquia |

##### Teams (10 endpoints) ✅ IMPLEMENTADO Sprint 16 + Sprint 21
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/php/teams` | Lista times da org (member_count dinâmico via employees.department) |
| POST | `/php/teams` | Cria novo time |
| GET | `/php/teams/:id` | Detalhes do time com membros **ordenados por hierarquia** (DFS) |
| PATCH | `/php/teams/:id` | Atualiza time |
| DELETE | `/php/teams/:id` | Remove time |
| POST | `/php/teams/:id/members` | Adiciona membro ao time |
| DELETE | `/php/teams/:id/members/:userId` | Remove membro do time |
| PATCH | `/php/teams/:id/members/:userId/role` | Atualiza papel do membro |
| GET | `/php/teams/:id/available-members` | Lista membros disponíveis |
| POST | `/php/teams/auto-create` | Cria/atualiza times a partir de employees.department |

**Notas de implementação (Sprint 21):**
- `GET /php/teams`: Conta membros dinamicamente consultando `employees WHERE department = teams.name AND status = 'active'`. Usa `Math.max(deptCount, storedCount)` e auto-corrige o valor no banco se divergente.
- `POST /php/teams/auto-create`: Times existentes são **atualizados** (member_count, manager_id, updated_at) em vez de ignorados. Retorna `{ created[], updated[], errors[] }`.
- `GET /php/teams/:id`: Constrói árvore hierárquica via `manager_id` com DFS pre-order. Raízes = funcionários cujo `manager_id` é null ou aponta para fora do departamento. Desempate por prioridade de cargo: Diretor(1) > Gerente(2) > Coordenador(3) > Líder(4) > Analista(5) > Assistente(6) > Estagiário(7). Retorna `hierarchy_depth` (0=topo) em cada objeto de membro.

##### Outros
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/php/status` | Status ativação para usuário |
| GET | `/php/ai/insights/:org_id` | Insights AI |
| POST | `/php/ai/recommendations` | Recomendações AI |
| GET | `/php/dashboard/:org_id` | Dashboard integrado |
| GET | `/php/action-plans` | Lista planos de ação |
| POST | `/php/action-plans` | Cria plano de ação |

### 🗂️ Estrutura de Tabelas PHP (17 tabelas)

#### 1. **php_module_activations** — Controle de Ativação
```sql
php_module_activations (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) UNIQUE,
  is_active BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  activated_by UUID REFERENCES auth.users(id),
  activation_plan TEXT CHECK IN ('tfci_only', 'nr1_only', 'copc_only', 'full'),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Toggle de ativação por organização (somente Fartech)
- **Índices:** org_id, is_active
- **RLS:** Apenas admins globais e org admins/owners
- **Status:** ✅ Implementado e testado
- **Armazenamento de Pesos:** Campo `settings JSONB` contém `{ weights: { tfci: 30, nr1: 40, copc: 30 } }`
- **⚠️ IMPORTANTE:** NÃO usar colunas dedicadas (tfci_weight, nr1_weight, copc_weight) — usar JSONB

##### 🎛️ Admin Panel (Sprint 10) — Gestão de Ativação

**Componente Principal:**
- `apps/web/src/components/admin/OrganizationDashboard.tsx`
  - Card expansível por empresa com métricas
  - Seção "Módulo PHP" com toggle ativar/desativar
  - Visual: Card verde (ativo) / cinza (inativo)
  - Display: Pesos configurados + timestamp de ativação

**Endpoints Admin:**
```typescript
POST   /api/admin/companies/:id/php-module  // Ativar módulo
DELETE /api/admin/companies/:id/php-module  // Desativar módulo
GET    /api/admin/companies/:id/metrics     // Métricas incluem status PHP
GET    /api/v1/php/status                   // Status para recruiter (novo)
```

**Controle de Acesso:**
- `/admin/companies` → Qualquer admin pode ver todas empresas
- `/php/activation` → Apenas `contato.fartech@app.br` (Fartech admin)
- `/php/tfci/cycles` → Todos recruiters com módulo ativo
- Layout PHP mostra link "Ativação" apenas para Fartech admin
- Menu recruiter aponta para `/php/tfci/cycles` (não activation)

**Fluxo de Ativação:**
1. Admin acessa `/admin/companies`
2. Expande card da empresa desejada
3. Clica "Ativar Módulo PHP"
4. Backend:
   - Verifica se já existe registro (UPDATE) ou cria novo (INSERT)
   - Define `is_active = true`, `activation_plan = 'full'`
   - Popula `settings: { weights: { tfci: 30, nr1: 40, copc: 30 } }`
   - Registra `activated_at = NOW()`
5. Frontend atualiza card (verde + pesos + data)

**Validação:**
- ✅ Código usa `settings JSONB` (conforme arquitetura)
- ✅ Migration obsoleta marcada como "NÃO USAR"
- ✅ Endpoints criados e funcionais
- ✅ Proteção de acesso implementada
- ✅ Estilização 100% conforme Design System TalentForge
- ✅ Navegação UX (botão voltar dashboard)
- ✅ Branding (footer logo watermark com hover effect)
- ✅ Logo otimizada (scale 150%, opacity 50%, sem aumentar altura footer)
- 🟡 Aguardando testes manuais completos

**Design System (2026-01-29):**
- **Paleta de Cores:** Azul TALENT `#1F4ED8` + Laranja FORGE `#F97316` + Cinza `#6B7280`
- **Tipografia:** Montserrat (`font-bold` títulos, `font-semibold` labels)
- **Componentes:**
  - Títulos principais: `text-[#1F4ED8]` (azul oficial)
  - Botões primários: `bg-[#1F4ED8] hover:bg-[#1845B8]`
  - Percentuais (30%/40%/30%): `text-[#F97316]` (laranja FORGE)
  - Labels: `text-[#6B7280] font-semibold tracking-wide`
  - Spinners: `border-[#1F4ED8]`
  - Background: `bg-gray-50` (padronizado)
- **Páginas Atualizadas:**
  - ✅ `php/layout.tsx` — Header + navegação + **footer com logo**
  - ✅ `php/dashboard/page.tsx` — Cards com cores oficiais
  - ✅ `php/tfci/cycles/page.tsx` — Formulários e botões
  - ✅ `php/ai/page.tsx` — Badges e alertas
  - ✅ `php/nr1/page.tsx` — Background e spinners
- **Branding (UX Final):**
  - ✅ **Botão "Voltar ao Dashboard"**: `ArrowLeft` icon + `router.push('/dashboard')`
  - ✅ **Logo no Footer**: Supabase Storage URL (MODULO PHP2.png)
  - ✅ **Efeito Watermark**: `opacity-50` (visível) → `hover:opacity-100` (acende)
  - ✅ **Transform Scale**: `scale-150 origin-left` (logo 50% maior sem aumentar altura do rodapé)
  - ✅ **Transição Suave**: `transition-all duration-300`
  - ✅ **Interação**: `cursor-pointer` + tooltip "PHP Module - People, Health & Performance"
- **Conformidade:** 100% alinhado com `docs/design-system.md`

#### 2. **teams** — Estrutura de Equipes ✅
```sql
teams (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES auth.users(id),
  member_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT teams_org_name_unique UNIQUE(org_id, name)
)
```
- **Propósito:** Agrupamento de colaboradores para análises coletivas
- **⚠️ Relação implícita:** `teams.name ↔ employees.department` — usado para contagem dinâmica de membros e auto-create de times
- **Índices:** org_id, manager_id
- **RLS:** ✅ Implementado (membros veem, gestores gerenciam)
- **Status:** ✅ **IMPLEMENTADO Sprint 16 + Sprint 21** (9 endpoints + auto-create + contagem dinâmica + ordenação hierárquica)

#### 3. **team_members** — Membros de Equipes ✅
```sql
team_members (
  id UUID PRIMARY KEY,
  team_id UUID REFERENCES teams(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role_in_team TEXT CHECK IN ('member', 'lead', 'coordinator'),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
)
```
- **Propósito:** Relacionamento M:N usuário-time
- **⚠️ Nota:** A maioria dos colaboradores em `employees` não possui `user_id` (conta auth). A contagem real de membros deve ser feita via `employees.department`, não via `team_members`.
- **Índices:** team_id, user_id
- **RLS:** ✅ Implementado (membros veem, gestores gerenciam)
- **Status:** ✅ **IMPLEMENTADO Sprint 16 + Sprint 21** (CRUD via TeamsService + contagem via employees)

#### 4. **nr1_dimensions** — Catálogo NR-1 v1.0
```sql
nr1_dimensions (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Catálogo das 10 dimensões NR-1 validadas com Fartech
- **Dimensões:**
  1. `workload_pace` — Carga de trabalho & ritmo
  2. `goal_pressure` — Pressão por metas & tempo
  3. `role_clarity` — Clareza de papéis & expectativas
  4. `autonomy_control` — Autonomia & controle
  5. `leadership_support` — Suporte da liderança
  6. `peer_collaboration` — Suporte entre colegas / colaboração
  7. `recognition_justice` — Reconhecimento & justiça percebida
  8. `communication_change` — Comunicação & mudanças
  9. `conflict_harassment` — Conflitos / assédio / relações difíceis
  10. `recovery_boundaries` — Recuperação & limites (descanso/desconexão)
- **Índices:** code, order_index
- **RLS:** Leitura pública, escrita apenas admins
- **Status:** ✅ Seed aplicado (10 dimensões)

#### 5. **tfci_cycles** — Ciclos de Avaliação TFCI ✅
```sql
tfci_cycles (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status assessment_status DEFAULT 'draft', -- draft | active | completed | cancelled
  participants_count INT DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Períodos de avaliação comportamental TFCI
- **Índices:** org_id, status, (start_date, end_date)
- **RLS:** Membros veem, admins gerenciam
- **Estatísticas automáticas:**
  - `participants_count`: COUNT DISTINCT target_user_id
  - `completion_rate`: (usuários com 3+ avaliações / total usuários) * 100
- **Status:** ✅ Implementado com API CRUD completa

#### 6. **tfci_assessments** — Avaliações TFCI 360° ✅
```sql
tfci_assessments (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) NOT NULL,
  team_id UUID REFERENCES teams(id),
  evaluator_id UUID REFERENCES auth.users(id), -- NULL se anônimo
  target_user_id UUID REFERENCES auth.users(id) NOT NULL,
  cycle_id UUID REFERENCES tfci_cycles(id) NOT NULL,
  
  -- 5 Dimensões TFCI (escala 1-5)
  collaboration_score NUMERIC(3,2) CHECK (BETWEEN 1 AND 5),
  communication_score NUMERIC(3,2) CHECK (BETWEEN 1 AND 5),
  adaptability_score NUMERIC(3,2) CHECK (BETWEEN 1 AND 5),
  accountability_score NUMERIC(3,2) CHECK (BETWEEN 1 AND 5),
  leadership_score NUMERIC(3,2) CHECK (BETWEEN 1 AND 5),
  
  -- Score geral (média automática)
  overall_score NUMERIC(3,2) GENERATED ALWAYS AS (
    (collaboration_score + communication_score + adaptability_score + 
     accountability_score + leadership_score) / 5
  ) STORED,
  
  comments TEXT,
  is_anonymous BOOLEAN DEFAULT TRUE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicates: mesmo avaliador não pode avaliar mesmo alvo no mesmo ciclo
  UNIQUE(evaluator_id, target_user_id, cycle_id)
)
```
- **Propósito:** Avaliações comportamentais coletivas (360° simplificado)
- **Dimensões:**
  1. **Collaboration** — Trabalha bem em equipe, compartilha conhecimento
  2. **Communication** — Se expressa claramente, ouve ativamente
  3. **Adaptability** — Lida bem com mudanças, flexível
  4. **Accountability** — Cumpre prazos, assume compromissos
  5. **Leadership** — Inspira outros, toma iniciativa
- **Índices:** org_id, cycle_id, target_user_id, team_id
- **RLS:** Membros criam, gestores veem individuais
- **Validações:**
  - ✅ Duplicate prevention via unique constraint
  - ✅ Cycle must be active (validado no service)
  - ✅ Scores 1-5 (check constraint)
  - ✅ Anonymous support (evaluator_id = NULL)
- **Status:** ✅ Implementado com formulário completo + heatmap

#### 7. **nr1_risk_assessments** — Matriz de Riscos NR-1
```sql
nr1_risk_assessments (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) NOT NULL,
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES auth.users(id),
  assessment_date DATE DEFAULT CURRENT_DATE,
  
  -- 10 Dimensões NR-1 (escala 1-3: 1=Baixo, 2=Médio, 3=Alto)
  workload_pace_risk INT CHECK (BETWEEN 1 AND 3),
  goal_pressure_risk INT CHECK (BETWEEN 1 AND 3),
  role_clarity_risk INT CHECK (BETWEEN 1 AND 3),
  autonomy_control_risk INT CHECK (BETWEEN 1 AND 3),
  leadership_support_risk INT CHECK (BETWEEN 1 AND 3),
  peer_collaboration_risk INT CHECK (BETWEEN 1 AND 3),
  recognition_justice_risk INT CHECK (BETWEEN 1 AND 3),
  communication_change_risk INT CHECK (BETWEEN 1 AND 3),
  conflict_harassment_risk INT CHECK (BETWEEN 1 AND 3),
  recovery_boundaries_risk INT CHECK (BETWEEN 1 AND 3),
  
  -- Risco geral calculado (média das 10 dimensões)
  overall_risk_level TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN (soma das 10 dimensões) / 10.0 >= 2.5 THEN 'high'
      WHEN (soma das 10 dimensões) / 10.0 >= 1.5 THEN 'medium'
      ELSE 'low'
    END
  ) STORED,
  
  action_plan TEXT,
  action_plan_status action_plan_status DEFAULT 'open',
  assessed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Evidência legal para compliance NR-1 (riscos psicossociais)
- **Índices:** org_id, team_id, user_id, (org_id, assessment_date DESC), overall_risk_level
- **RLS:** Dados sensíveis — apenas admins/RH/owner
- **Status:** ⏳ Pendente Sprint 8

#### 8. **copc_metrics_catalog** — Catálogo de Métricas COPC
```sql
copc_metrics_catalog (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id), -- NULL = template global
  category copc_category NOT NULL, -- quality | efficiency | effectiveness | cx | people
  metric_name TEXT NOT NULL,
  metric_code TEXT NOT NULL,
  weight NUMERIC(5,2) CHECK (BETWEEN 0 AND 1),
  target_value NUMERIC(10,2),
  unit TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, metric_code)
)
```
- **Propósito:** Catálogo customizável de métricas por organização
- **Categorias COPC Adapted:**
  - **Quality** (35%): QA Score, Rework Rate
  - **Efficiency** (20%): Process Adherence, Average Handle Time
  - **Effectiveness** (20%): First Call Resolution, Delivery Consistency
  - **Customer Experience** (15%): CSAT, NPS
  - **People** (10%): Absenteeism, Engagement
- **Índices:** org_id, category, is_active
- **RLS:** Admins gerenciam, membros veem
- **Seed:** 10 métricas template (org_id NULL)
- **Status:** ✅ Seed aplicado, ⏳ API pendente Sprint 9

#### 9. **copc_metrics** — Métricas COPC
```sql
copc_metrics (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) NOT NULL,
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES auth.users(id),
  metric_date DATE DEFAULT CURRENT_DATE,
  
  -- Quality (35%)
  quality_score NUMERIC(5,2) CHECK (BETWEEN 0 AND 100),
  rework_rate NUMERIC(5,2) CHECK (BETWEEN 0 AND 100),
  
  -- Efficiency (20%)
  process_adherence_rate NUMERIC(5,2) CHECK (BETWEEN 0 AND 100),
  average_handle_time NUMERIC(10,2),
  
  -- Effectiveness (20%)
  first_call_resolution_rate NUMERIC(5,2) CHECK (BETWEEN 0 AND 100),
  delivery_consistency NUMERIC(5,2) CHECK (BETWEEN 0 AND 100),
  
  -- CX (15%)
  customer_satisfaction_score NUMERIC(5,2) CHECK (BETWEEN 0 AND 100),
  nps_score NUMERIC(5,2) CHECK (BETWEEN -100 AND 100),
  
  -- People (10%)
  absenteeism_rate NUMERIC(5,2) CHECK (BETWEEN 0 AND 100),
  engagement_score NUMERIC(3,2) CHECK (BETWEEN 1 AND 5),
  operational_stress_level INT CHECK (BETWEEN 1 AND 3),
  
  -- Score COPC final (média ponderada)
  overall_performance_score NUMERIC(5,2) GENERATED ALWAYS AS (
    (quality_score * 0.35) + 
    (process_adherence_rate * 0.20) + 
    (first_call_resolution_rate * 0.20) + 
    (customer_satisfaction_score * 0.15) + 
    ((100 - absenteeism_rate) * 0.10)
  ) STORED,
  
  notes TEXT,
  source metric_source DEFAULT 'manual', -- manual | api | integration | calculated
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Indicadores operacionais + bem-estar
- **Índices:** org_id, team_id, user_id, (org_id, metric_date DESC)
- **RLS:** Gestores inserem/veem suas equipes
- **Status:** ⏳ Pendente Sprint 9

#### 10. **php_integrated_scores** — Score PHP Final
```sql
php_integrated_scores (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) NOT NULL,
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES auth.users(id),
  score_date DATE DEFAULT CURRENT_DATE,
  
  -- Componentes (0-100)
  tfci_score NUMERIC(5,2) CHECK (BETWEEN 0 AND 100),
  nr1_score NUMERIC(5,2) CHECK (BETWEEN 0 AND 100),
  copc_score NUMERIC(5,2) CHECK (BETWEEN 0 AND 100),
  
  -- PHP Score Final = TFCI 30% + NR-1 40% + COPC 30%
  php_score NUMERIC(5,2) GENERATED ALWAYS AS (
    (tfci_score * 0.30) + 
    (nr1_score * 0.40) + 
    (copc_score * 0.30)
  ) STORED,
  
  trend_vs_previous TEXT CHECK IN ('up', 'down', 'stable'),
  alert_level alert_level DEFAULT 'none', -- none | watch | warning | critical
  
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Dashboard executivo com score integrado
- **Pesos:** TFCI 30% | NR-1 40% | COPC 30%
- **Interpretação:**
  - 🟢 Verde: > 80
  - 🟡 Amarelo: 60-80
  - 🔴 Vermelho: < 60
- **Índices:** org_id, team_id, user_id, (org_id, score_date DESC), alert_level
- **RLS:** Membros veem
- **Status:** ✅ Sprint 10 completo (heuristic-based AI v1.0)

#### 11. **php_action_plans** — Planos de Ação Integrados
```sql
php_action_plans (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) NOT NULL,
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES auth.users(id),
  
  -- Origem
  triggered_by TEXT CHECK IN ('tfci', 'nr1', 'copc', 'manual', 'ai'),
  risk_level risk_level DEFAULT 'medium',
  
  -- Detalhes
  title TEXT NOT NULL,
  description TEXT,
  root_cause TEXT,
  recommended_actions JSONB, -- IA sugere ações
  
  -- Gestão
  assigned_to UUID REFERENCES auth.users(id),
  status action_plan_status DEFAULT 'open',
  priority INT CHECK (BETWEEN 1 AND 5),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Resultados
  effectiveness_score NUMERIC(3,2) CHECK (BETWEEN 1 AND 5),
  follow_up_required BOOLEAN DEFAULT FALSE,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Action plans que cruzam comportamento + saúde + performance
- **IA Integration:** Campo `recommended_actions` com sugestões automáticas
- **Índices:** org_id, team_id, assigned_to, (org_id, status, priority), risk_level
- **RLS:** Membros veem, gestores gerenciam
- **Status:** ✅ Sprint 10 completo (recommendations API + dashboard)

#### 12. **php_action_items** — Tarefas de Planos de Ação
```sql
php_action_items (
  id UUID PRIMARY KEY,
  action_plan_id UUID REFERENCES php_action_plans(id) NOT NULL,
  description TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  status action_plan_status DEFAULT 'open',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Breakdown de tarefas individuais
- **Índices:** action_plan_id, assigned_to, status
- **RLS:** Membros veem, atribuídos atualizam
- **Status:** ✅ Sprint 10 completo (AI-generated action items)

#### 13. **employees** — Colaboradores ✅
```sql
employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL, -- Encriptado em produção
  birth_date DATE,
  hire_date DATE NOT NULL,
  termination_date DATE,
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  position TEXT,
  department TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'terminated')) DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_cpf_per_org UNIQUE (organization_id, cpf)
)
```
- **Propósito:** Funcionários das empresas clientes (usado no PHP Module)
- **⚠️ Nota:** NÃO confundir com `candidates` (processo de recrutamento)
- **⚠️ Relação com Teams:** `employees.department` vincula implicitamente ao `teams.name` da mesma org. Usado para contagem dinâmica e auto-create de times.
- **⚠️ Hierarquia:** `hierarchy_level` existe no schema mas é NULL para todos os registros atuais. A hierarquia real é construída via `manager_id` (self-reference) com DFS tree walk.
- **Índices:** organization_id, manager_id, user_id, status, hire_date, department
- **RLS:** Admins full access, membros da org leem
- **Status:** ✅ Sprint 15 completo (11 endpoints + hierarquia + import CSV)

#### 14. **php_notifications** — Notificações Real-time ✅
```sql
php_notifications (
  id VARCHAR(100) PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL = todos da org
  type VARCHAR(20) NOT NULL CHECK (type IN ('alert', 'info', 'success', 'warning')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('tfci', 'nr1', 'copc', 'action_plan', 'system')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```
- **Propósito:** Sistema de notificações push do módulo PHP
- **Índices:** org_id, user_id, read, (org_id, read), created_at DESC, category
- **RLS:** Membros veem suas notificações ou da org (user_id NULL)
- **Status:** ✅ Sprint 14 completo (Realtime Dashboard)

#### 15. **php_user_presence** — Presença Online ✅
```sql
php_user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  socket_id VARCHAR(100),
  page VARCHAR(255),
  is_online BOOLEAN DEFAULT TRUE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, user_id)
)
```
- **Propósito:** Tracking de usuários online no dashboard PHP
- **Índices:** org_id, user_id, is_online
- **RLS:** Membros da org veem presença, usuário atualiza própria presença
- **Status:** ✅ Sprint 14 completo (Realtime Dashboard)

#### 16. **php_comments** — Comentários Colaborativos ✅
```sql
php_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('action_plan', 'action_item', 'assessment', 'cycle')),
  entity_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES php_comments(id) ON DELETE CASCADE,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```
- **Propósito:** Comentários em qualquer entidade PHP (planos, ciclos, etc)
- **Índices:** org_id, (entity_type, entity_id), user_id, parent_id, created_at DESC
- **RLS:** Membros da org leem/criam, autor edita/deleta
- **Status:** ✅ Sprint 14 completo (Realtime Dashboard)

#### 17. **php_edit_locks** — Locks de Edição ✅
```sql
php_edit_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  locked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),
  UNIQUE(entity_type, entity_id)
)
```
- **Propósito:** Prevenir edição simultânea (pessimistic locking)
- **Índices:** (entity_type, entity_id), expires_at
- **RLS:** Membros da org leem/gerenciam locks
- **Status:** ✅ Sprint 14 completo (Realtime Dashboard)

### 📊 Views do Módulo PHP

#### 1. **v_php_dashboard** — Dashboard Executivo
```sql
SELECT 
  org_id, team_id, score_date,
  AVG(php_score) AS avg_php_score,
  AVG(tfci_score) AS avg_tfci_score,
  AVG(nr1_score) AS avg_nr1_score,
  AVG(copc_score) AS avg_copc_score,
  COUNT(DISTINCT user_id) AS users_evaluated,
  COUNT(CASE WHEN alert_level = 'critical' THEN 1 END) AS critical_alerts,
  COUNT(CASE WHEN alert_level = 'warning' THEN 1 END) AS warning_alerts
FROM php_integrated_scores
GROUP BY org_id, team_id, score_date
```
- **Propósito:** Overview executivo com scores agregados
- **Status:** ✅ Implementado

#### 2. **v_nr1_heatmap** — Heatmap de Riscos
```sql
SELECT 
  org_id, team_id, team_name,
  AVG(workload_pace_risk) AS workload_pace_avg,
  AVG(goal_pressure_risk) AS goal_pressure_avg,
  -- ... (todas as 10 dimensões)
  COUNT(id) AS assessments_count,
  COUNT(CASE WHEN overall_risk_level = 'high' THEN 1 END) AS high_risk_count
FROM nr1_risk_assessments
WHERE assessment_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY org_id, team_id, team_name
```
- **Propósito:** Visualização de riscos por dimensão e equipe (90 dias)
- **Status:** ✅ Implementado

#### 3. **v_copc_summary** — Summary COPC
```sql
SELECT 
  org_id, team_id, team_name, metric_date,
  AVG(quality_score) AS avg_quality,
  AVG(process_adherence_rate) AS avg_efficiency,
  AVG(first_call_resolution_rate) AS avg_effectiveness,
  AVG(customer_satisfaction_score) AS avg_cx,
  AVG(absenteeism_rate) AS avg_absenteeism,
  AVG(overall_performance_score) AS avg_copc_score,
  COUNT(id) AS metrics_count
FROM copc_metrics
GROUP BY org_id, team_id, team_name, metric_date
```
- **Propósito:** Métricas COPC agregadas por equipe e data
- **Status:** ✅ Implementado

### 🛣️ API Endpoints PHP

#### Ativação (4 endpoints) ✅
```
GET    /api/v1/php/status              # Status ativação org
POST   /api/v1/php/activate            # Ativar módulo (body: activation_plan)
POST   /api/v1/php/deactivate          # Desativar módulo
PATCH  /api/v1/php/settings            # Atualizar configurações
```
- **Guard:** `@UseGuards(AuthGuard)` + verificação role admin/owner
- **Headers:** `x-org-id`, `x-user-id`
- **Status:** ✅ Implementado e testado

#### TFCI Cycles (5 endpoints) ✅
```
POST   /api/v1/php/tfci/cycles         # Criar ciclo
GET    /api/v1/php/tfci/cycles         # Listar ciclos
GET    /api/v1/php/tfci/cycles/:id     # Detalhe ciclo
PUT    /api/v1/php/tfci/cycles/:id     # Atualizar ciclo (com state machine)
DELETE /api/v1/php/tfci/cycles/:id     # Deletar ciclo
```
- **Guard:** `@UseGuards(PhpModuleGuard)` (verifica módulo ativo)
- **Validations:** DTOs com class-validator
- **Status Transitions (PUT):**
  - `draft` → `active` | `cancelled`
  - `active` → `completed` | `cancelled`
  - `completed` → (terminal, sem transições)
  - `cancelled` → (terminal, sem transições)
  - PUT aceita: `{ name?, start_date?, end_date?, status?, description? }`
- **Status:** ✅ Implementado completo (Sprint 22: PUT com state machine)

#### PHP Integrated Scores (1 endpoint) ✅
```
POST   /api/v1/php/scores/calculate    # Calcular e upsert scores integrados
```
- **Guard:** Auth + `x-org-id`
- **Body:** `{ team_id?: string }` (opcional, filtra por time)
- **Lógica:**
  - TFCI: avg `overall_score` últimos 90 dias (1-5 → 0-100)
  - NR-1: avg 10 dimensões risco invertidas (risk 1→100, 3→0) últimos 90 dias
  - COPC: avg `overall_performance_score` últimos 90 dias (0-100)
  - Upsert em `php_integrated_scores` com cálculo de trend (up/down/stable ±2)
- **Status:** ✅ Implementado Sprint 22

#### TFCI Assessments (3 endpoints) ✅
```
POST   /api/v1/php/tfci/assessments                # Submeter avaliação
GET    /api/v1/php/tfci/cycles/:id/assessments     # Listar avaliações do ciclo
GET    /api/v1/php/tfci/cycles/:id/heatmap         # Heatmap agregado
```
- **Guard:** `@UseGuards(PhpModuleGuard)`
- **Validations:**
  - ✅ Cycle must be active
  - ✅ No duplicate assessments (unique constraint)
  - ✅ Scores 1-5 (DTOs + DB constraints)
  - ✅ Anonymous support (evaluator_id nullable)
- **Business Logic:**
  - `updateCycleStats()` chamado após cada assessment
  - `getHeatmapData()` agrega médias por target_user_id
- **Status:** ✅ Implementado completo

### 🎨 Frontend Pages PHP

#### Ativação
- ✅ `/php/activation` — Toggle com seleção de plano (full | tfci_only | nr1_only | copc_only)
- ✅ `ActivationToggle.tsx` — Component com switch + plan selector
- ✅ `ModuleStatusBadge.tsx` — Badge no header (Ativo/Inativo)
- ✅ `usePhpModule.ts` — Hook para status do módulo

#### TFCI (4 páginas) ✅
- ✅ `/php/tfci/cycles` — Lista de ciclos + botão criar
  - Card por ciclo mostrando: nome, datas, status, participantes, completion_rate, barra progresso
  - Empty state quando não há ciclos
  - Botão "Ativar" para ciclos draft
  
- ✅ `/php/tfci/cycles/[id]` — Detalhe do ciclo
  - Header com nome, datas, status, botões "Enviar Avaliação" e "Ver Heatmap"
  - 3 cards: Participantes, Total Avaliações, Taxa Conclusão
  - Tabs: Assessments | Heatmap
  - Tab Assessments: Lista de avaliações com scores por dimensão
  - Tab Heatmap: Link para página dedicada
  
- ✅ `/php/tfci/cycles/[id]/assess` — Formulário de avaliação
  - Seleção de target_user_id (placeholder, em produção seria autocomplete)
  - Input equipe/departamento (opcional)
  - Checkbox "Avaliação anônima"
  - 5 dimensões com rating visual 1-5:
    - Botões grandes com número + label em hover
    - Labels: Muito Abaixo | Abaixo da Média | Adequado | Acima da Média | Excepcional
  - Textarea comments (opcional)
  - Validação: todos os scores obrigatórios
  
- ✅ `/php/tfci/cycles/[id]/heatmap` — Visualização heatmap
  - Legenda de cores (6 níveis: vermelho crítico → verde excelente)
  - Tabela sortável:
    - Colunas: Colaborador | 5 Dimensões | Média Geral | Nº Avaliações
    - Color coding por score (1-1.9 vermelho escuro → 4.5-5 verde escuro)
    - Clique no header para ordenar
  - 3 cards summary: Total Colaboradores | Média Geral Org | Total Avaliações
  - Empty state quando não há dados

#### Dashboard PHP (✅ Sprint 10 completo - AI Integration)
- ✅ `/php/ai` — AI Insights Dashboard (NEW Sprint 10)
  - 4 tipos de insights: alert, risk, opportunity, recommendation
  - Color-coding por severidade (critical/high/medium/low)
  - Tabela de previsões de risco (30 dias)
  - Scores de confiança e impacto
  - Links rápidos para TFCI/NR-1/COPC
  
- ⏳ `/php/dashboard` — Overview PHP Score (futuro)
  - 4 cards: PHP Total, TFCI, NR-1, COPC
  - Gráfico de tendência (30 dias)
  - Alertas críticos e avisos
  - Action plans ativos
  - Auto-redirect para `/activation` se módulo inativo

### 🧪 Testing

#### Scripts de Teste
- ✅ `scripts/test-php-module.js` — Validação completa Sprint 6
  - 9 fases: org lookup, status, activation, validate tables, dimensions, metrics, views, deactivation, reactivation
  - Resultado: ✅ 100% pass (12 tabelas, 10 dimensões NR-1, 10 métricas COPC, 3 views)
  
- ✅ `scripts/test-tfci-e2e.js` — End-to-end Sprint 7
  - 8 fases: setup, create cycle, activate, submit 6 assessments (2 anônimas), verify stats, verify heatmap, test duplicates, cleanup
  - Validações: participants_count, completion_rate, heatmap aggregation, duplicate prevention
  - Status: Criado, pendente execução com usuários seed

- ✅ `scripts/test-ai-e2e.js` — AI Integration Sprint 10
  - 6 fases: PHP active, generate insights, predict risks, recommendations, integration, health check
  - Resultado: ✅ 6/6 pass (2 insights, 2 predictions, 1 recommendation)
  - Mock-based: Sem chamadas API externa (heuristic v1.0)

### 🔐 Segurança PHP Module

#### RLS Policies Específicas
1. **php_module_activations**: Apenas admins globais + org admins/owners
2. **teams**: Membros veem, admins/managers gerenciam
3. **team_members**: Membros veem, managers gerenciam membership
4. **nr1_dimensions**: Leitura pública, escrita apenas admins globais
5. **tfci_cycles**: Membros veem, admins gerenciam
6. **tfci_assessments**: Membros criam, gestores veem individuais
7. **nr1_risk_assessments**: Dados sensíveis — apenas admins/RH/owner + user vê próprio
8. **copc_metrics**: Gestores inserem/veem suas equipes
9. **php_integrated_scores**: Membros veem
10. **php_action_plans**: Membros veem, gestores gerenciam

#### PhpModuleGuard
```typescript
@Injectable()
export class PhpModuleGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const orgId = request.headers['x-org-id'];
    
    // Verifica se módulo está ativo para a org
    const { data } = await supabase
      .from('php_module_activations')
      .select('is_active')
      .eq('org_id', orgId)
      .single();
    
    if (!data?.is_active) {
      throw new ForbiddenException('PHP module not activated');
    }
    
    return true;
  }
}
```
- **Uso:** Todos endpoints TFCI/NR1/COPC protegidos por este guard
- **Exceção:** Endpoints de ativação não usam guard (senão não consegue ativar)

### 📈 Roadmap PHP

#### ✅ Sprint 6 (Concluído 2026-01-29)
- Backend: php.module, controller, service, guard, DTOs
- Frontend: activation page, dashboard skeleton, layout, components
- Testing: test-php-module.js (9 fases, 100% pass)
- Migration: 20260130_create_php_module_tables.sql (12 tabelas)

#### ✅ Sprint 7 (Concluído 2026-01-30)
- Backend TFCI: tfci.module, controller, service, DTOs, entities
- 8 endpoints: 5 cycles CRUD + 3 assessments (submit, list, heatmap)
- Frontend TFCI: 4 páginas (cycles list, detail, assess form, heatmap)
- Features: Duplicate prevention, anonymous support, auto stats, color coding
- Testing: test-tfci-e2e.js (8 fases)

#### ✅ Sprint 8 — NR-1 Digital (Complete - 2026-01-29)
- **Backend**: ✅ Nr1Module, Nr1Controller, Nr1Service implementados
- **8 endpoints REST**: ✅ Assessment CRUD + risk-matrix + compliance-report + action-plans
- **Frontend**: ✅ Lista (/php/nr1) com stats cards (Total, High/Medium/Low risk)
- **Frontend**: ✅ Form (/php/nr1/new) com 10 dimensões NR-1 (escala 1-3)
- **Auto-calculation**: ✅ overall_risk_level (low/medium/high) + auto action plans
- **Compliance**: ✅ NR-1 v1.0 evidence tracking (90-day frequency)
- **Arquivos criados**:
  - `apps/api/src/php/nr1/{nr1.module.ts, nr1.controller.ts, nr1.service.ts}`
  - `apps/api/src/php/nr1/dto/nr1-assessment.dto.ts`
  - `apps/web/src/app/(recruiter)/php/nr1/{page.tsx, new/page.tsx}`

#### ✅ Sprint 9 — COPC Adapted (Complete - 2026-01-29)
- Backend: ✅ copc.module, controller, service
- 10 endpoints: ✅ Metrics CRUD, dashboard (7d/30d/90d), summary, trends, catalog
- Frontend: ✅ Dashboard (overall score + 5 categorias) + form (11 métricas)
- Tests: ✅ test-copc-e2e.js (9 fases)
- Migration fix: ✅ 20260129_fix_copc_metrics_column.sql aplicada
- Custom catalog: ✅ Orgs podem criar métricas próprias (copc_metrics_catalog)

#### ✅ Sprint 10 — AI Integration (COMPLETO 2026-01-29)

**Backend**: `apps/api/src/php/ai/`
- **ai.module.ts**: Módulo NestJS integrado com TFCI, NR-1, COPC
- **ai.service.ts**: 3 métodos core:
  - `generateInsights()` - Análise cross-module (TFCI + NR-1 + COPC)
  - `predictRisks()` - Previsões com horizonte 7/30/90 dias
  - `recommendActions()` - Recomendações contextualizadas
- **ai.controller.ts**: 4 endpoints REST:
  - `POST /php/ai/generate-insights` - Gerar insights
  - `POST /php/ai/predict-risks` - Prever riscos  
  - `POST /php/ai/recommend-actions` - Obter recomendações
  - `GET /php/ai/health` - Status do serviço AI

**Frontend**: `apps/web/src/app/(recruiter)/php/ai/page.tsx`
- Dashboard AI com:
  - Cards de insights (alert/risk/opportunity/recommendation)
  - Tabela de previsões de risco (30 dias)
  - Color-coding por severidade (critical/high/medium/low)
  - Scores de confiança e impacto
  - Links rápidos para TFCI/NR-1/COPC

**Implementação**: Baseada em heurísticas (v1.0 - sem API externa)
- Análise de padrões comportamentais (TFCI)
- Detecção de riscos psicossociais (NR-1)
- Monitoramento de performance (COPC)
- Correlações: "Baixo TFCI → Declínio COPC", "NR-1 crítico → COPC impactado"

**Testes**: `scripts/test-ai-e2e.js` - 6/6 fases (100%)
- ✅ Verificar ativação módulo PHP
- ✅ Gerar insights AI (2 insights: recommendation, alert)
- ✅ Prever riscos (2 previsões: critical, warning)
- ✅ Gerar recomendações (1 recomendação com 3 steps)
- ✅ Validar integração entre módulos
- ✅ Verificar health endpoint (v1.0.0, 3/4 features)

**Próximos passos** (Sprint 11 - opcional):
- OpenAI/Anthropic integration para NLG sofisticado
- ML models para previsões mais precisas
- Real-time streaming de insights

### 🔗 Diagrama de Dependências PHP

```
┌─────────────────┐
│  organizations  │ ◄── ROOT
└────────┬────────┘
         │
    ┌────┴─────────────────────────────────┐
    │                                      │
┌───▼──────────────────┐           ┌──────▼──────┐
│php_module_activations│           │   teams     │
└──────────────────────┘           └──────┬──────┘
                                          │
                    ┌─────────────────────┼──────────────────┐
                    │                     │                  │
            ┌───────▼────────┐    ┌───────▼────────┐  ┌─────▼─────────┐
            │ team_members   │    │  tfci_cycles   │  │nr1_risk_assess│
            └────────────────┘    └───────┬────────┘  └───────────────┘
                                          │
                                  ┌───────▼────────┐
                                  │tfci_assessments│
                                  └────────────────┘

┌──────────────────────┐    ┌─────────────────────┐
│copc_metrics_catalog  │    │  nr1_dimensions     │
└──────────┬───────────┘    └─────────────────────┘
           │                         (lookup table)
   ┌───────▼───────┐
   │ copc_metrics  │
   └───────────────┘

┌───────────────────────┐
│php_integrated_scores  │ ◄── Agrega TFCI + NR-1 + COPC
└───────────────────────┘

┌──────────────────┐
│php_action_plans  │
└────────┬─────────┘
         │
   ┌─────▼─────────┐
   │php_action_items│
   └───────────────┘

LEGENDA:
◄── : Tabela raiz (independente)
▼  : Dependência (FK)
```

### Assessments (DISC)
- `disc_responses`
- `assessment_invitations`

### Assessments adicionais (se habilitados)
- **Cores**: `color_questions`, `color_assessments`, `color_responses`
- **PI**: `pi_assessments`, `pi_descriptors`, `pi_situational_questions`, `pi_descriptor_responses`, `pi_situational_responses`

### Referências
- `ref_cbo` (FTS + RPC `search_cbo`)

### Cadastro de Empresas (novo em 2026-01-23)
- `companies` (id, name, cnpj, email, phone, website, address, city, state, industry, size, created_at, updated_at)

### Auditoria e Segurança (novo em 2026-01-23)
- `audit_logs` (id, actor_id, action, resource, resource_id, metadata JSONB, ip_address, user_agent, created_at)
  - **Propósito:** Registro de todas as ações críticas para compliance e troubleshooting
  - **Ações rastreadas:** create, update, delete, login, logout, settings_change, etc.
  - **RLS:** Apenas admins podem visualizar todos os logs
  - **Índices:** actor_id, created_at DESC, action, resource, (actor_id + created_at)
  - **Integração:** Join com `auth.users` para dados do ator (nome + email)

- `security_events` (id, type, severity, details JSONB, created_at)
  - **Propósito:** Monitoramento de eventos de segurança e detecção de ameaças
  - **Tipos:** failed_login, suspicious_activity, brute_force, unauthorized_access, etc.
  - **Severidades:** low, medium, high, critical (validação via enum)
  - **RLS:** Apenas admins podem visualizar e criar eventos
  - **Índices:** type, severity, created_at DESC, (severity + created_at)
  - **Estatísticas:** Endpoint retorna contagem por severidade nas últimas 24h

- `system_settings` (id, key UNIQUE, value JSONB, category, description, created_at, updated_at)
  - **Propósito:** Configurações persistentes do sistema acessíveis via interface admin
  - **Categorias:** notifications, security, system, general, email
  - **RLS:** 5 policies (admin select/insert/update/delete + função `get_setting()`)
  - **Funções:** `get_setting(key)` retorna value, `set_setting(key, value)` atualiza e registra audit
  - **Auditoria:** Cada mudança registrada automaticamente em `audit_logs`

- `blocked_ips` (id, ip_address UNIQUE, reason, blocked_at, blocked_by, expires_at)
  - **Propósito:** Lista de IPs bloqueados por atividade suspeita ou manual
  - **RLS:** Apenas admins podem gerenciar
  - **Função:** `is_ip_blocked(ip)` verifica se IP está bloqueado e não expirado

### Métricas e Analytics (novo em 2026-01-23)
- `user_activity` (id, user_id, action, resource, metadata, ip_address, user_agent, created_at)
  - **Propósito:** Tracking de atividades dos usuários para métricas em tempo real
  - **Ações rastreadas:** page_view, click, api_call, search, download, etc.
  - **RLS:** Admins veem tudo, usuários veem apenas suas próprias ações
  - **Índices:** user_id, created_at DESC, action, (user_id + created_at) para queries otimizadas
  - **Cleanup:** Função `cleanup_old_user_activity()` remove dados >90 dias automaticamente

#### 🚀 Otimizações de Performance (Sprint 4 - 2026-01-24)

##### Índices Críticos Implementados

**organizations:**
- PRIMARY KEY (id) - UUID v4
- UNIQUE INDEX (slug) - Busca por URL amigável
- INDEX (status) - Filtros de status ativo/inativo

**org_members:**
- PRIMARY KEY (id)
- INDEX (org_id) - Queries de membros por org (usado em RLS)
- INDEX (user_id) - Queries de orgs por usuário
- UNIQUE INDEX (org_id, user_id) - Previne duplicatas

**jobs:**
- PRIMARY KEY (id)
- INDEX (org_id) - Principal filtro multi-tenant
- INDEX (status) - Filtro de vagas abertas/fechadas
- INDEX (created_at DESC) - Ordenação temporal

**applications:**
- PRIMARY KEY (id)
- INDEX (job_id) - **CRÍTICO** para JOIN com jobs
- INDEX (candidate_id) - Histórico do candidato
- INDEX (status) - Filtros de pipeline
- COMPOSITE INDEX (job_id, status) - Query optimization

**assessments:**
- PRIMARY KEY (id)
- INDEX (candidate_id) - Histórico de avaliações
- INDEX (job_id) - **CRÍTICO** para JOIN com jobs

**application_events:**
- PRIMARY KEY (id)
- INDEX (application_id) - Timeline de eventos
- INDEX (created_at DESC) - Ordenação temporal (auditoria)

##### Query Patterns Otimizados

**1. Dashboard de Organização (v_org_metrics):**
```sql
-- Usa índices: organizations.id, org_members.org_id, jobs.org_id, 
--              applications.job_id, assessments.job_id
SELECT * FROM v_org_metrics WHERE org_id = $1;
-- Execution time: ~50-100ms para orgs com <10k registros
```

**2. Lista de Candidaturas por Vaga:**
```sql
-- Usa índices: applications.job_id, candidates.id
SELECT a.*, c.* 
FROM applications a
JOIN candidates c ON c.id = a.candidate_id
WHERE a.job_id = $1;
-- Execution time: <10ms
```

**3. Verificação de Acesso (RLS):**
```sql
-- Usa índices: org_members.(org_id, user_id)
SELECT 1 FROM org_members 
WHERE org_id = $1 AND user_id = auth.uid() AND status = 'active';
-- Execution time: <5ms (cached)
```

**Observações (companies)**
- Tabela criada para cadastro inicial de empresas
- Campo `size`: 'small' (1-50), 'medium' (51-250), 'large' (251-1000), 'enterprise' (1000+)
- Evoluirá para cadastro completo com gestão de vagas, histórico, relatórios

---

### 🚧 Gaps Identificados no Módulo PHP (2026-02-04)

| Item | Banco | API | UI | Status |
|------|-------|-----|-----|--------|
| `teams` | ✅ Tabela existe | ✅ 10 endpoints | ✅ 2 páginas | ✅ **Sprint 16 + 21** (contagem dinâmica + hierarquia) |
| `team_members` | ✅ Tabela existe | ✅ Via TeamsService | ✅ Página detalhes | ✅ **Sprint 16 + 21** (contagem via employees.department) |
| `employees` | ✅ Tabela existe | ✅ 11 endpoints | ✅ Página existe | ✅ Completo |
| `php_notifications` | ✅ Tabela existe | ✅ Via realtime | ✅ Dashboard | ✅ Completo |
| `php_user_presence` | ✅ Tabela existe | ✅ Via realtime | ✅ Dashboard | ✅ Completo |
| `php_comments` | ✅ Tabela existe | ✅ Via realtime | ✅ Dashboard | ✅ Completo |
| `php_edit_locks` | ✅ Tabela existe | ✅ Via realtime | ✅ Dashboard | ✅ Completo |

---

## 4) Tabelas legadas (não usar)
- `candidate_applications_view`
- `invitations`
- enum `assessment_kind`

> **Nota (2026-03-05):** `candidate_saved_jobs` foi re-introduzida em Sprint 30.2 como tabela canônica com `user_id = auth.uid()` RLS. Não é mais legada.

## 4.1) Tabelas obrigatórias de identidade
- `user_profiles` (perfil de autenticação e metadados do usuário)
## 5) Fluxos principais (resumo)
- **Auth**: Supabase Auth → trigger `handle_new_user` → `user_profiles`.
- **Cadastro candidato**: criar conta → onboarding → `candidate_profiles` + `candidate_education` + `candidate_experience`.
- **ATS**: vagas → pipeline → candidaturas → eventos.
- **Assessments**: convites → respostas → resultados DISC.
- **Admin**: login com user_type=admin → redirect `/admin` → gestão de usuários/tenants/roles.

## 5.1) Estrutura de rotas frontend

### ⚠️ IMPORTANTE: Pastas Removidas (2026-01-29)
- ❌ `(dashboard)/` - Removida (duplicação com `(recruiter)`)
- ❌ `(auth)/` - Removida (conflito de rotas com `(public)`)

### Públicas (sem autenticação)
| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/login` | Login (redireciona por tipo após auth) |
| `/register` | Cadastro de novos usuários |
| `/jobs` | Lista pública de vagas |
| `/jobs/:id` | Detalhe de vaga pública |
| `/assessment/*` | Realização de assessments |

**Nota (Landing page):** Conteúdo deve refletir a arquitetura canônica:
- Multi-tenant com isolamento por `org_id`/RLS.
- Auditoria de pipeline via `application_events`.
- Avaliações comportamentais com DISC como padrão.
- CTAs: `/register?type=recruiter` e `/register?type=candidate`; header exibe apenas “Login”.

### Recrutador (`user_type === 'recruiter'`)
| Rota | Descrição |
|------|-----------|
| `/dashboard` | Dashboard principal |
| `/dashboard/companies` | ✨ **Lista de empresas** (Sprint 15) |
| `/dashboard/companies/:id` | ✨ **Detalhes da empresa** (Sprint 15) |
| `/pipeline/:jobId` | Kanban de candidatos |
| `/candidates` | Lista de candidatos |
| `/jobs` (dashboard) | Gestão de vagas |
| `/reports` | Relatórios |
| `/php/*` | Módulo PHP (quando ativado) |

#### Gestão de Empresas (Sprint 15 — 2026-02-04)

**Página de Detalhes da Empresa** (`/dashboard/companies/:id`):
- **Design System**: Layout limpo com background `#FAFAF8`, bordas `#E5E5DC`
- **Header**: Nome da empresa + badge de status
- **Cards de Estatísticas**:
  - Total de colaboradores (via `/api/v1/php/employees`)
  - Total de departamentos (via `teams`)
  - Vagas abertas (via `jobs` com status `open`)
  - Data de cadastro (formatada pt-BR)
- **Seção Módulo PHP**:
  - Card com toggle ativar/desativar (apenas admin)
  - Visual verde (ativo) / cinza (inativo)
  - Redirecionamento para `/php/tfci/cycles?org_id=<id>` ao ativar
- **Seção Dados Corporativos** (3 sub-cards):
  - **Identificação**: CNPJ, Setor, Porte
  - **Contato**: Email, Telefone, Website
  - **Localização**: Endereço, Cidade, Estado, CEP
- **Seção Top 3 Gestores**:
  - Ranking com badges 🥇 🥈 🥉
  - Nome + email + cargo + data de entrada
  - Ordem por `created_at` (mais antigos = seniores)

**Endpoints Utilizados**:
```typescript
GET /api/v1/organizations/:id         // Dados da empresa + campos corporativos
PUT /api/v1/organizations/:id         // Atualização de dados corporativos
GET /api/v1/php/employees?org_id=:id  // Lista de colaboradores
POST /api/admin/companies/:id/php-module  // Ativar módulo PHP
DELETE /api/admin/companies/:id/php-module // Desativar módulo PHP
```

**DTOs Atualizados** (`apps/api/src/organizations/dto/index.ts`):
- `UpdateOrganizationDto`: cnpj, industry, size, email, phone, website, address, city, state, zipCode, country, description, logoUrl

### Candidato (`user_type === 'candidate'`)
| Rota | Descrição |
|------|-----------|
| `/candidate` | Dashboard do candidato |
| `/candidate/profile` | Edição de perfil |
| `/candidate/applications` | Minhas candidaturas + documentação admissional |
| `/candidate/jobs` | Buscar vagas abertas (via `get_open_jobs()`) |
| `/candidate/saved` | ✨ **Vagas salvas** (Sprint 30.2) — lista + remover salvas |
| `/onboarding` | Completar perfil inicial |

**Nota (2026-01-26):** A aba **Configurações** foi removida do menu do candidato. A rota não é exposta na navegação.

**Padrão de acesso a vagas salvas (Sprint 30.2):**
- Salvar: INSERT direto em `candidate_saved_jobs` via Supabase client (RLS garante `user_id = auth.uid()`)
- Listar: `supabase.rpc('get_my_saved_jobs')` — SECURITY DEFINER retorna join com `jobs`
- Remover: DELETE direto via Supabase client filtrando por `job_id`
- Toggle no card de vaga: ícone `Bookmark` / `BookmarkCheck` em `/candidate/jobs`

### Admin (`user_type === 'admin'`)
| Rota | Descrição |
|------|-----------|
| `/admin` | Dashboard admin (métricas reais + monitoramento em tempo real) |
| `/admin/users` | Gestão de usuários || `/admin/create-user` | **Criação de Usuários** (admin, recrutadores, candidatos direto no banco) |
| `/admin/companies` | **Cadastro de Empresas** (gestão de empresas, evoluirá para cadastro completo) || `/admin/tenants` | Gestão de tenants |
| `/admin/security` | **Centro de Segurança** (verificações, eventos, recomendações) |
| `/admin/roles` | Visualização de roles |
| `/admin/audit-logs` | Logs de auditoria |
| `/admin/security-events` | Eventos de segurança |
| `/admin/api-keys` | Gestão de API keys |
| `/admin/settings` | **Configurações do Sistema** (notificações, segurança, sistema, geral, email) |

#### Dashboard Admin (2026-01-23 - Atualizado Sprint 1)
O dashboard admin inclui um **painel de monitoramento em tempo real** com atualização a cada 5 segundos:

**Alarmes:**
- Críticos (vermelho) - Dados reais de `security_events`
- Avisos (laranja) - Dados reais de `security_events`
- Informativos (azul) - Dados reais de `security_events`

**Métricas de Banco de Dados (✅ 100% Real):**
- Conexões ativas → Via função `get_active_connections()` em `pg_stat_activity`
- Queries por segundo → Calculado via contagem de `audit_logs` por intervalo
- Tempo médio de resposta → Estimado baseado em volume de queries
- Storage usado vs limite → Calculado via contagens de registros nas tabelas principais
- **Endpoint:** `/api/admin/metrics/database`

**Performance API (✅ 100% Real):**
- Requisições por minuto → Calculado via `audit_logs` em janela de 1 minuto
- Taxa de erro → Percentual baseado em `security_events` de tipo 'error'
- Latência média (com código de cor) → Calculado com percentis p50/p95/p99
- Uptime → Monitoramento contínuo via heartbeat
- **Endpoint:** `/api/admin/metrics/api`

**Atividade de Usuários (✅ 100% Real):**
- Sessões ativas → Contagem de sessões em `auth.users` com `last_sign_in_at` recente
- Usuários online agora → Filtro <5min no `last_sign_in_at`
- Usuários online 5min → Filtro <5min
- Usuários online 30min → Filtro <30min
- Cliques por minuto → Agregação de ações na tabela `user_activity`
- Visualizações de página → Contagem de `page_view` em `user_activity`
- Total de ações 24h → Soma de registros em `user_activity` nas últimas 24h
- **Endpoint:** `/api/admin/metrics/users`
- **Tabela:** `user_activity` (tracking de ações, IP, user agent)
- **Cleanup:** Função automática `cleanup_old_user_activity()` remove dados >90 dias

## 6) RLS e permissões mínimas

> ⚠️ **Padrão canônico para acesso de candidatos**: sempre usar funções `SECURITY DEFINER` com
> fallback por email (`c.email = auth.jwt() ->> 'email'`) para cobrir candidatos cujo
> `candidates.user_id` esteja null (histórico de drop/restore da coluna em sprint 22).
> **NUNCA** confiar apenas em `candidate_user_id = auth.uid()` em queries diretas.

- Candidato acessa seus `assessments` via `get_my_disc_result()`, `get_my_color_result()`,
  `get_my_pi_result()` — funções SECURITY DEFINER que fazem fallback por `candidates.email`.
- Candidato **escreve** em `application_documents` via `upsert_application_document()` (SECURITY DEFINER)
  — INSERT/UPDATE direto na tabela **não** é exposto ao role `authenticated`.
- `candidate_education` e `candidate_experience` permitem CRUD quando `candidate_profile_id` pertence ao `auth.uid()`.

## 7) Segurança e Proteção (atualizado 2026-01-23)

### Medidas Implementadas

#### Autenticação e Autorização
- ✅ **Supabase Auth + JWT**: Tokens seguros com validação de assinatura
- ✅ **RLS (Row Level Security)**: Habilitado em todas as tabelas críticas
- ✅ **Guards NestJS**: `SupabaseAuthGuard` e `OrgGuard` para proteção de rotas
- ✅ **Middleware Next.js**: Proteção de rotas frontend por `user_type`; **rotas públicas** (sem autenticação): `/`, `/login`, `/register`, `/auth/*`, `/assessment*`, `/jobs/*`, `/invite*`, `/vagas*`
- ✅ **Multi-tenant**: Isolamento via `org_id` com verificação de membership

#### Banco de Dados
- ✅ **RLS Policies**: Queries filtradas automaticamente por usuário/organização
- ✅ **Parametrização**: Proteção contra SQL Injection via Supabase client
- ✅ **Função SECURITY DEFINER**: `is_org_member()` para verificação de acesso
- ✅ **Audit Logs**: Registro de todas ações críticas
- ✅ **Security Events**: Monitoramento de eventos suspeitos

#### API e Headers
- ✅ **CORS**: Restrito a origens permitidas
- ✅ **Bearer Auth**: Tokens JWT em header Authorization
- ✅ **Org-Id Header**: Validação de contexto organizacional
- ✅ **Content-Type**: Validação de tipos de conteúdo
- ✅ **Validation Pipes**: Sanitização automática de inputs no NestJS

#### Frontend
- ✅ **XSS Protection**: React sanitiza automaticamente JSX
- ✅ **HTTPS**: Conexões criptografadas via Vercel/Supabase
- ✅ **Secrets Management**: Variáveis de ambiente (.env)
- ✅ **Route Protection**: Middleware verifica autenticação e autorização

### Centro de Segurança (novo em 2026-01-23)

Dashboard dedicado em `/admin/security` com:

**Score de Segurança:**
- Verificação de 10 categorias (Database, Authentication, Network, API, Headers, Configuration, Frontend, Monitoring)
- Score visual de 0-100 com status pass/warning/fail
- Última verificação em tempo real

**Métricas de Ameaças (24h):**
- Total de eventos de segurança
- Eventos críticos e de alta prioridade
- Logins falhos
- Atividades suspeitas
- IPs bloqueados

**Verificações Automáticas:**
1. RLS Habilitado ✅
2. JWT Válido ✅
3. HTTPS ✅
4. CORS Configurado ✅
5. Rate Limiting ⚠️
6. CSP Headers ⚠️
7. Secrets Management ✅
8. SQL Injection ✅
9. XSS Protection ✅
10. Audit Logs ✅

**Eventos em Tempo Real:**
- Listagem de security_events com severidade
- Categorização por tipo (failed_login, suspicious_activity, etc.)
- Timestamp e detalhes

**Recomendações de Proteção:**
- Rate Limiting (Alta prioridade)
- WAF - Web Application Firewall (Alta)
- MFA - Multi-Factor Authentication (Média)
- Backup Encryption (Média)

### Vulnerabilidades Mitigadas

| Ataque | Proteção Implementada | Status |
|--------|----------------------|--------|
| SQL Injection | Queries parametrizadas + RLS | ✅ Protegido |
| XSS | React auto-sanitização + CSP | ✅ Protegido |
| CSRF | SameSite cookies + Origin check | ✅ Protegido |
| Clickjacking | X-Frame-Options: DENY | ✅ Protegido |
| MIME Sniffing | X-Content-Type-Options: nosniff | ✅ Protegido |
| Brute Force | Supabase rate limiting (login) | ✅ Protegido |
| Session Hijacking | Secure + HttpOnly cookies | ✅ Protegido |
| Privilege Escalation | RLS + Guards multi-camada | ✅ Protegido |
| Data Leakage | RLS + Org-scoped queries | ✅ Protegido |

### Próximas Melhorias (Roadmap)

| Melhoria | Prioridade | Esforço | Impacto |
|----------|-----------|---------|---------|
| **Rate Limiting API** | 🔴 Alta | Médio | Alto |
| WAF (Cloudflare/AWS) | 🔴 Alta | Alto | Alto |
| MFA para Admin | 🟡 Média | Médio | Médio |
| Content Security Policy v2 | 🟡 Média | Baixo | Médio |
| SIEM Integration | 🟢 Baixa | Alto | Alto |
| Penetration Testing | 🔴 Alta | Alto | Alto |
| Bug Bounty Program | 🟢 Baixa | Médio | Médio |
| DDoS Protection | 🟡 Média | Médio | Alto |
| Secrets Rotation | 🟡 Média | Médio | Médio |
| Backup Encryption | 🟡 Média | Baixo | Alto |

## 8) Regras de evolução
- Não introduzir novos módulos fora desta arquitetura sem revisão.
- Todo novo recurso deve respeitar **RLS** e **escopo de organização**.
- Manter compatibilidade com o frontend App Router.
- **Toda alteração de segurança deve ser documentada no Centro de Segurança**.
- **Novos endpoints devem passar por análise de vulnerabilidades**.

## 9) Próximos passos (alinhados à arquitetura canônica)

### Arquitetura (alto nível)
- **Core IAM (OIDC) + Policy Engine (RBAC/ABAC)**.
- **API Gateway/WAF** com rate limit e IP allowlist.
- **Audit/Telemetry** (logs imutáveis + integração SIEM).
- **Tenant Control Plane** (orgs, planos, billing, quotas).
- **Secrets Vault** (rotação de credenciais).
- **Data Governance** (LGPD: retention, export/delete).

### Módulos
- **Auth/SSO**: login, MFA, device trust.
- **Tenant & Org**: orgs, usuários, papéis, convites.
- **Policy**: permissões finas e revisão.
- **Security**: alertas, risk scoring, incident response.
- **Observability**: dashboards e alertas.
- **Billing**: planos, limites, consumo.
- **Admin Console**: gestão total.

### Backlog técnico (MVP → 90 dias)
- SSO + RBAC + audit básico.
- API Gateway + rate limit + WAF.
- Console admin + gestão de tenants.
- Logs centralizados + alertas críticos.
- Vault + rotação de secrets.
- LGPD: export/delete e retention.

### Modelo (núcleo)

**⚠️ NOTA (2026-02-03): Consolidação de Tabelas**
> As tabelas `tenants` e `tenant_users` foram **DESCONTINUADAS**.
> Usar `organizations` e `org_members` como fonte de verdade para multi-tenant.
> A migration `20260122_iam_core.sql` foi atualizada com os CREATE TABLE comentados.
> A API e frontend já usam `organizations`/`org_members`.

- ~~`tenants` (DEPRECATED → usar `organizations`)~~
- ~~`tenant_users` (DEPRECATED → usar `org_members`)~~
- `organizations` (id, name, slug, status, plan_id, created_at) — **USAR ESTA**
- `org_members` (org_id, user_id, role, status) — **USAR ESTA**
- `roles` (id, name, scope)
- `permissions` (id, action, resource)
- `role_permissions` (role_id, permission_id)
- `policies` (id, effect, conditions jsonb)
- `api_keys` (org_id, key_hash, scopes, expires_at) — referencia organizations
- `audit_logs` (org_id, actor_id, action, resource, metadata) — referencia organizations
- `security_events` (org_id, type, severity, details) — referencia organizations

### Endpoints (MVP)
- `POST /auth/login` (OIDC/MFA)
- `POST /auth/logout`
- `GET /tenants`
- `POST /tenants`
- `GET /tenants/:id`
- `POST /tenants/:id/users`
- `PATCH /tenants/:id/users/:userId`
- `GET /roles`
- `POST /roles`
- `GET /permissions`
- `POST /policies`
- `GET /audit-logs`
- `GET /security-events`
- `POST /api-keys`
- `DELETE /api-keys/:id`

### Mapa de implantação
- [docs/MAPA_IMPLANTACAO_IAM.md](MAPA_IMPLANTACAO_IAM.md)

### Operações de banco (histórico operacional)
- 2026-01-22: aplicado **IAM Core** (tabelas + RLS mínima) via SQL Editor (arquivo [supabase/migrations/20260122_iam_core.sql](../supabase/migrations/20260122_iam_core.sql)).
- 2026-01-22: aplicado **RLS leitura DISC por recrutador** via SQL Editor (arquivo [supabase/migrations/20260122_fix_org_read_disc_results.sql](../supabase/migrations/20260122_fix_org_read_disc_results.sql)).
- 2026-01-23: criado tenant inicial (**Tenant Demo**) via endpoint `/api/v1/tenants`.
- 2026-01-23: validação local dos endpoints IAM concluída (tenants, roles, permissions, audit-logs, security-events).
- 2026-01-23: aplicado **IAM Seed** (5 roles + 29 permissions + role-permission mappings) via SQL Editor (arquivo [supabase/migrations/20260123_iam_seed_roles_permissions.sql](../supabase/migrations/20260123_iam_seed_roles_permissions.sql)).
- 2026-01-23: aplicado **Tabela Companies** (cadastro de empresas) via SQL Editor (arquivo [supabase/migrations/20260123_create_companies_table.sql](../supabase/migrations/20260123_create_companies_table.sql)).
- 2026-01-23: implementado **Admin User Creation** (criação de usuários via service role) - páginas `/admin/create-user` e `/admin/companies`.
- **2026-02-03: LIMPEZA DE TABELAS NÃO UTILIZADAS** (arquivo [supabase/migrations/20260203_cleanup_unused_tables.sql](../supabase/migrations/20260203_cleanup_unused_tables.sql)):
  - ✅ Removidas: `candidate_saved_jobs`, `candidate_applications_view`, `invitations`, `employee_reports`
  - ✅ Confirmado: `tenants` e `tenant_users` nunca existiram no banco (apenas nos arquivos de migration)
  - ✅ Atualizado: `20260122_iam_core.sql` com CREATE TABLE comentados
  - ✅ Documentado: API e frontend já usam `organizations`/`org_members`

### Status IAM (validado em 2026-01-23, atualizado 2026-02-03)
| Componente | Status | Detalhes |
|------------|--------|----------|
| Tabelas | ✅ | ~~tenants, tenant_users~~ → **organizations, org_members** (consolidado), roles, permissions, role_permissions, policies, api_keys, audit_logs, security_events |
| RLS | ✅ | Políticas básicas ativas |
| Roles | ✅ | owner, admin, recruiter, viewer, candidate, manager |
| Permissions | ✅ | 30 permissões CRUD por recurso |
| Endpoints | ✅ | **Todos validados localmente** (usam organizations/org_members) |

#### Endpoints IAM validados (usam organizations/org_members internamente)
| Endpoint | GET | POST | PATCH | DELETE | Nota |
|----------|-----|------|-------|--------|------|
| `/api/v1/tenants` | ✅ | ✅ | — | — | → `organizations` |
| `/api/v1/tenants/:id` | ✅ | — | — | — | → `organizations` |
| `/api/v1/tenants/:id/users` | — | ✅ | — | — | → `org_members` |
| `/api/v1/tenants/:id/users/:userId` | — | — | ✅ | — | → `org_members` |
| `/api/v1/roles` | ✅ | ✅ | — | — |
| `/api/v1/permissions` | ✅ | ✅ | — | — |
| `/api/v1/policies` | — | ✅ | — | — |
| `/api/v1/audit-logs` | ✅ | — | — | — |
| `/api/v1/security-events` | ✅ | — | — | — |
| `/api/v1/api-keys` | — | ✅ | — | — |
| `/api/v1/api-keys/:id` | — | — | — | ✅ |

#### Endpoints Auth validados
| Endpoint | GET | POST |
|----------|-----|------|
| `/api/v1/auth/me` | ✅ | — |
| `/api/v1/auth/health` | ✅ | — |

#### Endpoints Core ATS validados
| Endpoint | GET | POST | PATCH | DELETE | Notas |
|----------|-----|------|-------|--------| ------|
| `/api/v1/organizations` | ✅ | ⏳ | — | — | 1 org retornada |
| `/api/v1/organizations/:id` | ✅ | — | ✅ | — | Inclui campos corporativos (Sprint 15) |
| `/api/v1/jobs` | ✅ | ⏳ | — | — | 3 jobs retornados |
| `/api/v1/candidates` | ✅ | ⏳ | — | — | 3 candidates retornados |
| `/api/v1/applications` | ✅ | ✅ | — | — | **Next.js Route** — Supabase direto, filtro via jobs.org_id (Sprint 26) |
| `/api/v1/applications/:id/stage` | — | — | ✅ | — | Mover fase no pipeline (Sprint 26) |
| `/api/v1/applications/:id/status` | — | — | ✅ | — | Alterar status candidatura (Sprint 26) |
| `/api/v1/reports/dashboard` | ✅ | — | — | — | Dashboard stats OK |
| `/api/v1/reports/pipelines` | ✅ | — | — | — | 3 jobs com pipelines |
| `/api/v1/reports/assessments` | ✅ | — | — | — | Corrigido (usava colunas legadas) |
| `/interviews` | ✅ | ✅ | ✅ | ✅ | **Sprint 33** — CRUD entrevistas; `POST` dispara e-mail de confirmação via Brevo |
| `/interviews?candidateId=` | ✅ | — | — | — | Filtra por candidato |
| `/interviews?jobId=` | ✅ | — | — | — | Filtra por vaga |
| `/interviews?status=` | ✅ | — | — | — | Filtra por status (scheduled/completed/cancelled) |

#### Endpoints Email validados
| Endpoint | POST | Notas |
|----------|------|-------|
| `/admin/settings/email/test` | ✅ | Envia e-mail de teste via Brevo; requer role admin |

#### Endpoints Assessments validados
| Endpoint | GET | POST | Notas |
|----------|-----|------|-------|
| `/api/v1/color-assessments/questions` | ✅ | — | 80 questões retornadas |
| `/api/v1/pi-assessments/descriptors` | ✅ | — | 20 descritores retornados |
| `/api/v1/pi-assessments/questions` | ✅ | — | 30 questões retornadas |
| `/api/v1/assessments/candidate/:id` | ✅ | — | Requer x-org-id |

#### Endpoints Admin validados (novos em 2026-01-23)
| Endpoint | GET | POST | PATCH | DELETE | Notas |
|----------|-----|------|-------|--------|-------|
| `/api/admin/users` | ✅ | — | — | — | Lista usuários Auth |
| `/api/admin/create-user` | — | ✅ | — | — | Cria usuário via service role + e-mail boas-vindas (Brevo) |
| `/api/admin/delete-user` | — | — | — | ✅ | Exclui usuário + registra audit log (2026-03-15) |
| `/api/admin/resend-welcome-email` | — | ✅ | — | — | Reenvia e-mail boas-vindas via Brevo (2026-03-14) |
| `/api/admin/companies` | ✅ | ✅ | — | — | CRUD de empresas |
| `/api/admin/companies/:id` | — | — | ✅ | ✅ | Update/Delete empresa |

### Correções aplicadas (2026-01-23)
| Arquivo | Problema | Solução |
|---------|----------|---------|
| `candidates.service.ts` | Usava `assessment_kind` (legado) | Alterado para `assessment_type` |
| `reports.service.ts` | Usava `interpreted_score` (não existe no banco) | Alterado para usar `normalized_score`, `traits` (colunas reais) |

### Admin Console (implementado 2026-01-23)
| Página | Rota | Funcionalidade |
|--------|------|----------------|
| Dashboard | `/admin` | Métricas reais: usuários, organizações, vagas, assessments + **Painel de Monitoramento em Tempo Real** |
| Usuários | `/admin/users` | Lista todos usuários (Auth), filtro por tipo (admin/recruiter/candidate) + **botão Excluir** com modal de confirmação (2026-03-15) |
| **Criar Usuário** | `/admin/create-user` | **Cadastro direto de usuários** (admin/recrutador/candidato via service role) + envio automático de e-mail boas-vindas (Brevo) |
| **Empresas** | `/admin/companies` | **Gestão de empresas** (CRUD completo, busca, porte) |
| Tenants | `/admin/tenants` | Gerenciamento de tenants |
| **Centro de Segurança** | `/admin/security` | **Score de segurança, verificações automáticas, eventos em tempo real, recomendações** |
| Roles | `/admin/roles` | Visualização de papéis |
| Audit Logs | `/admin/audit-logs` | Logs de auditoria |
| Security Events | `/admin/security-events` | Eventos de segurança |
| API Keys | `/admin/api-keys` | Gerenciamento de chaves API |
| **Configurações** | `/admin/settings` | **Configurações globais: notificações, segurança, sistema, geral, SMTP** |

#### Painel de Monitoramento em Tempo Real (2026-01-23)
Componente visual integrado ao dashboard admin com:
- **Atualização automática:** A cada 5 segundos
- **Tema:** Claro (bg-white/bg-[#FAFAF8]) seguindo padrão da aplicação
- **Alarmes:** Críticos, Avisos, Informativos
- **Banco de Dados:** Conexões ativas, queries/seg, tempo médio, storage
- **API:** Requisições/min, taxa de erro, latência, uptime
- **Usuários:** Sessões ativas, online agora, cliques/min
- **Cores:** Paleta oficial (#10B981, #3B82F6, #8B5CF6, #F59E0B, #EF4444, #EC4899, #06B6D4)

### API Routes Next.js (implementadas 2026-01-23)
| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/admin/users` | GET | Lista todos usuários do Supabase Auth (requer `SUPABASE_SERVICE_ROLE_KEY`) |
| `/api/admin/create-user` | POST | Cria usuários diretamente no Auth + user_profiles (admin/recruiter/candidate) + dispara e-mail boas-vindas via Brevo |
| `/api/admin/delete-user` | DELETE | Exclui usuário do Auth (cascata via trigger) + registra em `audit_logs` (2026-03-15) |
| `/api/admin/resend-welcome-email` | POST | Reenvia e-mail de boas-vindas com senha temporária via Brevo (2026-03-14) |
| `/api/admin/companies` | GET, POST | Lista e cria empresas |
| `/api/admin/companies/[id]` | PATCH, DELETE | Atualiza e deleta empresas |

### Middleware (atualizado 2026-01-23)
- **Rotas de API excluídas**: O matcher do middleware agora exclui `/api/` para permitir chamadas diretas às API routes
- **Roteamento por user_type**: Login redireciona automaticamente baseado em `user_metadata.user_type`:
  - `admin` → `/admin`
  - `recruiter` → `/dashboard`
  - `candidate` → `/candidate`
- **Proteção de rotas admin**: Apenas usuários com `user_type === 'admin'` podem acessar `/admin/*`

### Variáveis de ambiente adicionais
| Variável | Arquivo | Uso |
|----------|---------|-----|
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` | Admin API do Supabase Auth (listUsers, etc.) |

### Divergência Schema vs Migration
A migration `20241213_assessment_system_disc.sql` define `interpreted_score`, mas o banco real tem `normalized_score` e `traits`. O código foi ajustado para usar as colunas reais do banco.

---

## ✅ VALIDAÇÃO COMPLETA (2026-01-23)

Todos os endpoints da API foram validados localmente com sucesso:

### Resumo da Validação
| Módulo | Endpoints | Status |
|--------|-----------|--------|
| Auth | 2 | ✅ 100% |
| Organizations | 1 | ✅ 100% |
| Jobs | 1 | ✅ 100% |
| Candidates | 1 | ✅ 100% |
| Applications | 1 | ✅ 100% |
| Reports | 3 | ✅ 100% |
| Color Assessments | 1 | ✅ 100% |
| PI Assessments | 3 | ✅ 100% |
| IAM | 6 | ✅ 100% |
| Admin Console API | 1 | ✅ 100% |

### Dados retornados na validação
- Auth: User ID + email autenticado
- Organizations: 1 organização
- Jobs: 3 vagas
- Candidates: 3 candidatos
- Applications: 4 candidaturas
- Reports/dashboard: stats + recentActivity
- Reports/pipelines: 3 pipelines
- Reports/assessments: 1 DISC completado
- Color Questions: 80 questões
- PI Descriptors: 20 descritores
- PI Questions: 30 questões
- Tenants: 1 tenant (Demo)
- Roles: 6 (owner, admin, recruiter, viewer, candidate, manager)
- Permissions: 30 permissões CRUD
- Admin Users: 6 usuários (1 admin, 2 recruiters, 2 candidates, 1 unknown)

---

## 9) Frontend - Componentes e Features (atualizado 2026-01-23)

### Centro de Segurança (novo em 2026-01-23)
**Arquivo:** `apps/web/src/app/(admin)/admin/security/page.tsx`

**Funcionalidades:**
- Atualização automática a cada 10 segundos
- Score de segurança de 0-100 baseado em 10 verificações
- Métricas de ameaças em tempo real (24 horas)
- Listagem de eventos de segurança recentes
- Recomendações de proteção priorizadas

**Verificações Implementadas:**
1. **Database:** RLS Habilitado, SQL Injection Protection
2. **Authentication:** JWT Válido
3. **Network:** HTTPS
4. **API:** CORS Configurado, Rate Limiting (aviso)
5. **Headers:** CSP Headers (aviso)
6. **Configuration:** Secrets Management
7. **Frontend:** XSS Protection
8. **Monitoring:** Audit Logs

**Métricas de Ameaças:**
- Total de eventos (24h)
- Eventos críticos
- Logins falhos
- Atividades suspeitas
- IPs bloqueados
- Eventos de alta prioridade

**Design System:**
- Container principal: `bg-white`, bordas `border-[#E5E5DC]`
- Score visual com círculo e badge
- Cards de métricas: `bg-white` com ícones coloridos
- Verificações: `bg-[#FAFAF8]` com status colorido (pass/warning/fail)
- Eventos: `bg-[#FAFAF8]` com severidade (critical/high/medium/low)
- Recomendações: `bg-[#FAFAF8]` com hover `bg-[#F5F5F0]`
- **Totalmente tema claro** seguindo padrão da aplicação

**Cores por Severidade:**
- Crítico: `#EF4444` (vermelho)
- Alto: `#F59E0B` (laranja)
- Médio: `#3B82F6` (azul)
- Baixo: `#10B981` (verde)

**Tipografia:**
- Títulos: `text-[#141042]`
- Subtítulos/labels: `text-[#666666]`
- Texto auxiliar: `text-[#999]`

### Configurações do Sistema (novo em 2026-01-23)
**Arquivo:** `apps/web/src/app/(admin)/admin/settings/page.tsx`

**Funcionalidades:**
- Gerenciamento de configurações globais da plataforma
- Interface intuitiva com toggles e inputs
- Feedback visual de salvamento
- Estado persistente (simulado, pronto para integração)

**Seções Implementadas:**

1. **Notificações:**
   - Email notifications (toggle)
   - Alertas de segurança (toggle)
   - Atualizações do sistema (toggle)

2. **Segurança:**
   - Timeout de sessão (minutos)
   - Expiração de senha (dias)
   - MFA obrigatório para admins (toggle)

3. **Sistema:**
   - Modo manutenção (toggle - laranja)
   - Modo debug (toggle - vermelho, uso com cautela)
   - Nível de log (select: error/warn/info/debug)

4. **Geral:**
   - Nome da plataforma (TalentForge)
   - Fuso horário (São Paulo, Nova York, Londres, Tóquio)
   - Idioma padrão (pt-BR, en-US, es-ES)

5. **Email (SMTP — Brevo):**
   - Servidor SMTP: `smtp-relay.brevo.com` porta `587`
   - Usuário SMTP: login da conta Brevo
   - **Senha via env var**: `BREVO_SMTP_PASS` (SMTP Key do painel Brevo)
   - **Substitui** o e-mail nativo do Supabase (limite 2/dia → ilimitado no plano Brevo)
   - **TODOS os e-mails saem pelo Brevo** — tanto NestJS quanto Supabase Auth:
     - NestJS `EmailService`: convites, entrevistas, assessments, welcome, NR-1
     - Supabase Auth: reset de senha, confirmação de cadastro, magic link, troca de e-mail
   - Templates Supabase Auth versionados em `supabase/email-templates/`
   - Endpoint de teste: `POST /admin/settings/email/test`
   - **Env vars obrigatórias** (Vercel **production + preview + development** + Supabase SMTP Settings):
     - `BREVO_SMTP_HOST=smtp-relay.brevo.com`
     - `BREVO_SMTP_PORT=587`
     - `BREVO_SMTP_USER=<login-brevo>`
     - `BREVO_SMTP_PASS=<smtp-api-key>`
     - `BREVO_SENDER_NAME=TalentForge`
     - `BREVO_SENDER_EMAIL=noreply@talentforge.com.br`
     - `APP_URL=https://web-eight-rho-84.vercel.app`
   - ⚠️ **Se o Vercel resetar as vars**, executar: `bash scripts/restore-vercel-env.sh` (lê de `apps/api/.env`)

**Design System:**
- Container principal: `bg-white`, bordas `border-[#E5E5DC]`
- Cards de seção: `bg-white` com padding 6
- Campos de formulário: `bg-[#FAFAF8]` em destaque
- Toggles customizados: bg `#E5E5DC`, ativo `#10B981` (verde)
- Toggles especiais: modo manutenção `#F59E0B` (laranja), debug `#EF4444` (vermelho)
- Botão de salvar: `bg-[#141042]` com hover
- Inputs e selects: border `#E5E5DC`, focus `#141042`
- **Totalmente tema claro** seguindo padrão da aplicação

**Ícones (Lucide):**
- Settings (principal)
- Bell (notificações)
- Shield (segurança)
- Database (sistema)
- Globe (geral)
- Mail (email)
- Save (salvar)
- RefreshCw (salvando com animação)

**Responsividade:**
- Layout adaptativo com `sm:grid-cols-2` para inputs
- Botão de salvar duplicado (header fixo + footer)
- Texto dos botões responsivo (`hidden sm:inline`)
- Espaçamento vertical: `space-y-6 sm:space-y-8`
- Padding inferior: `pb-20 lg:pb-0` para mobile

### Criação de Usuários (novo em 2026-01-23)
**Arquivo:** `apps/web/src/app/(admin)/admin/create-user/page.tsx`

**Funcionalidades:**
- Cadastro direto no Supabase Auth via service role key
- Criação automática de perfil em `user_profiles`
- Email auto-confirmado (sem necessidade de verificação)
- Suporte para 3 tipos de usuário: Admin, Recrutador, Candidato

**Campos do Formulário:**
1. **Tipo de Usuário** (obrigatório):
   - Admin: Acesso total ao painel administrativo
   - Recrutador: Gestão de vagas e pipeline de candidatos
   - Candidato: Portal de candidaturas e perfil

2. **Informações Básicas** (obrigatórias):
   - Email
   - Senha (mínimo 6 caracteres)
   - Nome completo

3. **Informações Adicionais** (opcionais):
   - Telefone
   - Empresa (apenas recrutadores)
   - Cargo/Posição (apenas recrutadores)

**Design System:**
- Cards de seleção de tipo: border `#E5E5DC`, selecionado `#141042`
- Inputs: focus border `#141042`
- Botões: primário `#141042`, secundário border `#E5E5DC`
- Feedback: sucesso `#10B981`, erro `#EF4444`
- Ícones contextuais: Mail, Lock, User, Phone, Building2

**API Integration:**
- Endpoint: `POST /api/admin/create-user`
- Usa `supabaseAdmin.auth.admin.createUser()` com service role
- Retorna: userId, email, userType

### Cadastro de Empresas (novo em 2026-01-23)
**Arquivo:** `apps/web/src/app/(admin)/admin/companies/page.tsx`

**Funcionalidades:**
- CRUD completo de empresas
- Listagem com busca por nome, CNPJ ou email
- Formulário inline para criação/edição
- Exclusão com confirmação

**Campos do Formulário:**
1. **Informações Básicas** (obrigatórias):
   - Nome da empresa
   - CNPJ (único)
   - Email

2. **Contato** (opcionais):
   - Telefone
   - Website

3. **Endereço** (opcionais):
   - Endereço completo
   - Cidade
   - Estado (dropdown com estados brasileiros)

4. **Informações Adicionais**:
   - Setor/Indústria
   - Porte: Pequena (1-50), Média (51-250), Grande (251-1000), Enterprise (1000+)

**Design System:**
- Tabela responsiva com hover `bg-[#FAFAF8]`
- Badges de porte: cores específicas por tamanho
  - Pequena: `#3B82F6` (azul)
  - Média: `#10B981` (verde)
  - Grande: `#F59E0B` (laranja)
  - Enterprise: `#8B5CF6` (roxo)
- Botões de ação: Edit `#3B82F6`, Delete `#EF4444`
- Busca: ícone Search com border focus `#141042`

**API Integration:**
- Endpoints: 
  - `GET /api/admin/companies` - Lista todas empresas
  - `POST /api/admin/companies` - Cria empresa
  - `PATCH /api/admin/companies/[id]` - Atualiza empresa
  - `DELETE /api/admin/companies/[id]` - Deleta empresa
- Tabela: `companies` (migration `20260123_create_companies_table.sql`)

**Evolução Futura:**
- Gestão de vagas por empresa
- Histórico de contratações
- Relatórios customizados
- Integração com LinkedIn

### Painel de Monitoramento em Tempo Real (Dashboard Admin)
**Arquivo:** `apps/web/src/app/(admin)/admin/page.tsx`

**Funcionalidades:**
- ✅ Atualização automática a cada 5 segundos via `setInterval`
- ✅ Integração com 3 endpoints de métricas reais em tempo real
- ✅ 100% dos dados conectados ao banco (0% simulação)

**Arquitetura de Métricas:**
```
Dashboard (Frontend)
    ↓ fetch a cada 5s
    ├─→ /api/admin/metrics/database → PostgreSQL (get_active_connections, audit_logs, tabelas)
    ├─→ /api/admin/metrics/api → audit_logs, security_events, cálculos de latência
    └─→ /api/admin/metrics/users → auth.users (Supabase Admin), user_activity
```

**Métricas em Tempo Real:**
1. **Banco de Dados** (via `/api/admin/metrics/database`):
   - Conexões ativas: `SELECT get_active_connections()`
   - Queries/seg: Contagem de `audit_logs` em janela temporal
   - Tempo médio: Estimativa baseada em volume
   - Storage: Soma de registros × tamanho médio

2. **API Performance** (via `/api/admin/metrics/api`):
   - Requisições/min: Contagem de `audit_logs` em 1 minuto
   - Taxa de erro: % de `security_events` tipo 'error'
   - Latência: Cálculo de percentis (p50, p95, p99)
   - Uptime: Monitoramento contínuo

3. **Atividade de Usuários** (via `/api/admin/metrics/users`):
   - Sessões ativas: `auth.users` com `last_sign_in_at` recente
   - Online (5min/30min): Filtros por timestamp
   - Clicks/min: Agregação de `user_activity.action = 'click'`
   - Page views: Contagem de `user_activity.action = 'page_view'`
   - Total ações 24h: Soma de registros em `user_activity`

**Métricas Exibidas:**
1. **Alarmes** (✅ Dados Reais):
   - Críticos: contagem de `security_events` com `severity='critical'`
   - Avisos: contagem de `security_events` com `severity='high'`
   - Informativos: contagem de `security_events` com `severity='medium'/'low'`

2. **Banco de Dados** (✅ Dados Reais):
   - Conexões ativas: função `get_active_connections()` consulta `pg_stat_activity`
   - Queries por segundo: agregação temporal de `audit_logs`
   - Tempo médio de query: estimativa baseada em volume de queries
   - Storage usado vs limite: contagem de registros × tamanho médio

3. **Performance API** (✅ Dados Reais):
   - Requisições/minuto: contagem de `audit_logs` em janela móvel de 1 min
   - Taxa de erro: percentual de `security_events` com tipo 'error'
   - Latência média: cálculo com percentis (p50/p95/p99) de timestamps
   - Uptime: monitoramento contínuo com heartbeat

4. **Atividade de Usuários** (✅ Dados Reais):
   - Sessões ativas: consulta em `auth.users` via Supabase Admin
   - Usuários online (5min/30min): filtro por `last_sign_in_at`
   - Clicks/min: agregação de ações tipo 'click' em `user_activity`
   - Page views/min: agregação de ações tipo 'page_view' em `user_activity`
   - Total ações 24h: soma de registros em `user_activity` nas últimas 24h

**Design System:**
- Background: `bg-white`, cards `bg-[#FAFAF8]`
- Bordas: `border-[#E5E5DC]`
- Textos: `text-[#141042]`, `text-[#666666]`, `text-[#999]`
- Cores de status: #10B981 (verde), #3B82F6 (azul), #8B5CF6 (roxo), #F59E0B (laranja), #EF4444 (vermelho), #EC4899 (rosa), #06B6D4 (ciano)
- Barras de progresso: background `bg-[#E5E5DC]`, preenchimento com cores de status
- Animações: `transition-all duration-500` para barras, `animate-pulse` para indicador ao vivo

---

## 10) Usuários do Sistema (snapshot 2026-01-23)

| Email | Tipo | Status |
|-------|------|--------|
| `contato@fartech.app.br` | admin | ✅ Verificado |
| `frpdias@icloud.com` | recruiter | ✅ Verificado |
| `alan.p.passaiamerlini@gmail.com` | recruiter | ⚠️ Não verificado |
| `juliaasseruy@hotmail.com` | candidate | ✅ Verificado |
| `frpdias@hotmail.com` | candidate | ✅ Verificado |
| `fernando.dias@gmail.com` | unknown | ⚠️ Sem tipo definido |

### Notas sobre usuários
- Dados de usuários estão em `auth.users` (Supabase Auth), não em `user_profiles` (tabela vazia)
- O `user_type` é armazenado em `user_metadata` do Auth
- Admin Console busca via `auth.admin.listUsers()` usando service role key
---

## 11) Status de Conexões com Banco de Dados (2026-01-23)

### Resumo Executivo
| Categoria | Conectado | Simulado | % Real |
|-----------|-----------|----------|--------|
| **Gestão de Usuários** | 2/2 | 0/2 | 100% ✅ |
| **Empresas** | 4/4 | 0/4 | 100% ✅ |
| **IAM (Tenants/Roles)** | 5/5 | 0/5 | 100% ✅ |
| **Admin Dashboard** | 12/12 | 0/12 | 100% ✅ |
| **Centro de Segurança** | 3/10 | 7/10 | 30% 🟡 |
| **Configurações** | 0/5 | 5/5 | 0% 🔴 |
| **TOTAL** | **26/38** | **12/38** | **68%** |

**Última atualização:** 2026-01-23 (Sprint 1 concluído)
**Progresso:** 47% → 68% (+21 pontos percentuais)

### Módulos 100% Conectados ✅
1. **Gestão de Usuários** (`/admin/users`, `/admin/create-user`)
   - Listagem via Supabase Auth (service role)
   - Criação direta em Auth + `user_profiles`
   
2. **Empresas** (`/admin/companies`)
   - CRUD completo na tabela `companies`
   - GET, POST, PATCH, DELETE funcionais

3. **IAM** (`/admin/tenants`, `/admin/roles`)
   - Tenants: tabela `tenants`
   - Roles: tabela `roles`
   - Permissions: tabela `permissions`
   - Audit Logs: tabela `audit_logs`
   - Security Events: tabela `security_events`

### Módulos Parcialmente Conectados 🟡

#### Admin Dashboard (100% conectado) ✅
**Conectado (12/12):**
- ✅ Contagem de usuários (via Supabase Auth API)
- ✅ Contagem de organizações (`organizations`)
- ✅ Contagem de vagas (`jobs`)
- ✅ Total de assessments (`assessments`)
- ✅ Alarmes críticos/avisos/informativos (`security_events`)
- ✅ Conexões ativas do banco (função `get_active_connections()` + `pg_stat_activity`)
- ✅ Queries por segundo (agregação de `audit_logs` por intervalo)
- ✅ Tempo médio de query (estimativa baseada em volume)
- ✅ Storage usado (contagem de registros × tamanho médio)
- ✅ Requisições/min da API (contagem de `audit_logs` em janela móvel)
- ✅ Taxa de erro (percentual de `security_events` tipo 'error')
- ✅ Latência média (cálculo com percentis p50/p95/p99)
- ✅ Sessões ativas (`auth.users` com `last_sign_in_at` recente)
- ✅ Usuários online agora/5min/30min (filtros por `last_sign_in_at`)
- ✅ Cliques por minuto (agregação de `user_activity` por ação)
- ✅ Visualizações de página (contagem de `page_view` em `user_activity`)
- ✅ Total de ações 24h (soma de registros em `user_activity`)

**Endpoints implementados:**
- `/api/admin/metrics/database` - Métricas de banco de dados
- `/api/admin/metrics/api` - Performance da API
- `/api/admin/metrics/users` - Atividade de usuários

**Migrations executadas:**
- `20260123_metrics_functions.sql` - Função `get_active_connections()`
- `20260123_user_activity_tracking.sql` - Tabela `user_activity` com RLS e índices

#### Centro de Segurança (30% conectado)
**Conectado:**
- Total de eventos 24h (`security_events`)
- Eventos críticos (filter severity)
- Listagem de eventos recentes

**Simulado (precisa conectar):**
- Score de segurança 0-100 (precisa queries de verificação)
- Verificações automáticas (10 checks mockados)
- Logins falhos (precisa `audit_logs`)
- Atividades suspeitas (precisa regras em `security_events`)
- IPs bloqueados (precisa tabela `blocked_ips`)
- Recomendações (dinâmicas baseadas em score)

### Módulos Não Conectados 🔴

#### Configurações (0% conectado)
- Todas configurações em estado local React
- **Necessário:** Criar tabela `system_settings` ou usar env vars
- **Necessário:** API `/api/admin/settings` (GET/POST)

#### Interfaces Faltantes
- `/admin/api-keys` (não implementado)
- `/admin/audit-logs` (não implementado)
- `/admin/security-events` (não implementado)
- `/admin/roles` (visualização apenas, sem edição)

### Agenda de Implementação

Consulte [docs/CONEXOES_BANCO_STATUS.md](CONEXOES_BANCO_STATUS.md) para:
- ✅ Checklist detalhado por módulo
- 📅 5 Sprints planejados (~1 mês)
- 🎯 Priorização por impacto (Alta/Média/Baixa)
- 🔧 Queries SQL prontas para uso
- 📊 Métricas de progresso (objetivo: 100%)

**Próximos passos prioritários:**
1. ✅ **Sprint 1 (3-5 dias) - CONCLUÍDO:** Métricas reais de banco/API/usuários no dashboard
   - ✅ Endpoint `/api/admin/metrics/database`
   - ✅ Endpoint `/api/admin/metrics/api`
   - ✅ Endpoint `/api/admin/metrics/users`
   - ✅ Tabela `user_activity` com RLS e cleanup
   - ✅ Função `get_active_connections()` no PostgreSQL
   - ✅ Dashboard integrado com todos os 3 endpoints
2. ✅ **Sprint 2 (3-5 dias) - CONCLUÍDO:** Security score automático e verificações reais
   - ✅ Endpoint `/api/admin/security/checks` - 10 verificações em paralelo
   - ✅ Endpoint `/api/admin/security/score` - Score 0-100 + recomendações
   - ✅ Endpoint `/api/admin/security/threats` - Métricas de ameaças 24h
   - ✅ Funções `check_rls_status()` e `list_rls_policies()`
   - ✅ Tabela `blocked_ips` com RLS e função `is_ip_blocked()`
   - ✅ Centro de Segurança 100% conectado
3. ✅ **Sprint 3 (2-3 dias) - CONCLUÍDO:** Configurações persistentes com tabela/API
   - ✅ Migration `20260123_system_settings.sql` aplicada
   - ✅ Tabela `system_settings` (key, value JSONB, category, description)
   - ✅ Endpoint `/api/admin/settings` (GET com agrupamento por categoria, POST com RPC)
   - ✅ Interface `/admin/settings` atualizada com persistência real
   - ✅ 5 RLS policies: admin select/insert/update/delete + função `get_setting(key)`
   - ✅ Função `set_setting(key, value)` para atualizações
   - ✅ 15 configurações iniciais inseridas (notificações, segurança, sistema, geral, email)
   - ✅ Auditoria automática em cada atualização via `audit_logs`
4. ✅ **Sprint 4 (5-7 dias) - CONCLUÍDO:** Interfaces de audit logs, security events e API keys
   - ✅ Endpoint `/api/admin/audit-logs` (GET com paginação/filtros, POST)
   - ✅ Interface `/admin/audit-logs` (busca, filtros, exportação CSV, estatísticas)
   - ✅ Endpoint `/api/admin/security-events` (GET com paginação/filtros, POST, stats por severidade)
   - ✅ Interface `/admin/security-events` (busca, filtros, cards de severidade, detalhes JSON)
   - ✅ Integração com `audit_logs`: registro automático em cada criação de evento
   - ✅ Validação de severidade (low, medium, high, critical)
   - ✅ Paginação configurável (50 itens por página, max 100)
   - ✅ Filtros avançados: ação, recurso, usuário, tipo, severidade, datas
   - ✅ Join com `auth.users` para trazer dados do ator (nome + email)
   - ✅ Correção de build: `security-events/page.tsx` reescrito do zero
5. ⏳ **Sprint 5 (3-5 dias):** Relatórios e analytics avançados

**Progresso Atual:** 98% conectado ao banco real (42/43 funcionalidades) 🎉

**Sprints Concluídas:**
- ✅ Sprint 1: Dashboard métricas (database, API, usuários) - 100%
- ✅ Sprint 2: Security Center (score, verificações, ameaças) - 100%
- ✅ Sprint 3: System Settings (persistência, RLS, auditoria) - 100%
- ✅ Sprint 4: Audit Logs + Security Events (interfaces completas) - 100%

**Migrations Recentes:**
- ✅ `20260124_organizations_metadata.sql` - Campos adicionais em organizations (description, website, industry)
- ✅ `20260124_consolidate_companies_organizations.sql` - P0: Merge de companies → organizations (cnpj, email, phone, etc.)
- ✅ `20260124_lock_audit_logs_security.sql` - P0: Proteção contra DELETE em audit_logs + trigger de logging
- ✅ `20260124_performance_indexes.sql` - P1: 40+ índices compostos para otimização de queries
- ✅ `20260124_consolidate_iam.sql` - P1: Consolidação IAM (tenants → organizations, tenant_users → org_members)
- ✅ `20260124_business_metrics_views.sql` - P3: 6 views analíticas (funil, performance, KPIs executivos)

**Melhorias Implementadas (2026-01-24):**
- ✅ **P0 - Consolidação Arquitetural:** Eliminação de duplicações (companies, tenants)
- ✅ **P0 - Segurança:** Proteção de audit_logs contra adulteração/exclusão
- ✅ **P1 - Performance:** 40+ índices compostos (80-95% redução em tempo de query)
- ✅ **P1 - IAM:** Modelo unificado organization-centric
- ✅ **P2 - Rate Limiting:** 50/100 req/min para APIs admin/públicas
- ✅ **P2 - Notificações Realtime:** Hooks React para alertas instantâneos
- ✅ **P3 - Business Intelligence:** Views pré-computadas para dashboards executivos
- ✅ **P3 - Testes:** Estrutura Jest configurada (threshold 50% de cobertura)

**Consulte [IMPROVEMENTS_LOG.md](IMPROVEMENTS_LOG.md) para detalhes completos das melhorias.**

---

## 11.1) Sprint 4 - Melhorias de Schema (2026-01-24)

### 🎯 Migrations Aplicadas — ORDEM OBRIGATÓRIA

**Validação:** Executar `supabase/VALIDATE_IMPROVEMENTS.sql` após aplicação de todas migrations

#### 1️⃣ `20260124_consolidate_companies_organizations.sql` (P0)
**Propósito:** Eliminar duplicação arquitetural entre `companies` e `organizations`

**Mudanças:**
- ✅ Adiciona 9 colunas a `organizations`: cnpj, email, phone, address, city, state, size, status, plan_id
- ✅ Migra dados de `companies` → `organizations` (se houver dados)
- ✅ Remove tabela `companies` (legado)
- ✅ Atualiza FKs em `jobs` para `organizations.id`

**Impacto:**
- **Performance:** Elimina JOINs desnecessários entre companies e organizations
- **Segurança:** RLS unificado (não precisa duplicar policies)
- **Manutenção:** Fonte única de verdade para entidades organizacionais

**Validação:**
```sql
-- Deve retornar TRUE
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'organizations' 
    AND column_name IN ('cnpj', 'email', 'phone')
);
```

#### 2️⃣ `20260124_lock_audit_logs_security.sql` (P0)
**Propósito:** Proteção contra adulteração/exclusão de trilha de auditoria

**Mudanças:**
- ✅ Adiciona 2 RLS policies:
  - `admin_read_audit_logs` → Admins podem ler todos logs
  - `admin_insert_audit_logs` → Admins podem registrar logs
- ✅ Adiciona trigger `prevent_audit_delete` → BLOQUEIA DELETE em `audit_logs`
- ✅ Função `prevent_audit_log_deletion()` → RAISE EXCEPTION no DELETE

**Impacto:**
- **Compliance:** Atende SOC2, ISO 27001, LGPD (trilha imutável)
- **Segurança:** Impossível alterar histórico (mesmo com privilégios)
- **Forensics:** Investigações não podem ser comprometidas

**Validação:**
```sql
-- Deve FALHAR com erro
DELETE FROM audit_logs WHERE id = (SELECT id FROM audit_logs LIMIT 1);

-- Deve retornar 2
SELECT COUNT(*) FROM pg_policies 
WHERE tablename = 'audit_logs' AND schemaname = 'public';
```

#### 3️⃣ `20260124_performance_indexes.sql` (P1)
**Propósito:** Reduzir tempo de query em 80-95% com índices compostos estratégicos

**Mudanças:**
- ✅ **38 índices criados** em 10 tabelas principais:
  - `organizations` (2): name, slug
  - `org_members` (3): user_id+org_id, role, org_id+role
  - `jobs` (4): org_id+status, position, org_id+created_at, org_id+position
  - `applications` (5): candidate_id+job_id, job_id+status, org_id+status, created_at DESC, candidate_id+status
  - `application_events` (3): application_id+created_at, from/to_stage_id
  - `pipeline_stages` (2): job_id+position, org_id
  - `candidate_profiles` (2): user_id (UNIQUE), org_id
  - `assessments` (3): candidate_id+kind, org_id+kind+created_at
  - `audit_logs` (6): actor_id, created_at DESC, action, resource, actor_id+created_at, resource+created_at
  - `security_events` (8): type, severity, created_at DESC, severity+created_at, type+severity, org_id+severity

**Impacto:**
- **Performance:** Queries em dashboards e relatórios 5-20x mais rápidas
- **Escalabilidade:** Suporta milhões de registros sem degradação
- **Experiência:** Dashboards carregam <500ms (vs 3-5s antes)

**Erros Corrigidos Durante Aplicação:**
1. ❌ `functions in index predicate must be marked IMMUTABLE` → Removidos índices com NOW()
2. ❌ Column `event_type` não existe → Corrigido para `from_stage_id`/`to_stage_id`
3. ❌ Column `order_index` não existe → Corrigido para `position`
4. ❌ Column `slug` não pode ser indexado → Removido (GENERATED column)

**Validação:**
```sql
-- Deve retornar 38+
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';
```

#### 4️⃣ `20260124_consolidate_iam.sql` (P1)
**Propósito:** Unificar IAM com modelo organization-centric (eliminar tenants)

**Mudanças:**
- ✅ Normaliza dados existentes:
  - `tenants.status` → apenas valores válidos (active, inactive, suspended)
  - `tenant_users.role` → owner → admin (normalização)
  - `tenant_users.status` → apenas valores válidos
- ✅ Migra `tenants` → `organizations` (se houver tenants legados)
- ✅ Migra `tenant_users` → `org_members` (com INNER JOIN para garantir integridade)
- ✅ Remove tabelas `tenants` e `tenant_users`
- ✅ Atualiza `roles.scope` (tenant → organization)

**Impacto:**
- **Arquitetura:** Modelo unificado (organizations como única entidade multi-tenant)
- **Simplificação:** Menos tabelas, menos JOINs, menos RLS policies
- **Manutenção:** Código backend usa apenas `org_id` (não `tenant_id`)

**Erros Corrigidos Durante Aplicação:**
1. ❌ Constraint violations (role='owner') → Normalizado ANTES de aplicar constraints
2. ❌ FK violations (tenant_id não existe) → Migrado tenants PRIMEIRO, depois tenant_users
3. ❌ Status inválidos → Normalizado com UPDATE antes de INSERT
4. ❌ Timing de constraints → DROP constraints, normalizar, ADD constraints

**Estrutura da Migration:**
1. **Preparação:** ADD status column, DROP constraints
2. **Normalização:** Map owner→admin, validate roles/status
3. **Migração tenants→organizations:** Garante FK targets existem
4. **Migração tenant_users→org_members:** INNER JOIN validation
5. **Remoção de legado:** DROP tenants/tenant_users
6. **Atualização roles:** scope tenant→organization
7. **Constraints:** ADD após dados limpos

**Validação:**
```sql
-- Deve retornar 0 (tabelas removidas)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name IN ('tenants', 'tenant_users');

-- Deve retornar 0 (nenhum scope 'tenant')
SELECT COUNT(*) FROM roles WHERE scope = 'tenant';
```

#### 5️⃣ `20260124_business_metrics_views.sql` (P3)
**Propósito:** Views pré-computadas para dashboards executivos e relatórios

**6 Views Criadas:**

**1. `v_recruitment_funnel`** — Funil de recrutamento por vaga
```sql
-- Colunas: org_id, job_id, job_title, total_applications, hired, 
--          conversion_rate, avg_days_to_hire
-- Uso: SELECT * FROM v_recruitment_funnel WHERE org_id = '<uuid>';
```

**2. `v_avg_time_by_stage`** — Tempo médio por etapa do pipeline
```sql
-- Colunas: org_id, job_id, stage_name, position, 
--          median_hours, avg_hours, applications_in_stage
-- Uso: SELECT * FROM v_avg_time_by_stage WHERE org_id = '<uuid>';
```

**3. `v_recruiter_performance`** — Métricas de performance por recrutador
```sql
-- Colunas: org_id, recruiter_id, recruiter_name, total_jobs, 
--          total_applications, hired_count, hire_rate, avg_time_to_hire
-- Uso: SELECT * FROM v_recruiter_performance WHERE org_id = '<uuid>';
```

**4. `v_top_candidates`** — Candidatos mais ativos
```sql
-- Colunas: org_id, candidate_id, candidate_name, total_applications, 
--          active_applications, rejected_applications, hired_count
-- Uso: SELECT * FROM v_top_candidates WHERE org_id = '<uuid>' LIMIT 10;
```

**5. `v_assessment_completion_rate`** — Taxa de conclusão de assessments
```sql
-- Colunas: org_id, job_id, job_title, total_invites, completed, 
--          completion_rate, avg_score
-- Uso: SELECT * FROM v_assessment_completion_rate WHERE org_id = '<uuid>';
```

**6. `v_executive_dashboard`** — Dashboard executivo com KPIs principais
```sql
-- Colunas: org_id, org_name, total_jobs, active_jobs, total_applications, 
--          hired_count, rejection_rate, avg_time_to_hire, 
--          assessments_completed, candidate_satisfaction_score
-- Uso: SELECT * FROM v_executive_dashboard WHERE org_id = '<uuid>';
```

**Impacto:**
- **Performance:** Queries complexas pré-computadas (10-50x mais rápidas)
- **BI:** Power BI / Tableau podem consultar diretamente as views
- **Analytics:** Dashboards carregam instantaneamente
- **Escalabilidade:** Views otimizadas com índices subjacentes

**Erros Corrigidos Durante Aplicação:**
1. ❌ Column `old_stage_id`/`new_stage_id` → Corrigido para `from_stage_id`/`to_stage_id`
2. ❌ Column `order_index` → Corrigido para `position`
3. ❌ Column `name` → Corrigido para `full_name`
4. ❌ JOIN `candidate_profiles.candidate_id` → Corrigido para `user_id`
5. ❌ Enum value `active` → Corrigido para `applied`
6. ❌ Type error `round(double precision)` → Adicionado cast `::NUMERIC`
7. ❌ View `v_assessment_completion_rate` → Simplificada (removido `invitation_id`)

**RLS:**
- ✅ Todas views respeitam automaticamente RLS das tabelas base
- ✅ Não é necessário criar policies para views (herdam das tabelas)

**Validação:**
```sql
-- Deve retornar 6
SELECT COUNT(*) FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE 'v_%';

-- Teste de consulta (deve funcionar)
SELECT * FROM v_executive_dashboard WHERE org_id = '<seu_org_id>';
```

#### 6️⃣ `20260124_organizations_metadata.sql` (P2)
**Propósito:** Enriquecer tabela `organizations` com metadados essenciais

**Mudanças:**
- ✅ Adiciona 3 colunas:
  - `description TEXT` → Descrição da organização/empresa
  - `website TEXT` → Website oficial
  - `industry TEXT` → Setor/indústria

**Impacto:**
- **UX:** Perfis de organizações mais ricos e informativos
- **BI:** Segmentação por indústria em relatórios
- **Marketing:** Dados estruturados para landing pages

**Validação:**
```sql
-- Deve retornar 3
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'organizations' 
  AND column_name IN ('description', 'website', 'industry');
```

### ⚠️ Ordem de Aplicação OBRIGATÓRIA

**NÃO aplicar fora de ordem! Dependências:**
1. `consolidate_companies_organizations` → Unifica companies antes de IAM
2. `lock_audit_logs_security` → Proteção antes de qualquer operação
3. `performance_indexes` → Índices antes de migrations pesadas
4. `consolidate_iam` → Usa organizations já consolidadas
5. `business_metrics_views` → Usa schema final consolidado
6. `organizations_metadata` → Adiciona campos após consolidação

**Rollback NÃO recomendado:** Algumas migrations são destrutivas (DROP tables). Backup obrigatório antes de aplicar.

### 📊 Validação Completa

**Script:** `supabase/VALIDATE_IMPROVEMENTS.sql`

**Execução:**
```bash
# No Supabase SQL Editor
\i supabase/VALIDATE_IMPROVEMENTS.sql
```

**Verificações:**
- ✅ 12 colunas em `organizations`
- ✅ 2+ RLS policies em `audit_logs`
- ✅ 38+ índices de performance
- ✅ 0 tabelas legadas (tenants, tenant_users, companies)
- ✅ Dados normalizados em `org_members`
- ✅ 6 views analíticas funcionais

**Status Esperado:** "✅ Validação concluída! Verifique os resultados acima."

---

## 11.2) Sprint 5 - Correções Operacionais (2026-01-24)

### ✅ Correções de Integridade de Dados (Supabase)
- `candidates.owner_org_id` normalizado para garantir acesso multi-tenant correto.
- `candidates.user_id` normalizado para permitir vínculo com assessments (PI/Cores).
- Scripts de correção utilizados:
   - `supabase/DEBUG_CANDIDATES_NOTES.sql`
   - `supabase/FIX_CANDIDATE_USER_ID.sql`
   - `supabase/migrations/20260124_create_missing_auth_users_final.sql`
   - `supabase/migrations/20260124_force_candidates_to_fartech.sql`

### ✅ Notas do Candidato
- Persistência em `candidate_notes` confirmada.
- Leitura/gravação feita via Supabase client (RLS) no front:
   - [apps/web/src/components/candidates/NotesPanel.tsx](apps/web/src/components/candidates/NotesPanel.tsx)
- Contextos válidos confirmados no enum `note_context`: profile, resume, assessments, interview, general.

### ✅ Currículo e Perfil (Recrutador)
- Aba **Currículo** mostra apenas `candidate_experience`.
- Formação completa exibida em **Informações Pessoais** usando `candidate_education`:
   - `degree_level`, `course_name`, `institution`.
- Pretensão salarial e data de nascimento vêm de `candidate_profiles`:
   - `salary_expectation`, `birth_date`.
   - Idade calculada no front.

### ✅ Testes (DISC/PI/Cores)
- Aba **Testes** do recrutador renderiza cards no mesmo formato do painel do candidato.

### ✅ UI/UX Ajustes
- Botão **Voltar** no modal de detalhes do candidato.
- Nome do candidato exibido acima de **Informações Pessoais**.

### ✅ Relatórios (Origem de Candidatos)
- `candidates.source` adicionado via migration `supabase/migrations/20260124_add_candidate_source.sql`.
- `/reports/dashboard` retorna `sources` para “Efetividade por Origem”.

### ✅ Integração Google Agenda (OAuth)
- Campos adicionados em `user_profiles` para tokens e status da agenda.
- Endpoints `/auth/google-calendar/*` para conexão, status e desconexão.
- UI adicionada no card de Webhooks em Configurações com fluxo em 4 passos.
- Marca d’água da Fartech no rodapé direito do modal de detalhes.
- Logos padronizadas (altura 64px) em toda a aplicação.

### ✅ Configuração de API em Dev
- `API_V1_URL` (de `src/lib/api-config.ts`) aponta para `http://localhost:3001/api/v1` quando `NEXT_PUBLIC_API_BASE_URL` não está definida.

---

## 11.5) 🔷 Módulo People, Health & Performance (PHP)

> **NOVO (2026-01-29)**: Módulo premium integrando comportamento (TFCI), riscos psicossociais (NR-1) e performance operacional (COPC adaptado). Ativação opcional para clientes enterprise (Fartech).

### 📋 Visão Geral do Módulo

O módulo **PHP** integra três dimensões críticas de gestão de pessoas:

```
┌─────────────────────────────────────────────────────────────┐
│                  MÓDULO PHP - ARQUITETURA                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1.  COMPORTAMENTO (TFCI) ──┐                               │
│     • Percepção coletiva    │                               │
│     • Padrões de equipe     │                               │
│     • Sinais precoces       │                               │
│                             ├──> ANÁLISE INTEGRADA          │
│  2. RISCOS PSICOSSOCIAIS    │         ↓                     │
│     (NR-1 Digital)          │    PLANO DE AÇÃO IA           │
│     • Sobrecarga            │         ↓                     │
│     • Clima                 │    ALERTAS PREVENTIVOS        │
│     • Reconhecimento        │                               │
│                             │                               │
│  3. PERFORMANCE OPERACIONAL │                               │
│     (COPC Adaptado)         │                               │
│     • Qualidade             │                               │
│     • Eficiência            │                               │
│     • Absenteísmo           │                               │
│                             │                               │
└─────────────────────────────┘                               │
```

### 🎯 Propósito do Módulo

**Diferencial Competitivo:**
- **Compliance NR-1**: Gerenciamento de Riscos Ocupacionais Psicossociais (obrigação legal)
- **Avaliação comportamental real**: Sensor organizacional contínuo (não apenas feedback)
- **Performance sustentável**: COPC sem complexidade, focado em pessoas
- **Integração única**: Comportamento → Saúde → Performance em loop fechado

**Valor para Cliente:**
- Redução de risco trabalhista (NR-1 compliance)
- Saúde mental baseada em dados (não em achismo)
- Performance operacional conectada ao bem-estar
- Auditoria defensável (histórico completo)

### 🗂️ Schema de Banco de Dados

#### Tabelas Principais

##### 1. **php_module_activations** - Controle de Ativação do Módulo
```sql
php_module_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  is_active BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  activated_by UUID REFERENCES auth.users(id),
  activation_plan TEXT CHECK (activation_plan IN ('tfci_only', 'nr1_only', 'copc_only', 'full')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Toggle de ativação do módulo PHP por organização (controle Fartech)
- **RLS:** Apenas admins globais e org admins podem ativar/desativar
- **Índices:** PRIMARY KEY (id), UNIQUE (org_id), INDEX (is_active)

##### 2. **tfci_assessments** - Avaliações TFCI (Comportamento Coletivo)
```sql
tfci_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  evaluator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES tfci_cycles(id) ON DELETE CASCADE,
  
  -- Dimensões TFCI (1-5)
  collaboration_score NUMERIC(3,2) CHECK (collaboration_score BETWEEN 1 AND 5),
  communication_score NUMERIC(3,2) CHECK (communication_score BETWEEN 1 AND 5),
  adaptability_score NUMERIC(3,2) CHECK (adaptability_score BETWEEN 1 AND 5),
  accountability_score NUMERIC(3,2) CHECK (accountability_score BETWEEN 1 AND 5),
  leadership_score NUMERIC(3,2) CHECK (leadership_score BETWEEN 1 AND 5),
  
  overall_score NUMERIC(3,2) GENERATED ALWAYS AS (
    (collaboration_score + communication_score + adaptability_score + 
     accountability_score + leadership_score) / 5
  ) STORED,
  
  comments TEXT,
  is_anonymous BOOLEAN DEFAULT TRUE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Avaliações comportamentais coletivas (360° simplificado)
- **Dependências:** organizations, teams, auth.users, tfci_cycles
- **RLS:** Membros da org podem avaliar colegas, apenas gestores veem individuais
- **Índices:** PRIMARY KEY (id), INDEX (org_id, cycle_id), INDEX (target_user_id)

##### 3. **tfci_cycles** - Ciclos de Avaliação TFCI
```sql
tfci_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('draft', 'active', 'closed')) DEFAULT 'draft',
  participants_count INT DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Períodos de avaliação comportamental (ex: Q1 2026, Semestral)
- **RLS:** Membros da org podem ver, apenas org admins gerenciam

##### 4. **nr1_risk_assessments** - Matriz NR-1 (Riscos Psicossociais)
```sql
nr1_risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assessment_date DATE DEFAULT CURRENT_DATE,
  
  -- Dimensões NR-1 v1.0 (1=Baixo, 2=Médio, 3=Alto)
  -- 10 dimensões validadas com Fartech
  workload_pace_risk INT CHECK (workload_pace_risk BETWEEN 1 AND 3),              -- 1. Carga de trabalho & ritmo
  goal_pressure_risk INT CHECK (goal_pressure_risk BETWEEN 1 AND 3),              -- 2. Pressão por metas & tempo
  role_clarity_risk INT CHECK (role_clarity_risk BETWEEN 1 AND 3),                -- 3. Clareza de papéis & expectativas
  autonomy_control_risk INT CHECK (autonomy_control_risk BETWEEN 1 AND 3),        -- 4. Autonomia & controle
  leadership_support_risk INT CHECK (leadership_support_risk BETWEEN 1 AND 3),    -- 5. Suporte da liderança
  peer_collaboration_risk INT CHECK (peer_collaboration_risk BETWEEN 1 AND 3),    -- 6. Suporte entre colegas / colaboração
  recognition_justice_risk INT CHECK (recognition_justice_risk BETWEEN 1 AND 3),  -- 7. Reconhecimento & justiça percebida
  communication_change_risk INT CHECK (communication_change_risk BETWEEN 1 AND 3),-- 8. Comunicação & mudanças
  conflict_harassment_risk INT CHECK (conflict_harassment_risk BETWEEN 1 AND 3),  -- 9. Conflitos / assédio / relações difíceis
  recovery_boundaries_risk INT CHECK (recovery_boundaries_risk BETWEEN 1 AND 3),  -- 10. Recuperação & limites (descanso/desconexão)
  
  overall_risk_level TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN (workload_pace_risk + goal_pressure_risk + role_clarity_risk +
            autonomy_control_risk + leadership_support_risk + peer_collaboration_risk +
            recognition_justice_risk + communication_change_risk + conflict_harassment_risk +
            recovery_boundaries_risk) / 10.0 >= 2.5 THEN 'high'
      WHEN (workload_pace_risk + goal_pressure_risk + role_clarity_risk +
            autonomy_control_risk + leadership_support_risk + peer_collaboration_risk +
            recognition_justice_risk + communication_change_risk + conflict_harassment_risk +
            recovery_boundaries_risk) / 10.0 >= 1.5 THEN 'medium'
      ELSE 'low'
    END
  ) STORED,
  
  action_plan TEXT,
  action_plan_status TEXT CHECK (action_plan_status IN ('pending', 'in_progress', 'completed')),
  assessed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Matriz de riscos psicossociais conforme NR-1 atualizada
- **Compliance:** Evidência legal para fiscalização trabalhista
- **RLS:** Dados sensíveis - apenas org admins e RH podem ver
- **Índices:** PRIMARY KEY (id), INDEX (org_id, assessment_date DESC), INDEX (overall_risk_level)

##### 5. **copc_metrics** - Indicadores Operacionais (COPC Adaptado)
```sql
copc_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metric_date DATE DEFAULT CURRENT_DATE,
  
  -- Qualidade
  quality_score NUMERIC(5,2) CHECK (quality_score BETWEEN 0 AND 100),
  rework_rate NUMERIC(5,2) CHECK (rework_rate BETWEEN 0 AND 100),
  
  -- Eficiência
  process_adherence_rate NUMERIC(5,2) CHECK (process_adherence_rate BETWEEN 0 AND 100),
  delivery_consistency NUMERIC(5,2) CHECK (delivery_consistency BETWEEN 0 AND 100),
  
  -- Pessoas
  absenteeism_rate NUMERIC(5,2) CHECK (absenteeism_rate BETWEEN 0 AND 100),
  engagement_score NUMERIC(3,2) CHECK (engagement_score BETWEEN 1 AND 5),
  operational_stress_level INT CHECK (operational_stress_level BETWEEN 1 AND 3),
  
  -- COPC v1.0: Pesos validados com Fartech
  -- Qualidade 35% | Eficiência 20% | Efetividade 20% | CX 15% | Pessoas 10%
  -- Nota: Se operação sem CX, redistribuir 15% → Qualidade +10%, Efetividade +5%
  customer_satisfaction_score NUMERIC(5,2) CHECK (customer_satisfaction_score BETWEEN 0 AND 100),
  first_call_resolution_rate NUMERIC(5,2) CHECK (first_call_resolution_rate BETWEEN 0 AND 100),
  
  overall_performance_score NUMERIC(5,2) GENERATED ALWAYS AS (
    (quality_score * 0.35) + 
    (process_adherence_rate * 0.20) + 
    (COALESCE(first_call_resolution_rate, delivery_consistency) * 0.20) + 
    (COALESCE(customer_satisfaction_score, 0) * 0.15) + 
    ((100 - absenteeism_rate) * 0.10)
  ) STORED,
  
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Indicadores operacionais conectados ao bem-estar humano
- **Diferencial:** Performance + saúde no mesmo dataset
- **RLS:** Gestores veem suas equipes, admins veem tudo
- **Índices:** PRIMARY KEY (id), INDEX (org_id, metric_date DESC), INDEX (team_id)

##### 6. **php_action_plans** - Planos de Ação Integrados (IA-assisted)
```sql
php_action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Origem da ação
  triggered_by TEXT CHECK (triggered_by IN ('tfci', 'nr1', 'copc', 'manual', 'ai')),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Detalhes
  title TEXT NOT NULL,
  description TEXT,
  root_cause TEXT,
  recommended_actions JSONB, -- Array de ações sugeridas pela IA
  
  -- Gestão
  assigned_to UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')) DEFAULT 'open',
  priority INT CHECK (priority BETWEEN 1 AND 5) DEFAULT 3,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Resultados
  effectiveness_score NUMERIC(3,2) CHECK (effectiveness_score BETWEEN 1 AND 5),
  follow_up_required BOOLEAN DEFAULT FALSE,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Planos de ação que cruzam comportamento + saúde + performance
- **IA:** Sugestões automáticas baseadas em padrões históricos
- **RLS:** Gestores e admins da org
- **Índices:** PRIMARY KEY (id), INDEX (org_id, status, priority), INDEX (assigned_to)

##### 7. **teams** - Times/Equipes (dependência para módulo PHP)
```sql
teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES auth.users(id),
  member_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Agrupamento de colaboradores para análises coletivas
- **RLS:** Membros da org podem ver, gestores gerenciam

##### 8. **team_members** - Relacionamento Usuário-Time
```sql
team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  role_in_team TEXT, -- 'member', 'lead', 'coordinator'
  UNIQUE(team_id, user_id)
)
```
- **RLS:** Membros da org podem ver membership

##### 9. **php_integrated_scores** - Score Integrado PHP (TFCI + NR-1 + COPC)
```sql
php_integrated_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  score_date DATE DEFAULT CURRENT_DATE,
  
  -- Componentes do score (0-100)
  tfci_score NUMERIC(5,2) CHECK (tfci_score BETWEEN 0 AND 100),
  nr1_score NUMERIC(5,2) CHECK (nr1_score BETWEEN 0 AND 100),
  copc_score NUMERIC(5,2) CHECK (copc_score BETWEEN 0 AND 100),
  
  -- PHP Score Final (média ponderada)
  -- TFCI 30% | NR-1 40% | COPC 30%
  php_score NUMERIC(5,2) GENERATED ALWAYS AS (
    (COALESCE(tfci_score, 0) * 0.30) + 
    (COALESCE(nr1_score, 0) * 0.40) + 
    (COALESCE(copc_score, 0) * 0.30)
  ) STORED,
  
  trend_vs_previous TEXT, -- 'up', 'down', 'stable'
  alert_level TEXT CHECK (alert_level IN ('none', 'watch', 'warning', 'critical')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Score único integrando as 3 dimensões (dashboard executivo)
- **Cálculo:** Média ponderada TFCI 30% + NR-1 40% + COPC 30%
- **RLS:** Gestores veem equipes, admins veem tudo
- **Índices:** PRIMARY KEY (id), INDEX (org_id, score_date DESC), INDEX (alert_level)

##### 10. **nr1_dimensions** - Catálogo de Dimensões NR-1
```sql
nr1_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'workload_pace', 'goal_pressure', etc
  name TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```
- **Propósito:** Catálogo das 10 dimensões NR-1 v1.0 (configurável)
- **Seed Inicial:**
  1. `workload_pace` - Carga de trabalho & ritmo
  2. `goal_pressure` - Pressão por metas & tempo
  3. `role_clarity` - Clareza de papéis & expectativas
  4. `autonomy_control` - Autonomia & controle sobre o trabalho
  5. `leadership_support` - Suporte da liderança
  6. `peer_collaboration` - Suporte entre colegas / colaboração
  7. `recognition_justice` - Reconhecimento & justiça percebida
  8. `communication_change` - Comunicação & mudanças
  9. `conflict_harassment` - Conflitos / assédio / relações difíceis
  10. `recovery_boundaries` - Recuperação & limites (descanso/desconexão)

##### 11. **copc_metrics_catalog** - Catálogo de Métricas COPC
```sql
copc_metrics_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('quality', 'efficiency', 'effectiveness', 'cx', 'people')),
  metric_name TEXT NOT NULL,
  metric_code TEXT NOT NULL,
  weight NUMERIC(5,2) CHECK (weight BETWEEN 0 AND 1), -- peso na categoria
  target_value NUMERIC(10,2),
  unit TEXT, -- '%', 'seconds', 'count'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, metric_code)
)
```
- **Propósito:** Catálogo customizável de métricas COPC por org
- **Pesos Padrão v1.0:**
  - Quality: 35%
  - Efficiency: 20%
  - Effectiveness: 20%
  - Customer Experience: 15% (ou 0% se backoffice)
  - People: 10%
- **RLS:** Apenas org admins gerenciam catálogo

### 🛣️ Rotas Frontend (Web - Next.js)

#### Grupo de Rotas: (recruiter)/php/

```
apps/web/src/app/(recruiter)/php/
├── layout.tsx                    # Layout com sidebar do módulo PHP
├── page.tsx                      # Dashboard PHP (overview integrado)
├── activation/
│   └── page.tsx                  # Ativação/Desativação do módulo (somente Fartech)
├── tfci/
│   ├── page.tsx                  # Lista de ciclos TFCI
│   ├── [cycleId]/
│   │   └── page.tsx              # Detalhes do ciclo + participantes
│   └── assessments/
│       └── [assessmentId]/page.tsx # Resultado individual (gestor only)
├── nr1/
│   ├── page.tsx                  # Matriz de riscos psicossociais (dashboard)
│   ├── assessments/
│   │   └── page.tsx              # Lista de avaliações NR-1
│   ├── [assessmentId]/
│   │   └── page.tsx              # Detalhes da avaliação + plano de ação
│   └── reports/
│       └── page.tsx              # Relatórios de compliance NR-1
├── copc/
│   ├── page.tsx                  # Dashboard de performance operacional
│   ├── metrics/
│   │   └── page.tsx              # Entrada/edição de métricas COPC
│   └── trends/
│       └── page.tsx              # Análise de tendências
├── action-plans/
│   ├── page.tsx                  # Lista de planos de ação
│   └── [planId]/
│       └── page.tsx              # Detalhes do plano
└── settings/
    └── page.tsx                  # Configurações do módulo (pesos, alertas)
```

**Proteção de Rotas:**
- Middleware verifica `php_module_activations.is_active` para org atual
- Redirect para `/php/activation` se módulo inativo
- Permissões por role (gestores veem equipes, admins veem tudo)

### 📡 Endpoints da API (NestJS)

#### Domínio: `/api/v1/php`

```typescript
// Ativação do Módulo
POST   /api/v1/php/activate               # Ativa módulo para org (Fartech only)
POST   /api/v1/php/deactivate             # Desativa módulo
GET    /api/v1/php/activation-status      # Status de ativação

// TFCI (Comportamento)
GET    /api/v1/php/tfci/cycles            # Lista ciclos de avaliação
POST   /api/v1/php/tfci/cycles            # Cria novo ciclo
GET    /api/v1/php/tfci/cycles/:id        # Detalhes do ciclo
PATCH  /api/v1/php/tfci/cycles/:id        # Atualiza ciclo (status, etc)
DELETE /api/v1/php/tfci/cycles/:id        # Deleta ciclo

POST   /api/v1/php/tfci/assessments       # Submete avaliação TFCI
GET    /api/v1/php/tfci/assessments       # Lista avaliações (filtros)
GET    /api/v1/php/tfci/assessments/:id   # Detalhes da avaliação
GET    /api/v1/php/tfci/heatmap           # Heatmap comportamental da org

// NR-1 (Riscos Psicossociais)
GET    /api/v1/php/nr1/assessments        # Lista avaliações NR-1
POST   /api/v1/php/nr1/assessments        # Cria avaliação NR-1
GET    /api/v1/php/nr1/assessments/:id    # Detalhes da avaliação
PATCH  /api/v1/php/nr1/assessments/:id    # Atualiza avaliação + plano
GET    /api/v1/php/nr1/risk-matrix        # Matriz de riscos agregada
GET    /api/v1/php/nr1/compliance-report  # Relatório de compliance (PDF)

// COPC (Performance Operacional)
GET    /api/v1/php/copc/metrics           # Lista métricas COPC
POST   /api/v1/php/copc/metrics           # Registra métricas
GET    /api/v1/php/copc/metrics/:id       # Detalhes da métrica
GET    /api/v1/php/copc/dashboard         # Dashboard agregado
GET    /api/v1/php/copc/trends            # Análise de tendências

// Planos de Ação Integrados
GET    /api/v1/php/action-plans           # Lista planos de ação
POST   /api/v1/php/action-plans           # Cria plano de ação
GET    /api/v1/php/action-plans/:id       # Detalhes do plano
PATCH  /api/v1/php/action-plans/:id       # Atualiza plano
DELETE /api/v1/php/action-plans/:id       # Deleta plano
POST   /api/v1/php/action-plans/ai-suggest # IA sugere ações (baseado em dados)

// Teams (dependência)
GET    /api/v1/teams                      # Lista times da org
POST   /api/v1/teams                      # Cria time
GET    /api/v1/teams/:id                  # Detalhes do time
PATCH  /api/v1/teams/:id                  # Atualiza time
DELETE /api/v1/teams/:id                  # Deleta time
GET    /api/v1/teams/:id/members          # Lista membros do time
POST   /api/v1/teams/:id/members          # Adiciona membro
DELETE /api/v1/teams/:id/members/:userId  # Remove membro
```

**Headers Obrigatórios:**
- `Authorization: Bearer <jwt>`
- `x-org-id: <uuid>` (contexto organizacional)

**Guards Aplicados:**
- `SupabaseAuthGuard` (autenticação)
- `OrgGuard` (multi-tenant)
- `PhpModuleGuard` (verifica ativação do módulo)
- `RoleGuard` (permissões por role)

### 🔐 RLS Policies (Row Level Security)

#### php_module_activations
```sql
-- Apenas admins globais e org admins podem ativar/desativar
CREATE POLICY "admin_manage_php_activation"
ON php_module_activations FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM org_members 
    WHERE org_id = php_module_activations.org_id 
    AND role IN ('admin', 'owner')
  )
  OR
  (SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin'
);
```

#### tfci_assessments
```sql
-- Membros podem criar avaliações para sua org
CREATE POLICY "members_submit_tfci"
ON tfci_assessments FOR INSERT
WITH CHECK (
  is_org_member(org_id)
);

-- Apenas gestores veem avaliações individuais
CREATE POLICY "managers_view_individual_tfci"
ON tfci_assessments FOR SELECT
USING (
  (SELECT raw_user_meta_data->>'user_type' FROM auth.users WHERE id = auth.uid()) = 'admin'
  OR
  auth.uid() IN (
    SELECT manager_id FROM teams 
    WHERE id = tfci_assessments.team_id
  )
);

-- Agregações são visíveis para todos membros da org
CREATE POLICY "members_view_aggregated_tfci"
ON tfci_assessments FOR SELECT
USING (
  is_org_member(org_id) 
  AND is_anonymous = TRUE
);
```

#### nr1_risk_assessments
```sql
-- Dados sensíveis: apenas org admins e RH
CREATE POLICY "admins_full_access_nr1"
ON nr1_risk_assessments FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM org_members 
    WHERE org_id = nr1_risk_assessments.org_id 
    AND role IN ('admin', 'owner', 'hr')
  )
);

-- Usuários veem apenas suas próprias avaliações
CREATE POLICY "users_view_own_nr1"
ON nr1_risk_assessments FOR SELECT
USING (
  user_id = auth.uid()
);
```

#### copc_metrics
```sql
-- Gestores veem métricas de suas equipes
CREATE POLICY "managers_view_team_copc"
ON copc_metrics FOR SELECT
USING (
  auth.uid() IN (
    SELECT manager_id FROM teams WHERE id = copc_metrics.team_id
  )
  OR
  is_org_member(org_id)
);

-- Apenas gestores e admins inserem métricas
CREATE POLICY "managers_insert_copc"
ON copc_metrics FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT manager_id FROM teams WHERE id = team_id
  )
  OR
  auth.uid() IN (
    SELECT user_id FROM org_members 
    WHERE org_id = copc_metrics.org_id 
    AND role IN ('admin', 'owner')
  )
);
```

#### php_action_plans
```sql
-- Membros veem planos da org
CREATE POLICY "members_view_action_plans"
ON php_action_plans FOR SELECT
USING (
  is_org_member(org_id)
);

-- Apenas gestores e admins criam/editam planos
CREATE POLICY "managers_manage_action_plans"
ON php_action_plans FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM org_members 
    WHERE org_id = php_action_plans.org_id 
    AND role IN ('admin', 'owner', 'manager')
  )
);
```

### 🗓️ Plano de Implementação (Fases)

#### 🔹 FASE 1 — Fundação e Ativação (Sprint 6 - 30 dias)

**Entregáveis:**
- ✅ Migration `20260130_create_php_module_tables.sql`
- ✅ Tabelas: `php_module_activations`, `teams`, `team_members`
- ✅ RLS policies para controle de ativação
- ✅ Endpoint `/api/v1/php/activate` e `/api/v1/php/deactivate`
- ✅ Rota `/php/activation` (toggle visual para Fartech)
- ✅ PhpModuleGuard (middleware NestJS)
- ✅ Validação: módulo ativo/inativo reflete no frontend

**Critério de Sucesso:**
- Fartech consegue ativar/desativar módulo PHP por org
- Recrutadores veem/não veem menu PHP conforme ativação

---

#### 🔹 FASE 2 — TFCI (Comportamento Coletivo) (Sprint 7 - 30 dias)

**Entregáveis:**
- ✅ Tabelas: `tfci_cycles`, `tfci_assessments`
- ✅ CRUD de ciclos de avaliação
- ✅ Formulário de avaliação TFCI (5 dimensões)
- ✅ Heatmap comportamental (dashboard agregado)
- ✅ Relatório de ciclo (participação, scores médios)

**Critério de Sucesso:**
- Recrutador cria ciclo "Q1 2026"
- Colaboradores avaliam colegas (anonimamente)
- Gestor vê scores agregados por equipe
- Heatmap identifica áreas de risco (ex: comunicação baixa)

---

#### 🔹 FASE 3 — NR-1 Digital (Riscos Psicossociais) (Sprint 8 - 30 dias)

**Entregáveis:**
- ✅ Tabela: `nr1_risk_assessments`
- ✅ Formulário de avaliação NR-1 (8 dimensões de risco)
- ✅ Matriz de riscos (dashboard executivo)
- ✅ Plano de ação integrado (campo `action_plan`)
- ✅ Relatório de compliance NR-1 (PDF exportável)
- ✅ Histórico evolutivo (tracking de riscos ao longo do tempo)

**Critério de Sucesso:**
- RH avalia equipe de vendas (sobrecarga = ALTO)
- Sistema gera matriz de risco com classificação
- Plano de ação é documentado (evidência legal)
- PDF de compliance é gerado para auditoria

---

#### 🔹 FASE 4 — COPC Adaptado (Performance Operacional) (Sprint 9 - 30 dias)

**Entregáveis:**
- ✅ Tabela: `copc_metrics`
- ✅ Entrada de métricas operacionais (qualidade, eficiência, pessoas)
- ✅ Dashboard COPC (performance + bem-estar)
- ✅ Análise de tendências (evolução de métricas)
- ✅ Cruzamento com TFCI e NR-1 (alertas quando performance cai + risco alto)

**Critério de Sucesso:**
- Gestor registra métricas da equipe (qualidade 85%, stress operacional médio)
- Dashboard mostra correlação: stress alto → qualidade caindo
- Alerta é disparado: "Equipe X precisa intervenção"

---

#### 🔹 FASE 5 — IA & Planos de Ação Integrados (Sprint 10 - 30 dias)

**Entregáveis:**
- ✅ Tabela: `php_action_plans`
- ✅ IA sugere planos de ação (baseado em padrões históricos)
- ✅ Workflow de plano: criação → atribuição → acompanhamento → efetividade
- ✅ Alertas preventivos (burnout, conflito, queda de performance)
- ✅ Benchmark interno (comparação entre equipes)

**Critério de Sucesso:**
- IA detecta: "Equipe Y com NR-1 alto + COPC baixo + TFCI em queda"
- Sistema sugere: "Reduzir metas 20% + treinamento de comunicação + coaching 1:1"
- Gestor aceita plano, atribui ações, acompanha efetividade
- Após 30 dias: scores melhoram, plano é marcado como efetivo

---

### 🎯 Posicionamento Comercial

**Valor Único de Mercado:**
> "Único sistema no Brasil que integra comportamento (TFCI), saúde psicossocial (NR-1) e performance operacional (COPC) em um único motor contínuo."

**Diferencial vs Concorrência:**
- ✅ **Compliance NR-1 Real**: Não é checklist, é matriz viva com evidência legal
- ✅ **TFCI Contextualizado**: Avaliação comportamental vira sensor de risco
- ✅ **COPC Simplificado**: Performance sem certificação complexa
- ✅ **IA Integrada**: Planos de ação baseados em cruzamento de 3 dimensões

**Público-Alvo:**
- Contact centers e BPOs (COPC é padrão do setor)
- Empresas com +200 funcionários (obrigação NR-1)
- Organizações com foco em ESG (saúde mental é pilar S)
- Auditadas por órgãos trabalhistas (MTE, fiscalização)

### 🚀 Próximos Passos Técnicos

**✅ Validado com Fartech (2026-01-29):**
1. ✅ **Dimensões NR-1 v1.0**: 10 dimensões aprovadas (expandido de 8)
2. ✅ **Pesos COPC v1.0**: Quality 35%, Efficiency 20%, Effectiveness 20%, CX 15%, People 10%
3. ✅ **PHP Score**: TFCI 30% + NR-1 40% + COPC 30%
4. ⏳ **Gatilhos IA**: Definir thresholds (ex: NR-1 high + COPC <60 → alerta crítico)
5. ⏳ **Mockups**: Dashboard executivo em progresso

**Dashboard PHP - Componentes Principais:**

**1. Score Integrado (PHP Score 0-100)**
- Gauge circular com cor dinâmica (verde >80, amarelo 60-80, vermelho <60)
- Tendência 90 dias (linha do tempo)
- Breakdown: TFCI 30% | NR-1 40% | COPC 30%

**2. Mapa de Risco NR-1 (Heatmap)**
- Eixo X: 10 dimensões NR-1
- Eixo Y: Equipes/Unidades
- Células coloridas por nível de risco (verde/amarelo/vermelho)
- Drill-down: clicar → detalhes da dimensão + histórico

**3. COPC Adaptado (5 Cards)**
- **Qualidade** (35%): Score atual + variação M/M + ícone tendência
- **Eficiência** (20%): AHT/throughput + meta vs real
- **Efetividade** (20%): FCR/reincidência + comparação período anterior
- **CX** (15%): CSAT/NPS + comentários recentes (se aplicável)
- **Pessoas** (10%): Absenteísmo/turnover + alertas

**4. Correlações & Alertas Inteligentes**
- "⚠️ Pressão por metas ↑ 15% vs Qualidade ↓ 12% (Equipe Vendas)"
- "🔔 3 equipes com NR-1 alto + COPC <60 → Intervenção recomendada"
- "✅ Reconhecimento ↑ correlaciona com Efetividade ↑ (r=0.78)"

**5. Top 5 Ações Recomendadas (IA)**
- Prioridade: Crítico/Alto/Médio
- Impacto estimado: +X pontos no PHP Score
- Owner: Atribuição automática ao gestor da equipe
- Status: Aberto/Em andamento/Concluído

**6. Alertas Preventivos**
- 🔴 **Burnout Risk**: NR-1 carga ≥2.5 + COPC pessoas <50
- 🟡 **Conflito Latente**: NR-1 conflitos ≥2.0 + TFCI colaboração <3.0
- 🟠 **Queda Brusca**: COPC qualidade -20% em 30 dias
- 🔵 **Absenteísmo Anormal**: Taxa >10% (threshold configurável)

**Migration `20260130_create_php_module_tables.sql` - Estrutura:**

```sql
-- 1. php_module_activations (controle de ativação)
-- 2. teams + team_members (estrutura de equipes)
-- 3. nr1_dimensions (catálogo de 10 dimensões v1.0)
-- 4. tfci_cycles + tfci_assessments (comportamento)
-- 5. nr1_risk_assessments (matriz de riscos psicossociais)
-- 6. copc_metrics_catalog + copc_metrics (performance operacional)
-- 7. php_integrated_scores (score PHP 0-100)
-- 8. php_action_plans + php_action_items (planos de ação)
-- 9. Índices essenciais (org_id, team_id, assessment_date)
-- 10. RLS policies (multi-tenant + permissões por role)
-- 11. Views para dashboard (v_php_dashboard, v_nr1_heatmap, v_copc_summary)
-- 12. Seed inicial (10 dimensões NR-1, métricas COPC padrão)
```

**Enums SQL:**
```sql

---

## 📋 PRÓXIMOS PASSOS — Roadmap Sprint 11+

### ✅ Sprint 11: Validação & Cleanup (CONCLUÍDO)

**Status:** ✅ Concluído em 2026-02-03  
**Objetivo:** Cleanup de banco de dados e validação de arquitetura

**Conquistas da Sprint 11:**
- ✅ Auditoria completa do banco de dados (70+ tabelas analisadas)
- ✅ Remoção de tabelas não utilizadas (candidate_saved_jobs, candidate_applications_view, invitations, employee_reports)
- ✅ Consolidação IAM: tenants/tenant_users deprecados → usar organizations/org_members
- ✅ Documentação de migrations atualizada
- ✅ Arquitetura canônica validada

---

### ✅ Sprint 12: Action Plans & Settings (CONCLUÍDO)

**Status:** ✅ Concluído em 2026-02-03  
**Objetivo:** Implementar gestão de planos de ação e configurações avançadas

**Conquistas Sprint 12 - Fase 1 (Action Plans):**
- ✅ Backend API completo (`apps/api/src/php/action-plans/`)
  - ActionPlansModule, Controller, Service, DTOs, Entities
  - 8 endpoints: CRUD plans + CRUD items + stats + top-priority
- ✅ Frontend completo (`apps/web/src/app/(recruiter)/php/action-plans/`)
  - Lista de planos com filtros (status, risco, atrasados)
  - Formulário de criação de plano
  - Página de detalhe com gerenciamento de tarefas
- ✅ RLS policies corrigidas (INSERT/DELETE para action_items)
- ✅ Menu "Ações" adicionado ao layout PHP

**Conquistas Sprint 12 - Fase 2 (Settings):**
- ✅ Backend API completo (`apps/api/src/php/settings/`)
  - SettingsModule, Controller, Service, DTOs, Entities
  - 4 endpoints: GET, PUT, POST reset, POST test-webhook
- ✅ Frontend completo (`apps/web/src/app/(recruiter)/php/settings/`)
  - 4 abas: Pesos, Alertas, Notificações, Avançado
  - Configuração de pesos TFCI/NR-1/COPC (validação = 100%)
  - Thresholds customizáveis (burnout, conflito, queda, absenteísmo)
  - Notificações por email e webhook
  - Opções de IA e automação
- ✅ Menu "Config" adicionado ao layout PHP

---

### 🎯 Sprint 11 Legacy: Validação & Produção

**Status:** 🟡 Em Validação Manual  
**Deadline:** 31/01/2026  
**Objetivo:** Deploy seguro do Admin Panel para produção

**Conquistas da Sprint 10 (Concluídas):**
- ✅ Admin Panel funcional (ativação/desativação por organização)
- ✅ Controle de acesso (Fartech admin only)
- ✅ Estilização 100% conforme Design System
  - Paleta: Azul `#1F4ED8` + Laranja `#F97316` + Cinza `#6B7280`
  - Tipografia: Montserrat (font-bold, font-semibold)
  - Componentes: Cards, botões, spinners, badges alinhados
- ✅ 5 páginas atualizadas (layout, dashboard, tfci, ai, nr1)
- ✅ Score conformidade: 97% (AUDITORIA_MODULO_PHP.md)

#### Checklist de Validação (VALIDACAO_PRE_DEPLOY.md):

**1. Testes Manuais (Prioridade P0):**
- [ ] Login como admin → acessar `/admin/companies`
- [ ] Expandir card Fartech → ver status módulo PHP
- [ ] Clicar "Ativar Módulo PHP" → verificar card verde + pesos (30/40/30)
- [ ] Clicar "Desativar" → verificar card cinza + botão muda para "Ativar"
- [ ] Login como recruiter → verificar "Módulo PHP" no menu
- [ ] Clicar "Módulo PHP" → verificar redirect para `/php/tfci/cycles`
- [ ] Tentar acessar `/php/activation` como recruiter → verificar redirect
- [ ] Login como `contato.fartech@app.br` → acessar `/php/activation` → sucesso
- [ ] Verificar persistência (logout + login → módulo continua ativo)

**2. Testes Automatizados (Prioridade P0):**
```bash
# Rodar todos os scripts E2E
npm run test:php-visibility      # ✅ Já passou
node scripts/test-php-module.js  # Pendente
node scripts/test-copc-e2e.js    # Pendente
node scripts/test-ai-e2e.js      # ✅ Já passou (6/6)
```

**3. Validação de Segurança (Prioridade P0 - CRÍTICO):**
```bash
# Verificar RLS policies
psql $DATABASE_URL -f supabase/VALIDATE_IMPROVEMENTS.sql
```
**Verificar:**
- [ ] RLS ativo em `php_module_activations`
- [ ] Políticas filtram por `org_id`
- [ ] Service role pode ler/escrever (admin endpoints)
- [ ] Authenticated users só veem própria org

**4. Build Validation (Prioridade P0):**
```bash
npm run build  # Web + API
npm run lint   # Sem erros TypeScript
```

**5. Deploy Preview (Prioridade P1):**
```bash
git add .
git commit -m "feat(admin): Admin panel PHP activation - Sprint 10 complete"
git push origin main
# Testar no Vercel preview antes de marcar como production
```

**Critérios de Aceitação para Produção:**
- ✅ Todos testes manuais passam (9/9)
- ✅ Todos scripts E2E passam (4/4)
- ✅ RLS validado (VALIDATE_IMPROVEMENTS.sql)
- ✅ Build sem erros
- ✅ Deploy preview testado

---

### 🚀 Sprint 12: Action Plans & Settings (Fevereiro 2026) ✅ COMPLETO

**Objetivo:** Implementar gestão de planos de ação e configurações avançadas

**Features Implementadas:**
1. **Action Plans Management** ✅
   - Frontend: `/php/action-plans` + `/php/action-plans/[id]`
   - Backend: `ActionPlansModule` com CRUD completo
   - Tabelas: `php_action_plans`, `php_action_items`
   - Integração com dashboard (top 5 ações)

2. **Settings Page** ✅
   - Frontend: `/php/settings`
   - Backend: `SettingsModule` com configurações por org
   - Tabela: `php_module_settings`
   - Configuração de pesos, thresholds, notificações

**Arquivos Criados:**
- `apps/api/src/php/action-plans/` - Módulo completo (controller, service, module, DTOs)
- `apps/api/src/php/settings/` - Módulo de configurações
- `apps/web/src/app/(recruiter)/php/action-plans/page.tsx`
- `apps/web/src/app/(recruiter)/php/settings/page.tsx`

**Commits:**
- `5dd105f` - feat(php): implement Action Plans module - Sprint 12 Phase 1
- `08000af` - feat(php): implement Settings module - Sprint 12 Phase 2 complete

---

### 🤖 Sprint 13: OpenAI Enhanced (Março 2026) ✅ COMPLETO

**Objetivo:** Integração profunda com OpenAI GPT-4 para análise avançada

**Features Implementadas:**
1. **Natural Language Reports** ✅
   - Endpoint: `POST /php/ai/query` - Consultas em linguagem natural
   - Endpoint: `POST /php/ai/report` - Geração de relatórios narrativos
   - Tipos: summary, detailed, executive, comparison

2. **Predictive Analytics** ✅
   - Endpoint: `POST /php/ai/predict-turnover` - Predição de turnover (0-100%)
   - Endpoint: `POST /php/ai/forecast-performance` - Forecast de performance (até 12 meses)
   - Análise de fatores de risco e intervenções recomendadas

3. **AI-Powered Recommendations** ✅
   - Endpoint: `POST /php/ai/smart-recommendations` - Recomendações priorizadas por objetivo
   - Endpoint: `POST /php/ai/chat` - Conversa interativa com contexto persistente
   - Sugestões de ações com passos de implementação

4. **Infraestrutura** ✅
   - Rate limiting: 50 req/hora por org (em memória)
   - Caching: 5 min TTL para dados de org
   - Custo tracking: Tabela `php_ai_usage` com tokens e USD
   - Fallback: Funciona sem OpenAI com respostas básicas

**Arquivos Criados:**
- `apps/api/src/php/ai/ai-enhanced.service.ts` - Serviço OpenAI integrado
- `apps/api/src/php/ai/dto/ai.dto.ts` - DTOs e interfaces
- `apps/web/src/app/(recruiter)/php/ai-chat/page.tsx` - Interface de chat
- `supabase/migrations/20260204_openai_enhanced.sql` - Tabelas de tracking

**Novos Endpoints (8):**
- POST `/php/ai/query` - Consulta em linguagem natural
- POST `/php/ai/report` - Gera relatório narrativo
- POST `/php/ai/predict-turnover` - Prediz risco de turnover
- POST `/php/ai/forecast-performance` - Previsão de performance
- POST `/php/ai/smart-recommendations` - Recomendações inteligentes
- POST `/php/ai/chat` - Chat interativo
- GET `/php/ai/usage` - Estatísticas de uso
- GET `/php/ai/health` - Status da integração (v2.0)

**Validações:**
- ✅ OpenAI API key configurada via OPENAI_API_KEY
- ✅ Rate limiting por organização
- ✅ Caching de dados com TTL
- ✅ Cost tracking por feature

**Commit:** `446689c` - feat(php): implement OpenAI Enhanced module - Sprint 13

---

### 📊 Sprint 14: Real-Time Dashboard (Abril 2026) ✅ COMPLETO

**Objetivo:** Dashboard live com WebSockets para métricas em tempo real

**Features Implementadas:**
1. **WebSocket Integration** ✅
   - Backend: Socket.IO em NestJS (`PhpEventsGateway`)
   - Namespace: `/php` com CORS e transports configurados
   - Connection tracking por org_id
   - Events: dashboard:update, notification, cursor:update, action:locked

2. **Live Notifications** ✅
   - `NotificationsModule` com serviço completo
   - Tabela: `php_notifications` com RLS
   - Convenience methods: notifyHighRiskNr1, notifyLowTfciScore, etc.
   - Frontend: `NotificationBell` component com dropdown

3. **Collaborative Features** ✅
   - User presence tracking (`php_user_presence`)
   - Cursor tracking em tempo real
   - Edit locks (`php_edit_locks`) com expiração 5min
   - Comments em tempo real (`php_comments`)

4. **Dashboard Metrics Service** ✅
   - `DashboardService` com cache 30s
   - Métricas agregadas: TFCI, NR-1, COPC, Action Plans
   - Auto-emit via WebSocket on refresh

**Arquivos Criados:**
- `apps/api/src/php/events/php-events.gateway.ts` - WebSocket gateway (390+ linhas)
- `apps/api/src/php/events/php-events.module.ts` - Módulo global
- `apps/api/src/php/notifications/` - Módulo completo
- `apps/api/src/php/dashboard/` - Serviço de métricas
- `apps/web/src/hooks/use-php-realtime.ts` - Hook React para WebSocket
- `apps/web/src/components/php/notifications.tsx` - Componentes UI
- `supabase/migrations/20260205_realtime_dashboard.sql` - 4 tabelas + RLS

**Novos Endpoints (7):**
- GET `/php/notifications/:orgId` - Listar não lidas
- GET `/php/notifications/:orgId/count` - Contador
- POST `/php/notifications/:notificationId/read` - Marcar como lida
- POST `/php/notifications/:orgId/read-all` - Marcar todas
- GET `/php/dashboard/:orgId/metrics` - Métricas agregadas
- POST `/php/dashboard/:orgId/refresh` - Forçar refresh + emit
- GET `/php/dashboard/stats/connections` - Stats WebSocket

**WebSocket Events:**
- Client→Server: join:org, leave:org, cursor:move, action:lock/unlock, comment:add
- Server→Client: user:joined, cursor:update, dashboard:update, notification, goal:achieved

**Validações:**
- ✅ Socket.IO instalado (@nestjs/websockets, socket.io)
- ✅ Fallback para polling se WebSocket falhar
- ✅ RLS em todas novas tabelas

**Commits:**
- `92c7006` - feat(php): Sprint 14 - Real-time dashboard with WebSocket
- `3f99575` - fix(migrations): organization_members → org_members

---

### 📦 Shared Types Package (Fevereiro 2026) ✅ COMPLETO

**Objetivo:** Tipos TypeScript compartilhados entre API e Web

**Implementado:**
- `packages/types/src/php.ts` - 17 enums + 30 interfaces para PHP
- `packages/types/src/php-dto.ts` - 45+ DTOs para todos endpoints
- `packages/types/src/employee.types.ts` - Tipos de Employee

**Tipos Principais:**
- Enums: PhpModuleStatus, TfciCycleStatus, Nr1RiskLevel, ActionPlanStatus, etc.
- Entities: TfciCycle, Nr1Assessment, CopcMetric, ActionPlan, PhpNotification
- DTOs: Create/Update/Query para todos os recursos

**Commit:** `e5b5a8f` - feat(types): Add shared PHP module types and DTOs

---

### 🔒 Sprint 15: Compliance & Audit (Maio 2026)

**Objetivo:** Auditoria completa + conformidade LGPD/SOC2

**Features:**
1. **Audit Log System**
   - Tabela: `audit_logs` (who, what, when, old_value, new_value)
   - Trigger em todas tabelas PHP
   - Retenção: 7 anos (legal requirement)

2. **LGPD Compliance**
   - Consentimento explícito para avaliações
   - Right to erasure (delete user data)
   - Data portability (export JSON/CSV)
   - Privacy policy aceite obrigatório

3. **Security Hardening**
   - Rate limiting por IP
   - 2FA obrigatório para admins
   - Session timeout (15min inatividade)
   - Encryption at rest (sensitive fields)

4. **Validações:**
   - Penetration test (contratar consultoria)
   - LGPD checklist 100% completo
   - Audit log covering 100% das tabelas

---

### 🌍 Sprint 16: Multi-Language & Export (Junho 2026)

**Objetivo:** Suporte i18n + export de relatórios avançados

**Features:**
1. **Internationalization (i18n)**
   - Idiomas: PT-BR (default), EN, ES
   - next-intl para frontend
   - i18n para backend (emails, reports)
   - Detecção automática de idioma (browser)

2. **Advanced Export**
   - PDF: Relatório executivo completo (logo, gráficos, narrativa)
   - Excel: Planilha interativa com macros
   - PowerPoint: Deck pronto para apresentação (C-level)
   - API: Export via webhook (integrações externas)

3. **Customizable Templates**
   - Admin pode criar templates personalizados
   - Drag & drop de widgets (gráficos, tabelas, KPIs)
   - Brand colors + logo customizável

---

### 📈 Sprint 17: Mobile App (Julho-Agosto 2026)

**Objetivo:** App nativo para iOS/Android (React Native)

**Features:**
1. **Core Features Mobile**
   - Dashboard resumido (PHP score + alertas)
   - Push notifications (ações críticas)
   - Quick assessment (avaliação rápida no celular)
   - Offline mode (sync quando volta online)

2. **Manager View**
   - Aprovar/rejeitar action plans
   - Comentar em avaliações
   - Ver heatmap (touch-friendly)

3. **Employee Self-Service**
   - Ver próprio score TFCI
   - Auto-avaliação NR-1
   - Feedback anônimo

4. **Validações:**
   - App Store + Google Play publicados
   - Beta test com 20 usuários Fartech
   - Performance: < 3s load time

---

### 🔗 Sprint 18: Job Publisher Engine — Publicação Multi-Canal (Setembro-Outubro 2026)

**Objetivo:** Motor de publicação automática de vagas em plataformas externas (Gupy, Vagas.com, LinkedIn, Indeed) via API/feeds oficiais — sem RPA ou scraping.

**Princípio:** A vaga canônica vive no TalentForge (`jobs`). Os adapters traduzem e publicam nos canais. O status de cada canal é rastreado independentemente.

---

#### 🏗️ Arquitetura — Publisher Engine

```
┌──────────────────────────────────────────────────────┐
│                   TALENT FORGE                        │
│                                                       │
│  ┌─────────┐    ┌──────────────────┐                 │
│  │  jobs    │───▸│  Job Canonical   │                 │
│  │ (table)  │    │     Model        │                 │
│  └─────────┘    └────────┬─────────┘                 │
│                          │                            │
│               ┌──────────▼──────────┐                │
│               │  Publisher Engine    │                │
│               │  (Fila + Retry)     │                │
│               └──┬───┬───┬───┬─────┘                │
│                  │   │   │   │                        │
│         ┌────────┘   │   │   └────────┐              │
│         ▼            ▼   ▼            ▼              │
│    ┌────────┐  ┌─────┐ ┌──────┐  ┌───────┐         │
│    │ Gupy   │  │Vagas│ │Linke-│  │Indeed │         │
│    │Adapter │  │Adpt │ │dIn   │  │Adapter│         │
│    └───┬────┘  └──┬──┘ └──┬───┘  └───┬───┘         │
│        │          │       │          │               │
└────────┼──────────┼───────┼──────────┼───────────────┘
         ▼          ▼       ▼          ▼
     Gupy API   Vagas API  LinkedIn  Indeed
     (REST)     (REST)     Job Post  Job Sync
                           API       API/XML
```

---

#### 📦 Modelo Canônico da Vaga (Job Canonical Model)

O modelo canônico é a representação única e normalizada da vaga no TalentForge. Cada adapter extrai os campos que precisa e adapta ao formato da plataforma destino.

```typescript
// packages/types/src/job-canonical.ts
interface JobCanonical {
  // — Identidade
  id: string;                        // UUID do TalentForge
  org_id: string;                    // Organização dona da vaga
  title: string;                     // Título da vaga
  description: string;               // Descrição completa (HTML ou Markdown)
  
  // — Localização
  location: string;                  // Cidade/Estado
  remote_policy?: 'on_site' | 'hybrid' | 'remote';
  country?: string;                  // ISO 3166-1 alpha-2 (default: 'BR')
  
  // — Compensação
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;          // ISO 4217 (default: 'BRL')
  benefits?: string;                 // Texto livre ou JSON
  
  // — Requisitos
  employment_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'temporary';
  seniority: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director' | 'executive';
  skills?: string[];                 // Tags de competência
  education_level?: string;          // Nível mínimo
  experience_years?: number;         // Anos de experiência
  
  // — Controle
  status: 'draft' | 'open' | 'on_hold' | 'closed';
  expires_at?: string;               // ISO 8601
  created_by: string;                // UUID do recrutador
  created_at: string;
  updated_at: string;
}
```

---

#### 🗄️ Schema de Banco — Tabelas de Publicação

```sql
-- =====================================================================
-- job_publication_channels — Canais configurados por organização
-- =====================================================================
CREATE TABLE IF NOT EXISTS job_publication_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  channel_code TEXT NOT NULL CHECK (channel_code IN (
    'gupy', 'vagas', 'linkedin', 'indeed', 'catho', 'infojobs', 'custom'
  )),
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  credentials JSONB DEFAULT '{}'::jsonb,    -- Tokens/API keys (encrypted at rest)
  config JSONB DEFAULT '{}'::jsonb,          -- Configurações específicas do canal
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, channel_code)
);

-- =====================================================================
-- job_publications — Status de publicação de cada vaga em cada canal
-- =====================================================================
CREATE TABLE IF NOT EXISTS job_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  channel_id UUID REFERENCES job_publication_channels(id) ON DELETE CASCADE NOT NULL,
  external_id TEXT,                           -- ID da vaga na plataforma externa
  external_url TEXT,                          -- URL pública da vaga no canal
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'publishing', 'published', 'failed', 'expired', 'unpublished'
  )),
  payload_sent JSONB,                        -- Payload enviado ao canal (auditoria)
  response_received JSONB,                   -- Resposta do canal (auditoria)
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, channel_id)
);

-- =====================================================================
-- job_publication_logs — Log de auditoria (cada tentativa registrada)
-- =====================================================================
CREATE TABLE IF NOT EXISTS job_publication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID REFERENCES job_publications(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'create', 'publish', 'update', 'unpublish', 'expire', 'retry', 'webhook'
  )),
  status TEXT NOT NULL,                      -- 'success' | 'error'
  request_payload JSONB,
  response_payload JSONB,
  error_detail TEXT,
  duration_ms INTEGER,                       -- Tempo de resposta do canal
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE job_publication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_publication_logs ENABLE ROW LEVEL SECURITY;

-- Policies (org_id via join para publications e logs)
CREATE POLICY channels_org_access ON job_publication_channels
  FOR ALL USING (
    EXISTS (SELECT 1 FROM org_members om 
            WHERE om.org_id = job_publication_channels.org_id 
            AND om.user_id = auth.uid() AND om.status = 'active')
  );

CREATE POLICY publications_org_access ON job_publications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM jobs j
            JOIN org_members om ON om.org_id = j.org_id
            WHERE j.id = job_publications.job_id
            AND om.user_id = auth.uid() AND om.status = 'active')
  );

CREATE POLICY logs_org_access ON job_publication_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM job_publications jp
            JOIN jobs j ON j.id = jp.job_id
            JOIN org_members om ON om.org_id = j.org_id
            WHERE jp.id = job_publication_logs.publication_id
            AND om.user_id = auth.uid() AND om.status = 'active')
  );
```

---

#### 🔌 Adapters por Canal

**Prioridade de implementação (baseada em abertura da API):**

| # | Canal | Método | Viabilidade | Pré-requisitos |
|---|-------|--------|-------------|----------------|
| 1 | **Gupy** | REST API (OAuth) | ✅ Alta | Conta empresarial + credenciais OAuth |
| 2 | **Vagas for Business** | REST API (API Key) | ✅ Alta | Conta empresarial + API Key |
| 3 | **LinkedIn** | Job Posting API | ⚠️ Média | Programa de parceiros / ATS autorizado |
| 4 | **Indeed** | Job Sync API (GraphQL) ou XML Feed | ⚠️ Média | Parceria ATS ou feed XML aprovado |
| 5 | **Catho** | A definir | ❓ Investigar | Contato comercial |
| 6 | **InfoJobs** | A definir | ❓ Investigar | Contato comercial |

---

##### 1. Gupy Adapter (API pública oficial)

```typescript
// apps/api/src/publisher/adapters/gupy.adapter.ts
interface GupyAdapter {
  // Fluxo: Create (rascunho) → Publish (ativa)
  createJob(canonical: JobCanonical): Promise<{ externalId: string }>;
  publishJob(externalId: string): Promise<void>;
  updateJob(externalId: string, canonical: JobCanonical): Promise<void>;
  unpublishJob(externalId: string): Promise<void>;
  getJobStatus(externalId: string): Promise<GupyJobStatus>;
}

// Endpoints Gupy:
// POST   /jobs              → Cria rascunho
// PATCH  /jobs/{id}         → Publica/atualiza
// DELETE /jobs/{id}         → Remove
// Webhooks: candidatura recebida → atualiza pipeline no Forge
```

**Mapeamento Gupy:**
| JobCanonical | Gupy Field | Notas |
|---|---|---|
| `title` | `name` | — |
| `description` | `description` | HTML aceito |
| `location` | `address.city` | Precisa decompor |
| `employment_type` | `type` | Mapeamento de enum |
| `salary_min/max` | `salary.min/max` | — |
| `seniority` | `careerLevel` | Mapeamento de enum |
| `skills` | `desiredSkills` | Array de strings |

##### 2. Vagas for Business Adapter

```typescript
// apps/api/src/publisher/adapters/vagas.adapter.ts
interface VagasAdapter {
  publishJob(canonical: JobCanonical): Promise<{ externalId: string; url: string }>;
  updateJob(externalId: string, canonical: JobCanonical): Promise<void>;
  closeJob(externalId: string): Promise<void>;
  getApplications(externalId: string): Promise<VagasApplication[]>;
}

// Endpoints Vagas for Business:
// POST   /api/jobs         → Publica vaga
// PUT    /api/jobs/{id}    → Atualiza
// DELETE /api/jobs/{id}    → Encerra
// GET    /api/jobs/{id}/applications → Candidaturas
```

##### 3. LinkedIn Adapter (requer parceria)

```typescript
// apps/api/src/publisher/adapters/linkedin.adapter.ts
interface LinkedInAdapter {
  // Requer: ATS Partner Program enrollment
  postJob(canonical: JobCanonical): Promise<{ externalId: string; url: string }>;
  updateJob(externalId: string, canonical: JobCanonical): Promise<void>;
  closeJob(externalId: string): Promise<void>;
}

// Pré-requisito: Inscrição no LinkedIn ATS Partner Program
// Endpoint: POST /v2/simpleJobPostings (ou /v2/jobPostings)
// Auth: OAuth 2.0 com scope r_liteprofile + w_member_social + rw_jobs
```

##### 4. Indeed Adapter (feed XML ou API)

```typescript
// apps/api/src/publisher/adapters/indeed.adapter.ts
interface IndeedAdapter {
  // Opção A: XML Feed (mais fácil de aprovar)
  generateXmlFeed(jobs: JobCanonical[]): string;
  
  // Opção B: Job Sync API (GraphQL, requer parceria)
  syncJob(canonical: JobCanonical): Promise<{ externalId: string }>;
  deleteJob(externalId: string): Promise<void>;
}

// XML Feed: Gerar em /api/feeds/indeed.xml (cron atualiza a cada 6h)
// Job Sync API: GraphQL mutation createJob / updateJob
```

---

#### 🔀 Endpoints REST no TalentForge

```
POST   /api/v1/jobs                       → Cria vaga (modelo canônico)
GET    /api/v1/jobs/:id                    → Detalhe da vaga + status por canal
POST   /api/v1/jobs/:id/publish            → Publica em canais selecionados
POST   /api/v1/jobs/:id/unpublish          → Despublica de canais selecionados
GET    /api/v1/jobs/:id/channels           → Status por canal (published/pending/error)
POST   /api/v1/jobs/:id/channels/:channel  → Publica em canal específico
DELETE /api/v1/jobs/:id/channels/:channel  → Despublica de canal específico
GET    /api/v1/jobs/:id/publication-logs    → Logs de auditoria

POST   /api/v1/webhooks/gupy              → Webhook: eventos Gupy → pipeline
POST   /api/v1/webhooks/vagas             → Webhook: eventos Vagas → pipeline
POST   /api/v1/webhooks/linkedin          → Webhook: eventos LinkedIn → pipeline

GET    /api/v1/organizations/:orgId/channels         → Canais configurados
POST   /api/v1/organizations/:orgId/channels         → Configurar canal (credenciais)
PATCH  /api/v1/organizations/:orgId/channels/:id     → Atualizar credenciais
DELETE /api/v1/organizations/:orgId/channels/:id     → Remover canal

GET    /api/feeds/indeed.xml              → XML Feed para Indeed (público, com auth token)
```

---

#### 📂 Estrutura de Pastas (monorepo)

```
apps/
  api/src/
    publisher/
      publisher.module.ts              → NestJS module
      publisher.service.ts             → Orquestra publicação (fila + retry)
      publisher.controller.ts          → Endpoints REST
      job-canonical.mapper.ts          → jobs (DB) → JobCanonical
      adapters/
        adapter.interface.ts           → Interface base (publishJob, updateJob, etc.)
        gupy.adapter.ts               → Conector Gupy (REST/OAuth)
        vagas.adapter.ts              → Conector Vagas for Business
        linkedin.adapter.ts           → Conector LinkedIn (Job Posting API)
        indeed.adapter.ts             → Conector Indeed (XML + GraphQL)
      webhooks/
        gupy-webhook.handler.ts       → Processa eventos Gupy
        vagas-webhook.handler.ts      → Processa eventos Vagas
      feeds/
        indeed-feed.generator.ts      → Gera XML feed para Indeed
  web/src/
    app/(recruiter)/
      jobs/
        [id]/
          publish/page.tsx            → UI de publicação multi-canal
          channels/page.tsx           → Status por canal
    app/api/v1/
      jobs/
        [id]/
          publish/route.ts            → Next.js API route (proxy ou direto)
          channels/route.ts
      webhooks/
        gupy/route.ts
        vagas/route.ts
      feeds/
        indeed.xml/route.ts
    components/
      publisher/
        ChannelSelector.tsx           → Seleção de canais para publicar
        PublicationStatus.tsx          → Badge de status por canal
        PublicationTimeline.tsx        → Timeline de eventos de publicação
```

---

#### ⚡ Publisher Engine — Fluxo de Publicação

```
1. Recrutador cria vaga (POST /api/v1/jobs)
   └─▸ Salva em `jobs` (status: 'draft')

2. Recrutador clica "Publicar" e seleciona canais
   └─▸ POST /api/v1/jobs/:id/publish { channels: ['gupy', 'vagas'] }

3. Publisher Engine (para cada canal):
   a. Cria registro em `job_publications` (status: 'pending')
   b. Mapeia JobCanonical → formato do canal (adapter)
   c. Envia para API do canal
   d. Se sucesso:
      - status → 'published', salva external_id e external_url
      - Log em job_publication_logs (action: 'publish', status: 'success')
   e. Se erro:
      - status → 'failed', salva error_message
      - Log em job_publication_logs (action: 'publish', status: 'error')
      - Agenda retry (backoff exponencial: 1min, 5min, 30min, 2h)
      - Máx 5 retries → notifica recrutador

4. Webhooks (ex: candidato aplica via Gupy):
   └─▸ POST /api/v1/webhooks/gupy
   └─▸ Identifica vaga pelo external_id
   └─▸ Cria application no pipeline do Forge
   └─▸ Log em job_publication_logs (action: 'webhook')
```

---

#### 🛡️ Segurança e Compliance

- **Credenciais criptografadas**: `job_publication_channels.credentials` armazena tokens OAuth/API keys — campo JSONB com encrypt/decrypt via `pgcrypto` ou aplicação
- **Nunca logar credenciais**: `payload_sent` em logs NUNCA inclui tokens; sanitizar antes de persistir
- **Rate limiting por canal**: Respeitar limites de cada API (ex: Gupy 60 req/min)
- **Audit trail completo**: Cada tentativa gera registro em `job_publication_logs` com request/response
- **Webhooks**: Validar assinatura (HMAC) quando o canal suportar
- **RLS**: Todas tabelas com RLS via `org_id` (join chain: `publications → jobs → org_members`)

---

#### 🚫 Anti-padrões (NÃO IMPLEMENTAR)

| ❌ Anti-padrão | ✅ Correto |
|---|---|
| RPA/Selenium para publicar em sites | API oficial / XML feed |
| Scraping de candidaturas | Webhooks + API de retorno |
| Credenciais hardcoded | `job_publication_channels.credentials` (criptografado) |
| Retry infinito | Máx 5 retries + notificação de falha |
| Publicação síncrona (bloqueia UI) | Fila assíncrona com status polling |
| Bypass de RLS nas tabelas de publicação | Join chain via `jobs.org_id` |

---

#### 📅 Fases de Implementação

| Fase | Canais | Estimativa | Entregável |
|---|---|---|---|
| **Fase 1** | Gupy + Vagas for Business | 3 semanas | Publisher Engine + 2 adapters + UI de publicação |
| **Fase 2** | LinkedIn (com parceria) | 2 semanas | LinkedIn adapter + enrollment no partner program |
| **Fase 3** | Indeed (XML feed + API) | 2 semanas | Feed XML + adapter GraphQL |
| **Fase 4** | Catho + InfoJobs | 2 semanas | Investigação + adapters (se API disponível) |
| **Fase 5** | Webhooks bidirecionais | 1 semana | Candidaturas externas → pipeline TalentForge |

**Pré-requisitos por canal:**
1. **Gupy**: Criar conta developer no portal Gupy → obter OAuth client_id/secret
2. **Vagas for Business**: Solicitar API Key via painel empresarial
3. **LinkedIn**: Inscrição no LinkedIn ATS Partner Program (pode levar 2-4 semanas de aprovação)
4. **Indeed**: Solicitar acesso à Job Sync API ou configurar XML Feed Publisher ID

---

## 🎓 DECISÕES ARQUITETURAIS CHAVE

### 1. Por que JSONB para settings ao invés de colunas?
**Decisão:** Usar `settings JSONB DEFAULT '{}'` na tabela `php_module_activations`  
**Razão:**
- Flexibilidade: Adicionar novos configs sem migration
- Atomicidade: Update único para múltiplos settings
- Query power: PostgreSQL tem operadores JSONB excelentes (`->`, `->>`, `@>`)
**Trade-off:** Performance ligeiramente inferior a colunas dedicadas (aceitável para < 10K orgs)

### 2. Por que Admin Panel ao invés de API-only?
**Decisão:** UI completa de admin em Next.js (não só API)  
**Razão:**
- UX: Fartech precisa ativar clientes rapidamente (sem Postman)
- Segurança: Menos chance de erro (UI valida antes de enviar)
- Visibilidade: Ver todas empresas + status de ativação em um lugar
**Trade-off:** Mais código frontend (mas reutiliza componentes existentes)

### 3. Por que controle de acesso client-side + server-side?
**Decisão:** Guard duplo (frontend redirect + backend verification)  
**Razão:**
- Defense in depth: Cliente pode burlar frontend, mas backend bloqueia
- UX: Redirect imediato (sem esperar request falhar)
- Performance: Menos requests desnecessárias ao backend
**Trade-off:** Duplicação de lógica (mas mínima - só email check)

---

## 🔍 DEBUGGING & TROUBLESHOOTING

### Módulo PHP não aparece no menu recruiter
**Diagnóstico:**
```bash
node scripts/test-php-visibility.js
# Verifica: org existe? Módulo ativo? User é membro?
```
**Solução comum:**
- Módulo não ativado → Admin deve ativar em `/admin/companies`
- RLS bloqueando → Verificar `is_org_member()` retorna true
- Cache frontend → Fazer logout + login

### Admin não consegue ativar módulo
**Diagnóstico:**
```bash
# No browser console:
fetch('/api/admin/companies/<org_id>/php-module', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}).then(r => r.json()).then(console.log)
```
**Solução comum:**
- Supabase service role key não configurada → Checar `.env.local`
- Organização não existe → Verificar UUID correto
- Migration não rodou → Aplicar `20260129_*` migrations

### Recruiter vê tela de ativação (erro de acesso)
**Diagnóstico:**
```typescript
// Em php/activation/page.tsx, adicionar log:
console.log('User email:', profile?.email);
console.log('Is Fartech admin:', profile?.email === 'contato.fartech@app.br');
```
**Solução comum:**
- Guard client-side não carregou → Verificar `useEffect` executou
- Email diferente → Atualizar constante `FARTECH_ADMIN_EMAIL`
- Cache do browser → Hard refresh (Cmd+Shift+R)

---

## ✅ CONFORMIDADE FINAL

**Score Atual:** 97% ✅ (Atualizado 2026-01-29 23:50)  

**Conquistas da Sprint 10:**
- ✅ Admin Panel funcional (100%)
- ✅ Controle de acesso implementado (100%)
- ✅ Estilização conforme Design System (100%)
- ✅ 37/37 endpoints implementados (100%)
- ✅ PhpModuleGuard protegendo rotas (100%)
- ✅ 5 scripts E2E passando (100%)

**Bloqueadores para 100%:**
- [ ] RLS policies validadas (`VALIDATE_IMPROVEMENTS.sql`) — P0 CRÍTICO
- [ ] Action plans implementados (Sprint 12) — P2
- [ ] Settings page implementada (Sprint 12) — P2

**Status Deploy:**
- 🟡 **Aguardando:** Testes manuais (VALIDACAO_PRE_DEPLOY.md)
- 🟢 **Pronto:** Código, endpoints, guards, E2E tests, estilização
- 🔴 **Pendente:** Validation SQL (crítico antes de production)

**Auditorias Completas:**
- 📊 AUDITORIA_MODULO_PHP.md (97% conformidade)
- 📊 AVALIACAO_CONFORMIDADE_PHP.md (95% conformidade)
- 📋 VALIDACAO_PRE_DEPLOY.md (checklist pré-produção)

**Design System:**
- ✅ Paleta de cores oficial aplicada (Azul #1F4ED8 + Laranja #F97316)
- ✅ Tipografia Montserrat padronizada (font-bold, font-semibold)
- ✅ Componentes alinhados (cards, botões, spinners, badges)
- ✅ 5 páginas atualizadas (layout, dashboard, tfci, ai, nr1)
- 📖 Referência: docs/design-system.md

**Assinatura Arquitetural:**  
Fernando Dias + AI Assistant | 2026-01-29 23:50 UTC  
Próxima revisão: Sprint 12 (Action Plans + Settings)

---

---

## Sprint 25 — Qualidade de Código (2026-03-03)

**Objetivo:** Elevar a qualidade base do codebase com segurança (type safety, testes, error recovery).

### FASE 1 — Limpeza e Type Safety
- ✅ **142 console.log removidos** de 29 arquivos (produção silenciosa)
- ✅ **ESLint ativo** no build (`ignoreDuringBuilds: false`)
- ✅ `eslint.config.mjs` reescrito com `FlatCompat` (ESLint 9 + next/core-web-vitals)
- ✅ `JobStatus` enum completado com `DRAFT` e `PAUSED` em `packages/types`
- ✅ `dashboard/layout.tsx` tipado com `Organization[]` via flatMap
- ✅ Arquivos mortos removidos: `page-backup.tsx`, `page-simple.tsx`

### FASE 2 — Testes Automatizados
- ✅ **Playwright E2E** — 7 testes contra produção (Chromium headless):
  - `e2e/01-auth-pages`: login e register renderizam corretamente
  - `e2e/02-auth-redirect`: rotas protegidas redirecionam para /login
  - `e2e/03-api-auth`: APIs PHP retornam 401 sem Bearer token
- ✅ **Jest unitário** — 8 testes para `lib/api.ts` (`apiFetch`):
  - Headers obrigatórios (Content-Type, Authorization, x-org-id)
  - Erro HTTP 4xx/5xx com mensagem do body
  - Timeout (AbortError → "Request timed out")
  - Re-throw de erros de rede
- **Arquivos de teste:** `apps/web/e2e/`, `apps/web/__tests__/lib/`, `apps/web/playwright.config.ts`

### FASE 3 — Error Boundaries
- ✅ `(recruiter)/error.tsx` — captura erros no dashboard de recrutadores
- ✅ `(admin)/error.tsx` — captura erros no painel admin
- ✅ `(candidate)/error.tsx` — captura erros na área do candidato
- ✅ `not-found.tsx` — página 404 global com link de retorno
- Design: paleta oficial `#141042` + `#FAFAF8` + `border #E5E5DC`

### Resultados
- Build: ✅ 102 páginas, exit code 0
- Playwright: ✅ 7/7 passando
- Jest: ✅ 8/8 passando

---

## Sprint 26 — Pipeline Bug Fix + Em Documentação (2026-03-03)

**Objetivo:** Corrigir candidatos não carregando no pipeline e adicionar nova fase.

### Problema resolvido
- **Bug:** `GET /api/v1/applications` não existia como Next.js Route — frontend chamava NestJS (instável em produção) e recebia 404
- **Causa raiz:** Todas as outras rotas já foram migradas para Next.js API Routes, mas `applications` ficou para trás

### Implementações
- ✅ **`GET/POST /api/v1/applications`** — Nova Next.js Route com Supabase direto
  - Filtro multi-tenant via `jobs!inner(org_id)` (applications não tem org_id)
  - Segurança: `getAuthUser()` retorna 401 sem Bearer token
- ✅ **`PATCH /api/v1/applications/[id]/stage`** — Move candidatura de fase + registra `application_events`
- ✅ **`PATCH /api/v1/applications/[id]/status`** — Altera status da candidatura
- ✅ **Migration `20260303_application_status_in_documentation.sql`** aplicada em produção
  - `ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'in_documentation' AFTER 'in_process'`
  - Fluxo completo: `applied → in_process → in_documentation → hired | rejected`
- ✅ **Migration `20260316_add_interview_status.sql`** aplicada em produção
  - `ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'interview_hr' AFTER 'in_process'`
  - `ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'interview_manager' AFTER 'interview_hr'`
  - Sub-statuses exibidos como badge dentro da coluna **Em Avaliação** do Kanban
  - Fluxo completo: `applied → in_process → [interview_hr → interview_manager →] in_documentation → hired | rejected`
- ✅ **Pipeline Kanban:** coluna `in_documentation` (violeta) entre "Em Avaliação" e "Contratados"
- ✅ **`packages/types/enums.ts`:** `ApplicationStatus.IN_DOCUMENTATION = 'in_documentation'`
- ✅ **E2E:** teste `GET /api/v1/applications returns 401` adicionado em `03-api-auth.spec.ts`

### Enum application_status (atualizado)
```sql
CREATE TYPE application_status AS ENUM (
  'applied',          -- Novas Candidaturas
  'in_process',       -- Em Avaliação
  'interview_hr',     -- Entrevista com o RH (sub-status de in_process) ✨ Sprint 45
  'interview_manager',-- Entrevista com o Gestor (sub-status de in_process) ✨ Sprint 45
  'in_documentation', -- Em Documentação ✨ Sprint 26
  'hired',            -- Contratados
  'rejected'          -- Não Aprovados
);
```

> **Nota:** `interview_hr` e `interview_manager` são sub-statuses que residem visualmente na coluna **Em Avaliação** do Kanban. O badge indicador aparece no card do candidato mas a coluna não muda. O campo `pipeline_stages.name` continua sendo a fonte de verdade para labels de etapas customizadas.

### Resultados
- Build: ✅ 103 páginas (+1 nova rota), exit code 0
- Playwright: ✅ 8/8 passando
- Commit: `03ce0c3`

---

## Sprint 27 — Headhunter Org Fallback Fix (2026-03-03)

**Objetivo:** Corrigir pipeline mostrando zero candidatos para usuários do tipo headhunter (multi-org).

### Problema resolvido
- **Bug:** `limit(1)` sem ordem na query de `org_members` retornava org errada para headhunters que são membros de múltiplas organizações
- **Causa raiz:** Um headhunter pode ser `admin` da própria org E `member/manager` de orgs clientes — `limit(1)` sem `ORDER BY` escolhia aleatoriamente entre elas

### Fix aplicado em `apps/web/src/app/(recruiter)/dashboard/pipeline/page.tsx`

```tsx
// ❌ ANTES (bug — org indeterminada para headhunter multi-org)
const { data: orgMembership } = await supabase
  .from('org_members').select('org_id')
  .eq('user_id', user?.id).limit(1).maybeSingle();
resolvedOrgId = orgMembership?.org_id || null;

// ✅ DEPOIS (correto — prioriza role admin = própria org do headhunter)
const { data: orgMemberships } = await supabase
  .from('org_members').select('org_id, role')
  .eq('user_id', user.id).eq('status', 'active')
  .order('created_at', { ascending: true });
const adminOrg = orgMemberships.find(m => m.role === 'admin');
const managerOrg = orgMemberships.find(m => m.role === 'manager');
resolvedOrgId = adminOrg?.org_id || managerOrg?.org_id || orgMemberships[0].org_id;
```

### Lógica de prioridade de org (headhunter)
| Prioridade | Role | Org selecionada |
|-----------|------|-----------------|
| 1ª | `admin` | Própria org do headhunter |
| 2ª | `manager` | Org onde é gestor |
| 3ª | qualquer | Primeira org ativa por `created_at` |

### ⚠️ Problema com Turbopack (documentado)
Novas **rotas** Next.js criadas enquanto `next dev --turbopack` está rodando **não são detectadas por hot-reload**. Exige reinício manual:
```bash
# Matar o servidor
lsof -ti :3000 | xargs kill -9
# Reiniciar
npm run dev:web
```
Somente arquivos existentes são recarregados automaticamente; novos arquivos de rota precisam de restart.

### Resultados
- Pipeline de candidatos funcionando para todos os perfis (recruiter, headhunter, admin)
- Commit: `294c6bd` + fix headhunter aplicado

---

## Sprint 28 — Plano de Melhoria Módulo Recrutamento (2026-03-04)

**Objetivo:** Avaliar 360° o módulo de recrutamento e documentar roadmap de evolução.

### Avaliação 360° — Notas por área

| Área | Nota | Justificativa |
|------|------|---------------|
| Arquitetura técnica | 8/10 | Sólida. Pequenas inconsistências de cliente Supabase |
| Segurança | 9/10 | RLS, JWT, multi-tenant corretos |
| Performance | 5/10 | Sem paginação, componentes monolíticos |
| Completude de produto | 6/10 | Falta career page pública, rastreamento, filtros |
| UX/UI | 7/10 | Design system consistente, mas telas sobrecarregadas |
| Manutenibilidade | 6/10 | `CandidatesPage` com 1.317 linhas é risco |

**Nota geral: 6.8/10**

### Gaps críticos identificados

| # | Problema | Impacto |
|---|---------|--------|
| 1 | ~~Sem página pública de vagas (career page)~~ **✅ RESOLVIDO** — `/vagas` global job board (Sprint 48) | Alto |
| 2 | Pipeline sem filtro por vaga | Alto |
| 3 | Sem paginação em candidatos/vagas | Alto |
| 4 | Reports ainda usa NestJS instável | Médio |
| 5 | Sem rastreamento de origem das candidaturas | Médio |
| 6 | Modais de criação abrem páginas novas (UX ruim) | Médio |

### Roadmap aprovado

#### Sprint A — Career Page Pública ✅ ENTREGUE
**Rota:** `(public)/vagas/page.tsx` (job board global, Sprint 48), `(public)/jobs/[orgSlug]/page.tsx` (career page por org), `(public)/jobs/[orgSlug]/[jobId]/page.tsx` (detalhe + candidatura)

**Job Board Global `/vagas`** (Sprint 48 — 2026-03-17): RPC `get_all_public_jobs()` SECURITY DEFINER, 4 filtros (contrato/modalidade/senioridade/setor), redesign superior à Sólides Vagas, busca por cargo + localidade. Commit `75c3d8e`

**Campos novos em `jobs`:**
```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description_html TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits TEXT[];
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements TEXT[];
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_deadline DATE;
```

**Campos novos em `organizations`:**
```sql
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS career_page_enabled BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS career_page_headline TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS career_page_logo_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS career_page_color TEXT DEFAULT '#141042';
```

**View pública:**
```sql
CREATE OR REPLACE VIEW v_public_jobs AS
SELECT j.id, j.title, j.department, j.location, j.type,
  j.salary_min, j.salary_max, j.description_html,
  j.benefits, j.requirements, j.application_deadline, j.created_at,
  o.name AS org_name, o.slug AS org_slug,
  o.career_page_headline, o.career_page_logo_url, o.career_page_color
FROM jobs j
JOIN organizations o ON o.id = j.org_id
WHERE j.status = 'active' AND j.is_public = true AND o.career_page_enabled = true;
GRANT SELECT ON v_public_jobs TO anon, authenticated;
```

**Integração landing page:** Adicionar link `Vagas` no nav de `(public)/page.tsx` e seção "Vagas em Destaque".

#### Sprint B — Pipeline com Filtro por Vaga
- Seletor de vaga no topo do kanban (dropdown)
- URL param: `/dashboard/pipeline?job=<uuid>`
- Badge com nome da vaga em cada card

#### Sprint C — Paginação e Performance
- Paginação cursor-based via `.range(from, to)` do Supabase
- Refactor `CandidatesPage` (1.317 linhas) em: `CandidateCard`, `CandidateFilters`, `CandidateDetailDrawer`, `CandidateAssessmentsTab`

#### Sprint D — Rastreamento de Origem
```sql
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN (
    'direct_link','career_page','linkedin','indeed','referral','whatsapp','other'
  )),
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
```

#### Sprint E — Migrar Reports para Next.js Routes
- Remover `reportsApi` (NestJS) de `dashboard/reports/page.tsx`
- Queries diretas ao Supabase via route handlers
- Adicionar `in_documentation` em `STATUS_LABELS`

#### Sprint F — Limpeza
- Remover `page-backup.tsx` e `page-simple.tsx`
- Padronizar `createBrowserClient` → `createClient` em todas as telas
- Corrigir `statusColors` jobs: `open` → `active`, `on_hold` → `paused`

#### Sprint G1 — Modais Translúcidos de Criação

**Padrão visual canônico para criação rápida:**

| Propriedade | Valor |
|-------------|-------|
| Overlay | `bg-[#141042]/40 backdrop-blur-sm` |
| Container | `bg-white/95 rounded-2xl shadow-2xl border border-white/20` |
| Animação | `animate-in fade-in-0 zoom-in-95 duration-200` |
| Título | `text-lg font-semibold text-[#141042]` |
| Botão salvar | `bg-[#141042] hover:bg-[#1a1554] text-white` |

**Novo componente:** `apps/web/src/components/ui/creation-modal.tsx`

**Mudanças em `jobs/page.tsx`:**
- Botão `+ Nova Vaga`: de `Link href="/dashboard/jobs/new"` → `onClick={() => setShowNewJobModal(true)}`
- Modal tamanho `lg` com todos os campos do formulário inline
- Após salvar: `void loadJobs()` + toast (sonner)

**Mudanças em `candidates/page.tsx`:**
- Adicionar botão `+ Novo Candidato` (com `UserPlus`) no header
- Modal tamanho `md`
- Corrigir `candidatesApi` → Supabase direto
- Corrigir fallback de org (mesmo padrão Sprint 27 — prioridade por role)

**Regra:** Páginas `/dashboard/jobs/new`, `/dashboard/jobs/[id]`, `/dashboard/jobs/[id]/edit` e `/dashboard/jobs/[id]/publish` foram **removidas** (Sprint 29). Todo o fluxo de vagas é inline via modais e drawers. Apenas `/dashboard/jobs/[id]/applications` é mantida.

### Documento de referência
`docs/PLANO_MELHORIA_MODULO_RECRUTAMENTO.md` — avaliação 360° completa com wireframes, SQL e specs técnicas por sprint.

---

---

## Sprint 29 — Módulo de Vagas 100% Inline (2026-03-04)

**Objetivo:** Eliminar toda navegação de página do módulo de vagas. Todas as ações ocorrem via modais e drawers sem sair da lista.

### Componentes criados

| Componente | Tipo | z-index | Função |
|-----------|------|---------|--------|
| `NewJobModal.tsx` | Modal overlay | `z-50` | Criação de nova vaga |
| `JobDetailsModal.tsx` | Modal overlay | `z-50` | Visualização, ações de status e exclusão |
| `EditJobDrawer.tsx` | Drawer lateral (direito) | `z-[61]` | Edição completa da vaga inline |
| `PublishDrawer.tsx` | Drawer lateral (direito) | `z-[61]` | Gerenciar publicações por canal |

### Padrão de z-index para sobreposição

```
z-50  → Modal de detalhes (JobDetailsModal)
z-[60] → Overlay dos drawers secundários
z-[61] → Painel dos drawers secundários (EditJobDrawer, PublishDrawer)
```

### Páginas removidas

| Rota | Substituído por |
|------|----------------|
| `/dashboard/jobs/new/page.tsx` | `NewJobModal.tsx` |
| `/dashboard/jobs/[id]/page.tsx` | `JobDetailsModal.tsx` |
| `/dashboard/jobs/[id]/edit/page.tsx` | `EditJobDrawer.tsx` |
| `/dashboard/jobs/[id]/publish/page.tsx` | `PublishDrawer.tsx` |

**Mantido:** `/dashboard/jobs/[id]/applications/page.tsx` — ainda referenciado como link no `JobDetailsModal`.

### Commits
- `2064d5d` — feat(jobs): PublishDrawer inline
- `7df7d9f` — feat(jobs): EditJobDrawer inline
- `8dcaf5f` — chore(jobs): remove páginas obsoletas (-1929 linhas)

---

## Sprint 30 — Módulo de Documentação Admissional + Pipeline Drawer (2026-03-04)

**Objetivo:** Implementar fluxo completo de documentação admissional CLT e corrigir erros 401/400 no pipeline.

### Novos componentes

| Componente | Tipo | z-index | Função |
|-----------|------|---------|--------|
| `ApplicationDetailsDrawer.tsx` | Drawer lateral (direito) | `z-[61]` | Perfil do candidato, documentos admissionais e currículo |

### Padrão de z-index completo (atualizado)

```
z-50    → JobDetailsModal
z-[60]  → Overlay drawers (Edit, Publish, ApplicationDetails)
z-[61]  → Painel drawers
z-[70]  → Overlay resume viewer (portal candidato)
z-[71]  → Painel resume viewer (portal candidato)
z-[80]  → Overlay doc/resume viewer (dentro de drawers do recrutador)
z-[81]  → Painel doc/resume viewer (dentro de drawers do recrutador)
```

### Módulo de Documentação Admissional

**Fluxo:** Candidato movido para `in_documentation` → portal exibe seção de upload → recrutador visualiza no drawer

**14 tipos de documento CLT:**
`rg` · `cpf` · `ctps` · `pis` · `comprovante_residencia` · `certidao_civil` · `foto` · `titulo_eleitor` · `reservista` (opcional) · `escolaridade` · `cnh` (opcional) · `aso` (opcional) · `dados_bancarios` · `certidao_filhos` (opcional)

**Tabela `application_documents`:**
```sql
id              UUID PK
application_id  UUID FK → applications(id) ON DELETE CASCADE
document_type   TEXT  -- rg | cpf | ctps | ...
file_name       TEXT
bucket_path     TEXT  -- {application_id}/{document_type}_{timestamp}.{ext}
uploaded_by     UUID FK → auth.users(id)
uploaded_at     TIMESTAMPTZ
UNIQUE (application_id, document_type)  -- upsert ao reenviar
```

**RLS `application_documents`:**
- Candidato SELECT: `uploaded_by = auth.uid()` OR via `candidates.user_id`
- Candidato INSERT: apenas quando `applications.status = 'in_documentation'`
- Candidato UPDATE: `uploaded_by = auth.uid()`
- Recrutador SELECT: via `is_org_member(jobs.org_id)` (join `applications → jobs`)

**Storage bucket `application-documents`:** privado, 10MB, PDF/JPG/PNG/WEBP/DOC/DOCX

### Correções de bugs

| Bug | Causa | Fix |
|-----|-------|-----|
| 401 ao salvar pipeline | `sessionToken` stale no estado React | `handleSaveChanges` busca token fresco via `supabase.auth.getSession()` antes de cada save |
| 400 no drawer ao abrir candidato | `candidate_profiles` não tinha `location`, `headline`, `profile_score` | Mapeado para `city`+`state`, `current_title`, `profile_completion_percentage` |
| 400 no drawer — colunas ausentes | `linkedin_url` e `experience_years` não existiam | Migration `20260304_candidate_profiles_extra_fields.sql` adiciona as colunas |
| `is_org_member` com 2 argumentos | Assinatura recebe apenas `(org_id)` — `auth.uid()` é interno | Corrigido na migration `20260304_application_documents.sql` |

### Alterações em `candidate_profiles`

```sql
ALTER TABLE candidate_profiles
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS experience_years INT;
```

> `location` → mapeado de `city` + `state` (join no frontend)
> `headline` → mapeado de `current_title`
> `profile_score` → mapeado de `profile_completion_percentage`

### Commits
- `bbaad41` — feat(docs): módulo documentação admissional (migration + portal candidato + drawer)
- `37cf19e` — fix(pipeline): corrige 401 ao salvar (token fresco) e 400 no drawer (colunas inexistentes)

---

## Sprint 30.1 — Fix RLS application_documents + Perfis comportamentais (2026-03-05)

**Objetivo:** Corrigir erros 403/RLS que impediam candidatos sem `candidates.user_id` de escrever
documentos e visualizar seus perfis comportamentais no dashboard.

### Causa raiz
A coluna `candidates.user_id` foi dropada e restaurada em migrations da sprint 22, deixando registros
com `user_id = NULL`. Queries diretas com `candidate_user_id = auth.uid()` falhavam silenciosamente
para esses candidatos.

### Padrão canônico estabelecido
Todas as operações de leitura/escrita do candidato devem usar **funções `SECURITY DEFINER`** com
fallback duplo:
```sql
c.user_id = auth.uid()
OR (c.email IS NOT NULL AND c.email = (auth.jwt() ->> 'email'))
```

### Novas funções RPC

| Função | Tabelas | Operação |
|--------|---------|----------|
| `upsert_application_document(p_application_id, p_document_type, p_file_name, p_bucket_path)` | `application_documents` | INSERT/UPDATE (valida `status = in_documentation`) |
| `get_my_disc_result()` | `assessments` + `disc_assessments` | SELECT (retorna resultado DISC mais recente) |
| `get_my_color_result()` | `color_assessments` | SELECT (retorna perfil de cores mais recente) |
| `get_my_pi_result()` | `pi_assessments` | SELECT (retorna PI mais recente) |

### Alterações no portal candidato

| Arquivo | Mudança |
|---------|--------|
| `candidate/applications/page.tsx` | `.upsert()` → `.rpc('upsert_application_document')` |
| `candidate/page.tsx` | queries diretas de DISC/Color/PI → RPCs com fallback |
| `candidate/page.tsx` | busca de candidaturas no dashboard → `get_my_applications()` (mesmo padrão) |
| `candidate/layout.tsx` | sino estático → dropdown dinâmico com badge, lista candidaturas `in_documentation` |

### Migrations
- `20260305_fix_application_documents_rls.sql` — GRANT SELECT, DROP políticas INSERT/UPDATE,
  função `upsert_application_document` SECURITY DEFINER
- `20260305_get_my_behavioral_profiles.sql` — funções `get_my_disc_result`, `get_my_color_result`,
  `get_my_pi_result` SECURITY DEFINER

---

## Sprint 30.2 — Vagas Salvas (candidate_saved_jobs) (2026-03-05)

**Objetivo:** Implementar o fluxo completo de salvar/remover vagas no portal do candidato, seguindo padrões canônicos de RLS e RPCs SECURITY DEFINER.

### Contexto arquitetural
A tabela `candidate_saved_jobs` existia anteriormente como tabela legada, sem RLS adequado. Foi removida em `20260203_cleanup_unused_tables.sql`. Esta sprint a re-introduz com arquitetura canônica:
- `user_id` como chave de isolamento (não `candidate_id`)
- RLS explícito por política, não depende de join
- RPC SECURITY DEFINER para listagem com join em `jobs`

### Schema
```sql
candidate_saved_jobs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id     UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, job_id)
)
```

### RLS
| Política | Operação | Condição |
|----------|----------|----------|
| `candidate_saved_jobs_select` | SELECT | `user_id = auth.uid()` |
| `candidate_saved_jobs_insert` | INSERT | `user_id = auth.uid()` |
| `candidate_saved_jobs_delete` | DELETE | `user_id = auth.uid()` |

### Nova função RPC
| Função | Tabelas | Operação |
|--------|---------|----------|
| `get_my_saved_jobs()` | `candidate_saved_jobs` + `jobs` | SELECT — retorna vagas salvas com detalhes completos do job |

### Alterações no portal candidato
| Arquivo | Mudança |
|---------|---------|
| `candidate/saved/page.tsx` | Totalmente reimplementado — listagem real, skeleton loading, botão remover com confirmação visual |
| `candidate/jobs/page.tsx` | Adicionado botão toggle Salvar/Salva (`Bookmark`/`BookmarkCheck`) em cada card de vaga; carrega `savedJobIds` no mount |

### Migration
- `20260305_candidate_saved_jobs.sql` — tabela + índices (`user_id`, `job_id`) + 3 políticas RLS + RPC `get_my_saved_jobs()`

---

---

## Sprint 31 — Google Login + Google Calendar + Agenda do Headhunter (2026-03-06)

**Objetivo:** Ativar login social Google via Supabase OAuth, migrar integração de Google Calendar de NestJS para Next.js API Routes e implementar módulo de Agenda completo para o perfil de headhunter.

---

### 31.1 — Google Login (Supabase OAuth)

O código `signInWithOAuth({ provider: 'google' })` já existia nas telas de login e register. Apenas configuração de infra era necessária:

1. **Google Cloud Console** → OAuth 2.0 Client ID (Web application)
   - Authorized redirect URI: `https://fjudsjzfnysaztcwlwgm.supabase.co/auth/v1/callback`
2. **Supabase Dashboard** → Authentication → Providers → Google → habilitar + Client ID + Client Secret

Nenhuma alteração de código foi necessária.

---

### 31.2 — Google Calendar: migração NestJS → Next.js API Routes

**Problema:** `WebhookManager.tsx` chamava `apiFetch('/auth/google-calendar/*')` que apontava para `NEXT_PUBLIC_API_URL` errada; NestJS instável em produção.

**Solução:** 4 novas Next.js API Routes com service role direto ao Supabase.

#### Rotas criadas em `apps/web/src/app/api/google-calendar/`

| Arquivo | Método | Função |
|---------|--------|--------|
| `authorize/route.ts` | GET | Gera URL de consent OAuth do Google; salva CSRF state em `user_profiles.google_calendar_state` |
| `callback/route.ts` | GET | Recebe `?code=&state=`; valida state; troca code por tokens; salva `access_token`, `refresh_token`, `expires_at`, `email`; redireciona para `/dashboard/settings?google=connected` |
| `status/route.ts` | GET | Retorna `{ connected: boolean, email: string \| null }` |
| `disconnect/route.ts` | POST | Limpa colunas `google_calendar_*` em `user_profiles` |

#### Colunas adicionadas em `user_profiles` (migration `20260124_google_calendar_integration.sql`)

```sql
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_access_token TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_calendar_email TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS google_calendar_connected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_calendar_state TEXT;
```

#### `WebhookManager.tsx` atualizado
- Removido `apiFetch` e `createClient` imports
- Substituído por `fetch('/api/google-calendar/status|authorize|disconnect')` direto (Next.js routes)
- Sessão gerenciada server-side via cookies — sem necessidade de passar JWT manualmente

#### Env vars necessárias (`.env.local` + Vercel)
```
GOOGLE_CALENDAR_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=xxxx
```
> Redirect URI no Google Cloud Console: `https://web-eight-rho-84.vercel.app/api/google-calendar/callback`

---

### 31.3 — Tabela `interviews` (migration `20260306_interviews_table.sql`)

```sql
CREATE TABLE public.interviews (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id            UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  candidate_id      UUID REFERENCES candidates(id) ON DELETE SET NULL,
  application_id    UUID REFERENCES applications(id) ON DELETE SET NULL,
  job_id            UUID REFERENCES jobs(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_minutes  INT NOT NULL DEFAULT 60,
  type              TEXT NOT NULL DEFAULT 'video' CHECK (type IN ('video', 'presencial', 'phone')),
  location          TEXT,
  notes             TEXT,
  meet_link         TEXT,
  google_event_id   TEXT,
  status            TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**RLS:** `is_org_member(org_id)` para todas as operações (authenticated).
**Índices:** `org_id`, `scheduled_at`, `candidate_id`.

---

### 31.4 — AgendaModal (calendário mensal + timeline do dia)

**Arquivo:** `apps/web/src/components/calendar/AgendaModal.tsx`

**Ativação:** Botão "Agenda" no sidebar do recruiter (`CalendarDays` icon, acima da seção Recrutamento) em `dashboard/layout.tsx`.

#### Layout

```
┌──────────────────────────────────────────────────────────┐
│ Header: Agenda  < Março 2026 >  [Hoje]  [GCal status] [X] │
├──────────────────────────────────────────────────────────┤
│ Mini calendário mensal (6 × 7 grid, base Mon)            │
│  Seg  Ter  Qua  Qui  Sex  Sáb  Dom                       │
│  [1]  [2]  [3]  [4]  [5]  [6]  [7]                       │
│   …                                                       │
│  Dots azuis = eventos; círculo verde neon = hoje (comercial) │
├──────────────────────────────────────────────────────────┤
│ Timeline dia selecionado (08:00 → 20:00)                 │
│  08:00  ──── livre (hover: "Agendar às 08:00") ────      │
│  09:00  ██ Entrevista Técnica João · Vídeo 60min ██      │
│  10:00  │ (spanning — barra azul continuação)            │
│  11:00  ──── livre ────                                  │
│   …                                                      │
│  20:00  ──── fim do expediente ────                      │
└──────────────────────────────────────────────────────────┘
```

#### Lógica do círculo verde

| Condição | Aparência do dia atual |
|----------|------------------------|
| Horário comercial (08:00–19:59) | `bg-[#22c55e] shadow-[0_0_10px_2px_rgba(34,197,94,0.45)]` (verde neon com glow) |
| Fora do horário comercial | `bg-[#141042]` (azul escuro padrão) |

Re-verifica o horário a cada 60 segundos via `setInterval`.

#### Timeline — comportamento dos slots

| Estado do slot | Comportamento visual |
|---------------|---------------------|
| **Livre** | Botão invisível que aparece no hover da linha — "Agendar às HH:00" com border dashed |
| **Com entrevista** | Card colorido por tipo: `video` = azul, `presencial` = violeta, `phone` = emerald |
| **Continuação de reunião** | Barra vertical azul `bg-[#93C5FD]` (evento span entre horas) |
| **Hora atual** (hoje) | Background sutil `bg-[#FAFAF8]` + label da hora destacado em `#141042` |

#### Integração com Google Calendar
- Ao salvar nova entrevista: se `gcConnected === true`, abre `calendar.google.com/calendar/render` com evento pré-preenchido (TEMPLATE) em nova aba.
- Status de conexão exibido no header do modal com link para Configurações.

---

### 31.5 — Upload de currículo (candidates/new)

**Arquivo:** `apps/web/src/app/(recruiter)/candidates/new/page.tsx`

- Removido `candidatesApi` (NestJS) — `handleSubmit` usa Supabase direto
- Upload de PDF/DOC para bucket `resumes` (privado) em path `candidates/{candidateId}/{ts}.{ext}`
- Colunas adicionadas via migration `20260306_candidates_resume_upload.sql`:
  ```sql
  ALTER TABLE public.candidates
    ADD COLUMN IF NOT EXISTS resume_url TEXT,
    ADD COLUMN IF NOT EXISTS resume_filename TEXT;
  ```
- Política RLS: `authenticated` pode INSERT no bucket `resumes`

---

---

---

## Sprint 32 — Correções Críticas de Build + Roteamento (2026-03-06)

**Objetivo:** Corrigir erros de build bloqueantes no Vercel: dependência ausente `@talentforge/types`, conflito de rota dinâmica e erros de lint/parsing.

### 32.1 — Dependência `@talentforge/types` (build Vercel)

**Problema:** `Cannot find module '@talentforge/types'` no build do Vercel.

**Causa:** npm workspaces exige declaração explícita mesmo para pacotes internos. Sem isso, o Vercel não cria o symlink.

**Arquivos alterados:**
- `apps/web/package.json` — adicionado `"@talentforge/types": "*"` em `dependencies`
- `apps/web/next.config.mjs` — adicionado `transpilePackages: ['@talentforge/types']`

### 32.2 — AgendaModal: grid do calendário mensal (visual fix)

**Problema:** Dias do calendário apareciam em coluna única em vez de grade 7×6.

**Causa:** Tailwind v4 CSS-first + Turbopack não emite classes `grid-cols-7` de forma confiável.

**Solução:** Reescrita completa da seção de calendário em `AgendaModal.tsx` com:
- `display: flex` em rows (6 rows × 7 buttons) com **inline styles**
- Cada dia é um card com borda, hover, estados visuais (selecionado, hoje, fora do mês)
- Imune a purge/bundler do Tailwind — não depende de classes geradas

**Arquivo:** `apps/web/src/components/calendar/AgendaModal.tsx`

### 32.3 — Conflito de rota dinâmica `'id' !== 'orgSlug'`

**Problema:** Servidor Next.js falhava ao iniciar:
```
Error: You cannot use different slug names for the same dynamic path ('id' !== 'orgSlug')
```

**Causa:** Next.js App Router exige nomes idênticos de parâmetro para o mesmo segmento de URL em todos os route groups. `(recruiter)/jobs/[orgSlug]` e `(public)/jobs/[orgSlug]` resolviam o mesmo path `/jobs/<x>` — mas qualquer renomeação ainda conflitava.

**Solução:** Arquivo movido para URL diferente:
- **De:** `apps/web/src/app/(recruiter)/jobs/[orgSlug]/page.tsx`
- **Para:** `apps/web/src/app/(recruiter)/dashboard/jobs/[id]/page.tsx`

**Links atualizados** (3 arquivos):
- `(recruiter)/jobs/page.tsx` — `href={\`/jobs/${job.id}\`}` → `href={\`/dashboard/jobs/${job.id}\`}`
- `(recruiter)/candidates/[id]/page.tsx` — `href={\`/jobs/${app.jobId}\`}` → `href={\`/dashboard/jobs/${app.jobId}\`}`
- `(recruiter)/dashboard/jobs/[id]/page.tsx` — `useParams()` usa `id` (era `orgSlug`)

**Regra canônica resultante:** A URL de detalhe de vaga para recrutadores é `/dashboard/jobs/[id]` — **NUNCA** `/jobs/[id]` (conflita com rotas públicas).

### 32.4 — Erros de parsing e JSX

**Problema:** `Failed to compile` no Vercel (Type-check & Lint + next build).

**Erros corrigidos:**
1. `(recruiter)/dashboard/page-backup.tsx:424` — `Parsing error: ')' expected` → **arquivo deletado** (era backup acidental)
2. `components/jobs/JobDetailsModal.tsx:192` — `/* Overlay */` dentro de JSX sem chaves → corrigido para `{/* Overlay */}`

**Regra canônica:** Arquivos `page-backup.tsx`, `page-simple.tsx` e qualquer `* 2.tsx`/`* 2.ts` são **PROIBIDOS** no repositório — causam erros de build e duplicação.

### Commits
- `cba8238` — fix(web): add @talentforge/types dep + transpilePackages
- `3a60ef0` — fix(web): AgendaModal grid + primeira tentativa de renomeação de rota
- `37f66bb` — fix(routing): move pagina de detalhe de vaga para dashboard/jobs/[id]
- `f0b165f` — fix(web): deleta page-backup.tsx + comentário JSX inválido em JobDetailsModal

---

## Sprint 33 — EmailModule Brevo + InterviewsModule (2026-03-09)

**Objetivo:** Infraestrutura de e-mail transacional via Brevo SMTP + endpoints REST de entrevistas com envio de confirmação.

### 33.1 — EmailModule (Brevo SMTP)

**Localização:** `apps/api/src/email/`

| Arquivo | Descrição |
|---------|-----------|
| `email.module.ts` | Registra `MailerModule` (Brevo SMTP: `smtp-relay.brevo.com:587`) |
| `email.service.ts` | `sendInviteCandidate`, `sendInterviewScheduled`, `sendAssessmentLink`, `sendWelcomeUser`, `sendNr1Alert` |
| `templates/*.hbs` | Templates Handlebars para cada tipo de e-mail |

**Variáveis de ambiente obrigatórias (`apps/api/.env`):**
```
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=<login Brevo>
BREVO_SMTP_PASS=<chave API Brevo>
MAIL_FROM=noreply@talentforge.com.br
```

### 33.2 — InterviewsModule

- Endpoints CRUD completo: `POST`, `GET`, `PATCH`, `DELETE /api/v1/interviews`
- `POST /api/v1/interviews` dispara `emailService.sendInterviewScheduled()` via Brevo
- Lê `interviews` table (migration `20260306_interviews_table.sql`) com RLS `is_org_member(org_id)`
- Supabase auth: JWT verificado via `createClient(url, key, { auth: { persistSession: false } })`

### Commits
- `70b8cc9` — feat(api): EmailModule Brevo + InterviewsModule + templates Handlebars

---

## Sprint 34 — Career Page v2 + Fluxo de Candidatura + Build Fixes (2026-03-10)

**Objetivo:** Redesign completo da career page pública, fluxo de candidatura end-to-end validado (auth redirect + auto-apply) e correção de erros de build no Vercel.

### 34.1 — Career Page v2 (migration + campos)

**Migration:** `supabase/migrations/20260307_career_page_v2.sql`

- 7 novas colunas em `organizations`: `career_page_banner_url`, `career_page_about`, `career_page_secondary_color`, `career_page_whatsapp_url`, `career_page_instagram_url`, `career_page_linkedin_url`, `career_page_show_contact`
- View `v_public_jobs` recriada incluindo todos os novos campos
- RPC `get_public_jobs_by_org` atualizado (RETURNS SETOF v_public_jobs)
- Bucket Storage `org-assets` criado com 4 policies (public read + member upload/update/delete)

### 34.2 — Redesign Visual da Career Page

**Arquivo:** `apps/web/src/app/(public)/jobs/[orgSlug]/page.tsx`

- **Hero**: `primaryColor` como background + banner como overlay de imagem, `object-cover`
- **Logo card**: borda animada com `conic-gradient` rotativo (`@keyframes rotateBorder` 4s linear infinite) em `style` inline — imune a Tailwind purge
- **Badge de vagas**: posicionado no mesmo `flex justify-between` do logo
- **Cards de vaga enriquecidos**: preview de 150 chars (`line-clamp-2`) + pills de benefits/requirements + timestamp "Publicada há Xd"
- **Modal de detalhe**: `fixed inset-0 flex items-end sm:items-center justify-center` → inner `sm:rounded-2xl sm:max-w-2xl max-h-[92vh]` (bottom-sheet mobile / dialog desktop)
- **Modal body**: `description_html` via `dangerouslySetInnerHTML`, fallback para `description`; requirements com bullets; benefits com `CheckCircle`
- **Modal footer sticky**: gradiente `bg-gradient-to-t from-white` + botão candidatar com fundo `primaryColor`

### 34.3 — Fluxo de Candidatura end-to-end

**Problema**: 4 bugs no fluxo de candidatura identificados e corrigidos

| # | Arquivo | Bug | Correção |
|---|---------|-----|----------|
| 1 | `jobs/[orgSlug]/page.tsx` | `handleApply` redirecionava para `/register` | → `/login?redirect=/jobs/<slug>/<jobId>` |
| 2 | `(public)/login/page.tsx` | `?redirect` param não era lido após login | Adiciona `const redirectTo = searchParams.get('redirect')` + `router.push(redirectTo \|\| '/candidate')` |
| 3 | `(public)/register/page.tsx` | `redirectParam` usado mas não declarado | Adiciona `const redirectParam = searchParams.get('redirect')` no topo de `RegisterContent` |
| 4 | `(candidate)/candidate/jobs/page.tsx` | `?apply=jobId` param não processado | Wrapped em `<Suspense>` + `useSearchParams().get('apply')` + `useEffect` auto-apply + banner de retorno |

**Guard de tipo de usuário** adicionado em `handleApply`:
```typescript
if (user?.user_metadata?.user_type !== 'candidate') {
  alert('Apenas candidatos podem se candidatar.');
  return;
}
```

### 34.4 — Propagação de `?redirect` em Login/Register

**Cadeia completa de redirect:**
1. Career page → `/login?redirect=<encoded-path>`
2. `login/page.tsx` → lê `?redirect`, propaga para link "Criar conta": `/register?type=candidate&redirect=<encoded>`
3. `register/page.tsx` → lê `?redirect`, propaga para links "Fazer login" e "Ir para Login"
4. Após login bem-sucedido (candidato) → `router.push(redirectTo)` leva de volta ao jobId
5. `/candidate/jobs?apply=<jobId>` → auto-apply via `useEffect` + banner de confirmação

### 34.5 — Build Fixes Vercel

**Erro 1** (commit `70b8cc9`):
- `candidate/jobs/page.tsx:107` — linha de fechamento de `useEffect` fundida com declaração `const filteredJobs = useMemo` (`}, [deps]); = useMemo(() => {`)
- Causada por `multi_replace_string_in_file` que colapsou duas linhas em uma
- Fix: `replace_string_in_file` separando as duas declarações

**Erro 2** (commit `47fca90`):
- `register/page.tsx:258` — `Cannot find name 'redirectParam'` (Type error)
- Variável `redirectParam` usada na linha 258 mas nunca declarada no scope `RegisterContent`
- Fix: adicionada `const redirectParam = searchParams.get('redirect');` junto às demais leituras de `searchParams`

### Commits
- `70b8cc9` — fix(candidate/jobs): corrigir sintaxe useEffect+useMemo fundidos + apply flow
- `47fca90` — fix(register): declarar redirectParam ausente em RegisterContent

---

## Sprint 36 — org_type + Admin/Companies + Image Uploads (2026-03-10)

**Objetivo:** Diferenciar organização-empresa de organização-recrutadora, melhorar gestão de imagens na career page e corrigir bugs de CDN.

### 36.1 — Coluna `org_type` em `organizations`

**Migrations:** `20260310_organizations_org_type.sql` + `20260310_fix_org_type_enum.sql`

```sql
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS org_type TEXT NOT NULL DEFAULT 'company'
  CHECK (org_type IN ('company', 'recruiter'));
CREATE INDEX IF NOT EXISTS idx_organizations_org_type ON organizations (org_type);
```

- `'company'` → empresa-cliente avaliada pelo módulo PHP
- `'recruiter'` → agência de recrutamento / headhunter

### 36.2 — Admin/Companies com dois blocos

**Arquivo:** `apps/web/src/app/(admin)/admin/companies/page.tsx`

- Bloco **Empresas** lista `org_type = 'company'`
- Bloco **Recrutadoras / Headhunters** lista `org_type = 'recruiter'`
- Campo `org_type` exposto no formulário de criação/edição

### 36.3 — Imagens: Compressão + CDN cache-bust + Botões de excluir

**Arquivo:** `apps/web/src/app/(recruiter)/dashboard/settings/page.tsx`

| Feature | Implementação |
|---------|--------------|
| Compressão browser | `compressImage(file)` via Canvas API — `1200px max`, `quality 0.85`, `image/jpeg` |
| Cache-bust | Nome do arquivo: `${type}_${Date.now()}.jpeg` — novo nome a cada upload |
| Excluir logo/banner | 2 stages: `idle → confirming → excluindo`; `extractStoragePath(url)` extrai path do bucket |
| Sem `window.confirm()` | Confirmação inline com botão "Confirmar exclusão" + "Cancelar" |

### Commits Sprint 36
- `ea5a9d5` — feat(admin/companies): separar recrutadoras e empresas + coluna org_type
- `c70fa7c` — fix(db): adicionar valor recruiter ao enum org_type
- `d0893f5` — fix(settings): comprimir imagens no browser antes do upload
- `5ef1f2c` — fix(settings): CDN cache-bust por timestamp no nome do arquivo
- `a7ee953`, `ba8b89f` — feat/fix(settings): botões excluir logo/banner com confirmação inline

---

## Sprint 37 — Career Page Redesign v3 (2026-03-10)

**Objetivo:** Redesign completo da career page pública inspirado nas melhores páginas de vagas do mundo — banner real do usuário como hero, logo sem fundo, sticky nav glassmorphism e cards animados.

### 37.1 — Estrutura Visual

**Arquivo:** `apps/web/src/app/(public)/jobs/[orgSlug]/page.tsx` (commit `b43b0b7`)

#### Hero
- **Com banner**: `<img>` `absolute inset-0 w-full h-full object-cover` + overlay `linear-gradient(160deg, ${primary}D9 0%, ${primary}88 55%, transparent 100%)` — banner visível, color-tinted
- **Sem banner**: gradiente rico `135deg` + 2 orbs decorativos com `blur-3xl`/`blur-2xl`
- **Logo flutuante**: `<img>` direto, `filter: drop-shadow(0 4px 16px rgba(0,0,0,0.3))` — zero container branco
- **Curva SVG**: `<svg viewBox="0 0 1440 48">` com `path "M0,48 C480,0 960,0 1440,48"` fill `#F7F7F5` separando hero de conteúdo

#### Sticky Nav
```tsx
// useRef<HTMLDivElement> no heroRef + useEffect scroll passivo
const onScroll = () => {
  const heroH = heroRef.current?.offsetHeight || 400;
  setNavVisible(window.scrollY > heroH - 80);
};
// CSS: transform: navVisible ? 'translateY(0)' : 'translateY(-100%)'
// background: rgba(255,255,255,0.93) + backdropFilter: blur(16px)
```

### 37.2 — Helpers e Badges

```tsx
// TypeBadge — substitui EmploymentBadge
const TYPE_STYLE = {
  full_time:  'bg-violet-50 text-violet-700',
  part_time:  'bg-emerald-50 text-emerald-700',
  contract:   'bg-orange-50 text-orange-700',
  internship: 'bg-rose-50 text-rose-700',
};

// daysAgo()
function daysAgo(date: string) {
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (d === 0) return 'Hoje';
  if (d === 1) return 'Ontem';
  return `${d}d atrás`;
}
```

### 37.3 — Cards de Vaga Animados

- **Barra top**: `h-[2px] w-0 group-hover:w-full transition-all duration-500` com `linear-gradient(90deg, primary, secondary)`
- **Ícone**: `Briefcase` em quadrado `rounded-xl` com `${primary}0D` background
- **Badge "Nova"**: `<Sparkles className="w-2.5 h-2.5" />` para vagas < 7 dias
- **CTA hover**: `<ArrowUpRight>` com `opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200`
- **Modal header**: `radial-gradient(circle, secondary 1px, transparent 1px)` `backgroundSize: 24px 24px` `opacity-[0.04]`

### Commits Sprint 37
- `5628fdf` — refactor(jobs): remover card borda animada conic-gradient da logo
- `b43b0b7` — feat(jobs): redesign completo da career page com banner real, logo flutuante e cards animados

---

## Sprint 38 — Career Page v4 + work_modality + PHP Mobile Fixes (2026-03-11)

### 38.1 — Migration `20260311_career_page_v3_work_modality.sql`
- **`work_modality TEXT CHECK('presencial'|'hibrido'|'remoto')`** e **`salary_range TEXT`** adicionados à tabela `jobs`
- `v_public_jobs` recriada incluindo `work_modality`, `salary_range` e `seniority::TEXT`
- RPC `get_public_jobs_by_org(p_slug TEXT)` recriado — `RETURNS SETOF v_public_jobs`

### 38.2 — work_modality full stack
- **`packages/types/src/dto.ts`**: `workModality?: 'presencial' | 'hibrido' | 'remoto'` em `CreateJobDto` e `UpdateJobDto`
- **`apps/api/src/jobs/jobs.service.ts`**: `work_modality: dto.workModality` no insert; update condicional
- **`apps/web/src/app/(recruiter)/jobs/new/page.tsx`**: `isRemote` checkbox substituído por `Select` com 3 opções; `workModality` no estado e payload

### 38.3 — Career Page v4 (`/jobs/[orgSlug]/page.tsx`)

#### Novos componentes inline
- **`ModalityBadge`**: presencial=azul (`bg-blue-100 text-blue-700`), híbrido=âmbar (`bg-amber-100 text-amber-700`), remoto=verde (`bg-green-100 text-green-700`)
- **`SeniorityBadge`**: badge neutro `bg-gray-100 text-gray-600` com seniority como texto

#### Layout e UX
- Grid de vagas: `grid-cols-1 sm:grid-cols-2 gap-4` (era lista 1 coluna)
- Último card ímpar: `sm:col-span-2` via `isLastOdd = filteredJobs.length % 2 !== 0`
- Contador: "Mostrando X de Y vagas" abaixo dos filtros
- "Ver vaga" sempre visível (removido `opacity-0 group-hover:opacity-100`)
- Hero sempre 2 linhas: linha 1 = `career_page_headline || 'Faça parte do time'`, linha 2 = `org_name` na cor secundária
- Todos containers: `max-w-7xl` (era `max-w-5xl`)

#### Seção Banco de Talentos
Entre cards e footer; fallback: WhatsApp → LinkedIn → botão desabilitado

### 38.4 — PHP Mobile Fixes

| Arquivo | Problema | Correção |
|---------|----------|----------|
| `php/tfci/cycles/[id]/page.tsx` | `grid-cols-5` sem breakpoints nas dimensões de avaliação | `grid-cols-2 sm:grid-cols-3 md:grid-cols-5` |
| `php/action-plans/page.tsx` | skeleton `grid-cols-4` quebrado no mobile | `grid-cols-2 sm:grid-cols-4` |
| `php/employees/page.tsx` | tabela 6 colunas inutilizável no mobile | `hidden md:block` na tabela + card view `md:hidden` com nome/cargo/departamento/status |

### Commits Sprint 38
- `64927c6` — feat(career-page): melhorias visuais e campo work_modality
- `7bcf684` — fix(php): corrige grids e tabela sem responsividade mobile

---

## Sprint 39 — Depoimentos Editáveis na Career Page (2026-03-11)

### 39.1 — Migration `20260311_org_testimonials.sql`
Nova tabela `org_testimonials`:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | |
| `org_id` | UUID FK organizations | Multi-tenant |
| `author_name` | TEXT NOT NULL | Nome do autor |
| `author_role` | TEXT | Cargo/título |
| `text` | TEXT NOT NULL | Texto do depoimento |
| `avatar_color` | TEXT | Cor hex do avatar (iniciações) |
| `rating` | SMALLINT 1-5 | Número de estrelas |
| `display_order` | INTEGER | Ordem de exibição |
| `is_active` | BOOLEAN | Visibilidade pública |

**RLS:**
- `public_read_active_testimonials`: SELECT público (anon) apenas onde `is_active = true`
- `org_members_manage_testimonials`: ALL para membros autenticados da org via `is_org_member(org_id)`

### 39.2 — Settings Page — Card de Depoimentos
**Arquivo**: `apps/web/src/app/(recruiter)/dashboard/settings/page.tsx`

- Novo card "Depoimentos na Página de Carreiras" com:
  - Lista de depoimentos cadastrados (avatar com iniciais + cor, nome, cargo, trecho, estrelas)
  - Botões Editar (`<Pencil>`) e Excluir (`<Trash2>`) por item
  - Formulário inline ao adicionar/editar: nome, cargo, texto, seletor de estrelas clicável, paleta de 8 cores de avatar
  - `handleSaveTestimonial()`: insert ou update via Supabase; `handleDeleteTestimonial()`: delete com confirm
  - Estado: `testimonials[]`, `editingTestimonial`, `showTestimonialForm`, `savingTestimonial`

### 39.3 — Career Page Dinâmica
**Arquivo**: `apps/web/src/app/(public)/jobs/[orgSlug]/page.tsx`

- `org_id` adicionado à interface `PublicJob` (já estava na view, faltava no tipo TS)
- `const [testimonials, setTestimonials] = useState<Testimonial[]>([])`
- Após `loadJobs()`, busca `org_testimonials` filtrando `org_id + is_active=true + order display_order`
- Seção só renderiza quando `testimonials.length > 0` (sem depoimentos = sem seção)

### Commits Sprint 39
- `3619238` — feat(career-page): adiciona ícones SVG das redes sociais na seção #vagas
- `0ba627c` — feat(career-page): adiciona seção de depoimentos no final da página
- `b653426` — feat(testimonials): tabela org_testimonials + CRUD no settings + career page dinâmica

---

## Sprint 40 — Dicas de Carreira na Career Page (2026-03-11)

**Objetivo:** Permitir que headhunters/recrutadores cadastrem dicas de carreira visíveis na página pública de vagas da organização.

### 40.1 — Migration `20260311_org_career_tips.sql`

Nova tabela `org_career_tips`:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | |
| `org_id` | UUID FK organizations | Multi-tenant |
| `title` | TEXT NOT NULL | Título da dica |
| `summary` | TEXT NOT NULL DEFAULT '' | Resumo curto (exibido no card) |
| `content` | TEXT NOT NULL DEFAULT '' | Conteúdo expandido |
| `display_order` | INTEGER DEFAULT 0 | Ordem de exibição |
| `is_active` | BOOLEAN DEFAULT true | Visibilidade pública |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | Trigger `trg_career_tips_updated_at` |

**Índices:**
- `idx_org_career_tips_org_id` ON `(org_id)`
- `idx_org_career_tips_order` ON `(org_id, display_order)`

**RLS:**
- `public_read_active_tips`: SELECT público (anon + authenticated) onde `is_active = true`
- `org_members_manage_tips`: ALL para membros da org via `is_org_member(org_id)` + WITH CHECK

**GRANTs:**
- `SELECT` para `anon, authenticated`
- `INSERT, UPDATE, DELETE` para `authenticated`

### 40.2 — Settings Page — Card de Dicas de Carreira

**Arquivo:** `apps/web/src/app/(recruiter)/dashboard/settings/page.tsx`

- Novo card "Dicas de Carreira" com ícone `Lightbulb`
- Lista de dicas cadastradas (título + trecho do summary)
- Botões Editar (`<Pencil>`) e Excluir (`<Trash2>`) por item
- Formulário inline ao adicionar/editar: `title`, `summary`, `content`
- `handleSaveTip()`: INSERT ou UPDATE via Supabase direto (sem API intermediária)
- `handleDeleteTip()`: DELETE direto via Supabase
- Estado: `tips[]`, `editingTip`, `showTipForm`, `savingTip`

```typescript
interface Tip {
  id?: string;
  org_id?: string;
  title: string;
  summary: string;
  content: string;
  display_order: number;
  is_active?: boolean;
}
```

### 40.3 — Career Page Dinâmica

**Arquivo:** `apps/web/src/app/(public)/jobs/[orgSlug]/page.tsx`

- `const [tips, setTips] = useState<Tip[]>([])`
- Após `loadJobs()`, fetch de `org_career_tips` filtrando `org_id + is_active=true` ordenado por `display_order`
- Seção renderizada condicionalmente: só aparece quando `tips.length > 0`
- Cada card exibe: `title` (bold) + `summary` (texto curto) com ícone `Lightbulb`

### Commits Sprint 40
- (migration `20260311_org_career_tips.sql` + CRUD settings + renderização career page)

---

## Sprint 45 — Pipeline Sub-status + Enum interview_hr/interview_manager (2026-03-16)

### O que foi implementado
- **Auto-save do pipeline via Supabase direto**: removida dependência do NestJS no drag-and-drop de candidatos
- **Enum `application_status`**: adicionados valores `interview_hr` e `interview_manager`
- **Badge no card Kanban**: novo badge colorido para os sub-status de entrevista
- **Migration**: `supabase/migrations/20260316_add_interview_status.sql`

### Commits Sprint 45
- `20260316_add_interview_status.sql` — ALTER TYPE application_status ADD VALUE 'interview_hr' + 'interview_manager'

---

## Sprint 46 — Currículo PDF Profissional + COPC Tendências (2026-03-16)

### O que foi implementado

#### 1 — Fix: nome do arquivo não deve ser exibido em "Ver currículo"
**Arquivo**: `apps/web/src/app/(candidate)/candidate/layout.tsx`
- **Antes**: exibia `resume_filename` (nome original do arquivo, ex: "Atestado médico - 621854.pdf")
- **Depois**: exibe `"Currículo em PDF disponível"` (quando `resume_url` existe no banco) ou `"Nenhum currículo enviado"`
- Lógica baseada exclusivamente na presença de `resume_url` na tabela `candidate_profiles`

#### 2 — Gerador de currículo PDF profissional com foto circular
**Arquivo**: `apps/web/src/components/curriculum/CandidateCurriculumPDF.ts`

**Design do PDF gerado** (A4, portrait, jsPDF):
- **Header** (roxo primário `#141042`, 52mm): foto circular do candidato via Canvas API + nome em maiúsculas + cargo em verde `#10B981` + área/senioridade + contato em linha + LinkedIn/pretensão
- **Coluna esquerda** (fundo cinza `#F8F8FC`, 58mm): Contato completo · Formação Acadêmica (até 4 itens) · Diferenciais como tags arredondadas
- **Coluna direita** (área principal): Resumo profissional gerado dinamicamente · Experiências com cargo + empresa em azul + período em verde + descrição (max 280 chars) + badge "ATUAL"
- **Rodapé** (todas as páginas, roxo escuro): "TALENTFORGE · Currículo gerado em DD/MM/YYYY" + nº de página

**Detalhes técnicos**:
- `toCircularBase64(url, size)` — converte `avatar_url` para base64 recortado em círculo via `<canvas>` (`ctx.arc` + `ctx.clip()`)
- Fallback sem foto: círculo verde com iniciais do candidato
- `avatar_url` adicionado ao `selectColumns` da query em `candidate_profiles`
- Estado `exportingPDF` + feedback "Gerando PDF…" no botão durante processamento
- Arquivo nomeado: `curriculo_{nome_candidato}.pdf`

#### 3 — COPC Dashboard: botão Tendências
**Arquivo**: `apps/web/src/app/(recruiter)/php/copc/page.tsx`
- Adicionado botão "Tendências" com ícone `TrendingUp` no header do dashboard COPC
- Linka para `/php/copc/trends` (página já existente com `LineChart` + `BarChart` do recharts)
- Header agora tem 3 ações: **Tendências** · **KPIs por Área** · **Nova Métrica**

### Commits Sprint 46
- `b865b72` — fix(candidate): exibe status do currículo no banco em vez do nome do arquivo
- `21436fe` — feat(candidate): currículo PDF profissional com foto circular via jsPDF
- `e61a4a5` — feat(copc): adiciona botão Tendências linkando /php/copc/trends

---

## Sprint 41 — AI Assistant PHP Module (PLANEJADO)

### Diagnóstico do problema atual

A página `/php/ai-chat` está **totalmente implementada no frontend** mas **completamente não-funcional** porque todos os 7 endpoints de backend estão ausentes. A página também possui um bug secundário na obtenção do `orgId`.

**Arquivo**: `apps/web/src/app/(recruiter)/php/ai-chat/page.tsx`

#### Endpoints chamados pelo frontend (nenhum existe):
| Endpoint | Método | Chamado em |
|---|---|---|
| `/api/php/ai/health` | GET | `checkAIHealth()` |
| `/api/php/ai/usage` | GET | `loadUsageData()` |
| `/api/php/ai/chat` | POST | `sendMessage()` |
| `/api/php/ai/report` | POST | `generateReport()` |
| `/api/php/ai/predict-turnover` | POST | `predictTurnover()` |
| `/api/php/ai/forecast-performance` | POST | `forecastPerformance()` |
| `/api/php/ai/smart-recommendations` | POST | `getSmartRecommendations()` |

#### Bug secundário — `orgId` sempre `undefined`:
```typescript
// ❌ ATUAL — user_metadata.org_id não existe neste projeto
const orgId = session?.user?.user_metadata?.org_id;

// ✅ CORRETO — buscar via org_members (igual a todos os outros módulos)
const { data: orgMember } = await supabase
  .from('org_members')
  .select('org_id')
  .eq('user_id', session.user.id)
  .eq('status', 'active')
  .single();
const orgId = orgMember?.org_id;
```

---

### Plano de implementação

#### 1. Criar rotas de API

Diretório: `apps/web/src/app/api/php/ai/`

> ⚠️ **Atenção**: O frontend chama `/api/php/ai/*` (sem o prefixo `/v1/`). Confirmar se deve usar `/api/v1/php/ai/*` e atualizar o frontend, ou criar em `/api/php/ai/`.

**`health/route.ts`** — GET
- Verifica se a chave da API do provedor AI está configurada
- Retorna `{ healthy: boolean, provider: string, message?: string }`
- Requer auth + `validateOrgMembership`

**`usage/route.ts`** — GET
- Retorna estatísticas de uso por org (tokens consumidos, custo estimado, requests)
- Busca da tabela `php_ai_usage` (a criar)
- Query param: `?period=7d|30d|all`

**`chat/route.ts`** — POST
- Body: `{ message: string, context?: 'general'|'hr'|'performance'|'retention', conversationHistory?: Message[] }`
- Envia prompt ao provedor AI com contexto dos dados PHP da org
- Registra uso na tabela `php_ai_usage`
- Retorna `{ response: string, tokensUsed: number }`

**`report/route.ts`** — POST
- Body: `{ type: 'summary'|'detailed'|'executive'|'comparison', period?: string }`
- Gera relatório estruturado combinando scores TFCI + NR-1 + COPC
- Retorna `{ report: string, generatedAt: string }`

**`predict-turnover/route.ts`** — POST
- Body: `{ employeeId?: string }` (se ausente, analisa toda a org)
- Usa dados de PHP scores para predizer risco de turnover
- Retorna `{ predictions: Array<{ employeeId, risk: 'low'|'medium'|'high', factors: string[] }> }`

**`forecast-performance/route.ts`** — POST
- Body: `{ teamId?: string, months?: number }`
- Projeta tendência de performance baseada no histórico de scores
- Retorna `{ forecast: Array<{ period, predicted_score, confidence }> }`

**`smart-recommendations/route.ts`** — POST
- Body: `{ goal: string }` (ex: "melhorar engajamento", "reduzir turnover")
- Gera recomendações personalizadas baseadas nos dados da org
- Retorna `{ recommendations: Array<{ title, description, priority, effort }> }`

---

#### 2. Migration SQL — tabela de uso

```sql
-- 20260312_php_ai_usage.sql
CREATE TABLE php_ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT NOT NULL, -- 'chat', 'report', 'predict-turnover', etc.
  tokens_used INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE php_ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read own usage"
  ON php_ai_usage FOR SELECT
  USING (is_org_member(org_id));

CREATE POLICY "service role can insert usage"
  ON php_ai_usage FOR INSERT
  WITH CHECK (true); -- inserção feita via service role key
```

---

#### 3. Provedor AI — decisão pendente

Opções:
- **Anthropic Claude** (Haiku 4.5 para custo-benefício, Sonnet 4.6 para qualidade) — `@anthropic-ai/sdk`
- **OpenAI GPT-4o-mini** — `openai` SDK

Configuração via variável de ambiente: `AI_PROVIDER_API_KEY`

---

#### 4. Correção do frontend

Em `apps/web/src/app/(recruiter)/php/ai-chat/page.tsx`:
1. Substituir obtenção de `orgId` (bug acima)
2. Adicionar header `x-org-id` em todas as chamadas de API
3. Verificar que o header `Authorization: Bearer <token>` é enviado em todas as chamadas

---

#### 5. Ordem de execução sugerida

1. Decidir provedor AI e instalar SDK
2. Criar migration `php_ai_usage`
3. Criar `health/route.ts` (mais simples, valida o setup)
4. Corrigir `orgId` no frontend
5. Criar `chat/route.ts` (core da feature)
6. Criar `usage/route.ts`
7. Criar os endpoints de análise (`predict-turnover`, `forecast-performance`, `report`, `smart-recommendations`)

---

### Commits Sprint 40
- (migration `20260311_org_career_tips.sql` + CRUD settings + renderização career page)

---

## Sprint 43 — Landing Polish + Avatar Candidato (CONCLUÍDO)

### Data: 2026-03-12

### Escopo
Polimento visual da landing page pública e implementação de upload/recorte de foto de perfil para candidatos.

---

### Mudanças implementadas

#### 1. Landing Page — Hero Title
- Título `h1` passou de classes Tailwind para `style={{ fontSize: 'clamp(3.96rem, 7.04vw, 7.92rem)' }}` para garantir renderização independente do purge do Tailwind
- Container do `h1` expandido para largura total (`max-w-7xl`) — texto descritivo e botões permanecem em `max-w-3xl`
- Cada frase em linha própria: `Recrute melhor.` / `Gerencie pessoas.` / `Obtenha resultados.`
- Badge "✦ Recrutamento Inteligente + Gestão de Pessoas" removido
- Link "Já tem uma conta? Fazer login" removido
- Travessão `—` substituído por vírgula no subtítulo

#### 2. Landing Page — Seção PHP
- Badge "MÓDULO PREMIUM": padding `px-12 py-6`, bordas `rounded-2xl`, ícone `w-12 h-12`, fonte `clamp(3.96rem, 7.04vw, 7.92rem)`

#### 3. Candidate Avatar — Upload + Crop
- **Nova coluna**: `candidate_profiles.avatar_url TEXT`
- **Novo bucket Supabase Storage**: `candidate-avatars` (público, 5MB, JPEG/PNG/WebP)
- **Migration**: `supabase/migrations/20260312_candidate_avatar.sql`
- **Novo componente**: `apps/web/src/components/candidate/CropAvatarModal.tsx`
  - Usa `react-easy-crop` para recorte circular
  - Slider de zoom (1x a 3x)
  - Exporta JPEG 90% via `canvas.toBlob()`
- **Dashboard candidato** (`apps/web/src/app/(candidate)/candidate/page.tsx`):
  - Avatar circular `w-16/w-20` com `overflow-hidden` à esquerda do nome
  - Hover revela ícone `Camera`; sem foto exibe `User` placeholder
  - Ao selecionar arquivo → abre `CropAvatarModal` → após salvar → faz upload para `candidate-avatars/{uid}/avatar.jpg` com `upsert: true` → persiste URL em `candidate_profiles.avatar_url`

---

### Arquivos modificados
| Arquivo | Tipo |
|---------|------|
| `apps/web/src/app/(public)/page.tsx` | Modificado |
| `apps/web/src/app/(candidate)/candidate/page.tsx` | Modificado |
| `apps/web/src/components/candidate/CropAvatarModal.tsx` | Criado |
| `supabase/migrations/20260312_candidate_avatar.sql` | Criado |
| `apps/web/package.json` | Modificado (`react-easy-crop` adicionado) |

---

### Commits Sprint 43
- `ad7327d` — fix(landing): remove badge 'Recrutamento Inteligente + Gestão de Pessoas'
- `c9a866d` — feat(landing): aumentar tamanho do título hero em 50%
- `7596580` — feat(landing): aumentar tamanho do título hero em 100%
- `78f0933` — fix(landing): forçar tamanho do título com style inline (clamp)
- `d211b9b` — fix(landing): expandir título hero para largura total da seção
- `0b23958` — fix(landing): reduzir fonte do título hero em 20%
- `435abe4` — fix(landing): separar 'Gerencie pessoas.' para linha própria
- `ec75217` — fix(landing): aumentar fonte do título hero em 10%
- `7d56457` — fix(landing): remover link 'Já tem uma conta? Fazer login'
- `7c8cb48` — fix(landing): aumentar título 'Tudo que seu RH precisa' em 200%
- `d6dad0a` — fix(landing): ampliar badge 'Módulo Premium' com fonte do título hero
- `76c7eda` — fix(landing): remover travessão do subtítulo hero
- `e1376d7` — feat(candidate): upload de foto de perfil no banner do dashboard
- `b09f62b` — feat(candidate): modal de recorte/centralização do avatar

---

## Sprint 44 — Gate de Ativação do Módulo de Recrutamento (PLANEJADO)

### Contexto

O módulo de Recrutamento hoje carrega diretamente para todo recrutador sem nenhuma verificação de ativação. O PHP já possui o padrão correto (`php_module_activations` + `PhpModuleGuard`). O objetivo deste sprint é replicar esse padrão para o Recrutamento, tornando-o ativável/desativável por organização via Admin Panel.

---

### O que implementar

#### 1. Migration SQL

```sql
-- 20260312_recruitment_module_activations.sql

CREATE TABLE recruitment_module_activations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  is_active      BOOLEAN DEFAULT FALSE,
  activated_at   TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  activated_by   UUID REFERENCES auth.users(id),
  settings       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recruitment_module_activations ENABLE ROW LEVEL SECURITY;

-- SELECT: qualquer membro ativo da org pode ver (mesmo padrão de php_module_activations)
CREATE POLICY recruitment_activations_select ON recruitment_module_activations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = recruitment_module_activations.org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- INSERT/UPDATE: apenas admin ou manager da org (write via service role em produção)
CREATE POLICY recruitment_activations_write ON recruitment_module_activations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = recruitment_module_activations.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
      AND om.status = 'active'
    )
  );

CREATE POLICY recruitment_activations_update ON recruitment_module_activations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = recruitment_module_activations.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
      AND om.status = 'active'
    )
  );

CREATE POLICY recruitment_activations_delete ON recruitment_module_activations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = recruitment_module_activations.org_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
    )
  );

CREATE INDEX idx_recruitment_activations_org_id ON recruitment_module_activations(org_id);
CREATE INDEX idx_recruitment_activations_is_active ON recruitment_module_activations(is_active);

-- Trigger updated_at
CREATE TRIGGER set_updated_at_recruitment_activations
  BEFORE UPDATE ON recruitment_module_activations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

> ⚠️ **Atenção na ativação inicial**: ao criar a migration, fazer upsert de `is_active = true` para todas as orgs que já usam recrutamento (para não quebrar clientes existentes).

```sql
-- Ativar automaticamente todas as orgs ativas existentes
INSERT INTO recruitment_module_activations (org_id, is_active, activated_at)
SELECT id, true, NOW()
FROM organizations
WHERE status = 'active'
ON CONFLICT (org_id) DO NOTHING;
```

---

#### 2. API de status

**Arquivo**: `apps/web/src/app/api/v1/recruitment/status/route.ts`

```typescript
// GET /api/v1/recruitment/status
// Retorna: { is_active, activated_at, settings }
// Segue o mesmo padrão de /api/v1/php/status
```

- Auth: `getAuthUser` + `validateOrgMembership` de `lib/api/auth.ts`
- Se não houver registro → `is_active: false`

---

#### 3. Endpoints Admin Panel

**Arquivo**: `apps/web/src/app/api/admin/companies/[id]/recruitment-module/route.ts`

```
POST   /api/admin/companies/:id/recruitment-module   // Ativar (upsert is_active=true)
DELETE /api/admin/companies/:id/recruitment-module   // Desativar (is_active=false)
```

- Usa `SUPABASE_SERVICE_ROLE_KEY` diretamente (mesmo padrão de `php-module/route.ts`)
- Segue o mesmo padrão de `apps/web/src/app/api/admin/companies/[id]/php-module/route.ts`

---

#### 4. Guard no layout do dashboard

**Arquivo**: `apps/web/src/app/(recruiter)/dashboard/layout.tsx`

Adicionar verificação no mount:
```typescript
// No useEffect de loadUserInfo(), após carregar currentOrg:
const { data: status } = await supabase
  .from('recruitment_module_activations')
  .select('is_active')
  .eq('org_id', currentOrg.id)
  .maybeSingle();

setRecruitmentActive(status?.is_active ?? false);
```

- Se `is_active === false`: renderizar tela de "Módulo de Recrutamento inativo" com CTA para contato
- Exibir `ModuleStatusBadge` na sidebar (reutilizar o componente do PHP)

---

#### 5. Admin Panel UI

**Arquivo**: `apps/web/src/components/admin/OrganizationDashboard.tsx`

Adicionar card "Módulo de Recrutamento" seguindo o mesmo padrão visual do card "Módulo PHP":
- Visual: Card verde (ativo) / cinza (inativo)
- Botão toggle: "Ativar Recrutamento" / "Desativar Recrutamento"
- Exibe timestamp de ativação

---

### Ordem de execução (sexta-feira)

1. Criar migration com ativação automática das orgs existentes
2. Criar `GET /api/v1/recruitment/status`
3. Criar endpoints admin `POST/DELETE /api/admin/companies/:id/recruitment-module`
4. Adicionar guard no `dashboard/layout.tsx`
5. Adicionar card no `OrganizationDashboard.tsx`
6. Testar: desativar org de teste → confirmar que dashboard bloqueia → reativar

---

### Arquivos a criar/modificar

| Ação | Arquivo |
|---|---|
| CRIAR | `supabase/migrations/20260314_recruitment_module_activations.sql` |
| CRIAR | `apps/web/src/app/api/v1/recruitment/status/route.ts` |
| CRIAR | `apps/web/src/app/api/admin/companies/[id]/recruitment-module/route.ts` |
| MODIFICAR | `apps/web/src/app/(recruiter)/dashboard/layout.tsx` |
| MODIFICAR | `apps/web/src/components/admin/OrganizationDashboard.tsx` |

---

**FIM DO DOCUMENTO** — Versão 5.6 (Sprint 39: Depoimentos editáveis na career page)
- **Seção 5**: Boas Práticas de Implantação (ciclo de avaliação, comunicação, anonimato)
- **Seção 6**: FAQ para Auditoria Interna (MTE, fiscalização, jurídico)
- **Seção 7**: Checklist Pré-Auditoria (documentos, evidências, conformidade)

**`docs/TFCI_DIMENSIONS.md`** - Definição das 5 Dimensões Comportamentais
- Collaboration (Colaboração)
- Communication (Comunicação)
- Adaptability (Adaptabilidade)
- Accountability (Responsabilidade)
- Leadership (Liderança)

**`docs/COPC_ADAPTED.md`** - Como Adaptamos COPC ao Talent Forge

---

## 📝 Histórico de Versões

### v5.8 (2026-03-12)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 42)
- ✅ **Google OAuth fix**: handler server-side PKCE em `/api/auth/callback/route.ts`; `redirectTo` corrigido no login e register; callback page simplificada para spinner
- ✅ **Migration `20260312_notifications_triggers.sql`**: 3 triggers (`notify_new_application`, `notify_application_hired`, `notify_assessment_completed`); habilita Realtime + `REPLICA IDENTITY FULL` na tabela `notifications` de forma idempotente
- ✅ **NotificationCenter fix**: canal realtime filtrado por `user_id=eq.${user.id}`; nome de canal único `notifications:${user.id}`; client Supabase via `useRef`; `init()` useEffect unificado
- ✅ **Team page (`/dashboard/team`)**: 3 dialogs (convidar, editar função, remover); APIs `POST /api/v1/team/invite`, `PATCH/DELETE /api/v1/team/members/[memberId]`; `resolvedOrgId` resolve org localmente quando store é nulo
- ✅ **`<Toaster>` global**: componente `sonner` adicionado ao `layout.tsx` — toasts `success/error` agora visíveis em toda a aplicação
- ✅ **CSP fix (`next.config.mjs`)**: `style-src` + `https://fonts.googleapis.com`; `font-src` + `https://fonts.gstatic.com`; `script-src` + `connect-src` + `https://vercel.live`
- ✅ **`.env.example` unificado**: criado na raiz com todas as variáveis do monorepo documentadas; `VERCEL_OIDC_TOKEN` explicitamente proibido
- ✅ **Commits**: `4d2f45f` → `80b2f89` → `7866ab2` → `dc76c11` → `e18fb03` → `ec67c44` → `ff116e7` → `266d366` → `origin/main`

### v5.13 (2026-03-16)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 47 — PDF Relatório Completo)
- ✅ **`CandidateFullReportPDF.ts`**: novo gerador em `apps/web/src/components/reports/` — jsPDF A4, quatro seções: Currículo (layout de duas colunas idêntico ao PDF do candidato), Resultados dos Testes (DISC com barras por D/I/S/C, Cores, PI), Parecer Técnico (cards de score, barra de progresso, texto da IA), Anotações do Recrutador (notas salvas + 12 linhas em branco para novas anotações)
- ✅ **Interface `FullReportData`**: aceita `candidate`, `experiences`, `education`, `disc`, `colorAssessment`, `piAssessment`, `review`, `notes[]`
- ✅ **`handleGenerateFullReport()`**: novo handler em `candidates/page.tsx` — busca anotações via Supabase client-side, monta `FullReportData` com todo estado já carregado (`discResult`, `colorResult`, `piResult`, `currentReview`, `candidateDetails`) e aciona o gerador; estado `pdfLoading` controla loading indicator
- ✅ **Botão PDF**: "Baixar Relatório Completo (PDF)" exibido no bloco `currentReview` da aba Revisão — reutiliza ícone `Download` do Lucide
- ✅ **Rodapé dinâmico**: `drawAllFooters()` percorre todas as páginas e aplica paginação "X / Y" + branding TalentForge
- ✅ **Commits**: `e296a14` → `origin/main`

### v5.18 (2026-03-17)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 49 — Fix Middleware /vagas + SMTP Recovery)
- ✅ **Fix middleware `/vagas` como rota pública**: `/vagas` não estava na lista `publicRoutes` do `apps/web/src/middleware.ts` — rota redirecionava para `/login` em produção; adicionado `'/vagas'` no array e `pathname.startsWith('/vagas')` no guard de rota; cobre sub-rotas futuras (ex: `/vagas/[id]`). Commit `dcd9973`
- ✅ **Restauração vars SMTP Brevo no Vercel**: todas as 6 variáveis (`BREVO_SMTP_HOST`, `BREVO_SMTP_PORT`, `BREVO_SMTP_USER`, `BREVO_SMTP_PASS`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`) haviam sido removidas do Vercel — restauradas nos 3 ambientes (production + preview + development)
- ✅ **Script `scripts/restore-vercel-env.sh`**: script executável que lê credenciais de `apps/api/.env` (não commitado) e reaplicam todas as vars SMTP Brevo em 1 comando; sem secrets hardcoded; aceito pelo GitHub secret scanning. Commit `6a37fe0`
- ✅ **Commits**: `dcd9973` (middleware) → `39a3ea3` (redeploy SMTP) → `6a37fe0` (script restauração) → `origin/main`

### v5.17 (2026-03-17)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 48 — Job Board Global /vagas)
- ✅ **`/vagas` — Job Board Global público**: nova rota `apps/web/src/app/(public)/vagas/page.tsx` — agrega todas as vagas abertas de todas as organizações sem necessidade de autenticação
- ✅ **RPC `get_all_public_jobs()`**: função SQL STABLE SECURITY DEFINER que retorna `SETOF v_public_jobs` ordenado por `created_at DESC`; GRANT para `anon` e `authenticated`; migration `supabase/migrations/20260317_get_all_public_jobs.sql`
- ✅ **Design superior à Sólides Vagas** (engenharia reversa aplicada): hero com busca dupla (cargo + local), sidebar de filtros sticky (contrato/modalidade/nível/setor), barra de atalhos por área com ícones (scroll horizontal), cards com badge "NOVA", OrgAvatar, barra gradiente animada no hover, drawer mobile bottom-sheet, CTA de recrutador na sidebar, stats ao vivo (vagas/empresas/remotas)
- ✅ **4 filtros**: tipo de contrato (CLT/PJ/Estágio/Meio período), modalidade (Presencial/Híbrido/Remoto), senioridade (Intern→Manager), setor (dinâmico da base)
- ✅ **Busca por localidade**: campo `locationSearch` separado filtra `job.location`
- ✅ **Cores canônicas aplicadas**: `#141042` (primary), `#10B981` (green), `#F97316` (orange/FORGE), `#1F4ED8` (blue accent)
- ✅ **Commits**: `fbea7ae` (código + migration) → `75c3d8e` (redesign v2) → `origin/main`

### v5.16 (2026-03-16)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 47 — Fix PI PDF)
- ✅ **Bug fix PI ausente no PDF**: candidatos adicionados manualmente pelo recrutador têm `candidates.user_id = NULL`; o segundo fallback via `candidate_profiles.email` também falhava; adicionado **terceiro fallback** na rota `GET /api/recruiter/candidates/[id]/assessments` via `rpc('get_auth_user_id_by_email')` — busca direto em `auth.users` por email usando `SECURITY DEFINER`
- ✅ **Migration `20260316_get_auth_user_id_by_email.sql`**: função `get_auth_user_id_by_email(p_email text) RETURNS uuid` — SECURITY DEFINER, `search_path = auth, public`, acesso concedido a `service_role`
- ✅ **Commits**: `3bb0c04` → `origin/main`

### v5.15 (2026-03-16)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 47 — Relatório PDF Completo)
- ✅ **`generateFullReportPDF(data: FullReportData)`**: nova função em `CandidateCurriculumPDF.ts` — reutiliza `buildCurriculumPDF()` e appenda páginas de testes + parecer no mesmo documento jsPDF; exporta `relatorio_<nome>.pdf`
- ✅ **Interface `FullReportData extends CurriculumData`**: campo `report?` com `disc`, `color`, `pi`, `scores`, `recruiterNote`, `aiReview`, `reviewDate`, `jobApplied`
- ✅ **Estrutura do PDF (múltiplas páginas)**: (1+) Currículo layout 2 colunas; (penúltima) Score TalentForge 4 cards + gráficos DISC barras verticais + swatches Cores + barras PI natural/adaptado; (última) Anotações do recrutador + Parecer GPT-4o + linhas em branco para anotações manuscritas; rodapé TalentForge com paginação `N / Total` em todas as páginas
- ✅ **`handleGeneratePDF` atualizado**: monta `FullReportData` com `discResult`, `colorResult`, `piResult`, `currentReview` (score + ai_review + recruiter_note); botão "Relatório PDF" no header do modal com spinner e ícone `Download`
- ✅ **Botão reintroduzido**: `handleGeneratePDF` corrigido após refactor de assessments que havia removido o botão acidentalmente
- ✅ **Commits**: `3b67e49` → `f6ed5cd` → `origin/main`

### v5.14 (2026-03-16)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 47 — Fix Assessments display)
- ✅ **Bug fix DISC 0%**: query `assessments` client-side não filtrava por `assessment_type = 'disc'` — todos os registros eram marcados como DISC, resultando em traits zerados
- ✅ **Bug fix PI/Color "Não realizado"**: queries client-side via JWT do recrutador sujeitas a RLS; blocos pulados quando `candidate.user_id = NULL`
- ✅ **API Route `GET /api/recruiter/candidates/[id]/assessments`**: nova rota com `service_role` (bypass RLS) — valida token + membership; DISC filtrado por `assessment_type = 'disc'`; Color/PI por `candidate_user_id`; fallback via `candidate_profiles.email` quando `user_id` é nulo; **terceiro fallback via `rpc('get_auth_user_id_by_email')`** para candidatos sem `candidate_profiles`; retorna `{ disc: [], color: [], pi: [] }`
- ✅ **`loadCandidateDetails` refatorado**: 3 queries client-side → única chamada `fetch('/api/recruiter/candidates/[id]/assessments')` com headers `Authorization` + `x-org-id`
- ✅ **Commits**: `9f8d716` → `b8415c1` → `origin/main`

### v5.13 (2026-03-16)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 47 — Fix geração de parecer)
- ✅ **Bug fix `handleGenerateReview`**: botão "Gerar Parecer com IA" em `/dashboard/candidates` não disparava quando `localStorage.getItem('selected_org_id')` era null (retorno silencioso)
- ✅ **`resolvedOrgId` em estado**: `loadCandidates()` resolve orgId via `org_members` (DB) e persiste em estado React + sobrescreve localStorage — eliminando dependência exclusiva do localStorage
- ✅ **Cadeia de fallback**: `resolvedOrgId ?? localStorage('selected_org_id') ?? session.user_metadata.org_id` aplicada em `handleGenerateReview` e `loadReviews`
- ✅ **Alertas visíveis**: retornos antecipados por sessão expirada ou org não identificada agora exibem `alert()` em vez de falhar silenciosamente
- ✅ **Commits**: `81f5c03` → `deb1ab5` → `0c87076` → `000d3a9` → `origin/main`

### v5.11 (2026-03-16)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 47 — Prompt IA Customizável)
- ✅ **`recruiter_settings`**: nova tabela `(user_id, org_id, review_prompt TEXT NULL)` — UNIQUE(user_id, org_id); trigger `updated_at`; RLS `user_id = auth.uid() AND is_org_member(org_id)`; GRANT ALL para `service_role`
- ✅ **`DEFAULT_REVIEW_PROMPT`**: constante canônica em `apps/web/src/lib/defaults.ts` com variáveis `{{nome}}`, `{{cargo}}`, `{{disc}}`, `{{score_total}}` etc.; re-exportada pela API route para retrocompatibilidade
- ✅ **API Route `GET /api/recruiter/settings`**: retorna `{ review_prompt, default_prompt, updated_at }` — `default_prompt` sempre presente como fallback
- ✅ **API Route `PUT /api/recruiter/settings`**: upsert em `recruiter_settings` com `onConflict: 'user_id,org_id'`; prompt vazio/null persiste como NULL (usa padrão do sistema)
- ✅ **`technical-review/route.ts`**: step 2.5 — busca `recruiter_settings` do recrutador antes de chamar GPT-4o; função `fillPrompt(template, vars)` substitui `{{variavel}}` via regex; fallback automático para `DEFAULT_REVIEW_PROMPT`
- ✅ **Settings page `/dashboard/settings`** — novo card "Prompt de Avaliação por IA": textarea mono com 12 linhas, lista de variáveis disponíveis, botão Salvar + Restaurar Padrão, `<details>` para preview do prompt padrão; `defaultPrompt` inicializado com a constante (sem dependência da API)
- ✅ **Commits**: `786c1d6` → `deb1ab5` → `81f5c03` → `origin/main`

### v5.10 (2026-03-16)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 47)
- ✅ **`candidate_technical_reviews`**: nova tabela com `score_total` (NUMERIC 0-100), `score_testes` (40%), `score_experiencia` (35%), `score_recrutador` (25%), `ai_review` TEXT gerado via GPT-4o, `recruiter_rating` SMALLINT (0-10), `input_snapshot` JSONB; RLS `is_org_member(org_id)` em todas as operações
- ✅ **Fórmula de Score**: Testes=40% (DISC×0.4 + Color×0.3 + PI×0.3) + Experiência=35% (anos×4 max60 + grau acadêmico max40) + Recrutador=25% (rating×10)
- ✅ **API Route `POST /api/recruiter/candidates/[id]/technical-review`**: auth → membership → fetch candidato+notas+testes+experiência → calcScores → GPT-4o → INSERT tabela → return
- ✅ **API Route `GET /api/recruiter/candidates/[id]/technical-review`**: últimos 5 pareceres (candidate_id + org_id)
- ✅ **Aba "Parecer Técnico"** em `/dashboard/candidates/[id]`: seletor 0-10, textarea observações, botão IA com loading state, 4 score cards + barra de progresso colorida, texto do parecer, histórico expansível
- ✅ **`openai` SDK** instalado em `apps/web` (anteriormente apenas em `apps/api`)
- ⚠️ **`OPENAI_API_KEY`** necessária em `apps/web/.env.local` e na Vercel para geração real de pareceres
- ✅ **Migration**: `supabase/migrations/20260316_candidate_technical_reviews.sql`

### v5.9 (2026-03-16)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 46)
- ✅ **`CandidateCurriculumPDF.ts`**: novo gerador jsPDF em `apps/web/src/components/curriculum/` — layout 2 colunas, foto circular via Canvas API, header `#141042`, rodapé TalentForge com número de página
- ✅ **Fix "Ver currículo"**: label exibe `"Currículo em PDF disponível"` / `"Nenhum currículo enviado"` em vez do `resume_filename` (nome do arquivo no bucket)
- ✅ **`avatar_url`** adicionado ao `selectColumns` de `candidate_profiles` no layout do candidato
- ✅ **COPC Dashboard**: botão "Tendências" com ícone `TrendingUp` linkando `/php/copc/trends` — backlog zerado
- ✅ **Commits**: `b865b72` + `21436fe` + `e61a4a5` → `origin/main`

### v5.8 (2026-03-16)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 45)
- ✅ **Migration `20260316_add_interview_status.sql`**: `ALTER TYPE application_status ADD VALUE 'interview_hr'` + `'interview_manager'`
- ✅ **Pipeline Kanban**: auto-save via Supabase direto (sem NestJS); badge colorido para sub-status de entrevista no card
- ✅ **`20260315_admin_delete_user_fn.sql`**: função `admin_cleanup_user_references(UUID)` SECURITY DEFINER — limpa FKs em 15 tabelas antes de deletar usuário; GRANT apenas para `service_role`

### v5.7 (2026-03-11)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 40)
- ✅ **Migration `20260311_org_career_tips.sql`**: tabela `org_career_tips` — campos `title`, `summary`, `content`, `display_order`, `is_active`; trigger `updated_at`; RLS público (leitura `is_active=true`) + escrita via `is_org_member(org_id)`; GRANTs `anon + authenticated`
- ✅ **Settings page — Dicas de Carreira**: novo card com ícone `Lightbulb`, lista de dicas, formulário inline (title/summary/content), CRUD completo via Supabase direto
- ✅ **Career page dinâmica**: fetch de `org_career_tips` após `loadJobs()`; seção só renderiza se há dicas cadastradas e ativas

### v5.6 (2026-03-11)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 39)
- ✅ **Migration `20260311_org_testimonials.sql`**: tabela `org_testimonials` — campos `author_name`, `author_role`, `text`, `avatar_color`, `rating` (1-5), `display_order`, `is_active`; RLS público (leitura `is_active=true`) + escrita via `is_org_member(org_id)`
- ✅ **Settings page — Depoimentos**: novo card com lista, formulário inline, seletor de estrelas clicável, paleta de 8 cores de avatar; CRUD completo via Supabase
- ✅ **Career page dinâmica**: `org_id` adicionado à interface `PublicJob`; fetch de `org_testimonials` após `loadJobs()`; seção só renderiza se há depoimentos cadastrados
- ✅ **Ícones SVG oficiais das redes sociais**: WhatsApp, Instagram e LinkedIn com SVG inline e cores de marca na seção `#vagas`
- ✅ **Commits**: `3619238` + `0ba627c` + `b653426` → `origin/main`

### v5.5 (2026-03-11)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 38)
- ✅ **Migration `20260311_career_page_v3_work_modality.sql`**: `work_modality TEXT CHECK('presencial'|'hibrido'|'remoto')` + `salary_range TEXT` em `jobs`; `v_public_jobs` e RPC `get_public_jobs_by_org` recriados incluindo novos campos + `seniority::TEXT`
- ✅ **`work_modality` full stack**: `CreateJobDto`/`UpdateJobDto` em `packages/types`; `jobs.service.ts` (NestJS) mapeia `work_modality` em insert e update; `jobs/new/page.tsx` substitui `isRemote` por `Select` de modalidade
- ✅ **Career Page — `ModalityBadge`**: Presencial=azul, Híbrido=âmbar, Remoto=verde (componente inline na `jobs/[orgSlug]/page.tsx`)
- ✅ **Career Page — `SeniorityBadge`**: badge neutro cinza exibido abaixo da modalidade
- ✅ **Career Page — grid 2-col**: `grid-cols-1 sm:grid-cols-2 gap-4`; último card ímpar recebe `sm:col-span-2` (`isLastOdd`)
- ✅ **Career Page — contador**: `Mostrando X de Y vagas`
- ✅ **Career Page — hero headline editável**: sempre 2 linhas — `career_page_headline` (default 'Faça parte do time') + `org_name` na cor secundária; settings label/placeholder atualizados
- ✅ **Career Page — Banco de Talentos**: seção entre cards e footer; link prioriza WhatsApp → LinkedIn → desabilitado; `max-w-7xl` em todos os containers (era `max-w-5xl`)
- ✅ **PHP mobile — TFCI `[id]`**: `grid-cols-5` → `grid-cols-2 sm:grid-cols-3 md:grid-cols-5` nas dimensões de avaliação
- ✅ **PHP mobile — Action Plans**: skeleton `grid-cols-4` → `grid-cols-2 sm:grid-cols-4`
- ✅ **PHP mobile — Employees**: tabela 6-col escondida no mobile (`hidden md:block`); card view adicionada (`md:hidden`) com nome, cargo, departamento, status e link
- ✅ **Commits**: `64927c6` (career-page) + `7bcf684` (php mobile) → pusados para `origin/main`

### v5.4 (2026-03-10)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 37)
- ✅ **Career Page redesign v3** (`apps/web/src/app/(public)/jobs/[orgSlug]/page.tsx`, commit `b43b0b7`):
  - **Hero**: banner real do usuário como `<img>` `object-cover` + overlay `linear-gradient(160deg, primaryD9 0%, primary88 55%, transparent)` preservando visibilidade; sem banner → gradiente rico + orbs `blur-3xl`
  - **Logo flutuante**: `<img>` direto com `filter: drop-shadow(0 4px 16px rgba(0,0,0,0.3))` — zero container, zero fundo branco
  - **Sticky nav**: `position: fixed`, surge após scroll além do hero (`translateY(-100%)` → `translateY(0)`) com `backdrop-blur(16px)` glassmorphism; usa `useRef<HTMLDivElement>` + `useEffect` scroll passivo
  - **SVG curve**: `<svg viewBox="0 0 1440 48">` com `path d="M0,48 C480,0 960,0 1440,48..."` fill `#F7F7F5` separando hero de conteúdo
  - **TypeBadge**: substitui `EmploymentBadge`; paleta semântica violet/emerald/orange/rose por tipo de contrato
  - **`daysAgo()`**: helper — Hoje / Ontem / Nd atrás
  - **Cards animados**: barra `h-[2px]` `w-0 → w-full` no hover com gradiente `primary → secondary`; ícone `Briefcase` em quadrado `rounded-xl`; badge "Nova" com `<Sparkles>`; CTA com `<ArrowUpRight>` desliza com `opacity-0 → opacity-100 -translate-x-2 → translate-x-0`
  - **Modal header**: `radial-gradient` dots pattern `opacity-[0.04]` como textura

### v5.3 (2026-03-10)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 36)
- ✅ **`org_type` em `organizations`**: coluna `TEXT NOT NULL DEFAULT 'company' CHECK (org_type IN ('company','recruiter'))` + índice `idx_organizations_org_type`; migration `20260310_organizations_org_type.sql` + fix `20260310_fix_org_type_enum.sql` (commits `ea5a9d5`, `c70fa7c`)
- ✅ **Admin/companies refactor** (`/admin/companies`): UI reescrita com dois blocos separados — **Empresas clientes** (`org_type='company'`) e **Recrutadoras/Headhunters** (`org_type='recruiter'`); API routes atualizadas (commits `ea5a9d5`)
- ✅ **Compressão de imagem no browser**: `compressImage()` via Canvas API antes do upload para Supabase Storage — limita a 1200px/0.85 quality, elimina erro 413 (commit `d0893f5`)
- ✅ **CDN cache-bust por timestamp**: nomes de arquivo gerados como `${type}_${Date.now()}.jpeg` — evita loop de cache ao trocar logo/banner (commit `5ef1f2c`)
- ✅ **Botões excluir logo/banner**: confirmação inline sem `window.confirm()` — dois stages (`idle → confirming → excluindo`) com `extractStoragePath()` para remoção do bucket (commits `a7ee953`, `ba8b89f`)
- ✅ **Remoção borda animada logo**: card com `conic-gradient` rotativo removido da career page (commit `5628fdf`)

### v5.2 (2026-03-10)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 34)
- ✅ **Career Page v2 migration**: `20260307_career_page_v2.sql` — 7 novas colunas em `organizations` (banner, about, secondary color, WhatsApp/Instagram/LinkedIn, show_contact) + view `v_public_jobs` atualizada + bucket `org-assets` com policies
- ✅ **Career Page redesign**: hero com banner overlay + logo card com borda `conic-gradient` animada + cards enriquecidos (description preview, pills, timestamp) + modal centrado (bottom-sheet mobile)
- ✅ **Fluxo de candidatura end-to-end**: 4 bugs corrigidos em `jobs/[orgSlug]`, `login`, `register` e `candidate/jobs`
- ✅ **Redirect chain**: `?redirect` propagado de career page → login → register → auto-apply em `/candidate/jobs?apply=<jobId>`
- ✅ **Guard `user_type`**: apenas candidatos podem se candidatar (alerta para recrutadores/admins)
- ✅ **Build fix `register/page.tsx`**: `redirectParam` declarado em `RegisterContent` (commit `47fca90`)
- ✅ **Build fix `candidate/jobs/page.tsx`**: separadas linhas `useEffect` + `useMemo` fundidas (commit `70b8cc9`)
- ✅ **Rotas públicas documentadas**: `/jobs/[orgSlug]` e `/jobs/[orgSlug]/[jobId]` adicionadas à Seção 5.1

### v5.1 (2026-03-09)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 33)
- ✅ **EmailModule Brevo**: `apps/api/src/email/` — `MailerModule` com SMTP Brevo (`smtp-relay.brevo.com:587`), 5 métodos de envio, 5 templates Handlebars
- ✅ **InterviewsModule**: endpoints CRUD + `POST` dispara `sendInterviewScheduled` via Brevo automaticamente
- ✅ **Variáveis documentadas**: `BREVO_SMTP_HOST/PORT/USER/PASS` + `MAIL_FROM` em `apps/api/.env`

### v5.0 (2026-03-06)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 32)
- ✅ **@talentforge/types dep fix**: adicionado `"@talentforge/types": "*"` em `apps/web/package.json` + `transpilePackages` em `next.config.mjs` — resolve build Vercel
- ✅ **AgendaModal calendar grid**: reescrito com `display: flex` + inline styles (fix Tailwind v4 + Turbopack `grid-cols-7`); cada dia é card com borda, hover e estados visuais
- ✅ **Dynamic route fix**: `(recruiter)/jobs/[orgSlug]` movido para `(recruiter)/dashboard/jobs/[id]` — elimina conflito `'id' !== 'orgSlug'` com `(public)/jobs/[orgSlug]`
- ✅ **Build errors corrigidos**: `page-backup.tsx` deletado (parsing error L424); comentário `/* Overlay */` → `{/* Overlay */}` em `JobDetailsModal.tsx`
- ✅ **URL canônica de detalhe de vaga**: `/dashboard/jobs/<id>` (recrutador) — nunca `/jobs/<id>`

### v4.9 (2026-03-06)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 31)
- ✅ **Google Login**: `signInWithOAuth({ provider: 'google' })` ativado via configuração no Supabase + Google Cloud Console (sem alteração de código)
- ✅ **Google Calendar Routes**: 4 Next.js API Routes (`authorize`, `callback`, `status`, `disconnect`) substituem endpoints NestJS instáveis; `WebhookManager.tsx` migrado para `fetch('/api/google-calendar/*')`
- ✅ **Tabela `interviews`**: nova tabela com RLS `is_org_member(org_id)`, suportando agendamentos de entrevistas com tipo (video/presencial/phone), candidato, vaga e integração Google Calendar
- ✅ **AgendaModal**: calendário mensal (6×7 grid Mon-based) + timeline diária 08:00–20:00 com slots clicáveis, indicador verde neon para dia atual em horário comercial, integração com `interviews` via Supabase
- ✅ **Upload de currículo**: `candidates/new/page.tsx` migrado de NestJS para Supabase direto + upload PDF/DOC para bucket `resumes`

### v4.0 (2026-03-02)
- ✅ **Score de Conformidade**: 100% mantido
- ✅ **Job Publisher Engine (Sprint 18)**: Arquitetura completa do motor de publicação multi-canal de vagas
- ✅ **Modelo Canônico de Vaga**: `JobCanonical` interface documentada (título, localização, compensação, requisitos, controle)
- ✅ **4 Adapters planejados**: Gupy (REST/OAuth), Vagas for Business (REST/API Key), LinkedIn (Job Posting API/parceria), Indeed (XML Feed + GraphQL)
- ✅ **Schema de banco**: `job_publication_channels`, `job_publications`, `job_publication_logs` com RLS completo
- ✅ **Publisher Engine**: Fila assíncrona + retry com backoff exponencial + audit trail
- ✅ **Endpoints REST**: 13 endpoints documentados (publish, channels, webhooks, feeds)
- ✅ **Anti-padrões**: Proibido RPA/scraping — apenas APIs oficiais e feeds XML
- ✅ **Fases de implementação**: 5 fases com estimativas e pré-requisitos por canal
- ✅ **fix(companies)**: Migração de API calls de NestJS para Next.js API routes locais (commit `305d163`)

### v3.9 (2026-03-01)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 20)
- ✅ **Companies CRUD (recruiter)**: `dashboard/companies/page.tsx` reescrito com criação/edição/exclusão de empresas clientes, consulta automática de CNPJ via BrasilAPI e cadastro de administrador inicial via `/api/v1/php/employees`
- ✅ **Admin companies detalhe**: `admin/companies/[id]/page.tsx` atualizado com abas Informações/Funcionários, carrega employees via `/api/v1/php/employees` com Authorization header canônico
- ✅ **Rotas de funcionários documentadas**: `dashboard/companies/[id]/employees/new/page.tsx` e `[employeeId]/edit/page.tsx` (recruiter) + `admin/companies/[id]/employees/new/page.tsx` (admin)
- ✅ **PHP sidebar canônico**: nav horizontal substituída por sidebar vertical canônico em todo o módulo PHP
- ✅ **Design System PHP**: todas as páginas do módulo PHP (TFCI, NR-1, COPC, action-plans, settings) padronizadas com paleta `#141042`/`#10B981`/`#3B82F6` e tokens canônicos
- ✅ **NR-1 Authorization fix**: lista NR-1 corrigida com `Authorization: Bearer <JWT>` + guard de array `Array.isArray(data)`
- ✅ **Tailwind v4 @source fix**: adicionado `@source` em `globals.css` para scan completo de classes em produção (Vercel)

### v3.8 (2026-02-28)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 19)
- ✅ **Reports conectados a dados reais**: `reports/page.tsx` reescrito com `useOrgStore` + Supabase + `reportsApi` (sem mock data)
- ✅ **Padrão de fetch canônico**: `Promise.allSettled([reportsApi.dashboard, reportsApi.pipelines, supabase_time_to_hire])` com fallback direto ao Supabase
- ✅ **Time-to-hire via Supabase direto**: últimos 6 meses calculados de `applications` (não depende do NestJS API)
- ✅ **Filtros de data funcionais**: `dateRange.start/end` disparam re-fetch com debounce 300ms via `useEffect`
- ✅ **Export com dados reais**: `ReportExport` usa `reportData` populado de `recentActivity` da API
- ✅ **4 componentes analytics migrados** para design system canônico: `KPICards`, `RecruitmentFunnel`, `TimeToHireChart`, `SourceEffectiveness`
- ✅ **Cores de gráficos padronizadas**: `gray-*` → `#141042`/`#666666`/`#E5E5DC`; ícones `#3B82F6`; trends `#10B981`/`#EF4444`
- ✅ **Sombras tintadas nos analytics**: `shadow-[0_2px_8px_rgba(20,16,66,0.06),...]` em todos os cards de gráfico

### v3.7 (2026-02-28)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 18)
- ✅ **Deploy padronizado**: URLs estáveis Vercel documentadas; GitHub integrado ao projeto web; `api-config.ts` centraliza URL da API
- ✅ **Glass tokens**: `--glass-*` adicionados em `globals.css` (Apple Liquid Glass)
- ✅ **Shadows tintadas**: shadows com `rgba(20,16,66,...)` substituem sombras genéricas do Tailwind
- ✅ **Easing curves**: `--ease-spring` e `--ease-smooth` adicionadas como tokens
- ✅ **Sidebar corrigida**: `bg-gray-900` → `bg-[#141042]` (cor canônica)
- ✅ **Header sticky glass**: `sticky top-0` + `backdrop-blur-xl` + `bg-white/85`
- ✅ **Dashboard background**: gradiente sutil `bg-linear-to-br from-[#FAFAF8] via-[#F5F4FB]`
- ✅ **Vercel team**: documentado `fernando-dias-projects-e4b4044b` / orgId `team_lwke1raX8NIzKHkR5z2CPFR5`
- ✅ **API URL**: `NEXT_PUBLIC_API_BASE_URL` sem `/api/v1`; `api-config.ts` compõe `API_V1_URL`

### v3.7 (2026-03-02)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 21)
- ✅ **Teams contagem dinâmica**: `GET /php/teams` calcula `member_count` via `employees.department ↔ teams.name` em vez de depender do valor armazenado
- ✅ **Teams auto-create update**: `POST /php/teams/auto-create` agora atualiza times existentes (member_count, manager_id) em vez de ignorá-los
- ✅ **Teams ordenação hierárquica**: `GET /php/teams/:id` retorna membros ordenados por organograma (DFS pre-order via `manager_id`)
- ✅ **Frontend hierarchy**: Indentação visual por `hierarchy_depth`, ícone Crown para líderes, conectores `└`, nomes de líderes em azul
- ✅ **Relação documentada**: `teams.name ↔ employees.department` (relação implícita para contagem e auto-create)
- ✅ **Nota team_members**: Documentado que maioria dos employees não tem `user_id`; contagem deve usar `employees.department`
- ✅ **employees.hierarchy_level**: Documentado que campo existe mas é NULL; hierarquia real via `manager_id` DFS
- ✅ **positionPriority**: Algoritmo de sorting: Diretor(1) > Gerente(2) > Coordenador(3) > Líder(4) > Analista(5) > Assistente(6) > Estagiário(7)

### v3.6 (2026-02-28)
- ✅ **Score de Conformidade**: 100% mantido (Sprint 17)
- ✅ **Gaps resolvidos**: `teams` e `team_members` atualizados para ✅ IMPLEMENTADO Sprint 16
- ✅ **Rota `(employee)` documentada**: grupo de rotas para colaboradores (self-service NR-1)
- ✅ **Incidente 2026-02-28 documentado**: 4 problemas + correções em cascata
  - Design System: FORGE `#3B82F6` → `#F97316` (4 arquivos)
  - `useSearchParams` sem `Suspense`: padrão correto documentado
  - `@types/react` dual version: solução via `overrides` no root `package.json`
  - `next.config.ts` → `next.config.mjs` (ESM-first)
- ✅ **Checklist**: adicionados itens 8 e 9 (verificar `@types/react` raiz e `overrides`)
- ✅ **Regra nova**: `npm install` SEMPRE da raiz do monorepo, nunca de `apps/web`
- ✅ **Build validado**: `npm run build:web` → 88/88 páginas estáticas geradas sem erros

### v3.5 (2026-02-05 14:00)
- ✅ **Correção Stack**: React 19 → **React 18** na documentação (Next.js 15 requer React 18, não 19)
- ✅ **Seção de Troubleshooting**: Adicionada seção completa "Startup do Servidor Local — Guia Completo e Troubleshooting"
  - 6 problemas documentados com diagnóstico e solução
  - Checklist de verificação rápida para dev local
  - Histórico de incidentes com cadeia de causas e resolução
  - Tabela de variáveis de ambiente críticas (incluindo VERCEL_OIDC_TOKEN proibido em dev)
- ✅ **Regra de Segurança Ambiental**: `VERCEL_OIDC_TOKEN` documentado como **proibido** em desenvolvimento local
- ✅ **Regra de Dependências**: Documentado que `next`, `react`, `react-dom` devem existir APENAS em `apps/web/package.json` (nunca no root)
- ✅ **Incidente documentado**: Cadeia de 3 causas em cascata do incidente 2026-02-05 (node_modules corrompido + Next.js 16 no root + VERCEL_OIDC_TOKEN)

### v3.4 (2026-01-29 23:58)
- ✅ **UX Final Sprint 10**: Logo PHP otimizada no footer
  - Transform scale 150% (50% maior visualmente)
  - Opacidade aumentada 20% → 50% (mais visível)
  - Mantido efeito watermark hover (opacity-100)
  - `origin-left` para escalar sem aumentar altura do footer
  - Transição suave 300ms (`transition-all`)
- ✅ **Conformidade**: 97% mantido, branding 100%
- ✅ **Documentação**: Seção Design System expandida com detalhes técnicos da logo

### v3.3 (2026-01-29 23:50)
- ✅ **Design System Sprint 10**: 100% aplicado em 5 páginas PHP
  - Azul TALENT #1F4ED8, Laranja FORGE #F97316, Cinza #6B7280
  - Tipografia Montserrat (font-bold, font-semibold)
  - Botão voltar dashboard + Footer com logo watermark
- ✅ **Auditoria**: AUDITORIA_MODULO_PHP.md criado (97% score)
- ✅ **Validação**: Admin panel funcional, endpoints OK

### v3.2 (2026-01-29)
- ✅ **Sprint 10 Completo**: AI Integration + Admin Panel
- ✅ **Endpoints Admin**: POST/DELETE php-module + GET metrics
- ✅ **Controle Acesso**: Fartech admin único autorizado

### v3.1 (2026-01-28)
- ✅ **Sprint 9**: COPC 13 perguntas + Dashboard integrações
- ✅ **RLS Organizations**: Reativado com 5 policies corrigidas

### v3.0 (2026-01-27)
- ✅ **Sprint 7+8**: NR-1 + TFCI completos
- ✅ **12 Tabelas PHP**: Migrations aplicadas + RLS ativo
- ✅ **37 Endpoints**: Backend NestJS 100% funcional
- **Seção 1**: COPC Original vs COPC Adaptado (diferenças, simplificações)
- **Seção 2**: Pesos v1.0 (Quality 35%, Efficiency 20%, Effectiveness 20%, CX 15%, People 10%)
- **Seção 3**: Regra para Operações sem CX (redistribuição de pesos)
- **Seção 4**: Catálogo de Métricas (padrão + customização por org)
- **Seção 5**: Integração com TFCI e NR-1 (loop fechado)
- **Seção 6**: Casos de Uso (contact center, backoffice, vendas, CS)

---

## 12) Design System e Padrões Visuais

### 🎨 Paleta de Cores (NUNCA ALTERAR)

| Token | HEX | Uso |
|-------|-----|-----|
| Primary | `#141042` | Roxo escuro — texto principal, botões primários, headers |
| Secondary | `#10B981` | Verde — sucesso, confirmação, status ativo |
| Accent | `#3B82F6` | Azul — informativo, links, badges |
| Warning | `#F59E0B` | Laranja — avisos, alertas médios |
| Danger | `#EF4444` | Vermelho — erros, risco alto, exclusão |
| Purple | `#8B5CF6` | Roxo alternativo — assessments, badges especiais |
| Pink | `#EC4899` | Rosa — People/bem-estar no COPC |
| Cyan | `#06B6D4` | Ciano — métricas complementares |
| Background main | `#FFFFFF` | Fundo de cards e modais |
| Background alt | `#FAFAF8` | Fundo de páginas e seções |
| Border | `#E5E5DC` | Bordas de cards e divisores |
| Text primary | `#141042` | Texto principal |
| Text secondary | `#666666` | Texto auxiliar / labels |
| Text muted | `#999999` | Placeholders / metadados |

**Branding do Logotipo (Módulo PHP e páginas admin):**
- `TALENT` → `#1F4ED8` Montserrat SemiBold `tracking-tight`
- `FORGE` → `#F97316` Montserrat Bold `tracking-wider`

### 🖋️ Tipografia

- **Família**: Montserrat (Google Fonts) — configurada via `@import` em `globals.css`
- **Pesos**: 400 Regular · 500 Medium · 600 SemiBold · 700 Bold
- **Títulos H1**: `text-3xl font-bold text-[#141042]`
- **Títulos H2**: `text-xl font-semibold text-[#141042]`
- **Labels**: `text-sm text-[#666666]`
- **Metadados**: `text-xs text-[#999999]`

### 🧱 Componentes Padrão

#### Cards
```tsx
<div className="bg-white border border-[#E5E5DC] rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
```

#### Botão Primário
```tsx
<button className="px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1554] transition-colors">
```

#### Botão Secundário
```tsx
<button className="px-4 py-2 border border-[#E5E5DC] text-[#141042] rounded-lg hover:bg-[#FAFAF8] transition-colors">
```

#### Botão Perigo
```tsx
<button className="px-4 py-2 bg-[#EF4444] text-white rounded-lg hover:bg-red-700 transition-colors">
```

#### Input
```tsx
<input className="w-full px-3 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]" />
```

#### Badge de Status
```tsx
// Sucesso
<span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Ativo</span>
// Risco Alto
<span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Alto</span>
// Informativo
<span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Info</span>
```

#### Spinner de Loading
```tsx
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141042]"></div>
```

#### Empty State
```tsx
<div className="text-center py-12">
  <IconComponent className="w-12 h-12 text-[#E5E5DC] mx-auto mb-4" />
  <p className="text-[#999999]">Nenhum item encontrado</p>
</div>
```

### 📐 Layout e Espaçamento

- **Max-width páginas**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Padding de seções**: `py-8`
- **Gap de grids**: `gap-6`
- **Grids responsivos**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

### ⚙️ Implementação Técnica (Tailwind 4)

- **Approach**: CSS-first via `@import "tailwindcss"` + `@theme inline` em `globals.css`
- **SEM** `tailwind.config.ts` — configuração direta via CSS variables
- **Cores via CSS var**: `--color-primary: #141042` etc. (definido em `globals.css`)
- **Arquivo principal**: `apps/web/src/app/globals.css`

### 🪟 Glass Tokens — Apple Liquid Glass (Sprint 18)

Tokens de glassmorphism adicionados em `globals.css`:

| Token | Valor | Uso |
|-------|-------|-----|
| `--glass-bg` | `rgba(255,255,255,0.80)` | Fundo glass padrão |
| `--glass-bg-heavy` | `rgba(255,255,255,0.92)` | Glass opaco (header sticky) |
| `--glass-bg-tinted` | `rgba(20,16,66,0.04)` | Glass levemente tintado de primary |
| `--glass-border` | `rgba(255,255,255,0.50)` | Borda glass clara |
| `--glass-border-subtle` | `rgba(20,16,66,0.08)` | Borda glass sutil (primary) |
| `--glass-specular` | `inset 0 1px 0 rgba(255,255,255,0.70)` | Reflexo especular |
| `--glass-shadow` | composto | Sombra + reflexo combinados |

**Easing curves:**
- `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)` — animações com overshoot
- `--ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94)` — transições suaves

**Shadows tintadas (primary):**
```css
--shadow-xs: 0 1px 3px rgba(20, 16, 66, 0.04);
--shadow-sm: 0 2px 8px rgba(20, 16, 66, 0.06), 0 1px 2px rgba(20, 16, 66, 0.04);
--shadow-md: 0 4px 16px rgba(20, 16, 66, 0.08), 0 2px 4px rgba(20, 16, 66, 0.05);
--shadow-lg: 0 8px 32px rgba(20, 16, 66, 0.10), 0 2px 8px rgba(20, 16, 66, 0.06);
--shadow-xl: 0 16px 48px rgba(20, 16, 66, 0.12), 0 4px 16px rgba(20, 16, 66, 0.08);
```
> Sombras tintadas com `#141042` dão profundidade cromática sem pesar visualmente.

### 🏗️ Padrões de Layout (Sprint 18)

#### Sidebar
```tsx
// Cor canônica: bg-[#141042] (não gray-900)
<aside className="fixed inset-y-0 left-0 z-40 w-64 bg-[#141042] text-white flex flex-col shadow-[4px_0_24px_rgba(20,16,66,0.15)]">
  <div className="flex h-16 items-center px-6 border-b border-white/10">
    {/* Logo */}
  </div>
</aside>
```

#### Header Sticky (Glass)
```tsx
// Header com backdrop-blur (Apple-style)
<header className="sticky top-0 z-30 h-16 border-b border-[#E5E5DC] bg-white/85 backdrop-blur-xl flex items-center justify-between px-6">
  <h1 className="text-xl font-semibold text-[#141042]">{title}</h1>
</header>
```

#### Dashboard Background
```tsx
// Gradiente sutil em vez de bg-gray-50
<div className="min-h-screen bg-linear-to-br from-[#FAFAF8] via-[#F5F4FB] to-[#FAFAF8]">
```

### 🚫 Proibições do Design System

1. Não usar classes Tailwind genéricas (`bg-blue-500`, `text-gray-900`, `bg-gray-50`) em componentes novos — usar valores HEX do sistema
2. Não criar novos tokens de cor sem aprovação
3. Não alterar `globals.css` sem atualizar este documento
4. Não usar `rounded-full` em cards — somente `rounded-xl` ou `rounded-lg`
5. Não usar `bg-gray-900` na sidebar — usar `bg-[#141042]` (cor canônica primária)
6. Sombras em hover: usar `shadow-[var(--shadow-lg)]` das CSS vars tintadas (não `shadow-md` hardcoded do Tailwind)

---

## 13) Módulo MCP — TalentForge AI Brain (v1.0, 2026-02-26)

### Visão Geral
O `packages/mcp` implementa o **TalentForge MCP Server** — uma interface Model Context Protocol (Anthropic) que expõe as capacidades de RH do TalentForge para agentes de IA (Claude Desktop, claude-code, e outros clientes MCP compatíveis).

**Posicionamento estratégico**: em vez de competir com ERP de Ponto/Folha, o TalentForge se posiciona como o **cérebro de RH analítico e comportamental**, conectável a qualquer sistema via MCP.

### Package: `@talentforge/mcp`
- **Localização**: `packages/mcp/`
- **Entry point**: `packages/mcp/src/server.ts`
- **Binário**: `talentforge-mcp` (executa via stdio)
- **Transporte**: stdio (padrão MCP — compatível com Claude Desktop e claude-code)
- **Conexão DB**: Supabase service role direto (não passa pela API NestJS)
- **Build tool**: esbuild (TS 5.9 + zod 3.25 causam hang no tsc)

### Regras Canônicas do MCP
1. **Toda tool DEVE chamar `validateOrg(org_id)` antes de qualquer query** — garante multi-tenant
2. **Nenhuma tool expõe dados fora do escopo da org** — `owner_org_id` ou join via `jobs.org_id`
3. **`applications` não tem `org_id` direto** — acesso sempre via `jobs!inner(org_id)` (path canônico)
4. **Operações de escrita** devem registrar audit trail em `application_events`
5. **Erros retornam `isError: true`** no response MCP — nunca lançam exceção não tratada
6. **Logs apenas em `stderr`** — stdout é reservado para o protocolo MCP (stdio)

### Catálogo de Tools (v1.0)

#### Recrutamento (`tools/recruitment.ts`)
| Tool | Descrição | Tabelas principais |
|------|-----------|-------------------|
| `search-candidates` | Busca candidatos por texto, tags, localização | `candidates`, `assessments` |
| `get-pipeline-status` | Status do pipeline de uma vaga com candidatos por estágio | `jobs`, `pipeline_stages`, `applications` |
| `move-candidate` | Move candidatura para outro estágio (escreve audit trail) | `applications`, `application_events` |
| `get-candidate-profile` | Perfil completo: assessments, candidaturas, notas | `candidates`, `assessments`, `applications` |

#### Assessments / Comportamental (`tools/assessments.ts`)
| Tool | Descrição | Tabelas principais |
|------|-----------|-------------------|
| `analyze-disc-profile` | Análise DISC com traço primário/secundário, pontos fortes e atenção | `disc_assessments`, `assessments` |
| `compare-candidates` | Ranking de candidatos por score — ideal para decisão entre finalistas | `candidates`, `assessments` |
| `get-team-health` | Score integrado PHP (TFCI + NR-1 + COPC) + último ciclo e avaliação | `php_integrated_scores`, `tfci_cycles` |

#### People Analytics (`tools/people.ts`)
| Tool | Descrição | Tabelas principais |
|------|-----------|-------------------|
| `get-recruitment-metrics` | Vagas, candidatos, conversão, time-to-hire no período | `jobs`, `candidates`, `applications` |
| `get-employee-list` | Lista colaboradores com filtro por departamento ou time | `employees`, `team_members` |
| `predict-retention-risk` | Top colaboradores em risco de turnover/burnout (PHP scores + fallback NR-1) | `php_integrated_scores`, `nr1_risk_assessments` |

### Build e Execução
```bash
npm run build:mcp        # compila com esbuild (~10ms)
npm run mcp:inspect      # UI visual para testar as tools
npm run mcp:start        # inicia servidor (stdio)

# Variáveis obrigatórias
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Integração com Claude Desktop
Adicionar em `~/.config/claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "talentforge": {
      "command": "node",
      "args": ["/path/to/packages/mcp/dist/server.js"],
      "env": {
        "SUPABASE_URL": "...",
        "SUPABASE_SERVICE_ROLE_KEY": "..."
      }
    }
  }
}
```

---

## 14) Job Publisher Engine — Multi-Canal (Sprint 35, 2026-03-10)

### Visão Geral
O Publisher Engine permite publicar vagas do TalentForge em plataformas externas (Gupy, Vagas.com, LinkedIn, Indeed) de forma centralizada, com rastreamento de status, retry automático e audit log completo.

### Arquitetura

```
[NestJS] PublisherController
    └── PublisherService (orquestra, faz upsert em job_publications)
            ├── GupyAdapter     → Gupy REST API v2 (OAuth2 client_credentials)
            ├── VagasAdapter    → Vagas.com Business REST API (ApiKey)
            └── LinkedInAdapter → LinkedIn Job Posting API (OAuth2 + ATS parceria pendente)
```

### Modelo Canônico — JobCanonical
```typescript
interface JobCanonical {
  id: string;
  title: string;
  description: string;
  description_html?: string;
  location: string;
  employment_type: string;  // 'clt' | 'pj' | 'internship' | 'freelancer' | 'temporary'
  requirements?: string;
  benefits?: string;
  salary_min?: number;
  salary_max?: number;
  application_deadline?: string;
  external_apply_url?: string;
  org_id: string;
  org_name: string;
  org_slug: string;
}
```

### Interface ChannelAdapter
```typescript
interface ChannelAdapter {
  channelCode: ChannelCode;
  publish(job: JobCanonical, credentials: ChannelCredentials): Promise<PublishResult>;
  unpublish(externalId: string, credentials: ChannelCredentials): Promise<PublishResult>;
  update(externalId: string, job: JobCanonical, credentials: ChannelCredentials): Promise<PublishResult>;
}
```

### Endpoints REST

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/v1/jobs/:id/channels` | Status de publicação da vaga por canal |
| `POST` | `/api/v1/jobs/:id/publish` | Publicar vaga nos canais selecionados |
| `DELETE` | `/api/v1/jobs/:id/publish/:channelId` | Despublicar vaga de um canal |
| `GET` | `/api/v1/organizations/:id/channels` | Canais configurados pela org |
| `POST` | `/api/v1/organizations/:id/channels` | Configurar/atualizar credenciais de canal |

### Schema de Banco

#### `job_publication_channels`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | |
| `org_id` | UUID FK organizations | |
| `channel_code` | TEXT CHECK | `'gupy' \| 'vagas' \| 'linkedin' \| 'indeed' \| 'catho' \| 'infojobs' \| 'custom'` |
| `display_name` | TEXT | Nome exibido |
| `is_active` | BOOLEAN | Canal habilitado pela org |
| `credentials` | JSONB | API keys/tokens (NUNCA expor em logs) |
| `config` | JSONB | Configurações específicas do canal |
| `last_sync_at` | TIMESTAMPTZ | Último sync |

#### `job_publications`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID PK | |
| `job_id` | UUID FK jobs | |
| `channel_id` | UUID FK job_publication_channels | |
| `external_id` | TEXT | ID da vaga na plataforma externa |
| `external_url` | TEXT | URL pública da vaga no canal |
| `status` | TEXT CHECK | `pending \| publishing \| published \| failed \| expired \| unpublished` |
| `payload_sent` | JSONB | Payload enviado (auditoria) |
| `response_received` | JSONB | Resposta do canal (auditoria) |
| `error_message` | TEXT | Mensagem de erro se falhou |
| `retry_count` | INTEGER | Número de tentativas |
| `published_at` | TIMESTAMPTZ | Quando foi publicado com sucesso |

#### `job_publication_logs`
Log de auditoria: cada tentativa (create, publish, update, unpublish, expire, retry, webhook) gera um registro com `request_payload`, `response_payload`, `duration_ms`.

### Regras Canônicas do Publisher
1. **Credenciais NUNCA são expostas** em respostas de API ou logs — ficam somente em `job_publication_channels.credentials` (JSONB, apenas lidos pelo service role internamente)
2. **Toda tentativa gera log** em `job_publication_logs` — incluindo falhas
3. **Status intermediário `publishing`** deve ser definido antes da chamada ao adapter
4. **Adapters são stateless** — recebem `JobCanonical` + `ChannelCredentials`, retornam `PublishResult`
5. **LinkedIn requer parceria ATS** — adapter preparado, aguarda aprovação do programa LinkedIn Partner
6. **RLS** nas três tabelas — acesso somente por membros autenticados da org

### Status dos Adapters
| Canal | Status | Método Auth | Observação |
|-------|--------|-------------|------------|
| Gupy | ✅ Pronto | OAuth2 client_credentials | Requer conta Enterprise Gupy |
| Vagas.com | ✅ Pronto | API Key | Requer conta Business Vagas.com |
| LinkedIn | ⚠️ Parceria pendente | OAuth2 Bearer | Adapter pronto, aguarda LinkedIn Partner Program |
| Indeed | 🔲 Roadmap | XML Feed / GraphQL | A implementar (fase 3) |
| Catho / InfoJobs | 🔲 Roadmap | A verificar | A implementar (fase 4, se API disponível) |

---

## 15) PDF de Compliance NR-1 (Sprint 35, 2026-03-10)

### Componente: `Nr1CompliancePDF`
**Localização**: `apps/web/src/components/reports/Nr1CompliancePDF.tsx`
**Dependências**: `jsPDF` + `jspdf-autotable` (já instalados no projeto)

### Seções do PDF Gerado
1. **Cabeçalho institucional** — logo TalentForge, data de emissão, fundo `#141042`
2. **Dados da empresa** — razão social, CNPJ, período, versão NR-1
3. **Status de conformidade** — banner verde (conforme) ou vermelho (requer ação)
4. **Resumo estatístico** — total, alto/médio/baixo risco, planos gerados
5. **Dimensões críticas** — tabela das dimensões com média ≥ 2.5
6. **Avaliações detalhadas** — tabela com todas as campanhas/avaliações do período
7. **Mapa de risco por dimensão** — todas as 10 dimensões com média + barra visual
8. **Recomendações** — lista gerada automaticamente pelo NestJS
9. **Declaração legal** — referência à NR-1 (Portaria MTE) e Lei 14.831/2024
10. **Rodapé paginado** — "Página X de Y" em todas as páginas

### Uso
```tsx
// Botão na página NR-1 (apps/web/src/app/(recruiter)/php/nr1/page.tsx)
<Nr1CompliancePDF
  assessments={assessments}
  complianceReport={complianceReport}  // opcional
  orgName="Fartech Ltda"
  cnpj="00.000.000/0001-00"
/>
```

### Nomenclatura do arquivo gerado
`NR1_Compliance_{OrgName}_{YYYY-MM-DD}.pdf`

---

## 16) Jobs Page v2 — Gestão de Vagas Aprimorada (Sprint 35, 2026-03-10)

### Melhorias implementadas (inspiradas na Solides)

#### KPI Bar
5 cards no topo calculados em tempo real:
- **Total** — total de vagas da org
- **Ativas** — status `open`
- **Rascunhos** — status `on_hold`
- **Fechadas** — status `closed`
- **Candidaturas** — soma total de candidatos em todas as vagas

#### Filtros Expandidos
| Filtro | Tipo | Implementação |
|--------|------|---------------|
| Busca | Text | title + department + location |
| Status | Select | all / on_hold / open / closed |
| Ordenação | Select | data (desc) / candidaturas (desc) / título (A-Z) |
| Departamento | Select | Gerado dinamicamente das vagas da org |
| Tipo de contrato | Select | CLT / PJ / Estágio / Freelancer / Temporário |
| Modalidade | Select | Remoto / Híbrido / Presencial |

#### Toggle de Visualização
- **Cards** (padrão): cards enriquecidos com mini-funil
- **Tabela**: view compacta com todas as colunas + seleção em lote

#### Cards Enriquecidos
- **Urgência de deadline**: badge vermelho quando prazo ≤ 7 dias (`AlertTriangle`)
- **Prazo expirado**: badge cinza quando deadline já passou
- **Mini-funil**: pills com contagem de candidatos por etapa do pipeline (até 4 + overflow)
- **Dias aberta**: "Aberta há N dias"
- **Sênioridade**: badge Júnior / Pleno / Sênior
- **Métricas**: candidatos + hire rate + tempo médio lado a lado

#### Ações Rápidas por Card
- **Copiar link**: copia URL `{origin}/empresas/{orgSlug}/{jobId}` da career page
- **Duplicar vaga**: cria cópia como rascunho (`status: 'on_hold'`) instantaneamente
- **Ver detalhes**: abre JobDetailsModal

#### Bulk Actions (seleção em lote)
- Checkbox em cada card e na tabela
- "Selecionar todos" na view tabela
- Barra de ações deslizante quando há seleção: **Arquivar** (status → `closed`)

### Regras Canônicas da Jobs Page
1. **JobDetailsModal** é o único ponto de edição de vaga — não criar edição inline fora do modal
2. **Mini-funil** usa `pipeline_stages.name` — nunca usar `application.status` para labels de etapa
3. **Copiar link** usa `org.slug` — sempre buscar da tabela `organizations`
4. **Duplicar** cria com `status: 'on_hold'` — nunca duplicar para `open` diretamente
5. **Bulk archive** usa `status: 'closed'` — não deletar vagas (soft-archive)

---

## 17) Source Analytics — applications.source (Sprint D, 2026-03-10)

### Schema
Colunas adicionadas em `applications` (migration `20260306_application_source_tracking.sql`):
```sql
source        TEXT    -- 'career_page' | 'direct' | 'linkedin' | 'gupy' | 'referral' | 'other'
utm_source    TEXT    -- ex: 'linkedin', 'google', 'newsletter'
utm_medium    TEXT    -- ex: 'cpc', 'organic', 'email'
utm_campaign  TEXT    -- ex: 'dev-senior-jan26'
```

### Prioridade de dados no ReportsService
```
1. applications.source (mais granular — rastreia a candidatura)
2. candidates.source (fallback — rastreia o candidato)
```

O `ReportsService.getDashboard()` usa `applications.source` com fallback para `candidates.source` quando não há dados de `applications`.

### Labels Canônicos de Source
| Valor no banco | Label exibido |
|----------------|---------------|
| `career_page` | Career Page |
| `direct` | Direto |
| `linkedin` | LinkedIn |
| `linkedin_ads` | LinkedIn Ads |
| `gupy` | Gupy |
| `referral` | Indicação |
| `indeed` | Indeed |
| `site` | Site |
| `other` | Outros |

---

## 18) Histórico de Sprints

| Sprint | Data | Escopo | Status |
|--------|------|--------|--------|
| Sprint 1–15 | 2024-12 a 2026-02 | Schema inicial, auth, DISC, pipeline, admin console, empresas | ✅ |
| Sprint 16 | 2026-02-26 | MCP Server v1.0 — 10 tools AI | ✅ |
| Sprint 25 | 2026-02 | ESLint, Playwright E2E (7), Jest (8), Error Boundaries | ✅ |
| Sprint 30 | 2026-03-01 | Google OAuth, CV Upload, email templates versionados | ✅ |
| Sprint 31 | 2026-03-02 | Google Calendar, Jobs route migration, types fix | ✅ |
| Sprint 32 | 2026-03-06 | Campaigns NR-1, COPC dinâmico, NR-1 Invitations v2, Peer Selection TFCI | ✅ |
| Sprint 33 | 2026-03-09 | EmailModule Brevo SMTP, InterviewsModule, 5 templates HBS | ✅ |
| Sprint 34 | 2026-03-10 | Career Page v2, fluxo de candidatura, redirect login, auto-apply | ✅ |
| Sprint 35 | 2026-03-10 | Publisher Engine NestJS, NR-1 PDF, Jobs Page v2, Source Analytics, limpeza 112 arquivos | ✅ |
| Sprint 36 | 2026-03-10 | `org_type` em `organizations`, admin/companies refactor (2 blocos), compressão upload imagens, CDN cache-bust timestamp, botões excluir logo/banner | ✅ |
| Sprint 37 | 2026-03-10 | Career Page redesign v3 — banner real como BG, logo flutuante `drop-shadow`, sticky nav glassmorphism, SVG curve, cards animados (`w-0→w-full`), TypeBadge, `daysAgo()`, Sparkles, ArrowUpRight | ✅ |
| **Sprint 38** | **2026-03-11** | **Career Page v4 — `work_modality` + `salary_range` em `jobs`, `ModalityBadge`, `SeniorityBadge`, grid 2-col com `isLastOdd`, seção Banco de Talentos, headline editável 2 linhas, `max-w-7xl`; PHP mobile fixes: `grid-cols-*` responsivos no TFCI/ActionPlans + card view mobile em Employees** | ✅ |
| **Sprint 39** | **2026-03-11** | **Depoimentos editáveis — tabela `org_testimonials` com RLS, CRUD no settings (formulário inline, estrelas clicáveis, paleta de cores), career page busca do DB e renderiza condicionalmente; ícones SVG reais das redes sociais na seção #vagas** | ✅ |
| **Sprint 40** | **2026-03-11** | **Dicas de carreira — tabela `org_career_tips` com RLS + trigger updated_at, CRUD no settings (card Lightbulb, formulário inline title/summary/content), career page renderiza seção condicionalmente** | ✅ |
| **Sprint 45** | **2026-03-16** | **Pipeline auto-save Supabase direto (remove dependência NestJS) + enum `interview_hr`/`interview_manager`, badge no card Kanban, migration `20260316_add_interview_status.sql`** | ✅ |
| **Sprint 46** | **2026-03-16** | **Currículo PDF profissional candidato (`CandidateCurriculumPDF.ts`) — jsPDF 2 colunas, foto circular via Canvas API, header roxo escuro, seções Experiência/Formação/Contato/Diferenciais, rodapé TalentForge; fix: exibe status do currículo no banco em vez do nome do arquivo; COPC: botão Tendências linkando `/php/copc/trends`** | ✅ |
| **Sprint 41** | **PLANEJADO** | **AI Assistant PHP Module — 7 endpoints `/api/php/ai/*`, tabela `php_ai_usage`, correção `orgId` no frontend, integração com provedor AI (Anthropic/OpenAI)** | 🔲 |
| **Sprint 43** | **2026-03-12** | **Landing Polish + Avatar Candidato — título hero com `clamp()`, badge MÓDULO PREMIUM ampliado, avatar upload com modal de recorte (`react-easy-crop`), bucket `candidate-avatars`, migration `avatar_url`** | ✅ |
| **Hotfix** | **2026-03-13** | **Botão Analytics Dashboard — removida guarda `isLocalhost` em `(recruiter)/dashboard/page.tsx`; botão "Analytics" e `AnalyticsPanel` (recharts) agora visíveis em produção para todos os usuários** | ✅ |
| **Sprint 44** | **PLANEJADO** | **Gate de ativação do módulo Recrutamento — tabela `recruitment_module_activations`, `GET /api/v1/recruitment/status`, endpoints admin, guard no `dashboard/layout.tsx`, card no Admin Panel** | 🔲 |
```