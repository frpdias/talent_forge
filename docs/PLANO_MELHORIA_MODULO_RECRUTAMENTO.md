# Plano de Melhoria — Módulo de Recrutamento
**Avaliação 360° + Roadmap de Evolução**  
Data: 2026-03-04 | Baseado na Arquitetura Canônica v4.3

---

## 1. AVALIAÇÃO 360° — ESTADO ATUAL

### 1.1 Inventário de Telas (o que existe)

| Tela | Rota | Status | Observações |
|------|------|--------|-------------|
| Dashboard principal | `/dashboard` | ✅ Funcional | KPIs, atividade recente, alertas |
| Lista de vagas | `/dashboard/jobs` | ✅ Funcional | Busca, filtros por status, badges de publicação |
| Nova vaga | `/dashboard/jobs/new` | ✅ Funcional | Formulário completo |
| Detalhe da vaga | `/dashboard/jobs/[id]` | ✅ Funcional | Edição inline |
| Publicação de vaga | `/dashboard/jobs/[id]/publish` | ✅ Funcional | Multi-canal (Sprint 18) |
| Candidaturas da vaga | `/dashboard/jobs/[id]/applications` | ✅ Funcional | Lista por vaga |
| Pipeline Kanban | `/dashboard/pipeline` | ✅ Funcional | 5 colunas + DnD |
| Lista de candidatos | `/dashboard/candidates` | ✅ Funcional | 1.317 linhas, muito pesada |
| Detalhe do candidato | `/dashboard/candidates/[id]` | ✅ Funcional | Perfil, assessments, notas |
| Assessments | `/dashboard/assessments` | ✅ Funcional | Resultados DISC |
| Relatórios | `/dashboard/reports` | ✅ Funcional | KPIs, funil, tempo médio |
| Relatórios DISC | `/dashboard/reports/disc` | ✅ Funcional | Analytics de assessments |
| Convite | `/dashboard/invite` | ✅ Funcional | Link de convite para candidatos |
| Settings | `/dashboard/settings` | ✅ Funcional | Configurações da org |
| Empresas | `/dashboard/companies` | ✅ Funcional | Gestão de empresas clientes |

**Total: 15 telas operacionais no módulo recrutador.**

---

### 1.2 Avaliação por Dimensão

#### 🟢 PONTOS FORTES

**Arquitetura**
- Next.js App Router corretamente organizado em `(recruiter)` route group
- API Routes Next.js criadas (Sprint 26) — frontend desacoplado do NestJS instável
- Multi-tenant implementado via `org_members` + `x-org-id`
- RLS no banco protege dados entre organizações
- Supabase direto no frontend nas queries de leitura (correto para SaaS)

**UX / Produto**
- Pipeline Kanban com DnD funciona bem (dnd-kit + hello-pangea)
- Dashboard com KPIs reais calculados do banco
- Publicação multi-canal de vagas (Sprint 18) é diferencial competitivo
- Sistema de notas em candidatos implementado
- Relatórios com funil de conversão e export CSV/PDF

**Segurança**
- `getAuthUser()` centralizado nas API Routes
- Headers `Authorization + x-org-id` obrigatórios
- `is_org_member()` como SECURITY DEFINER no banco

---

#### 🟡 PONTOS DE ATENÇÃO (não críticos, mas limitantes)

**Performance**
- `CandidatesPage` tem **1.317 linhas** — componente monolítico difícil de manter
- Candidatos carregados todos de uma vez (sem paginação)
- `createBrowserClient` instanciado dentro do componente em múltiplas telas (deveria ser singleton)
- Jobs page instancia `createBrowserClient` diretamente — inconsistente com outras telas que usam `createClient()`

**Dados e Consistência**
- `STATUS_LABELS` nos relatórios não inclui `in_documentation` (Sprint 26) — desatualizado
- `statusColors` em jobs usa `open/on_hold/closed` mas o enum real do banco é `draft/active/paused/closed`
- `page-backup.tsx` e `page-simple.tsx` existem no dashboard — arquivos órfãos para remover
- Sem paginação real em nenhuma lista (candidates, jobs, pipeline)

**Fluxo de candidato**
- Candidato se cadastra via invite link mas **não tem página pública de vagas** — depende 100% de link direto
- Sem SEO para vagas — zero visibilidade orgânica
- Landing page (`/`) não tem seção nem link para vagas abertas das empresas clientes

