#!/bin/bash
# =============================================================================
# restore-vercel-env.sh — Restaura variáveis de ambiente críticas no Vercel
# Uso: bash scripts/restore-vercel-env.sh
#
# Lê as credenciais de apps/api/.env e .env.local raiz (nunca commitados).
# Execute sempre que as vars do Vercel forem apagadas/resetadas.
# Requer: vercel CLI autenticado + projeto linkado em apps/web/
# =============================================================================

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."
API_ENV="$ROOT/apps/api/.env"
ROOT_ENV="$ROOT/.env.local"

# Carrega var de um arquivo .env — tr -d '\r\n' remove CRLF e newlines finais
load_var() { grep "^$1=" "$2" 2>/dev/null | cut -d= -f2- | tr -d '\r\n'; }

# ---------------------------------------------------------------------------
# SMTP Brevo — lido de apps/api/.env
# ---------------------------------------------------------------------------
if [ ! -f "$API_ENV" ]; then
  echo "❌ Arquivo $API_ENV não encontrado."
  exit 1
fi
BREVO_HOST=$(load_var BREVO_SMTP_HOST    "$API_ENV"); [ -z "$BREVO_HOST" ] && BREVO_HOST="smtp-relay.brevo.com"
BREVO_PORT=$(load_var BREVO_SMTP_PORT    "$API_ENV"); [ -z "$BREVO_PORT" ] && BREVO_PORT="587"
BREVO_USER=$(load_var BREVO_SMTP_USER    "$API_ENV")
BREVO_PASS=$(load_var BREVO_SMTP_PASS    "$API_ENV")
BREVO_FROM=$(load_var BREVO_SENDER_EMAIL "$API_ENV"); [ -z "$BREVO_FROM" ] && BREVO_FROM="noreply@talentforge.com.br"
BREVO_NAME=$(load_var BREVO_SENDER_NAME  "$API_ENV"); [ -z "$BREVO_NAME" ] && BREVO_NAME="TalentForge"

if [ -z "$BREVO_PASS" ]; then echo "❌ BREVO_SMTP_PASS não encontrado em $API_ENV"; exit 1; fi

# ---------------------------------------------------------------------------
# Supabase — lido de .env.local raiz
# ---------------------------------------------------------------------------
if [ ! -f "$ROOT_ENV" ]; then echo "❌ Arquivo $ROOT_ENV não encontrado."; exit 1; fi
SUPABASE_URL=$(load_var NEXT_PUBLIC_SUPABASE_URL     "$ROOT_ENV")
SUPABASE_ANON=$(load_var NEXT_PUBLIC_SUPABASE_ANON_KEY "$ROOT_ENV")
SUPABASE_SRK=$(load_var SUPABASE_SERVICE_ROLE_KEY    "$ROOT_ENV")

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON" ]; then
  echo "❌ Vars Supabase não encontradas em $ROOT_ENV"
  exit 1
fi

# ---------------------------------------------------------------------------
# Garante link ao projeto Vercel
# ---------------------------------------------------------------------------
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
echo "📧 Restaurando vars em 3 ambientes (production / preview / development)..."

for ENV in production preview; do
  echo "  → $ENV"
  # Supabase
  set_var NEXT_PUBLIC_SUPABASE_URL      "$SUPABASE_URL"  "$ENV"
  set_var NEXT_PUBLIC_SUPABASE_ANON_KEY "$SUPABASE_ANON" "$ENV"
  set_var SUPABASE_SERVICE_ROLE_KEY     "$SUPABASE_SRK"  "$ENV" "--sensitive"
  set_var NEXT_PUBLIC_APP_URL           "https://web-eight-rho-84.vercel.app" "$ENV"
  # Brevo SMTP
  set_var BREVO_SMTP_HOST    "$BREVO_HOST" "$ENV"
  set_var BREVO_SMTP_PORT    "$BREVO_PORT" "$ENV"
  set_var BREVO_SMTP_USER    "$BREVO_USER" "$ENV"
  set_var BREVO_SMTP_PASS    "$BREVO_PASS" "$ENV" "--sensitive"
  set_var BREVO_SENDER_EMAIL "$BREVO_FROM" "$ENV"
  set_var BREVO_SENDER_NAME  "$BREVO_NAME" "$ENV"
done

# Development: sensitive não suportado
echo "  → development"
set_var NEXT_PUBLIC_SUPABASE_URL      "$SUPABASE_URL"  development
set_var NEXT_PUBLIC_SUPABASE_ANON_KEY "$SUPABASE_ANON" development
set_var SUPABASE_SERVICE_ROLE_KEY     "$SUPABASE_SRK"  development
set_var NEXT_PUBLIC_APP_URL           "http://localhost:3000" development
set_var BREVO_SMTP_HOST    "$BREVO_HOST" development
set_var BREVO_SMTP_PORT    "$BREVO_PORT" development
set_var BREVO_SMTP_USER    "$BREVO_USER" development
set_var BREVO_SMTP_PASS    "$BREVO_PASS" development
set_var BREVO_SENDER_EMAIL "$BREVO_FROM" development
set_var BREVO_SENDER_NAME  "$BREVO_NAME" development

echo ""
echo "✅ Concluído! Acione redeploy para aplicar:"
echo "   git commit --allow-empty -m 'fix: redeploy vars restauradas' && git push"
