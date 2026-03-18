#!/bin/bash
# Script para adicionar variáveis de ambiente ao projeto Vercel talent_forge
# Execute: bash scripts/add-vercel-env.sh

set -e

SUPABASE_URL="https://fjudsjzfnysaztcwlwgm.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqdWRzanpmbnlzYXp0Y3dsd2dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDA3NjAsImV4cCI6MjA4MDExNjc2MH0.RVfvnu7Cp9X5wXefvXtwOu20hSsR4B6mGkypssMtUyE"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqdWRzanpmbnlzYXp0Y3dsd2dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU0MDc2MCwiZXhwIjoyMDgwMTE2NzYwfQ.z-Qc2Y6H_h9nkli5iiCqgFPvQmLf5eVKMJVTuce9MDk"
API_URL="https://api-py-ruddy.vercel.app/api/v1"
REPLY_TO="contato@talentforge.com.br"

echo "=== Adicionando vars de ambiente ao Vercel (talent_forge) ==="

# NEXT_PUBLIC_SUPABASE_URL
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production 2>&1 || echo "Já existe em production"
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview 2>&1 || echo "Já existe em preview"
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL development 2>&1 || echo "Já existe em development"

# NEXT_PUBLIC_SUPABASE_ANON_KEY
echo "$ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production 2>&1 || echo "Já existe em production"
echo "$ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview 2>&1 || echo "Já existe em preview"
echo "$ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development 2>&1 || echo "Já existe em development"

# SUPABASE_SERVICE_ROLE_KEY
echo "$SERVICE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production 2>&1 || echo "Já existe em production"
echo "$SERVICE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY preview 2>&1 || echo "Já existe em preview"
echo "$SERVICE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY development 2>&1 || echo "Já existe em development"

# NEXT_PUBLIC_API_URL
echo "$API_URL" | vercel env add NEXT_PUBLIC_API_URL production 2>&1 || echo "Já existe em production"
echo "$API_URL" | vercel env add NEXT_PUBLIC_API_URL preview 2>&1 || echo "Já existe em preview"
echo "$API_URL" | vercel env add NEXT_PUBLIC_API_URL development 2>&1 || echo "Já existe em development"

# BREVO_REPLY_TO
echo "$REPLY_TO" | vercel env add BREVO_REPLY_TO production 2>&1 || echo "Já existe em production"
echo "$REPLY_TO" | vercel env add BREVO_REPLY_TO preview 2>&1 || echo "Já existe em preview"
echo "$REPLY_TO" | vercel env add BREVO_REPLY_TO development 2>&1 || echo "Já existe em development"

echo "=== Concluído! ==="
