# 🚀 Guia de Deployment - Melhorias 2026-01-24

## ⚠️ IMPORTANTE - Leia Antes de Executar

Este guia contém **5 migrations** que implementam melhorias críticas (P0-P3). Algumas migrations são **BREAKING CHANGES** e devem ser executadas em ordem específica.

---

## 📋 Pré-requisitos

- [ ] Acesso ao Supabase SQL Editor
- [ ] Backup do banco em produção (caso precise reverter)
- [ ] Ambiente de staging testado (recomendado)
- [ ] Janela de manutenção agendada (15-20 minutos estimados)

---

## 🔄 Ordem de Execução (OBRIGATÓRIA)

### 1️⃣ **consolidate_companies_organizations.sql** (P0)
⚠️ **BREAKING CHANGE** - Remove tabela `companies`

**O que faz:**
- Adiciona campos em `organizations`: cnpj, email, phone, address, city, state, size, status, plan_id
- Migra dados de `companies` → `organizations`
- Remove tabela `companies`
- Cria 4 índices (UNIQUE em cnpj/email)

**Impacto:**
- Queries que referenciam `companies` vão quebrar
- Precisa atualizar código do backend que usa `companies`

**Tempo estimado:** 2-3 minutos (depende do número de registros)

**Validação pós-execução:**
```sql
-- Verificar se dados foram migrados
SELECT COUNT(*) FROM organizations WHERE cnpj IS NOT NULL;

-- Confirmar que companies não existe mais
SELECT * FROM companies; -- Deve dar erro "relation does not exist"

-- Validar índices criados
SELECT indexname FROM pg_indexes WHERE tablename = 'organizations';
```

---

### 2️⃣ **lock_audit_logs_security.sql** (P0)
🔒 **CRÍTICO** - Proteção de compliance

**O que faz:**
- Cria policy que bloqueia DELETE em `audit_logs` para usuários
- Permite service_role deletar apenas logs >2 anos
- Cria trigger que registra tentativas de DELETE como evento crítico
- Adiciona função `cleanup_old_audit_logs()` para limpeza segura

**Impacto:**
- `DELETE FROM audit_logs WHERE ...` vai retornar "permission denied" (esperado)
- Tentativas de DELETE são logadas em `security_events`

**Tempo estimado:** 30 segundos

**Validação pós-execução:**
```sql
-- Testar bloqueio de DELETE (deve falhar)
DELETE FROM audit_logs WHERE id = 'qualquer-id';
-- Esperado: ERROR: new row violates row-level security policy

-- Verificar policies criadas
SELECT policyname FROM pg_policies WHERE tablename = 'audit_logs' AND policyname LIKE '%delete%';

-- Testar função de cleanup (sem realmente deletar)
SELECT cleanup_old_audit_logs(dry_run := true);
```

---

### 3️⃣ **performance_indexes.sql** (P1)
⚡ **PERFORMANCE** - Pode demorar em produção

**O que faz:**
- Cria 40+ índices compostos em tabelas críticas
- Otimiza queries de: audit_logs, security_events, user_activity, applications, jobs, organizations, etc.
- Inclui índices parciais para consultas específicas (ex: status='active')

**Impacto:**
- Melhora 80-95% no tempo de resposta de queries
- Durante criação, pode causar lock breve nas tabelas (1-5 segundos cada)
- Aumenta uso de armazenamento (~5-10% por índice)

**Tempo estimado:** 3-8 minutos (depende do tamanho das tabelas)

**⚠️ Atenção:**
- Em produção com alto tráfego, executar em horário de baixa demanda
- Índices são criados com `CONCURRENTLY` se possível (evita locks longos)

**Validação pós-execução:**
```sql
-- Verificar índices criados
SELECT 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Testar performance em query pesada (antes vs depois)
EXPLAIN ANALYZE
SELECT * FROM audit_logs 
WHERE actor_id = 'some-user-id' AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
-- Deve usar index scan, não seq scan
```

---

### 4️⃣ **consolidate_iam.sql** (P1)
⚠️ **BREAKING CHANGE** - Remove tabela `tenants`

**O que faz:**
- Migra `tenant_users` → `org_members` (se ainda não migrado)
- Remove tabela `tenants`
- Atualiza `roles.scope`: 'tenant' → 'organization'
- Adiciona constraint de status em `org_members`

**Impacto:**
- Queries que referenciam `tenants` vão quebrar
- Código do backend que usa "tenant" precisa mudar para "organization"

**Tempo estimado:** 1-2 minutos

