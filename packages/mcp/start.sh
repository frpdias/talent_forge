#!/usr/bin/env bash
# TalentForge MCP — wrapper que carrega as credenciais do projeto
# Usado pelo .mcp.json para iniciar o servidor com as env vars corretas

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Carrega credenciais da API (fonte canônica das vars Supabase)
API_ENV="$ROOT_DIR/apps/api/.env"
MCP_ENV="$SCRIPT_DIR/.env"

if [ -f "$MCP_ENV" ]; then
  set -o allexport
  # shellcheck source=/dev/null
  source "$MCP_ENV"
  set +o allexport
elif [ -f "$API_ENV" ]; then
  set -o allexport
  # shellcheck source=/dev/null
  source "$API_ENV"
  set +o allexport
else
  echo "ERRO: Nenhum arquivo .env encontrado em packages/mcp/.env ou apps/api/.env" >&2
  exit 1
fi

# Build se necessário
DIST="$SCRIPT_DIR/dist/server.js"
if [ ! -f "$DIST" ]; then
  echo "Compilando MCP server..." >&2
  cd "$SCRIPT_DIR" && npm run build
fi

exec node "$DIST"
