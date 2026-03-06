# 🔧 Instruções para Aplicar Migrations da Sprint 2

**Data:** 23 de janeiro de 2026  
**Sprint:** 2 - Centro de Segurança  
**Status:** Pronto para aplicação

---

## 📋 Migrations a Aplicar

### 1. `20260123_security_check_functions.sql`
**Prioridade:** ALTA  
**Descrição:** Funções para verificação de segurança

**O que cria:**
- ✅ `check_rls_status()` - Verifica RLS em tabelas críticas
- ✅ `list_rls_policies()` - Lista políticas RLS ativas

**Dependências:** Nenhuma

### 2. `20260123_blocked_ips_tracking.sql`
**Prioridade:** ALTA  
**Descrição:** Tabela para tracking de IPs bloqueados

**O que cria:**
- ✅ Tabela `blocked_ips` com campos completos
- ✅ Índices otimizados
- ✅ RLS Policies (admin-only)
- ✅ Função `is_ip_blocked(ip)` para verificação

**Dependências:** Requer `auth.users` (já existe)

---

## 🚀 Como Aplicar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **+ New query**
5. Cole o conteúdo de `20260123_security_check_functions.sql`
6. Clique em **Run** (ou pressione `Ctrl+Enter`)
7. Repita os passos 4-6 para `20260123_blocked_ips_tracking.sql`

### Opção 2: Via CLI do Supabase

```bash
# Navegar até a raiz do projeto
cd /Users/fernandodias/Desktop/PROJETO_TALENT_FORGE

# Aplicar migrations
supabase db push

# Ou aplicar manualmente
supabase db execute --file supabase/migrations/20260123_security_check_functions.sql
supabase db execute --file supabase/migrations/20260123_blocked_ips_tracking.sql
```

---

## ✅ Verificação Pós-Aplicação

### 1. Verificar Funções Criadas

```sql
-- Listar funções criadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('check_rls_status', 'list_rls_policies', 'is_ip_blocked');

-- Deve retornar 3 linhas
```

### 2. Testar Função de RLS

```sql
-- Testar check_rls_status
SELECT check_rls_status();

-- Deve retornar JSON similar a:
-- {
--   "total_tables": 14,
--   "tables_with_rls": 14,
--   "percentage": 100.00,
--   "status": "pass",
--   "message": "RLS habilitado em todas as tabelas críticas"
-- }
```

### 3. Verificar Tabela `blocked_ips`

```sql
-- Verificar tabela criada
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'blocked_ips'
ORDER BY ordinal_position;

-- Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'blocked_ips';

-- rowsecurity deve ser 'true'
```

### 4. Verificar Policies RLS

```sql
-- Listar policies da tabela blocked_ips
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'blocked_ips';

-- Deve retornar 4 policies:
-- 1. Admins can view blocked IPs
-- 2. Admins can insert blocked IPs
-- 3. Admins can update blocked IPs
-- 4. Service role can manage blocked IPs
```

### 5. Testar Função `is_ip_blocked()`

```sql
-- Inserir IP de teste
INSERT INTO blocked_ips (ip_address, reason, is_active)
VALUES ('192.168.1.100', 'Teste', true);

-- Testar função
SELECT is_ip_blocked('192.168.1.100'::INET);
-- Deve retornar: true

SELECT is_ip_blocked('10.0.0.1'::INET);
-- Deve retornar: false

-- Limpar teste
DELETE FROM blocked_ips WHERE ip_address = '192.168.1.100';
```

---

## 🔒 Permissões Verificadas

### Funções SQL
- ✅ `check_rls_status()` - GRANT EXECUTE TO authenticated
- ✅ `list_rls_policies()` - GRANT EXECUTE TO authenticated
- ✅ `is_ip_blocked()` - SECURITY DEFINER (público pode chamar)

### Tabela `blocked_ips`
- ✅ SELECT - Apenas admins
- ✅ INSERT - Apenas admins
- ✅ UPDATE - Apenas admins
- ✅ DELETE - Não permitido (usar UPDATE para desativar)
- ✅ ALL - Service role

---

## 🧪 Testar Endpoints da Aplicação