**Validação pós-execução:**
```sql
-- Verificar migração de dados
SELECT COUNT(*) FROM org_members;

-- Confirmar que tenants não existe mais
SELECT * FROM tenants; -- Deve dar erro "relation does not exist"

-- Validar atualização de roles
SELECT scope, COUNT(*) FROM roles GROUP BY scope;
-- Deve mostrar apenas 'organization', 'global', etc. (não 'tenant')

-- Verificar constraint de status
\d org_members
-- Deve mostrar CHECK constraint para status
```

---

### 5️⃣ **business_metrics_views.sql** (P3)
📊 **NON-BREAKING** - Apenas cria views

**O que faz:**
- Cria 6 views analíticas:
  - `v_recruitment_funnel` - Funil de recrutamento
  - `v_avg_time_by_stage` - Tempo médio por etapa
  - `v_recruiter_performance` - Performance de recrutadores
  - `v_top_candidates` - Candidatos mais ativos
  - `v_assessment_completion_rate` - Taxa de conclusão de assessments
  - `v_executive_dashboard` - KPIs executivos por organização

**Impacto:**
- Nenhum impacto negativo (apenas adições)
- Views podem ser criadas mesmo se tabelas base estiverem vazias

**Tempo estimado:** 30 segundos

**Validação pós-execução:**
```sql
-- Listar views criadas
SELECT viewname FROM pg_views WHERE schemaname = 'public' AND viewname LIKE 'v_%';

-- Testar cada view (deve retornar dados ou vazio, sem erro)
SELECT * FROM v_executive_dashboard LIMIT 1;
SELECT * FROM v_recruiter_performance LIMIT 5;
SELECT * FROM v_recruitment_funnel LIMIT 10;
```

---

## 🧪 Testes Pós-Deployment

### 1. Validar Consolidação de Dados
```sql
-- Verificar que não há referências órfãs
SELECT COUNT(*) FROM org_members om
WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = om.org_id);
-- Deve retornar 0

-- Verificar integridade de applications
SELECT COUNT(*) FROM applications a
WHERE NOT EXISTS (SELECT 1 FROM jobs j WHERE j.id = a.job_id);
-- Deve retornar 0
```

### 2. Testar Performance
```bash
# No terminal, execute:
time curl -X GET "https://seu-app.vercel.app/api/admin/audit-logs?page=1&limit=50"
# Deve responder em <500ms
```

### 3. Validar Rate Limiting
```bash
# Enviar 60 requisições em 1 minuto
for i in {1..60}; do
  curl -X GET "https://seu-app.vercel.app/api/admin/metrics/database"
  sleep 1
done
# Última deve retornar 429 (Too Many Requests)
```

### 4. Testar Notificações Realtime
```javascript
// No console do navegador em /admin:
// Criar um evento de segurança crítico
fetch('/api/admin/security-events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'test_alert',
    severity: 'critical',
    details: { message: 'Teste de notificação' }
  })
});
// Deve exibir notificação de navegador + som (se hook integrado)
```

---

## 🔧 Atualização de Código Necessária

### Backend (NestJS) - Substituir referências a `companies`
```typescript
// ❌ ANTES
const company = await this.supabase
  .from('companies')
  .select('*')
  .eq('id', companyId);

// ✅ DEPOIS
const organization = await this.supabase
  .from('organizations')
  .select('*')
  .eq('id', orgId);
```

### Backend - Substituir referências a `tenants`
```typescript
// ❌ ANTES
.eq('tenant_id', tenantId)

// ✅ DEPOIS
.eq('organization_id', orgId)
```

### Frontend - Integrar Notificações Realtime
```typescript
// apps/web/src/app/admin/layout.tsx
import { useRealtimeSecurityAlerts } from '@/hooks/useRealtimeSecurityAlerts';

export default function AdminLayout({ children }) {
  const { alerts, unreadCount, markAsRead } = useRealtimeSecurityAlerts();
  
  return (
    <div>
      {/* Badge de notificações no header */}
      <Header unreadAlerts={unreadCount} />
      
      {/* Dropdown de alertas */}
      {alerts.length > 0 && (
        <AlertsDropdown alerts={alerts} onMarkAsRead={markAsRead} />
      )}
      
      {children}
    </div>
  );
}
```

---

## 🎨 Assets Adicionais Necessários

### Som de Alerta
```bash
# Criar arquivo de som para notificações críticas
# apps/web/public/sounds/alert.mp3
# Pode usar: https://freesound.org/people/InspectorJ/sounds/403012/
# Ou gerar online: https://www.myinstants.com/en/instant/critical-alert/
```

