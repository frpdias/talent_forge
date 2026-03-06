# Status de Conexões com Banco de Dados - TalentForge
**Data:** 23 de janeiro de 2026

## 📊 Visão Geral

| Categoria | Conectado | Simulado | Total | % Conectado |
|-----------|-----------|----------|-------|-------------|
| Admin Dashboard | 17 | 0 | 17 | 100% ✅ |
| Gestão de Usuários | 2 | 0 | 2 | 100% ✅ |
| Centro de Segurança | 10 | 0 | 10 | 100% ✅ |
| Empresas | 4 | 0 | 4 | 100% ✅ |
| Configurações | 0 | 5 | 5 | 0% |
| IAM (Tenants/Roles) | 5 | 0 | 5 | 100% ✅ |
| **TOTAL** | **38** | **5** | **43** | **88%** 🎉 |

---

## ✅ CONECTADO AO BANCO REAL

### 1. Admin Dashboard (`/admin`)
**Arquivo:** `apps/web/src/app/(admin)/admin/page.tsx`

✅ **100% Conectado:**
- Contagem de usuários (via `/api/admin/users`)
- Contagem de organizações (`organizations` table)
- Contagem de vagas (`jobs` table)
- Total de assessments (`assessments` table)
- Alarmes (críticos, avisos, informativos) - via `/api/admin/metrics/*`
- Conexões ativas do banco - via `get_active_connections()`
- Queries por segundo - agregação `audit_logs`
- Tempo médio de query - cálculo baseado em volume
- Storage usado - cálculo por contagem de registros
- Requisições/min da API - janela móvel `audit_logs`
- Taxa de erro - percentual `security_events`
- Latência média - cálculo percentis p50/p95/p99
- Sessões ativas - `auth.users.last_sign_in_at`
- Usuários online - filtros por tempo
- Cliques por minuto - agregação `user_activity`
- Visualizações de página - `user_activity.page_view`
- Total de ações 24h - soma `user_activity`

### 2. Gestão de Usuários (`/admin/users` e `/admin/create-user`)

✅ **100% Conectado:**
- Listagem de usuários: `GET /api/admin/users` (Supabase Auth via service role)
- Criação de usuários: `POST /api/admin/create-user` (Supabase Auth + `user_profiles`)
- Filtros por tipo (admin/recruiter/candidate) - dados reais do Auth

### 3. Cadastro de Empresas (`/admin/companies`)

✅ **100% Conectado:**
- Listagem: `GET /api/admin/companies` (tabela `companies`)
- Criação: `POST /api/admin/companies`
- Edição: `PATCH /api/admin/companies/[id]`
- Exclusão: `DELETE /api/admin/companies/[id]`

### 4. Centro de Segurança (`/admin/security`) ✨ NOVO - 100% CONECTADO
**Arquivo:** `apps/web/src/app/(admin)/admin/security/page.tsx`

✅ **100% Conectado:**
- **Score de Segurança:** Cálculo automático baseado em 10 verificações reais
- **Verificações Automáticas (10 checks):**
  1. RLS Habilitado - via `check_rls_status()`
  2. SQL Injection - Supabase client parametrizado
  3. JWT Válido - validação de sessão
  4. HTTPS - verificação de protocolo
  5. CORS Configurado - verificação de env vars
  6. Rate Limiting - verificação de eventos
  7. CSP Headers - configuração vercel.json
  8. Secrets Management - verificação de env vars
  9. XSS Protection - React + CSP
  10. Audit Logs - contagem de registros

- **Métricas de Ameaças (24h):**
  - Total de eventos - `security_events`
  - Eventos críticos - filter `severity='critical'`
  - Eventos de alta prioridade - filter `severity IN ('high', 'critical')`
  - Logins falhos - `audit_logs.action='login_failed'` ou `security_events.type='failed_login'`
  - Atividades suspeitas - `security_events.type='suspicious_activity'`
  - IPs bloqueados - `blocked_ips` WHERE `is_active=true`

- **Eventos em Tempo Real:**
  - Listagem dos últimos 10 eventos de `security_events`
  - Severidade (critical/high/medium/low)
  - Tipo de evento e detalhes
  - Timestamp formatado

- **Recomendações Dinâmicas:**
  - Geradas baseadas em checks que falharam
  - Priorização automática (high/medium/low)
  - Top 5 recomendações mais relevantes

**Endpoints implementados:**
- ✅ `/api/admin/security/checks` - Executa 10 verificações de segurança
- ✅ `/api/admin/security/score` - Calcula score 0-100 e recomendações
- ✅ `/api/admin/security/threats` - Métricas de ameaças 24h