Após aplicar as migrations, teste os endpoints:

### 1. Verificações de Segurança
```bash
curl -X GET \
  http://localhost:3000/api/admin/security/checks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Resposta esperada:**
```json
{
  "success": true,
  "checks": [
    {
      "id": "rls_enabled",
      "name": "RLS Habilitado",
      "category": "Database",
      "status": "pass",
      "message": "Row Level Security habilitado em todas as tabelas"
    },
    // ... 9 outras verificações
  ]
}
```

### 2. Score de Segurança
```bash
curl -X GET \
  http://localhost:3000/api/admin/security/score \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Resposta esperada:**
```json
{
  "success": true,
  "score": {
    "value": 85,
    "status": "pass",
    "breakdown": {
      "pass": 8,
      "warning": 2,
      "fail": 0
    },
    "recommendations": [...]
  }
}
```

### 3. Métricas de Ameaças
```bash
curl -X GET \
  http://localhost:3000/api/admin/security/threats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Resposta esperada:**
```json
{
  "success": true,
  "metrics": {
    "totalEvents": 0,
    "criticalEvents": 0,
    "highPriorityEvents": 0,
    "failedLogins": 0,
    "suspiciousActivity": 0,
    "blockedIPs": 0
  }
}
```

---

## 🎯 Acessar Interface

1. Faça login como **admin** na aplicação
2. Navegue para [http://localhost:3000/admin/security](http://localhost:3000/admin/security)
3. Verifique se todos os dados estão carregando:
   - ✅ Score de Segurança (0-100)
   - ✅ Verificações Automáticas (10 checks)
   - ✅ Métricas de Ameaças (6 métricas)
   - ✅ Eventos Recentes (lista)
   - ✅ Recomendações (dinâmicas)

---

## 📊 Monitoramento

### Dashboard Admin
A página `/admin` agora mostra:
- ✅ Alarmes em tempo real
- ✅ Conexões ativas do banco (via `get_active_connections()`)
- ✅ Todas métricas conectadas ao banco real

### Centro de Segurança
A página `/admin/security` agora mostra:
- ✅ Score calculado automaticamente
- ✅ Verificações executadas em tempo real
- ✅ Métricas de ameaças das últimas 24h
- ✅ IPs bloqueados ativos
- ✅ Recomendações inteligentes

---

## ⚠️ Troubleshooting

### Erro: "function check_rls_status() does not exist"
**Solução:** Re-aplicar migration `20260123_security_check_functions.sql`

### Erro: "relation blocked_ips does not exist"
**Solução:** Re-aplicar migration `20260123_blocked_ips_tracking.sql`

### Erro: "permission denied for table blocked_ips"
**Solução:** Verificar se RLS policies foram criadas corretamente

### Endpoint retorna "error": "Não autenticado"
**Solução:** Certifique-se de estar logado como admin

### Score sempre retorna 70
**Solução:** Verificar se endpoint `/api/admin/security/checks` está funcionando

---

## 📝 Rollback (Se Necessário)

Se precisar desfazer as migrations:

```sql
-- Remover funções
DROP FUNCTION IF EXISTS check_rls_status();
DROP FUNCTION IF EXISTS list_rls_policies();
DROP FUNCTION IF EXISTS is_ip_blocked(INET);

-- Remover tabela
DROP TABLE IF EXISTS blocked_ips CASCADE;
```

---

## ✅ Checklist Final

Antes de considerar a Sprint 2 aplicada em produção:

- [ ] Migrations aplicadas no Supabase
- [ ] Funções verificadas e testadas
- [ ] Tabela `blocked_ips` criada com RLS
- [ ] Endpoint `/api/admin/security/checks` retornando 10 verificações
- [ ] Endpoint `/api/admin/security/score` calculando score dinâmico
- [ ] Endpoint `/api/admin/security/threats` retornando métricas 24h
- [ ] Página `/admin/security` carregando dados reais
- [ ] Todos os testes manuais passaram
- [ ] Documentação atualizada

---

**Última atualização:** 23 de janeiro de 2026  
**Versão das Migrations:** 20260123  
**Status:** ✅ Pronto para produção
