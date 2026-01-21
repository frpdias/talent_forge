#!/bin/bash

# =============================================================================
# TALENT FORGE - Script de Segurança para Produção
# =============================================================================
# Este script ajuda a identificar e corrigir problemas de segurança
# antes de liberar o acesso demo.
# =============================================================================

echo "🔒 TALENT FORGE - Verificação de Segurança"
echo "==========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de problemas
PROBLEMS=0

# -----------------------------------------------------------------------------
# 1. Verificar chaves expostas no código
# -----------------------------------------------------------------------------
echo "📋 1. Verificando chaves expostas no código..."
echo ""

# Padrões suspeitos
PATTERNS=(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"  # JWT tokens
    "SUPABASE_KEY.*=.*['\"]ey"
    "POSTGRES_KEY.*=.*['\"]ey"
    "service_role"
    "postgres.*key"
)

for pattern in "${PATTERNS[@]}"; do
    FOUND=$(grep -r "$pattern" --include="*.js" --include="*.ts" --include="*.tsx" --include="*.json" . 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v ".git")
    if [ ! -z "$FOUND" ]; then
        echo -e "${RED}⚠️  ALERTA: Possível chave exposta encontrada:${NC}"
        echo "$FOUND"
        echo ""
        ((PROBLEMS++))
    fi
done

if [ $PROBLEMS -eq 0 ]; then
    echo -e "${GREEN}✅ Nenhuma chave exposta encontrada no código.${NC}"
fi

# -----------------------------------------------------------------------------
# 2. Verificar arquivos .env
# -----------------------------------------------------------------------------
echo ""
echo "📋 2. Verificando arquivos de ambiente..."
echo ""

ENV_FILES=(
    ".env"
    ".env.local"
    ".env.production"
    "apps/web/.env"
    "apps/web/.env.local"
    "apps/api/.env"
    "apps/api/.env.local"
)

for envfile in "${ENV_FILES[@]}"; do
    if [ -f "$envfile" ]; then
        echo -e "${YELLOW}📄 Encontrado: $envfile${NC}"
        # Verificar se está no .gitignore
        if grep -q "$envfile" .gitignore 2>/dev/null; then
            echo -e "${GREEN}   ✅ Está no .gitignore${NC}"
        else
            echo -e "${RED}   ⚠️  NÃO está no .gitignore!${NC}"
            ((PROBLEMS++))
        fi
    fi
done

# -----------------------------------------------------------------------------
# 3. Verificar .gitignore
# -----------------------------------------------------------------------------
echo ""
echo "📋 3. Verificando .gitignore..."
echo ""

REQUIRED_IGNORES=(
    ".env"
    ".env.local"
    ".env.production"
    "node_modules"
    ".next"
)

for ignore in "${REQUIRED_IGNORES[@]}"; do
    if grep -q "$ignore" .gitignore 2>/dev/null; then
        echo -e "${GREEN}✅ $ignore está no .gitignore${NC}"
    else
        echo -e "${RED}⚠️  $ignore NÃO está no .gitignore!${NC}"
        ((PROBLEMS++))
    fi
done

# -----------------------------------------------------------------------------
# 4. Verificar variáveis de ambiente necessárias
# -----------------------------------------------------------------------------
echo ""
echo "📋 4. Variáveis de ambiente necessárias para produção:"
echo ""

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_API_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
    echo "   • $var"
done

# -----------------------------------------------------------------------------
# 5. Resumo
# -----------------------------------------------------------------------------
echo ""
echo "==========================================="
echo "📊 RESUMO DA VERIFICAÇÃO"
echo "==========================================="
echo ""

if [ $PROBLEMS -eq 0 ]; then
    echo -e "${GREEN}✅ Nenhum problema de segurança encontrado!${NC}"
else
    echo -e "${RED}⚠️  $PROBLEMS problema(s) encontrado(s)!${NC}"
    echo ""
    echo "Por favor, corrija os problemas antes de continuar."
fi

echo ""
echo "==========================================="
echo "📝 PRÓXIMOS PASSOS"
echo "==========================================="
echo ""
echo "1. Remover chaves hardcoded dos arquivos"
echo "2. Configurar variáveis de ambiente no Vercel:"
echo "   vercel env add NEXT_PUBLIC_SUPABASE_URL"
echo "   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   vercel env add SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "3. Rotacionar chaves no Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/fjudsjzfnysaztcwlwgm/settings/api"
echo ""
echo "4. Fazer novo deploy:"
echo "   cd apps/web && npx vercel --prod"
echo ""
