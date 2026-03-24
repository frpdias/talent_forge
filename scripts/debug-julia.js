const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/web/.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const candidateIds = [
  '406f9f98-fa96-43f4-9995-265b4c06b8a6',
  '10be77ca-e5fd-477b-a6e7-95cf7b85e67d',
  '578a5138-69f2-49e0-a02e-91752361a8f4',
];

async function main() {
  const { data: assignments } = await sb
    .from('it_test_assignments')
    .select('id, candidate_id, org_id, nivel, assigned_at')
    .in('candidate_id', candidateIds);

  console.log('\n=== ASSIGNMENTS ===');
  (assignments || []).forEach(a => console.log(JSON.stringify(a)));

  if (assignments && assignments.length > 0) {
    const { data: results } = await sb
      .from('it_test_results')
      .select('assignment_id, candidate_id, score, correct_answers, total_questions, completed_at')
      .in('assignment_id', assignments.map(a => a.id));

    console.log('\n=== RESULTS ===');
    if (!results || results.length === 0) {
      console.log('(nenhum resultado encontrado)');
    } else {
      results.forEach(r => console.log(JSON.stringify(r)));
    }
  }
}

main().catch(console.error);
