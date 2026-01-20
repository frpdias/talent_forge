#!/bin/bash

# Script para limpar deploys não utilizados no Vercel
# Mantém apenas os 3 últimos deploys
# 
# Uso: ./scripts/cleanup-vercel-simple.sh
# Requer: Vercel CLI instalado e autenticado

KEEP_COUNT=3
PROJECT_DIR="apps/web"

echo "🧹 Limpador de Deploys do Vercel"
echo "================================"
echo ""

# Verificar se está no diretório correto
if [ ! -d "$PROJECT_DIR" ]; then
  echo "❌ Erro: Diretório $PROJECT_DIR não encontrado"
  exit 1
fi

cd "$PROJECT_DIR" || exit 1

echo "📦 Listando deploys..."
echo ""

# Listar deploy IDs (formato: ID | URL | Criado | Tempo)
DEPLOYS=$(vercel list --json 2>/dev/null | jq -r '.[] | .uid + "|" + .url + "|" + .created' 2>/dev/null)

if [ -z "$DEPLOYS" ]; then
  echo "❌ Erro ao listar deploys. Verifique se:"
  echo "   1. Vercel CLI está instalado (npm i -g vercel)"
  echo "   2. Você está autenticado (vercel login)"
  echo "   3. Está no diretório correto do projeto"
  exit 1
fi

# Converter para array e ordenar por data (mais recente primeiro)
readarray -t DEPLOY_ARRAY < <(echo "$DEPLOYS" | sort -t '|' -k 3 -rn)

TOTAL=${#DEPLOY_ARRAY[@]}
echo "✅ Total de $TOTAL deploy(s) encontrado(s)"
echo ""

if [ "$TOTAL" -le "$KEEP_COUNT" ]; then
  echo "ℹ️  Nenhuma limpeza necessária ($TOTAL <= $KEEP_COUNT)"
  cd - > /dev/null
  exit 0
fi

# Mostrar deploys a manter
echo "RECENTES (manter):"
for ((i = 0; i < KEEP_COUNT; i++)); do
  IFS='|' read -r id url created <<< "${DEPLOY_ARRAY[$i]}"
  echo "  $((i + 1)). $id - $url"
done

# Mostrar deploys a deletar
echo ""
echo "PARA DELETAR:"
TO_DELETE=$((TOTAL - KEEP_COUNT))
for ((i = KEEP_COUNT; i < TOTAL; i++)); do
  IFS='|' read -r id url created <<< "${DEPLOY_ARRAY[$i]}"
  echo "  $((i + 1)). $id - $url"
done

echo ""
read -p "⚠️  Confirma a exclusão de $TO_DELETE deploy(s)? (s/n): " confirm

if [[ "$confirm" != "s" && "$confirm" != "S" ]]; then
  echo "❌ Operação cancelada"
  cd - > /dev/null
  exit 0
fi

echo ""
echo "🗑️  Deletando deploys..."
echo ""

DELETED=0
FAILED=0

for ((i = KEEP_COUNT; i < TOTAL; i++)); do
  IFS='|' read -r id url created <<< "${DEPLOY_ARRAY[$i]}"
  
  if vercel remove "$id" --yes > /dev/null 2>&1; then
    echo "  ✅ Deletado: $id"
    ((DELETED++))
  else
    echo "  ❌ Falha ao deletar: $id"
    ((FAILED++))
  fi
done

echo ""
echo "📊 Resultado: $DELETED deletado(s), $FAILED falha(s)"
echo "✅ Mantidos os $KEEP_COUNT deploys mais recentes"
echo ""

cd - > /dev/null
