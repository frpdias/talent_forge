#!/usr/bin/env node
/**
 * Script para aplicar migration: team_members + employee_id
 * Usa o Supabase service_role key para executar via REST
 * 
 * Uso: node scripts/apply-team-members-migration.js
 */

const SUPABASE_URL = 'https://fjudsjzfnysaztcwlwgm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqdWRzanpmbnlzYXp0Y3dsd2dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU0MDc2MCwiZXhwIjoyMDgwMTE2NzYwfQ.z-Qc2Y6H_h9nkli5iiCqgFPvQmLf5eVKMJVTuce9MDk';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

async function query(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, { headers, ...opts });
  const text = await res.text();
  return { status: res.status, ok: res.ok, body: text ? JSON.parse(text) : null };
}

async function main() {
  console.log('=== Migration: team_members + employee_id ===\n');

  // Step 1: Check if employee_id already exists
  const check = await query('/rest/v1/team_members?select=employee_id&limit=0');
  if (check.ok) {
    console.log('✅ Coluna employee_id já existe. Migration já aplicada.');
    return;
  }
  console.log('⚠️  Coluna employee_id não existe. Precisa de migration DDL.\n');
  
  // Step 2: Try creating a temporary function to run DDL
  const createFn = await query('/rest/v1/rpc/apply_team_members_migration', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  
  if (createFn.status === 404 || (createFn.body?.code === 'PGRST202')) {
    console.log('❌ A função RPC não existe no DB.\n');
    console.log('📋 AÇÃO NECESSÁRIA: Execute o SQL abaixo no Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/fjudsjzfnysaztcwlwgm/sql/new\n');
    console.log('--- COPIE E COLE ESTE SQL ---\n');
    console.log(`
-- 1. Adicionar coluna employee_id
ALTER TABLE team_members 
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE CASCADE;

-- 2. Tornar user_id nullable  
ALTER TABLE team_members 
  ALTER COLUMN user_id DROP NOT NULL;

-- 3. CHECK: pelo menos um dos dois deve estar preenchido
DO $$ BEGIN
  ALTER TABLE team_members 
    ADD CONSTRAINT team_members_has_user_or_employee 
    CHECK (user_id IS NOT NULL OR employee_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Unique por employee dentro do time
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_team_employee 
  ON team_members(team_id, employee_id) 
  WHERE employee_id IS NOT NULL;

-- 5. Index para buscas por employee_id
CREATE INDEX IF NOT EXISTS idx_team_members_employee_id 
  ON team_members(employee_id) 
  WHERE employee_id IS NOT NULL;

-- 6. Preencher employee_id nos registros existentes
UPDATE team_members tm
SET employee_id = e.id
FROM employees e
WHERE tm.user_id = e.user_id
  AND tm.employee_id IS NULL;
    `);
    console.log('\n--- FIM DO SQL ---\n');
    console.log('Após executar, rode este script novamente para verificar.');
    return;
  }

  if (createFn.ok) {
    console.log('✅ Migration aplicada com sucesso via RPC!');
  } else {
    console.log('Resposta:', JSON.stringify(createFn.body, null, 2));
  }
}

main().catch(console.error);