**Relatórios**
- Fonte de dados mista: alguns KPIs vêm da API NestJS (`reportsApi`), outros direto do Supabase — duplicação e inconsistência
- Gráfico de "Efetividade de Fontes" usa dados hardcodados por fonte (LinkedIn, Indeed) mas o sistema não rastreia origem das candidaturas

**Pipeline**
- Sem filtro por vaga no kanban (mostra todos os candidatos de todas as vagas)
- Sem busca no kanban
- Status `in_documentation` adicionado mas sem documentação de quando usar

---

#### 🔴 GAPS CRÍTICOS (afetam produto)

1. **Sem página pública de vagas** — empresa não tem "career page" para divulgar suas vagas
2. **Sem rastreamento de origem** — não sabe de onde vêm os candidatos (origem das candidaturas)
3. **Pipeline sem filtro por vaga** — recruiter com muitas vagas abertas vê o kanban poluído
4. **Candidatos sem paginação** — com +500 candidatos, a tela vai travar
5. **API NestJS ainda usada em reports** — `reportsApi` chama NestJS instável em produção

---

## 2. GAP ANALYSIS — ARQUITETURA CANÔNICA vs. IMPLEMENTAÇÃO

| Item Canônico | Status | Gap |
|---------------|--------|-----|
| RLS em todas as tabelas | ✅ | — |
| Multi-tenant por `org_id` | ✅ | `applications` resolve via jobs!inner |
| API Routes Next.js para `/api/v1/applications` | ✅ Sprint 26 | — |
| `getAuthUser()` em todas as API Routes | ✅ | — |
| `is_org_member()` como barreira | ✅ | — |
| Endpoint `GET /api/v1/reports/*` como Next.js Route | ⚠️ Parcial | Reports ainda chama NestJS via `reportsApi` |
| Página pública de vagas | ❌ | Não existe |
| Paginação em listas | ❌ | Nenhuma lista tem paginação |
| Rastreamento de fonte de candidatura | ❌ | Campo `source` inexistente em `applications` |

---

## 3. PLANO DE MELHORIA — SPRINTS PROPOSTOS

> **Prioridade definida por impacto no produto x esforço de implementação.**  
> Nenhuma alteração deve ser feita sem antes atualizar a Arquitetura Canônica.

---

### 🏆 SPRINT A — Página Pública de Vagas (Career Page)
**Prioridade: CRÍTICA | Esforço: Médio | Impacto: Alto**

#### Objetivo
Criar página pública acessível sem login onde empresas podem divulgar suas vagas abertas, com link na landing page principal.

#### Estrutura de rotas proposta
```
(public)/
  vagas/
    page.tsx          → /vagas — listagem geral de vagas públicas (SEO)
  empresas/
    [slug]/
      page.tsx        → /empresas/[slug] — career page da empresa (ex: /empresas/fartech)
      vagas/
        [jobId]/
          page.tsx    → /empresas/[slug]/vagas/[jobId] — detalhe da vaga + botão Candidatar
```

#### Banco de dados necessário
```sql
-- Adicionar campos na tabela jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description_html TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits TEXT[];
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements TEXT[];

-- Adicionar slug na tabela organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS career_page_enabled BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS career_page_headline TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS career_page_logo_url TEXT;

-- View pública (sem RLS restritiva)
CREATE OR REPLACE VIEW v_public_jobs AS
SELECT 
  j.id, j.title, j.department, j.location, j.type,
  j.salary_min, j.salary_max, j.description_html,
  j.benefits, j.requirements, j.created_at,
  o.name as org_name, o.slug as org_slug, o.career_page_logo_url
FROM jobs j
JOIN organizations o ON o.id = j.org_id
WHERE j.status = 'active' 
  AND j.is_public = true
  AND o.career_page_enabled = true;
```

#### Componentes a criar
- `(public)/vagas/page.tsx` — listagem com filtros (cidade, área, tipo)
- `(public)/empresas/[slug]/page.tsx` — career page da empresa
- `(public)/empresas/[slug]/vagas/[jobId]/page.tsx` — detalhe + formulário de candidatura
- `dashboard/jobs/[id]/settings/page.tsx` — configurações de visibilidade da vaga (toggle is_public)

#### Integração com Landing Page
- Adicionar seção "Vagas em Destaque" na landing page (`(public)/page.tsx`)
- Link "Ver todas as vagas" no nav: `<a href="/vagas">Vagas</a>`
- Seção de empresas que usam o Talent Forge com link para career pages

