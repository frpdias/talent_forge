#!/bin/bash

APIKEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqdWRzanpmbnlzYXp0Y3dsd2dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU0MDc2MCwiZXhwIjoyMDgwMTE2NzYwfQ.z-Qc2Y6H_h9nkli5iiCqgFPvQmLf5eVKMJVTuce9MDk"
BASE_URL="https://fjudsjzfnysaztcwlwgm.supabase.co/rest/v1"

echo "============================================"
echo "  CHECK ARQUITETURA CANÔNICA - TalentForge"
echo "============================================"
echo ""

echo "1) TABELAS DO BANCO DE DADOS"
echo "-------------------------------"
tables=$(curl -s "${BASE_URL}/" -H "apikey: ${APIKEY}" | jq -r '.definitions | keys[]' 2>/dev/null | sort)
count=$(echo "$tables" | wc -l | tr -d ' ')
echo "  Total de tabelas: $count"
echo ""

echo "2) USUÁRIOS DO AUTH"
echo "-------------------------------"
users=$(curl -s "https://fjudsjzfnysaztcwlwgm.supabase.co/auth/v1/admin/users" \
  -H "apikey: ${APIKEY}" \
  -H "Authorization: Bearer ${APIKEY}")

total=$(echo "$users" | jq '.users | length')
admins=$(echo "$users" | jq '[.users[] | select(.user_metadata.user_type == "admin")] | length')
recruiters=$(echo "$users" | jq '[.users[] | select(.user_metadata.user_type == "recruiter")] | length')
candidates=$(echo "$users" | jq '[.users[] | select(.user_metadata.user_type == "candidate")] | length')

echo "  Total:      $total"
echo "  Admins:     $admins"
echo "  Recruiters: $recruiters"
echo "  Candidates: $candidates"
echo ""

echo "3) SERVIÇOS"
echo "-------------------------------"
api=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/v1/auth/health 2>/dev/null)
web=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 2>/dev/null)

if [ "$api" = "200" ] || [ "$api" = "201" ]; then
  echo "  API NestJS (:3001): ✅"
else
  echo "  API NestJS (:3001): ❌"
fi

if [ "$web" = "200" ] || [ "$web" = "307" ]; then
  echo "  Next.js Web (:3000): ✅"
else
  echo "  Next.js Web (:3000): ❌"
fi

echo ""
echo "============================================"
echo "  CHECK COMPLETO - $(date '+%Y-%m-%d %H:%M')"
echo "============================================"
