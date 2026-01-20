#!/bin/bash

echo "🚀 Iniciando configuração do CBO..."

# 1. Aplicar Migração
echo "📦 Aplicando migração do banco de dados (Você precisará da senha do banco)..."
npm run db:migrate

# 2. Rodar Seed
echo "🌱 Populando tabela CBO..."
node scripts/seed-cbo.js

echo "✅ Concluído!"