#### Fluxo candidato via Career Page
```
Landing Page → /vagas → /empresas/[slug]/vagas/[jobId] → Formulário
→ (se tem conta) Login + Candidatura automática
→ (se não tem conta) Registro rápido + Candidatura
→ Email de confirmação → Pipeline do recrutador
```

---

### SPRINT B — Pipeline com Filtro por Vaga
**Prioridade: Alta | Esforço: Baixo | Impacto: Alto**

#### Problema
Recrutador com 10 vagas abertas vê 150+ candidatos no kanban sem saber qual é de qual vaga.

#### Solução
- Adicionar seletor de vaga no topo do pipeline (dropdown ou tabs)
- URL param: `/dashboard/pipeline?job=<uuid>`
- Filtro "todas as vagas" como default
- Badge com nome da vaga em cada card do kanban
- Quick filter por status de vaga (ativa / em processo / fechada)

---

### SPRINT C — Paginação e Performance nas Listas
**Prioridade: Alta | Esforço: Médio | Impacto: Alto**

#### Problema
Candidatos/jobs carregados todos de uma vez — inviável com +500 registros.

#### Solução
- Paginação cursor-based no Supabase (`.range(from, to)`)
- Componente `<InfiniteList>` reutilizável
- Refactor `CandidatesPage` (1.317 linhas) em componentes menores:
  - `CandidateCard`
  - `CandidateFilters`
  - `CandidateDetailDrawer`
  - `CandidateAssessmentsTab`

---

### SPRINT D — Rastreamento de Origem
**Prioridade: Média | Esforço: Médio | Impacto: Alto**

#### Problema
O gráfico de "Efetividade de Fontes" usa dados estáticos — o sistema não sabe de onde veio o candidato.

#### Solução
```sql
-- Adicionar campo source em applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS source TEXT;
-- valores: 'direct_link', 'career_page', 'linkedin', 'indeed', 'referral', 'other'

ALTER TABLE applications ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
```
- Capturar UTM params no formulário de candidatura
- Popular gráfico de fontes com dados reais
- Dashboard: "por qual canal chegou cada candidato"

---

### SPRINT E — Migrar Reports para Next.js Routes
**Prioridade: Média | Esforço: Baixo | Impacto: Médio**

#### Problema
`reportsApi` ainda chama NestJS (`http://localhost:3001`) — em produção, o NestJS é instável.

#### Solução
- Criar `app/api/v1/reports/dashboard/route.ts` como Next.js Route (já existe parcialmente)
- Remover dependência de `reportsApi` do frontend de relatórios
- Queries diretas ao Supabase com cálculos no servidor (route handler)
- Adicionar `in_documentation` no `STATUS_LABELS` do reports

---

### SPRINT F — Limpeza e Qualidade
**Prioridade: Baixa | Esforço: Baixo | Impacto: Médio**

#### Tarefas de limpeza
- [ ] Remover `apps/web/src/app/(recruiter)/dashboard/page-backup.tsx`
- [ ] Remover `apps/web/src/app/(recruiter)/dashboard/page-simple.tsx`
- [ ] Padronizar `createBrowserClient` vs `createClient` — usar `createClient` (do `lib/supabase/client`) em todas as telas
- [ ] Corrigir `statusColors` em jobs: `open` → `active`, `on_hold` → `paused`
- [ ] Adicionar `in_documentation` em `STATUS_LABELS` no reports
- [ ] Adicionar `in_documentation` no funil do relatório de pipeline

---

## 4. RESUMO EXECUTIVO

### Pontuação atual por área (escala 1-10)

| Área | Nota | Justificativa |
|------|------|---------------|
| Arquitetura técnica | 8/10 | Sólida. Pequenos inconsistências de cliente Supabase |
| Segurança | 9/10 | RLS, JWT, multi-tenant corretos |
| Performance | 5/10 | Sem paginação, componentes monolíticos |
| Completude de produto | 6/10 | Falta career page pública, rastreamento, filtros |
| UX/UI | 7/10 | Design system consistente, mas algumas telas sobrecarregadas |
| Manutenibilidade | 6/10 | CandidatesPage com 1.317 linhas é risco |

**Nota geral: 6.8/10**

---

### Prioridade de execução sugerida

