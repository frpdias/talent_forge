/**
 * assign-junior-test-existing.js
 * Atribui Teste de Informática Junior a todos os candidatos existentes
 * que ainda não possuem uma atribuição ativa.
 *
 * Uso: node scripts/assign-junior-test-existing.js
 * Opção (e-mail específico): node scripts/assign-junior-test-existing.js juliaasseruy@hotmail.com
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: 'apps/api/.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌  SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  process.exit(1);
}

const sb = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const targetEmail = process.argv[2] || null;

async function main() {
  console.log(targetEmail
    ? `🎯  Atribuindo Junior para: ${targetEmail}`
    : '🎯  Atribuindo Junior para todos os candidatos sem teste...\n');

  // 1. Buscar candidatos (filtrado por e-mail se especificado)
  let query = sb.from('candidates').select('id, email, full_name, owner_org_id');
  if (targetEmail) {
    query = query.ilike('email', targetEmail.trim());
  }

  const { data: candidates, error: candErr } = await query;
  if (candErr) {
    console.error('❌  Erro ao buscar candidatos:', candErr.message);
    process.exit(1);
  }

  if (!candidates || candidates.length === 0) {
    console.warn('⚠️   Nenhum candidato encontrado' + (targetEmail ? ` com e-mail "${targetEmail}"` : ''));
    process.exit(0);
  }

  console.log(`📋  ${candidates.length} candidato(s) encontrado(s)\n`);

  // 2. Buscar quais já têm atribuição
  const candidateIds = candidates.map(c => c.id);
  const { data: existing } = await sb
    .from('it_test_assignments')
    .select('candidate_id')
    .in('candidate_id', candidateIds);

  const alreadyAssigned = new Set((existing || []).map(a => a.candidate_id));

  // 3. Filtrar os que ainda não têm
  const toAssign = candidates.filter(c => !alreadyAssigned.has(c.id));

  if (toAssign.length === 0) {
    console.log('✅  Todos os candidatos já possuem atribuição de teste. Nada a fazer.');
    return;
  }

  console.log(`🔧  ${toAssign.length} candidato(s) sem atribuição — inserindo...\n`);

  let ok = 0;
  let fail = 0;

  for (const c of toAssign) {
    const { error } = await sb.from('it_test_assignments').insert({
      candidate_id: c.id,
      org_id:       c.owner_org_id,
      nivel:        'junior',
      assigned_by:  null,           // automático
      token:        crypto.randomUUID(),
    });

    if (error) {
      console.error(`  ❌  ${c.full_name} (${c.email}):`, error.message);
      fail++;
    } else {
      console.log(`  ✅  ${c.full_name} (${c.email})`);
      ok++;
    }
  }

  console.log(`\n📊  Resultado: ${ok} atribuído(s), ${fail} falhou`);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
