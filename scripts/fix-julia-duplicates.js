/**
 * fix-julia-duplicates.js
 *
 * Para juliaasseruy@hotmail.com, que tem 3 registros duplicados em `candidates`:
 *
 * MANTER  : 10be77ca — org c318c4aa (org do recrutador frpdias)
 * DELETAR : 578a5138 — org caee2ca7 (tem o resultado do IT test — migrar antes)
 * DELETAR : 406f9f98 — org 00000000 (org inválida, sem resultado)
 *
 * Passos:
 *  1. Ler o resultado existente (assignment 3dbfc7ed → candidato 578a5138)
 *  2. Inserir esse resultado no assignment correto (a8e64fa6 → candidato 10be77ca)
 *  3. Deletar candidatos 578a5138 e 406f9f98 (CASCADE limpa assignments e results)
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../apps/web/.env.local') });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const KEEP_CANDIDATE_ID    = '10be77ca-e5fd-477b-a6e7-95cf7b85e67d'; // org c318c4aa
const KEEP_ORG_ID          = 'c318c4aa-6e70-4bbc-991d-5126b14b4631';
const KEEP_ASSIGNMENT_ID   = 'a8e64fa6-12c5-44ba-885c-3f5b3ff3877d';

const SOURCE_ASSIGNMENT_ID = '3dbfc7ed-6746-47f6-93d8-b57417a91776'; // tem o resultado

const DELETE_CANDIDATES    = [
  '578a5138-69f2-49e0-a02e-91752361a8f4',
  '406f9f98-fa96-43f4-9995-265b4c06b8a6',
];

async function main() {
  console.log('=== Iniciando limpeza de duplicatas da Julia ===\n');

  // ── 1. Buscar o resultado existente ─────────────────────────────────
  const { data: existingResult, error: rErr } = await sb
    .from('it_test_results')
    .select('*')
    .eq('assignment_id', SOURCE_ASSIGNMENT_ID)
    .maybeSingle();

  if (rErr) throw new Error('Erro ao buscar resultado: ' + rErr.message);
  if (!existingResult) {
    console.log('⚠️  Nenhum resultado encontrado no assignment fonte. Pulando migração de resultado.');
  } else {
    console.log('✅ Resultado encontrado:', {
      score:           existingResult.score,
      correct_answers: existingResult.correct_answers,
      total_questions: existingResult.total_questions,
      completed_at:    existingResult.completed_at,
    });

    // ── 2. Verificar se já existe resultado no assignment de destino ───
    const { data: alreadyHas } = await sb
      .from('it_test_results')
      .select('id')
      .eq('assignment_id', KEEP_ASSIGNMENT_ID)
      .maybeSingle();

    if (alreadyHas) {
      console.log('ℹ️  Assignment de destino já tem resultado — não duplicar.');
    } else {
      // ── 3. Inserir resultado no candidato/assignment correto ─────────
      const { error: iErr } = await sb
        .from('it_test_results')
        .insert({
          assignment_id:   KEEP_ASSIGNMENT_ID,
          candidate_id:    KEEP_CANDIDATE_ID,
          org_id:          KEEP_ORG_ID,
          nivel:           existingResult.nivel,
          total_questions: existingResult.total_questions,
          correct_answers: existingResult.correct_answers,
          answers:         existingResult.answers,
          completed_at:    existingResult.completed_at,
        });

      if (iErr) throw new Error('Erro ao inserir resultado migrado: ' + iErr.message);
      console.log('✅ Resultado migrado para o candidato correto (10be77ca)');
    }
  }

  // ── 4. Deletar candidatos duplicados (CASCADE limpa assignments e results) ──
  for (const candidateId of DELETE_CANDIDATES) {
    const { error: dErr } = await sb
      .from('candidates')
      .delete()
      .eq('id', candidateId);

    if (dErr) {
      console.error(`❌ Erro ao deletar candidato ${candidateId}:`, dErr.message);
    } else {
      console.log(`🗑️  Candidato ${candidateId} deletado (e seus dados em cascata)`);
    }
  }

  // ── 5. Verificação final ─────────────────────────────────────────────
  console.log('\n=== Verificação final ===');

  const { data: remaining } = await sb
    .from('candidates')
    .select('id, email, owner_org_id, created_at')
    .ilike('email', 'juliaasseruy@hotmail.com');
  console.log('Candidatos restantes:', remaining?.length, remaining?.map(c => c.id));

  const { data: finalAssignment } = await sb
    .from('it_test_assignments')
    .select('id, nivel, assigned_at')
    .eq('candidate_id', KEEP_CANDIDATE_ID)
    .maybeSingle();
  console.log('Assignment:', finalAssignment);

  if (finalAssignment) {
    const { data: finalResult } = await sb
      .from('it_test_results')
      .select('score, correct_answers, total_questions, completed_at')
      .eq('assignment_id', finalAssignment.id)
      .maybeSingle();
    console.log('Resultado:', finalResult);
  }

  console.log('\n✅ Limpeza concluída com sucesso!');
}

main().catch((err) => { console.error('ERRO FATAL:', err); process.exit(1); });