```
Sprint A (Career Page) ─── impacto direto no produto e aquisição de candidatos
Sprint B (Filtro Pipeline) ── quick win, 1-2 dias de trabalho
Sprint C (Paginação) ─────── necessary para escalar além de 500 registros
Sprint D (Origem) ─────────── inteligência de dados para o recrutador
Sprint E (Reports API) ────── eliminar dependência do NestJS instável
Sprint F (Limpeza) ─────────── feito junto com outros sprints (baixo esforço)
```

---

## 5. DETALHE DA CAREER PAGE — WIREFRAME FUNCIONAL

```
┌─────────────────────────────────────────────────┐
│  LANDING PAGE (/)                                │
│  nav: Recursos | PHP | Como Funciona | Planos    │
│                                          [Vagas] ← NOVO LINK
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│  /vagas — PORTAL DE VAGAS                        │
│                                                  │
│  🔍 Buscar vagas...   📍 Cidade  🏢 Área  💼 Tipo │
│                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │ Dev Backend │  │ UX Designer │  │ Analista │ │
│  │ Fartech     │  │ Acme Corp   │  │ StartupX │ │
│  │ São Paulo   │  │ Remoto      │  │ RJ       │ │
│  │ [Ver Vaga]  │  │ [Ver Vaga]  │  │ [Ver]    │ │
│  └─────────────┘  └─────────────┘  └──────────┘ │
│                                                  │
│  ← Anterior   Página 1 de 5   Próxima →          │
└─────────────────────────────────────────────────┘
                        ↓ (clique em empresa)
┌─────────────────────────────────────────────────┐
│  /empresas/fartech — CAREER PAGE DA EMPRESA      │
│                                                  │
│  [Logo Fartech]  Fartech Tecnologia              │
│  "Construindo o futuro do RH"                    │
│                                                  │
│  VAGAS ABERTAS (3)                               │
│  ┌────────────────────────────────────────────┐  │
│  │ Senior Backend Developer                   │  │
│  │ Engenharia • São Paulo • CLT               │  │
│  │ R$ 12.000 – 18.000                [Aplicar]│  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                        ↓ (clique em Aplicar)
┌─────────────────────────────────────────────────┐
│  /empresas/fartech/vagas/[id] — DETALHE DA VAGA  │
│                                                  │
│  ← Voltar para Fartech                           │
│  Senior Backend Developer                        │
│  Engenharia • São Paulo • CLT • R$12k-18k        │
│                                                  │
│  SOBRE A VAGA                                    │
│  [description_html renderizado]                  │
│                                                  │
│  REQUISITOS  │  BENEFÍCIOS                       │
│  • Node.js   │  • VR + VA                        │
│  • TypeScript│  • Plano saúde                   │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  ✉️  Me candidatar a esta vaga           │    │
│  │                                          │    │
│  │  Nome: ___________________________       │    │
│  │  Email: __________________________       │    │
│  │  LinkedIn: ________________________      │    │
│  │  Currículo: [Upload PDF]                 │    │
│  │                                          │    │
│  │  Já tenho conta? [Entrar e aplicar]      │    │
│  │                    [Candidatar →]        │    │
│  └──────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## 6. MIGRAÇÕES SQL NECESSÁRIAS (Sprint A)

```sql
-- migration: YYYYMMDD_career_page.sql

-- 1. Campos de publicidade nas vagas
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS description_html TEXT,
  ADD COLUMN IF NOT EXISTS benefits TEXT[],
  ADD COLUMN IF NOT EXISTS requirements TEXT[],
  ADD COLUMN IF NOT EXISTS application_deadline DATE;

-- 2. Career page nas organizações
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS career_page_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS career_page_headline TEXT,
  ADD COLUMN IF NOT EXISTS career_page_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS career_page_color TEXT DEFAULT '#141042';

-- 3. Rastreamento de origem nas candidaturas
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN (
    'direct_link', 'career_page', 'linkedin', 'indeed',
    'referral', 'whatsapp', 'other'
  )),
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- 4. View pública de vagas (sem RLS restritiva — leitura pública)
CREATE OR REPLACE VIEW v_public_jobs AS
SELECT
  j.id,
  j.title,
  j.department,
  j.location,
  j.type,
  j.salary_min,
  j.salary_max,
  j.description_html,
  j.benefits,
  j.requirements,
  j.application_deadline,
  j.created_at,
  o.name   AS org_name,
  o.slug   AS org_slug,
  o.career_page_headline,
  o.career_page_logo_url,
  o.career_page_color
