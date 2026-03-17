#!/bin/bash
# =============================================================================
# restore-vercel-env.sh — Restaura variáveis de ambiente críticas no Vercel
# Uso: bash scripts/restore-vercel-env.sh
#
# Lê as credenciais de apps/api/.env (nunca commitado — não contém secrets).
# Execute sempre que as vars do Vercel forem apagadas/resetadas.
# Requer: vercel CLI autenticado + projeto linkado em apps/web/
# =============================================================================

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."
ENV_FILE="$ROOT/apps/api/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Arquivo $ENV_FILE não encontrado."
  echo "   As credenciais ficam em apps/api/.env (não commitado)."
  exit 1
fi

# Carrega vars do .env sem expô-las no script
load_var() { grep "^$1=" "$ENV_FILE" | cut -d= -f2-; }

BREVO_HOST=$(load_var BREVO_SMTP_HOST)
BREVO_PORT=$(load_var BREVO_SMTP_PORT)
BREVO_USER=$(load_var BREVO_SMTP_USER)
BREVO_PASS=$(load_var BREVO_SMTP_PASS)
BREVO_FROM=$(load_var BREVO_SENDER_EMAIL)
BREVO_NAME=$(load_var BREVO_SENDER_NAME)

# Fallbacks para vars opcionais
[ -z "$BREVO_HOST" ] && BREVO_HOST="smtp-relay.brevo.com"
[ -z "$BREVO_PORT" ] && BREVO_PORT="587"
[ -z "$BREVO_FROM" ] && BREVO_FROM="noreply@talentforge.com.br"
[ -z "$BREVO_NAME" ] && BREVO_NAME="TalentForge"

if [ -z "$BREVO_PASS" ]; then
  echo "❌ BREVO_SMTP_PASS não encontrado em $ENV_FILE"
  exit 1
fi

# Garante link ao projeto
cd "$ROOT/apps/web"
if [ ! -f ".vercel/project.json" ]; then
  echo "Projeto não linkado. Executando vercel link..."
  vercel link --yes
fi

set_var() {
  local NAME="$1" VAL="$2" ENV="$3" EXTRA="${4:-}"
  printf '%s' "$VAL" | vercel env add "$NAME" "$ENV" --force $EXTRA 2>&1 | grep -E "Overrode|Error" || true
}

echo ""
echo "📧 Restaurando variáveis SMTP Brevo em 3 ambientes..."

for ENV in production preview; do
  echo "  → $ENV"
  set_var BREVO_SMTP_HOST    "$BREVO_HOST" "$ENV"
  set_var BREVO_SMTP_PORT    "$BREVO_PORT" "$ENV"
  set_var BREVO_SMTP_USER    "$BREVO_USER" "$ENV"
  set_var BREVO_SMTP_PASS    "$BREVO_PASS" "$ENV" "--sensitive"
  set_var BREVO_SENDER_EMAIL "$BREVO_FROM" "$ENV"
  set_var BREVO_SENDER_NAME  "$BREVO_NAME" "$ENV"
done

# Development não aceita --sensitive
echo "  → development"
set_var BREVO_SMTP_HOST    "$BREVO_HOST" development
set_var BREVO_SMTP_PORT    "$BREVO_PORT" development
set_var BREVO_SMTP_USER    "$BREVO_USER" development
set_var BREVO_SMTP_PASS    "$BREVO_PASS" development
set_var BREVO_SENDER_EMAIL "$BREVO_FROM" development
set_var BREVO_SENDER_NAME  "$BREVO_NAME" development

echo ""
echo "✅ Concluído! Acione redeploy para aplicar:"
echo "   git commit --allow-empty -m 'fix: redeploy vars restauradas' && git push"
