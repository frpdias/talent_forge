# 🚀 Instruções de Deploy - TalentForge

## ✅ Status de Preparação

- ✅ Build verificado e funcional
- ✅ Código limpo (sem arquivos de backup)
- ✅ Commit realizado: `94f5d81`
- ✅ Push para GitHub concluído
- ✅ 100% de conexão com banco de dados real

---

## 📋 Pré-requisitos

### 1. Migrations do Supabase

**Aplicar as seguintes migrations no Supabase SQL Editor (em ordem):**

```sql
-- 1. Funções de métricas
supabase/migrations/20260123_metrics_functions.sql

-- 2. Tracking de atividades
supabase/migrations/20260123_user_activity_tracking.sql

-- 3. Funções de verificação de segurança
supabase/migrations/20260123_security_check_functions.sql

-- 4. IPs bloqueados
supabase/migrations/20260123_blocked_ips_tracking.sql

-- 5. Sistema IAM
supabase/migrations/20260122_iam_core.sql
supabase/migrations/20260123_iam_seed_roles_permissions.sql

-- 6. Tabela de empresas
supabase/migrations/20260123_create_companies_table.sql

-- 7. Configurações do sistema
supabase/migrations/20260123_system_settings.sql
```

**Como aplicar:**
1. Acesse https://fjudsjzfnysaztcwlwgm.supabase.co
2. Vá em `SQL Editor`
3. Cole o conteúdo de cada migration na ordem acima
4. Execute cada uma (botão "Run")

### 2. Variáveis de Ambiente na Vercel

**Configurar as seguintes variáveis no painel da Vercel:**

#### Para `apps/web`:
```bash
NEXT_PUBLIC_API_URL=https://seu-api-url.vercel.app/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://fjudsjzfnysaztcwlwgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Para `apps/api`:
```bash
SUPABASE_URL=https://fjudsjzfnysaztcwlwgm.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service role)
DATABASE_URL=postgresql://postgres:senha@fjudsjzfnysaztcwlwgm.supabase.co:5432/postgres
JWT_SECRET=seu-jwt-secret-aqui
```

---

## 🚀 Deploy via Vercel CLI

### Opção 1: Deploy Automático (Recomendado)

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Fazer login
vercel login

# Deploy do frontend (web)
cd apps/web
vercel --prod

# Deploy do backend (api)
cd ../api
vercel --prod
```

### Opção 2: Deploy via GitHub Integration

1. Acesse https://vercel.com/dashboard
2. Clique em "Import Project"
3. Conecte o repositório GitHub: `frpdias/talent_forge`
4. Configure os projetos:

**Frontend (apps/web):**
- Framework: Next.js
- Root Directory: `apps/web`
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

**Backend (apps/api):**
- Framework: NestJS
- Root Directory: `apps/api`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

5. Adicione as variáveis de ambiente (ver seção anterior)
6. Clique em "Deploy"

---

## 🔍 Verificação Pós-Deploy

### 1. Testar Endpoints da API

```bash
# Health check
curl https://seu-api-url.vercel.app/api/v1/health

# Métricas (requer autenticação)
curl https://seu-api-url.vercel.app/api/v1/admin/metrics/database \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 2. Testar Frontend

Acesse as seguintes páginas e verifique se carregam sem erros:

- ✅ **Dashboard Admin:** https://seu-site.vercel.app/admin
  - Verificar métricas em tempo real
  - Verificar atualização automática a cada 5s

- ✅ **Security Center:** https://seu-site.vercel.app/admin/security
  - Verificar score de segurança
  - Verificar eventos de segurança

- ✅ **Configurações:** https://seu-site.vercel.app/admin/settings
  - Testar salvar configuração
  - Verificar persistência no banco

- ✅ **Audit Logs:** https://seu-site.vercel.app/admin/audit-logs
  - Verificar listagem de logs
  - Testar filtros e paginação
  - Testar exportação CSV

- ✅ **Security Events:** https://seu-site.vercel.app/admin/security-events
  - Verificar cards de estatísticas
  - Testar filtros por severidade
  - Verificar detalhes JSON

### 3. Verificar Logs do Vercel

```bash
# Ver logs em tempo real
vercel logs seu-deployment-url --follow

