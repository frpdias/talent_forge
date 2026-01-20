# Scripts de Limpeza do Vercel

Este diretório contém scripts para gerenciar e limpar os deploys do Vercel, mantendo apenas os 3 mais recentes.

## Scripts Disponíveis

### 1. **Node.js (Recomendado)**

```bash
npm run cleanup:deployments
```

**Ou:**

```bash
node scripts/cleanup-vercel-deployments.js
```

**Requisitos:**
- Variável de ambiente `VERCEL_TOKEN` configurada
- Opcional: `VERCEL_TEAM_ID` e `VERCEL_PROJECT_ID` para teams

**Como obter o token:**
1. Acesse https://vercel.com/account/tokens
2. Crie um novo token (Full Access ou Custom)
3. Configure: `export VERCEL_TOKEN=seu_token_aqui`

### 2. **Bash (Simples)**

```bash
chmod +x scripts/cleanup-vercel-simple.sh
./scripts/cleanup-vercel-simple.sh
```

**Requisitos:**
- Vercel CLI instalado: `npm i -g vercel`
- Autenticado: `vercel login`
- Ferramentas: `jq`, `sort`

## Como Funciona

1. **Lista** todos os deploys do projeto
2. **Ordena** por data (mais recente primeiro)
3. **Mostra** os 3 deploys que serão mantidos
4. **Mostra** os deploys que serão deletados
5. **Pede confirmação** antes de deletar
6. **Deleta** os deploys antigos
7. **Mantém** apenas os 3 mais recentes

## Exemplo de Execução

```
🧹 Limpador de Deploys do Vercel
================================

📦 Buscando deploys...

✅ Total de 12 deploy(s) encontrado(s)

RECENTES (manter):
  1. abc123def - 17/12/2025 14:30:00 - https://web-abc123.vercel.app
  2. xyz789uvw - 17/12/2025 10:15:00 - https://web-xyz789.vercel.app
  3. mnp456qrs - 17/12/2025 08:00:00 - https://web-mnp456.vercel.app

PARA DELETAR:
  4. old1234ab - 16/12/2025 20:45:00 - https://web-old1234.vercel.app
  5. old5678cd - 16/12/2025 15:30:00 - https://web-old5678.vercel.app
  ... (mais 4 deploys)

⚠️  Confirma a exclusão de 9 deploy(s)? (s/n): s

🗑️  Deletando deploys...

  ✅ Deletado: old1234ab
  ✅ Deletado: old5678cd
  ... (mais 7 deletados)

📊 Resultado: 9 deletado(s), 0 falha(s)
✅ Mantidos os 3 deploys mais recentes
```

## Configurações

Você pode alterar a quantidade de deploys a manter editando a variável `KEEP_COUNT` em qualquer um dos scripts:

```javascript
// cleanup-vercel-deployments.js
const KEEP_COUNT = 3; // Mude para o número desejado
```

```bash
# cleanup-vercel-simple.sh
KEEP_COUNT=3  # Mude para o número desejado
```

## Troubleshooting

### "VERCEL_TOKEN não está configurado"

Configure o token:
```bash
export VERCEL_TOKEN=seu_token_aqui
```

Ou adicione ao seu `.bashrc` / `.zshrc`:
```bash
echo 'export VERCEL_TOKEN=seu_token_aqui' >> ~/.zshrc
source ~/.zshrc
```

### "Erro ao listar deploys" (Script Bash)

Verifique:
1. Vercel CLI instalado: `vercel --version`
2. Autenticado: `vercel login`
3. No diretório correto: `cd apps/web`

### "Falha ao deletar alguns deploys"

- Verifique se o token tem permissão de DELETE
- Alguns deploys podem estar em uso (por exemplo, deploy de produção atual)
- Tente deletar manualmente: `vercel remove <deployment-id> --yes`

## Automation (Cron)

Para executar automaticamente (exemplo: toda semana):

```bash
# Adicione ao seu crontab
0 2 * * 0 cd /path/to/PROJETO_TALENT_FORGE && npm run cleanup:deployments -- --yes
```

## Segurança

⚠️ **Importante:**
- Nunca compartilhe seu `VERCEL_TOKEN`
- Use `.env.local` ou variáveis de ambiente seguras
- O script confirma antes de deletar
- Mantém sempre os 3 últimos deploys para rollback rápido

## Suporte

Para problemas:
1. Verifique os logs: `npm run cleanup:deployments 2>&1 | tee cleanup.log`
2. Consulte docs do Vercel: https://vercel.com/docs/rest-api
3. Teste manualmente: `vercel list`