FROM jobs j
JOIN organizations o ON o.id = j.org_id
WHERE j.status = 'active'
  AND j.is_public = true
  AND o.career_page_enabled = true;

GRANT SELECT ON v_public_jobs TO anon;
GRANT SELECT ON v_public_jobs TO authenticated;
```

---

---

## 7. PADRONIZAÇÃO DE ESTILIZAÇÃO — CRIAÇÃO VIA MODAL TRANSLÚCIDO

### 7.1 Problema atual

| Ação | Comportamento atual | Problema |
|------|---------------------|---------|
| `+ Nova Vaga` (jobs/page.tsx) | Navega para `/dashboard/jobs/new` — página separada | Abandona o contexto, perda de estado |
| `+ Novo Candidato` | **Botão não existe** na tela principal de candidatos | Gap de UX — recruiter vai para rota `/candidates/new` separada |
| Formulários de criação | Páginas inteiras com `ArrowLeft` e navegação manual | Inconsistente com o padrão de modais já usado em candidatos (detalhe) |

### 7.2 Padrão a adotar — Modal Translúcido

O projeto já possui **dois componentes de modal** em `apps/web/src/components/ui/`:
- `modal.tsx` — Modal simples com overlay `bg-black/50`
- `dialog.tsx` — Dialog com trigger/content separados

**O componente `Modal` deve ser evoluído** para suportar o padrão translúcido com backdrop blur, alinhado ao Design System (`#141042`).

#### Especificação visual do novo `<CreationModal>`