# Ver últimos 100 logs
vercel logs seu-deployment-url -n 100
```

### 4. Verificar Supabase

Execute no SQL Editor:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'audit_logs', 
    'security_events', 
    'system_settings',
    'user_activity',
    'blocked_ips',
    'companies'
  );

-- Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('audit_logs', 'security_events', 'system_settings');

-- Verificar configurações inseridas
SELECT key, category, description 
FROM system_settings 
ORDER BY category, key;
```

---

## ⚠️ Troubleshooting

### Erro: "Cannot find module for page"

**Solução:**
```bash
cd apps/web
rm -rf .next
npm run build
vercel --prod
```

### Erro: "RLS policy violation"

**Causa:** Policies não aplicadas ou usuário sem permissão admin

**Solução:**
1. Verificar se todas as migrations foram aplicadas
2. Verificar se o usuário tem `user_type = 'admin'` na tabela `user_profiles`

```sql
-- Tornar usuário admin
UPDATE user_profiles 
SET user_type = 'admin' 
WHERE email = 'seu-email@example.com';
```

### Erro: "Function does not exist"

**Causa:** Migrations de funções não foram aplicadas

**Solução:**
1. Aplicar migrations na ordem correta (ver seção Pré-requisitos)
2. Verificar se funções existem:

```sql
-- Listar funções criadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_active_connections',
    'check_rls_status',
    'list_rls_policies',
    'is_ip_blocked',
    'get_setting',
    'set_setting'
  );
```

### Erro de Build no Vercel

**Solução:**
1. Verificar Node.js version (usar 18.x ou 20.x)
2. Verificar se todas as dependências estão no package.json
3. Verificar logs de build no Vercel Dashboard

---

## 📊 Métricas de Deploy

### Performance Esperada

- **Time to First Byte (TTFB):** < 200ms
- **First Contentful Paint (FCP):** < 1.8s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Cumulative Layout Shift (CLS):** < 0.1
- **Total Blocking Time (TBT):** < 200ms

### Monitoramento

1. **Vercel Analytics:** Habilitado automaticamente
2. **Supabase Logs:** Acessíveis via dashboard
3. **Custom Logs:** Via `audit_logs` e `user_activity` tables

---

## 🔐 Segurança Pós-Deploy

### Checklist de Segurança

- [ ] HTTPS habilitado (Vercel faz automaticamente)
- [ ] CORS configurado corretamente
- [ ] RLS habilitado em todas as tabelas críticas
- [ ] Service Role Key não exposta no frontend
- [ ] Secrets não commitados no Git
- [ ] Rate limiting configurado (opcional)
- [ ] WAF configurado (opcional)

### Recomendações

1. **Habilitar MFA** para conta Vercel e Supabase
2. **Configurar alertas** de erros via Vercel Integration
3. **Backup automático** do Supabase (já habilitado)
4. **Monitorar métricas** semanalmente via `/admin`
5. **Revisar audit logs** mensalmente

---

## 📝 Comandos Úteis

```bash
# Ver status dos deployments
vercel ls

# Rollback para deployment anterior
vercel rollback

# Ver domínios configurados
vercel domains ls

# Adicionar domínio customizado
vercel domains add seu-dominio.com

# Ver variáveis de ambiente
vercel env ls

# Adicionar variável de ambiente
vercel env add NOME_VARIAVEL production

# Remover deployment antigo
vercel rm deployment-url
```

---

## 🎉 Deploy Completo!

Após seguir todos os passos, sua aplicação estará rodando em produção com:

- ✅ 100% de conexão com banco de dados real
- ✅ Sistema de auditoria completo
- ✅ Monitoramento de segurança em tempo real
- ✅ Configurações persistentes
- ✅ Interfaces administrativas completas
- ✅ RLS e políticas de segurança aplicadas
- ✅ Build otimizado e validado

**URLs Finais:**
- Frontend: https://talent-forge-web.vercel.app (ou seu domínio)
- API: https://talent-forge-api.vercel.app (ou seu domínio)

---

**Gerado em:** 23 de janeiro de 2026  
**Projeto:** TalentForge Platform  
**Versão:** 2.0.0  
**Commit:** 94f5d81
