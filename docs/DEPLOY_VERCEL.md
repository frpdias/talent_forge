# 🚀 Deploy no Vercel - TalentForge

> **Última atualização**: Janeiro 2026

## 📋 Checklist Pré-Deploy

### Verificações Obrigatórias

- [ ] Build local funciona sem erros (`npm run build`)
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Banco de dados Supabase configurado e acessível
- [ ] Migrations do Supabase aplicadas
- [ ] Dados de seed inseridos (CBO, etc.)

### Status do Build Atual

```
✅ Build: SUCESSO
✅ Rotas: 36 páginas
✅ Middleware: Funcionando
✅ Tamanho total: ~150kB First Load JS
```

---

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com) com projeto criado
- Repositório Git (GitHub, GitLab ou Bitbucket)

---

## 🌐 Deploy do Frontend (Web) - RECOMENDADO PRIMEIRO

### 1. Criar Novo Projeto no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Selecione o repositório do projeto
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 2. Configurar Variáveis de Ambiente

No painel do Vercel, vá em **Settings** > **Environment Variables** e adicione:

```bash
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://fjudsjzfnysaztcwlwgm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-public-anon-key

# Aplicação
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
NEXT_PUBLIC_APP_NAME=Talent Forge
```

### 3. Deploy

Clique em **Deploy** e aguarde. O frontend estará disponível em:
```
https://seu-projeto.vercel.app
```

---

## 🔧 Deploy da API (Backend) - OPCIONAL

> ⚠️ **NOTA**: O frontend já se conecta diretamente ao Supabase, então a API NestJS é opcional para funcionalidades básicas.

### 1. Criar Novo Projeto no Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Selecione o repositório do projeto
3. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `apps/api` ⚠️ **CRÍTICO**
   - **Build Command**: deixe vazio (usa do vercel.json)
   - **Output Directory**: deixe vazio
   - **Install Command**: deixe vazio

### 2. Configurar Variáveis de Ambiente

No painel do Vercel, vá em **Settings** > **Environment Variables** e adicione:

```bash
# Supabase (obrigatório)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
SUPABASE_JWT_SECRET=seu-jwt-secret

# Frontend URL (obrigatório para CORS)
FRONTEND_URL=https://seu-app.vercel.app

# Ambiente
NODE_ENV=production
```

#### 📍 Como obter as credenciais do Supabase:

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** > **API**:
   - `SUPABASE_URL` = Project URL
   - `SUPABASE_ANON_KEY` = anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (⚠️ NÃO expor no frontend)
4. Vá em **Settings** > **Database** > **Connection string**:
   - `SUPABASE_JWT_SECRET` = JWT Secret

### 3. Deploy

Clique em **Deploy** e aguarde. A API estará disponível em:
```
https://seu-projeto-api.vercel.app/api/v1
```

Documentação Swagger:
```
https://seu-projeto-api.vercel.app/docs
```

---

## 🔄 Atualizar FRONTEND_URL da API

⚠️ **IMPORTANTE**: Após deploy do frontend, volte na configuração da API:

1. Acesse o projeto da API no Vercel
2. Vá em **Settings** > **Environment Variables**
3. Atualize `FRONTEND_URL` com a URL real do frontend:
   ```
   FRONTEND_URL=https://seu-projeto.vercel.app
   ```
4. Clique em **Redeploy** para aplicar

---

## ✅ Verificação

### Testar a API:

```bash
# Health check
curl https://seu-projeto-api.vercel.app/api/v1

# Swagger docs
open https://seu-projeto-api.vercel.app/docs
```

### Testar o Frontend:

```bash
open https://seu-projeto.vercel.app
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"
- Verifique se o `Root Directory` está correto (`apps/api` ou `apps/web`)
- Verifique se todas as dependências estão no `package.json`

### Erro: CORS
- Verifique se `FRONTEND_URL` está configurado corretamente na API
- Deve ser a URL **exata** do frontend (sem barra no final)

### Erro: Supabase connection
- Verifique se todas as variáveis `SUPABASE_*` estão configuradas
- Teste as credenciais localmente primeiro

### Build falha
- Verifique os logs de build no Vercel
- Teste o build localmente: `npm run build`

---

## 🔒 Segurança

### ⚠️ NUNCA exponha no frontend:
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

### ✅ Apenas no frontend (com `NEXT_PUBLIC_`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 📚 Recursos

- [Vercel Docs](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Supabase Docs](https://supabase.com/docs)
- [NestJS Serverless](https://docs.nestjs.com/faq/serverless)