```
┌──────────────────────────────────────────────────────────┐
│  backdrop: bg-[#141042]/40 + backdrop-blur-sm            │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ bg-white/95 rounded-2xl shadow-2xl                 │  │
│  │ border border-white/20                             │  │
│  │                                                    │  │
│  │  ● ○ ─────────────────────────────────── [×]       │  │
│  │  Título da ação                                    │  │
│  │  ─────────────────────────────────────────────     │  │
│  │                                                    │  │
│  │  [conteúdo do formulário]                          │  │
│  │                                                    │  │
│  │  ─────────────────────────────────────────────     │  │
│  │  [Cancelar]                      [Salvar →]        │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

#### Propriedades visuais canônicas

| Propriedade | Valor |
|-------------|-------|
| Overlay | `bg-[#141042]/40 backdrop-blur-sm` |
| Container | `bg-white/95 rounded-2xl shadow-2xl border border-white/20` |
| Header | `border-b border-gray-100 px-6 py-4` |
| Título | `text-lg font-semibold text-[#141042]` |
| Botão fechar | `rounded-lg hover:bg-gray-100 text-gray-400` |
| Footer | `border-t border-gray-100 px-6 py-4 flex justify-end gap-3` |
| Botão cancelar | `variant="outline" text-gray-600` |
| Botão salvar | `bg-[#141042] hover:bg-[#1a1554] text-white` |
| Tamanhos | `sm=max-w-md` / `md=max-w-lg` / `lg=max-w-2xl` / `xl=max-w-4xl` |
| Animação | `animate-in fade-in-0 zoom-in-95 duration-200` |

---

### 7.3 Componente a criar: `<CreationModal>`

**Arquivo:** `apps/web/src/components/ui/creation-modal.tsx`

```tsx
// Especificação — não implementar ainda
interface CreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;          // ex: "Preencha os dados da vaga"
  icon?: React.ReactNode;     // ícone no header (ex: <Briefcase>)
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onSubmit: () => Promise<void>;
  submitLabel?: string;       // padrão: "Salvar"
  loading?: boolean;
  children: React.ReactNode;
}
```

---

### 7.4 Formulário `+ Nova Vaga` — Especificação do Modal

**Onde:** `apps/web/src/app/(recruiter)/dashboard/jobs/page.tsx`  
**Trigger:** Botão `+ Nova Vaga` no header da página (já existe, muda de `Link href="/dashboard/jobs/new"` para `onClick={() => setShowNewJobModal(true)}`)

**Campos do formulário (igual ao `jobs/new/page.tsx` existente):**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Título da vaga | `Input` | ✅ |
| CBO / Cargo referência | `CboSelector` (componente existente) | — |
| Departamento | `Input` | ✅ |
| Localidade | `Input` | ✅ |
| Tipo de contratação | `Select` (CLT/PJ/Freelance/Estágio) | ✅ |
| Salário de (R$) | `Input number` | — |
| Salário até (R$) | `Input number` | — |
| Descrição | `Textarea` | — |
| Requisitos | `Textarea` | — |
| Benefícios | `Textarea` | — |
| Status inicial | `Select` (Rascunho/Ativa) | ✅ |

**Tamanho:** `lg` (max-w-2xl) — formulário extenso requer mais espaço  
**Após salvar:** `router.refresh()` + fechar modal + toast de confirmação (sonner)

**Estado local necessário em `jobs/page.tsx`:**
```tsx
const [showNewJobModal, setShowNewJobModal] = useState(false);
// Ao salvar: void loadJobs() — recarregar lista sem navegar
```

---

### 7.5 Formulário `+ Novo Candidato` — Especificação do Modal

**Onde:** `apps/web/src/app/(recruiter)/dashboard/candidates/page.tsx`  
**Trigger:** Botão NOVO a ser adicionado no header da página ao lado de `Candidatos`

**Posicionamento do botão:**
```tsx
// Adicionar no header da CandidatesPage junto com os filtros
<Button onClick={() => setShowNewCandidateModal(true)}>
  <UserPlus className="w-4 h-4 mr-2" />
  Novo Candidato
</Button>
```

**Campos do formulário (baseado em `candidates/new/page.tsx`):**

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome completo | `Input` | ✅ |
| Email | `Input email` | ✅ |
| Telefone | `Input` | — |
| Cidade/Estado | `Input` | — |
| Cargo pretendido | `Input` | — |
| LinkedIn | `Input url` | — |
| Pretensão salarial (R$) | `Input number` | — |
| Tags | `TagInput` (campo + botão Adicionar) | — |

**Tamanho:** `md` (max-w-lg)  
**Após salvar:** `void loadCandidates()` + fechar modal + toast

> ⚠️ **Atenção ao implementar**: `candidates/new/page.tsx` usa `candidatesApi` (NestJS). O modal deve usar Supabase direto (mesma correção do Sprint 26), seguindo o padrão do `applications/route.ts`.

**Bug a corrigir junto:** o fallback de org em `candidates/new/page.tsx` usa `limit(1)` sem ordem — mesmo bug corrigido no pipeline (Sprint 27). Usar o mesmo padrão de prioridade por role.

---

### 7.6 Páginas a MANTER (não remover)

As páginas `/dashboard/jobs/new` e `/candidates/new` devem ser **mantidas** para:
- Acessibilidade via URL direta
- Deep link de outras telas
- Fallback se JS falhar

Mas deixarão de ser o fluxo principal — o modal será o padrão de criação rápida.

---

### 7.7 Impacto nos demais botões de criação do módulo

Aplicar o mesmo padrão progressivamente:

| Botão | Tela | Prioridade |
|-------|------|-----------|
| `+ Nova Vaga` | jobs/page.tsx | 🔴 Alta (Sprint G1) |
| `+ Novo Candidato` | candidates/page.tsx | 🔴 Alta (Sprint G1) |
| `+ Nova Empresa` | companies/page.tsx | 🟡 Média (Sprint G2) |
| `+ Convidar Membro` | settings/page.tsx | 🟡 Média (Sprint G2) |
| `Agendar Entrevista` | pipeline/page.tsx (futuro) | 🟢 Baixa (Sprint G3) |

---

### 7.8 Sprint G1 — Implementação dos Modais de Criação (Resumo técnico)

**Esforço estimado:** 1-2 dias  
**Arquivos a criar:**
- `apps/web/src/components/ui/creation-modal.tsx` — componente base

**Arquivos a modificar:**
- `apps/web/src/app/(recruiter)/dashboard/jobs/page.tsx`
  - Remover `<Link href="/dashboard/jobs/new">` do botão principal
  - Adicionar state `showNewJobModal`
  - Adicionar formulário inline no modal
- `apps/web/src/app/(recruiter)/dashboard/candidates/page.tsx`
  - Adicionar botão `+ Novo Candidato` no header
  - Adicionar state `showNewCandidateModal`
  - Adicionar formulário inline no modal
  - Corrigir `candidatesApi` → Supabase direto
  - Corrigir fallback de org (mesmo padrão Sprint 27)

**Não alterar:** `jobs/new/page.tsx`, `candidates/new/page.tsx` (manter para acesso direto)

---

*Documento gerado em: 2026-03-04*  
*Baseado em: `docs/ARQUITETURA_CANONICA.md` v4.3*  
*Nenhuma alteração de código realizada — documento de planejamento apenas.*
