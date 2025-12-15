# Manifesto TalentForge

## Objetivo fundador
Criar uma plataforma híbrida (consultoria + SaaS) para headhunters e empresas, com testes comportamentais proprietários e IA para prever fit, retenção e performance.

## Identidade
- Nome provisório: TalentForge
- Propósito: recrutamento inteligente com leitura profunda de pessoas
- Visão: ser o motor de contratação mais preciso do Brasil
- Filosofia de UX/branding: clareza, ciência e humanidade

## Blocos fundamentais
- Módulo do headhunter
- Teste comportamental proprietário
- Banco de talentos enriquecido
- Portal da empresa
- Núcleo de IA
- Base multi-tenant para virar SaaS

## Stack
- Frontend: SvelteKit ou Next.js
- Backend: Node.js (Express/Nest)
- Banco: Postgres/Supabase (usaremos Supabase como host padrão)
- Infra: Vercel / Fly.io
- IA: OpenAI + modelos fine-tuned de comportamento
- Armazenamento: Supabase Buckets

## Roadmap

### Etapa 1 — Concepção
- Manifesto técnico, pitch e espinha dorsal.

### Etapa 2 — MVP (0–90 dias)
- Cadastro de headhunters/empresas
- Criação e gestão de vagas
- Pipeline Kanban
- Cadastro de candidatos
- Matching básico (filtros + teste v1)
- Teste comportamental v1 (rápido)
- Relatórios simples
- Meta: usável por 2–3 consultorias piloto

### Etapa 3 — Crescimento (90–150 dias)
- Portal da empresa (aprovação/recusa, histórico, SLA, notificações)
- Videoperfil + IA (upload, análise corporal/comunicação, insights em linguagem natural)
- Teste comportamental avançado (Big Five + DISC) com relatório visual
- Banco de talentos enriquecido (engajamento, pretensão, disponibilidade, skills validadas, histórico)

### Etapa 4 — Versão 2.0 (6–9 meses)
- Multi-tenancy real (SaaS puro, permissões, times)
- Marketplace interno (headhunter, avaliações, assinatura)
- IA preditiva (retenção, propensão a mover, cluster cultural, matching 2.0)
- Módulo financeiro (assinaturas, faturas, comissionamento)

### Etapa 5 — Ecossistema (1 ano+)
- Mobile candidato, reputação, API pública, benchmark de perfis, onboarding, learning hub

## Monetização
- Consultoria premium → SaaS para empresas (planos com vagas + créditos de testes) → Marketplace → IA avançada (cobrança por vídeo/relatórios)

## Pitch
“Estamos construindo o motor de leitura comportamental mais preciso do Brasil, integrado ao recrutamento moderno. Um Netflix de talentos: empresas deixam de procurar; passam a ser encontradas.”
