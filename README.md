# TalentForge
Plataforma híbrida (consultoria + SaaS) para headhunters e empresas, com testes comportamentais proprietários e IA para prever fit, retenção e performance. Banco de dados hospedado no Supabase (Postgres + Buckets) desde o dia zero.

## 🚀 Quick Start

### Pré-requisitos
- Node.js 20+
- npm 10+ ou pnpm
- Conta no [Supabase](https://supabase.com) (grátis)

### Instalação

```bash
# 1. Clone o repositório (se necessário)
cd PROJETO_TALENT_FORGE

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente

# Backend (apps/api/.env)
cp apps/api/.env.example apps/api/.env
# Edite com suas credenciais do Supabase

# Frontend (apps/web/.env.local)
cp apps/web/.env.local.example apps/web/.env.local
# Edite com suas credenciais do Supabase

# 4. Execute as migrations no Supabase
# Acesse o painel do Supabase > SQL Editor
# Execute os scripts em ordem:
#   - supabase/migrations/20241211_init_schema.sql
#   - docs/rls-policies.sql

# 5. Inicie o desenvolvimento
npm run dev
```

### URLs de desenvolvimento
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Docs (Swagger)**: http://localhost:3001/docs

## Identidade
- Propósito: recrutamento inteligente com leitura profunda de pessoas.
- Visão: ser o motor de contratação mais preciso do Brasil.
- Pilares: clareza, ciência e humanidade.

## Módulos fundamentais
- Módulo do headhunter
- Teste comportamental proprietário
- Banco de talentos enriquecido
- Portal da empresa
- Núcleo de IA
- Base multi-tenant para evoluir para SaaS

## Stack

### Frontend (apps/web)
- **Next.js 15** - React framework com App Router
- **React 19** - UI library
- **Tailwind CSS 4** - Utility-first CSS
- **Zustand** - State management
- **@dnd-kit** - Drag and drop para Kanban
- **Supabase SSR** - Auth e client-side queries

### Backend (apps/api)
- **NestJS 11** - Node.js framework
- **Swagger** - API documentation
- **Supabase JS** - Database client
- **class-validator** - Validation

### Infra
- **Supabase** - PostgreSQL + Auth + Storage
- **Vercel** - Deploy frontend (recomendado)
- **Railway/Render** - Deploy backend (recomendado)

## Estrutura do Projeto

```
├── apps/
│   ├── api/                 # Backend NestJS
│   │   └── src/
│   │       ├── auth/        # Auth guards e decorators
│   │       ├── organizations/
│   │       ├── jobs/
│   │       ├── candidates/
│   │       ├── applications/
│   │       ├── assessments/ # Testes comportamentais
│   │       ├── reports/
│   │       └── supabase/    # Supabase service
│   └── web/                 # Frontend Next.js
│       └── src/
│           ├── app/         # App Router pages
│           │   ├── (auth)/  # Login, Register, Onboarding
│           │   ├── (dashboard)/ # Dashboard pages
│           │   └── assessment/  # Public assessment page
│           ├── components/
│           │   ├── ui/      # Base components
│           │   ├── layout/  # Sidebar, Header
│           │   └── kanban/  # Drag-and-drop board
│           └── lib/         # Utils, API, Auth, Store
├── packages/
│   └── types/               # Shared TypeScript types
├── docs/                    # Documentation
└── supabase/               # Migrations
```

## MVP Features

- ✅ **Organizations** - Multi-tenant para headhunters e empresas
- ✅ **Jobs** - CRUD de vagas com pipeline customizável
- ✅ **Candidates** - Gestão de candidatos com tags e notas
- ✅ **Applications** - Kanban drag-and-drop por vaga
- ✅ **Assessments** - Teste comportamental v1 (Big Five simplificado)
- ✅ **Reports** - Dashboard com métricas e conversões
- ✅ **Auth** - Login/registro com Supabase Auth

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia API e Web em paralelo

# Build
npm run build        # Build de todos os projetos

# Lint
npm run lint         # Lint em todos os projetos

# Individual
npm run dev:api      # Apenas API
npm run dev:web      # Apenas Web
```

## Documentação

- [docs/manifesto.md](docs/manifesto.md) - Narrativa, roadmap e entregáveis
- [docs/decisions.md](docs/decisions.md) - Decisões de stack
- [docs/data-model.sql](docs/data-model.sql) - Schema do banco
- [docs/rls-policies.sql](docs/rls-policies.sql) - Políticas RLS
- [docs/auth.md](docs/auth.md) - Contrato de auth/tenant
- [docs/api.md](docs/api.md) - Rotas da API
- [docs/ux-flows.md](docs/ux-flows.md) - Fluxos UX

## Roadmap

### MVP (0–90 dias) ✅
- Cadastro de headhunters e empresas
- Criação/gestão de vagas e pipeline Kanban
- Cadastro de candidatos
- Matching básico (filtros + pontuação de teste)
- Teste comportamental v1 (rápido)
- Relatórios simples

### Crescimento (90–150 dias)
- Portal da empresa
- Videoperfil + IA
- Teste avançado (Big Five + DISC)
- Banco enriquecido

### v2.0 (6–9 meses)
- Multi-tenant SaaS
- Marketplace interno
- IA preditiva
- Módulo financeiro

## Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Proprietário - TalentForge © 2024
- `packages/types`: tipos compartilhados.
- `supabase`: instruções de banco.

## Próximos passos sugeridos
1) Aplicar `docs/data-model.sql` e `docs/rls-policies.sql` no Supabase.  
2) Instalar dependências e scaffold do backend (`apps/api`) e frontend (`apps/web`).  
3) Implementar guards de auth/tenant, DTOs e endpoints do MVP.  
4) Construir UI Kanban, cadastro de candidatos e fluxo de teste v1.  