**Funções SQL criadas:**
- ✅ `check_rls_status()` - Verifica RLS em tabelas críticas
- ✅ `list_rls_policies()` - Lista políticas RLS ativas
- ✅ `is_ip_blocked()` - Verifica se IP está bloqueado

**Migrations aplicadas:**
- ✅ `20260123_security_check_functions.sql` - Funções de verificação
- ✅ `20260123_blocked_ips_tracking.sql` - Tabela de IPs bloqueados

### 5. IAM - Tenants, Roles, Permissions

✅ **100% Conectado:**
- Tenants: tabela `tenants` (via API `/api/v1/tenants`)
- Roles: tabela `roles` (via API `/api/v1/roles`)
- Permissions: tabela `permissions` (via API `/api/v1/permissions`)
- Audit Logs: tabela `audit_logs` (via API `/api/v1/audit-logs`)
- Security Events: tabela `security_events` (via API `/api/v1/security-events`)

---

## ❌ PENDENTE DE CONEXÃO

### 1. Configurações do Sistema (`/admin/settings`)
**Arquivo:** `apps/web/src/app/(admin)/admin/settings/page.tsx`

❌ **Tudo Simulado:**
- Notificações (email, alertas, updates) - estado local
- Segurança (timeout, password expiry, MFA) - estado local
- Sistema (maintenance mode, debug mode, log level) - estado local
- Geral (site name, timezone, language) - estado local
- Email SMTP - estado local

**Necessário:**
- Criar tabela `system_settings` ou usar variáveis de ambiente
- Implementar API para salvar/carregar configurações

### 2. Dashboard - Métricas de Monitoramento
**Arquivo:** `apps/web/src/app/(admin)/admin/page.tsx`

❌ **Simulado (necessita conexão real):**
- **Alarmes:** Conectar com `security_events` (severity levels)
- **Banco de Dados:**
  - Conexões ativas: query em `pg_stat_activity`
  - Queries/seg: query em `pg_stat_statements`
  - Tempo médio: calcular de `pg_stat_statements`
  - Storage: query em `pg_database_size`
- **API Performance:**
  - Requisições/min: calcular de `audit_logs` com timestamp real
  - Taxa de erro: query em `audit_logs` com status errors
  - Latência: adicionar campo em `audit_logs` ou usar métricas Vercel
  - Uptime: calcular baseado em health checks
- **Usuários:**
  - Sessões ativas: query em auth.sessions
  - Online agora: query em auth.sessions com last_sign_in recente
  - Cliques/min: adicionar tracking de eventos
  - Total sessões: count de auth.sessions

### 3. Centro de Segurança - Checks e Score
**Arquivo:** `apps/web/src/app/(admin)/admin/security/page.tsx`

❌ **Simulado (necessita implementação):**
- **Score de Segurança:**
  - Implementar query que verifica configurações reais
  - Verificar RLS policies ativas
  - Validar configurações de Auth
  - Checar headers de segurança
- **Verificações Automáticas:**
  - RLS Enabled: query em `pg_policies`
  - JWT Válido: verificar configuração do Supabase
  - Rate Limiting: verificar configuração
  - CSP Headers: verificar response headers
- **Métricas de Ameaças:**
  - Logins falhos: query em `audit_logs` ou auth history
  - Atividades suspeitas: regras baseadas em `security_events`
  - IPs bloqueados: criar tabela `blocked_ips`

### 4. API Keys (`/admin/api-keys`)

⚠️ **Não implementado ainda**
- Criar interface para gestão de API keys
- Conectar com tabela `api_keys`

### 5. Roles & Permissions (`/admin/roles`)

⚠️ **Visualização apenas**
- Criar interface para edição de roles
- Adicionar/remover permissions de roles
- Conectar com `role_permissions`

### 6. Audit Logs (`/admin/audit-logs`)

⚠️ **Não implementado**
- Criar interface de listagem
- Filtros por: data, usuário, ação, recurso
- Conectar com tabela `audit_logs`

### 7. Security Events (`/admin/security-events`)

⚠️ **Não implementado**
- Criar interface de listagem
- Filtros por: severidade, tipo, data
- Conectar com tabela `security_events`

---

## 📅 AGENDA DE IMPLEMENTAÇÃO

### ✅ Sprint 1: Fundação de Métricas (3-5 dias) - CONCLUÍDO
**Prioridade: ALTA** 🔴 **STATUS: ✅ COMPLETO**

#### ✅ Dia 1-2: Dashboard - Métricas Reais de Banco
- [x] Criar endpoint `/api/admin/metrics/database`
  - Queries em `pg_stat_activity` para conexões ativas
  - `audit_logs` para queries/seg e tempo médio
  - Cálculo de storage por registros
