# Esqueleto de Arquitetura (detalhado, para iniciar qualquer aplicacao)

> Use este documento como base. Remova o que nao se aplica e preencha os campos [TODO].

## 1) Visao geral
- Produto: [TODO nome e objetivo em 1 frase]
- Usuarios: [TODO personas]
- Principais fluxos: [TODO 3-5 fluxos criticos]
- Principais riscos: [TODO riscos tecnicos e de negocio]
- Metricas de sucesso: [TODO KPIs]

## 2) Stack e decisoes
- Frontend: [TODO framework, versao, motivo]
- Backend: [TODO framework, versao, motivo]
- Banco: [TODO engine, replicacao, auth, RLS/policies]
- Infra: [TODO cloud, deploy, edge, storage]
- Observabilidade: [TODO logs, traces, metrics]
- CI/CD: [TODO pipeline, checks, gates]
- Versoes suportadas: [TODO Node, runtime, navegador]

## 3) Estrutura do repositorio
```
[TODO estrutura de pastas]
```

## 4) Dominios e modulos
- Dominios principais: [TODO]
- Contextos delimitados: [TODO]
- Integracoes externas: [TODO]
- Eventos: [TODO eventos internos, webhooks]

## 4) Contratos de API (MVP)
- `GET /api/v1/...`
- `POST /api/v1/...`
- `PATCH /api/v1/...`
[TODO endpoints por dominio]
- Padroes: [TODO paginacao, filtros, ordenacao, erros]

## 5) Modelo de dados
- Tabelas principais: [TODO]
- Relacionamentos: [TODO]
- Politicas RLS: [TODO]
- Migrations: [TODO local, supabase, prisma, etc]
- Indices: [TODO]
- Retencao/arquivamento: [TODO]

## 6) Auth e autorizacao
- Provedor: [TODO]
- Roles/papeis: [TODO]
- Claims JWT: [TODO]
- Middleware/guards: [TODO]
- MFA e politicas: [TODO]
- Onboarding: [TODO]

## 7) Frontend
- Rotas publicas: [TODO]
- Rotas protegidas: [TODO]
- Data fetching: [TODO SSR/CSR]
- Estado global: [TODO]
- Design system: [TODO tokens, componentes, temas]
- Performance: [TODO caching, imagens, bundle]

## 8) Backend
- Modulos/servicos: [TODO]
- Validacao: [TODO]
- Integracoes externas: [TODO]
- Jobs/filas: [TODO]
- Rate limit e protecoes: [TODO]

## 9) Infra e deploy
- Ambientes: [TODO dev/staging/prod]
- Variaveis de ambiente: [TODO lista]
- Jobs/cron: [TODO]
- Segredos: [TODO onde ficam, rotacao]
- Backup e restore: [TODO]

## 10) Observabilidade e auditoria
- Logs: [TODO]
- Auditoria: [TODO]
- Alertas: [TODO]
- Dashboards: [TODO]
- SLO/SLI: [TODO]

## 11) Seguranca
- Protecoes: [TODO CORS, CSP, rate limit, etc]
- Backups: [TODO]
- Chaves e secrets: [TODO]
- Compliance: [TODO LGPD, SOC2, etc]

## 12) Testes e qualidade
- Unitarios: [TODO]
- Integracao: [TODO]
- E2E: [TODO]
- Lint/format: [TODO]
- Seed/dados de teste: [TODO]

## 13) Runbook minimo
- Como subir local: [TODO]
- Como aplicar migrations: [TODO]
- Como fazer deploy: [TODO]
- Como reverter: [TODO rollback]
- Troubleshooting comum: [TODO]

---

# Checklist de Pre-Implantacao (para liberar teste)

## A) Produto e negocio
- [ ] Escopo do teste definido (quem acessa, por quanto tempo, o que precisa funcionar)
- [ ] Fluxos criticos validados (login, cadastro, acao principal, logout)
- [ ] Metricas de sucesso definidas (ex.: ativacao, conversao, tempo de tarefa)

## B) Dados e RLS
- [ ] RLS habilitado nas tabelas criticas
- [ ] Policies revisadas para roles (admin/recruiter/candidate)
- [ ] Dados seed para teste (tenants, users, roles, jobs, candidates)
- [ ] Backup baseline tirado antes do teste

## C) Auth e permissoes
- [ ] Login/registro funcionando em producao
- [ ] Claims JWT corretas (tenant/org)
- [ ] Rotas protegidas bloqueando acesso indevido
- [ ] Usuario admin validado

## D) API e endpoints
- [ ] Health check ok
- [ ] Endpoints criticos respondendo 200
- [ ] Paginacao e filtros ok
- [ ] Erros padronizados (4xx/5xx)

## E) Frontend
- [ ] Build sem erros
- [ ] Rotas carregam sem branco
- [ ] Integracao com API ok
- [ ] Fluxos principais testados no navegador alvo

## F) Observabilidade
- [ ] Logs ativos (web e API)
- [ ] Alertas basicos configurados
- [ ] Dashboard minimo (latencia, erros, uso)

## G) Seguranca
- [ ] Secrets apenas no backend
- [ ] CORS/CSP revisados
- [ ] Rate limit basico (se aplicavel)
- [ ] Teste de vazamento de dados entre tenants

## H) Deploy
- [ ] Variaveis de ambiente completas
- [ ] Deploy em producao concluido
- [ ] Rollback testado/planejado

# Estrutura de Multi-Tenant por Recrutador (link de convite)

## Objetivo
- Cada recrutador = um tenant (empresa)
- Candidatos pertencem somente ao tenant do recrutador
- Link publico de convite associa o candidato ao tenant correto

## Modelo de dados (sugestao)
- `tenants` (ou `companies`): id, name, created_at
- `tenant_users`: tenant_id, user_id, role
- `invite_links`: id, tenant_id, token, expires_at, max_uses, uses_count, created_at
- `candidates`: id, tenant_id, owner_user_id, email, name, created_at

## Fluxo do link
1) Recrutador cria um link de convite (token unico)
2) Candidato acessa `https://app.com/invite/<token>`
3) Frontend valida token -> recebe tenant_id
4) Cadastro do candidato grava tenant_id automaticamente
5) RLS garante que somente o tenant do recrutador veja esses candidatos

## RLS (ideia geral)
- `candidates`: SELECT/UPDATE apenas se `tenant_id` pertence ao usuario logado
- `invite_links`: SELECT publico por token (com regras) e INSERT apenas admin/recruiter

## Endpoints sugeridos
- `POST /api/v1/invite-links` (criar link)
- `GET /api/v1/invite-links/:token` (validar token)
- `POST /api/v1/candidates` (criar candidato associado ao tenant do token)