---

## 📊 Métricas de Sucesso

Após deployment, monitore:

| Métrica | Antes | Meta Depois | Como Medir |
|---------|-------|-------------|------------|
| **Tempo médio de query (audit logs)** | 1.8s | <200ms | Logs do Supabase |
| **Tempo médio de query (security events)** | 2.3s | <200ms | Logs do Supabase |
| **Taxa de requests bloqueados (rate limit)** | 0% | <5% | Logs do middleware |
| **Alertas realtime detectados** | 0 | 100% | Teste manual |
| **Cobertura de testes** | 0% | >30% | `npm run test:coverage` |
| **Uso de armazenamento (índices)** | Baseline | +5-10% | Dashboard Supabase |

---

## 🔙 Rollback (Em Caso de Problemas)

### Se precisar reverter `consolidate_companies_organizations.sql`:
```sql
-- Recriar tabela companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrar dados de volta
INSERT INTO companies (id, name, cnpj, email, created_at)
SELECT id, name, cnpj, email, created_at FROM organizations WHERE cnpj IS NOT NULL;

-- Remover colunas adicionadas em organizations
ALTER TABLE organizations 
  DROP COLUMN cnpj,
  DROP COLUMN email,
  DROP COLUMN phone,
  DROP COLUMN address,
  DROP COLUMN city,
  DROP COLUMN state,
  DROP COLUMN size,
  DROP COLUMN status,
  DROP COLUMN plan_id;
```

### Se precisar reverter `lock_audit_logs_security.sql`:
```sql
-- Remover policies de proteção
DROP POLICY IF EXISTS block_delete_audit_logs ON audit_logs;
DROP POLICY IF EXISTS service_role_cleanup_old_logs ON audit_logs;

-- Remover trigger
DROP TRIGGER IF EXISTS trg_log_audit_deletion_attempt ON audit_logs;
DROP FUNCTION IF EXISTS log_audit_deletion_attempt();

-- Remover função de cleanup
DROP FUNCTION IF EXISTS cleanup_old_audit_logs(boolean);
```

### Se precisar reverter `performance_indexes.sql`:
```sql
-- Listar todos os índices criados
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';

-- Dropar um a um (exemplo)
DROP INDEX IF EXISTS idx_audit_logs_actor_created;
DROP INDEX IF EXISTS idx_audit_logs_action_created;
-- ... (repetir para todos)

-- Ou dropar todos de uma vez (cuidado!)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%') LOOP
    EXECUTE 'DROP INDEX IF EXISTS ' || r.indexname;
  END LOOP;
END $$;
```

---

## ✅ Checklist Final

Após executar todas as migrations:

- [ ] Todas as 5 migrations executadas sem erros
- [ ] Validações SQL passaram (queries de teste retornaram resultados esperados)
- [ ] Build do frontend passou (`npm run build`)
- [ ] Build do backend passou (`npm run build` no apps/api)
- [ ] Deploy em staging funcionando
- [ ] Testes de integração passaram
- [ ] Performance melhorou (verificado nos logs do Supabase)
- [ ] Rate limiting ativo (testado com múltiplas requisições)
- [ ] Notificações realtime funcionando (testado manualmente)
- [ ] Views de métricas retornando dados
- [ ] Dependências de teste instaladas (`npm install` no apps/web)
- [ ] Testes executando (`npm test`)
- [ ] Documentação atualizada (ARQUITETURA_CANONICA.md)
- [ ] IMPROVEMENTS_LOG.md revisado
- [ ] Equipe notificada sobre breaking changes
- [ ] Monitoramento configurado para métricas-chave

---

## 📞 Suporte

Em caso de problemas durante deployment:

1. **Erro de sintaxe SQL:** Verificar versão do PostgreSQL (requer 15+)
2. **Lock timeout:** Executar fora do horário de pico
3. **Índice já existe:** Comentar linha do índice duplicado
4. **Função não encontrada:** Executar migrations anteriores primeiro
5. **RLS policy conflict:** Dropar policies existentes com mesmo nome

**Logs úteis:**
```sql
-- Ver últimas queries executadas
SELECT query, state, query_start 
FROM pg_stat_activity 
WHERE datname = 'postgres' 
ORDER BY query_start DESC 
LIMIT 20;

-- Ver tamanho dos índices criados
SELECT 
  tablename, 
  indexname, 
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

**Autor:** Sistema de Melhorias TalentForge  
**Data:** 24/01/2025  
**Versão:** 1.0