- [x] Atualizar `apps/web/src/app/(admin)/admin/page.tsx`
  - Substituir dados simulados por chamadas à API
- [x] Testar e validar métricas

#### ✅ Dia 3: Dashboard - Métricas de API
- [x] Criar endpoint `/api/admin/metrics/api`
  - Calcular requisições/min de `audit_logs`
  - Taxa de erro de `security_events`
  - Latência com percentis p50/p95/p99
- [x] Atualizar dashboard com dados reais
- [x] Adicionar cache para performance

#### ✅ Dia 4-5: Dashboard - Métricas de Usuários
- [x] Criar endpoint `/api/admin/metrics/users`
  - Query em `auth.users` para sessões ativas
  - Filtrar online por `last_sign_in_at` recente
- [x] Criar tabela `user_activity` para tracking
  - Campos: user_id, action, resource, metadata, ip_address, user_agent, timestamp
- [x] Implementar RLS e cleanup automático
- [x] Atualizar dashboard com dados reais

---

### ✅ Sprint 2: Segurança Real (3-5 dias) - CONCLUÍDO
**Prioridade: ALTA** 🔴 **STATUS: ✅ COMPLETO**

#### ✅ Dia 1-2: Security Center - Score Automático
- [x] Criar endpoint `/api/admin/security/score`
  - Calcular score 0-100 baseado em verificações
  - Gerar recomendações dinâmicas
- [x] Criar endpoint `/api/admin/security/checks`
  - 10 verificações de segurança em paralelo
  - Status: pass/warning/fail
- [x] Implementar cálculo real de score
- [x] Atualizar `apps/web/src/app/(admin)/admin/security/page.tsx`

#### ✅ Dia 3: Security Center - Verificações Reais
- [x] Implementar queries para cada verificação:
  - RLS: `check_rls_status()` - verifica tabelas críticas
  - JWT: validar token do Supabase
  - HTTPS: verificar protocolo
  - Rate Limiting: verificar eventos
  - CSP: verificar configuração
  - SQL Injection: Supabase client
  - XSS: React + CSP
  - Secrets: verificar env vars
  - CORS: verificar configuração
  - Audit Logs: contar registros
- [x] Atualizar status baseado em dados reais

#### ✅ Dia 4-5: Security Center - Métricas de Ameaças
- [x] Criar endpoint `/api/admin/security/threats`
  - Total de eventos 24h
  - Eventos críticos e alta prioridade
  - Logins falhos
  - Atividades suspeitas
  - IPs bloqueados
- [x] Criar tabela `blocked_ips` (id, ip, reason, blocked_at, is_active)
- [x] Criar função `is_ip_blocked(ip)` para verificação
- [x] Implementar queries para logins falhos em `audit_logs`
- [x] Atualizar métricas com dados reais

**Migrations aplicadas:**
- ✅ `20260123_security_check_functions.sql` - Funções `check_rls_status()` e `list_rls_policies()`
- ✅ `20260123_blocked_ips_tracking.sql` - Tabela de IPs bloqueados com RLS

---

### Sprint 3: Configurações Persistentes (2-3 dias)
**Prioridade: MÉDIA** 🟡 **STATUS: ⏳ PRÓXIMO**

#### Dia 1: Tabela de Configurações
- [ ] Criar migration `20260124_system_settings.sql`
  ```sql
  CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    category TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
  );
  ```
- [ ] Popular com valores padrão
- [ ] Criar índices

#### Dia 2-3: API e Interface
- [ ] Criar endpoint `/api/admin/settings`
  - GET: buscar configurações
  - POST: salvar configurações
- [ ] Atualizar `apps/web/src/app/(admin)/admin/settings/page.tsx`
  - Carregar valores reais no mount
  - Salvar no banco ao clicar "Salvar"
- [ ] Implementar validações
- [ ] Testar persistência

---

### Sprint 4: Interfaces de Gestão (5-7 dias)
**Prioridade: MÉDIA** 🟡

#### Dia 1-2: Audit Logs Interface
- [ ] Criar `apps/web/src/app/(admin)/admin/audit-logs/page.tsx`
- [ ] Implementar listagem com paginação
- [ ] Adicionar filtros:
  - Data (range picker)
  - Usuário (dropdown)
  - Ação (dropdown)
  - Recurso (input)
- [ ] Adicionar exportação (CSV/JSON)

#### Dia 3-4: Security Events Interface
- [ ] Criar `apps/web/src/app/(admin)/admin/security-events/page.tsx`
- [ ] Implementar listagem com paginação
- [ ] Adicionar filtros:
  - Severidade (critical/high/medium/low)
  - Tipo (failed_login/suspicious_activity/etc)
  - Data (range picker)
