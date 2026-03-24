#!/usr/bin/env node
/**
 * Script: apply-module-security-migration.js
 * Aplica a migration 20260320_restrict_module_activations_to_admin.sql
 * via Supabase Management API (endpoint /sql).
 */

const SUPABASE_PROJECT_REF = 'fjudsjzfnysaztcwlwgm';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqdWRzanpmbnlzYXp0Y3dsd2dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU0MDc2MCwiZXhwIjoyMDgwMTE2NzYwfQ.z-Qc2Y6H_h9nkli5iiCqgFPvQmLf5eVKMJVTuce9MDk';

const statements = [
  // PHP MODULE ACTIVATIONS - remover políticas de escrita de membros da org
  'DROP POLICY IF EXISTS php_activations_insert ON php_module_activations',
  'DROP POLICY IF EXISTS php_activations_update ON php_module_activations',
  'DROP POLICY IF EXISTS php_activations_delete ON php_module_activations',
  'DROP POLICY IF EXISTS php_module_activations_insert ON php_module_activations',
  'DROP POLICY IF EXISTS php_module_activations_update ON php_module_activations',
  'DROP POLICY IF EXISTS php_module_activations_delete ON php_module_activations',
  // RECRUITMENT MODULE ACTIVATIONS - mesma restrição
  'DROP POLICY IF EXISTS recruitment_activations_insert ON recruitment_module_activations',
  'DROP POLICY IF EXISTS recruitment_activations_update ON recruitment_module_activations',
  'DROP POLICY IF EXISTS recruitment_activations_delete ON recruitment_module_activations',
  // Revogar permissões de escrita do role authenticated
  'REVOKE INSERT, UPDATE, DELETE ON php_module_activations FROM authenticated',
  'REVOKE INSERT, UPDATE, DELETE ON recruitment_module_activations FROM authenticated',
  // Garantir SELECT para authenticated (exibir status no UI)
  'GRANT SELECT ON php_module_activations TO authenticated',
  'GRANT SELECT ON recruitment_module_activations TO authenticated',
  // Comentários de auditoria
  "COMMENT ON TABLE php_module_activations IS 'Ativacoes do modulo PHP por organizacao. Escrita restrita ao service_role (admin Fartech via API). SELECT liberado para membros da org.'",
  "COMMENT ON TABLE recruitment_module_activations IS 'Ativacoes do modulo de Recrutamento por organizacao. Escrita restrita ao service_role (admin Fartech via API). SELECT liberado para membros da org.'",
];

async function execSQL(sql) {
  const url = `https://${SUPABASE_PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql`;
  // Fallback: usar endpoint de query direto via Management API
  const mgmtUrl = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`;
  
  // Tentar via Management API primeiro
  const res = await fetch(mgmtUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  
  return await res.json();
}

async function main() {
  console.log('Aplicando migration: 20260320_restrict_module_activations_to_admin.sql');
  console.log('='.repeat(70));
  
  let success = 0;
  let failed = 0;
  
  for (const stmt of statements) {
    const preview = stmt.substring(0, 80) + (stmt.length > 80 ? '...' : '');
    try {
      await execSQL(stmt);
      console.log('✅', preview);
      success++;
    } catch (err) {
      console.log('❌', preview);
      console.log('   Erro:', err.message.substring(0, 200));
      failed++;
    }
  }
  
  console.log('='.repeat(70));
  console.log(`Resultado: ${success} OK, ${failed} falhou`);
}

main().catch(console.error);