- [ ] Adicionar ações: marcar como resolvido, bloquear IP

#### Dia 5-7: Roles & Permissions Management
- [ ] Atualizar `apps/web/src/app/(admin)/admin/roles/page.tsx`
- [ ] Implementar edição de roles
- [ ] Criar interface para adicionar/remover permissions
- [ ] Implementar drag-and-drop para permissions
- [ ] Criar endpoint `/api/admin/roles/[id]/permissions`
- [ ] Testar atribuição de permissions

---

### Sprint 5: API Keys & Avançado (3-5 dias)
**Prioridade: BAIXA** 🟢

#### Dia 1-2: API Keys Interface
- [ ] Criar `apps/web/src/app/(admin)/admin/api-keys/page.tsx`
- [ ] Implementar listagem de keys
- [ ] Criar formulário para nova key:
  - Nome
  - Scopes (multi-select)
  - Expiração
- [ ] Gerar key hash (bcrypt)
- [ ] Mostrar key apenas uma vez na criação
- [ ] Implementar revogação

#### Dia 3-5: Features Avançadas
- [ ] Implementar Rate Limiting real (via middleware)
- [ ] Adicionar CSP Headers no Next.js
- [ ] Criar endpoint `/api/health` para health checks
- [ ] Implementar alertas automáticos (email/slack)
- [ ] Criar dashboard de SLA/uptime

---

## 🎯 Priorização por Impacto

### Crítico (Fazer Primeiro)
1. **Dashboard - Métricas de Banco** → Visibilidade de performance
2. **Security Center - Score Real** → Awareness de segurança
3. **Configurações Persistentes** → UX melhorada

### Importante (Fazer em Seguida)
4. **Dashboard - Métricas de API** → Monitoramento de aplicação
5. **Security Center - Ameaças Reais** → Proteção ativa
6. **Audit Logs Interface** → Compliance e rastreabilidade

### Desejável (Fazer Quando Possível)
7. **Dashboard - Métricas de Usuários** → Analytics de uso
8. **Security Events Interface** → Gestão de incidentes
9. **Roles Management** → Flexibilidade de permissões
10. **API Keys** → Integrações externas

---

## 📋 Checklist de Validação

Após cada conexão, validar:
- [ ] Query funciona corretamente
- [ ] Performance aceitável (<500ms)
- [ ] Erros tratados adequadamente
- [ ] Loading states implementados
- [ ] Cache implementado (onde aplicável)
- [ ] Documentação atualizada
- [ ] Testes manuais passando

---

## 🔧 Queries SQL Necessárias

### Métricas de Banco
```sql
-- Conexões ativas
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Queries por segundo (via pg_stat_statements extension)
SELECT calls, mean_exec_time, query 
FROM pg_stat_statements 
ORDER BY calls DESC 
LIMIT 10;

-- Storage usado
SELECT pg_size_pretty(pg_database_size('postgres'));
```

### Métricas de Segurança
```sql
-- RLS Policies ativas
SELECT count(*) FROM pg_policies;

-- Logins falhos (últimas 24h)
SELECT count(*) 
FROM audit_logs 
WHERE action = 'login_failed' 
AND created_at > NOW() - INTERVAL '24 hours';

-- Atividades suspeitas
SELECT count(*) 
FROM security_events 
WHERE type = 'suspicious_activity' 
AND created_at > NOW() - INTERVAL '24 hours';
```

### Métricas de Usuários
```sql
-- Sessões ativas
SELECT count(*) FROM auth.sessions WHERE expires_at > NOW();

-- Usuários online (últimos 5 min)
SELECT count(DISTINCT user_id) 
FROM auth.sessions 
WHERE updated_at > NOW() - INTERVAL '5 minutes';
```

---

## 📊 Métricas de Progresso

### Objetivo: 100% de Conexão Real
- **Atual:** 47% (18/38 conectados)
- **Sprint 1:** +33% → 80%
- **Sprint 2:** +10% → 90%
- **Sprint 3:** +5% → 95%
- **Sprint 4:** +3% → 98%
- **Sprint 5:** +2% → 100%

**Prazo estimado total:** 16-25 dias úteis (~1 mês)

---

## 🚀 Próximos Passos Imediatos

1. **Revisar e aprovar agenda**
2. **Criar branch:** `feature/real-db-connections`
3. **Começar Sprint 1, Dia 1:** Métricas de banco
4. **Configurar ambiente de testes**
5. **Documentar queries e endpoints**

---

**Última atualização:** 23 de janeiro de 2026
**Responsável:** Time de Desenvolvimento TalentForge
