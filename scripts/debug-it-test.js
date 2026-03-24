const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/web/.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const userId = 'cc374127-33e1-4a04-a5fc-cf68a1e4cc91';

  const { data: candidate, error: ce } = await sb
    .from('candidates')
    .select('id, email')
    .eq('user_id', userId)
    .maybeSingle();

  console.log('candidate error:', ce);
  console.log('candidate found:', candidate);

  if (!candidate) { console.log('NO CANDIDATE — API retornaria null'); return; }

  const { data: assignment, error: ae } = await sb
    .from('it_test_assignments')
    .select('id, nivel, token, assigned_at, org_id')
    .eq('candidate_id', candidate.id)
    .order('assigned_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log('assignment error:', ae);
  console.log('assignment:', assignment);

  if (assignment) {
    const { data: result } = await sb
      .from('it_test_results')
      .select('score, total_questions, correct_answers, nivel, completed_at')
      .eq('assignment_id', assignment.id)
      .maybeSingle();
    console.log('result:', result);
    console.log('\nAPI RESPONSE seria:');
    console.log(JSON.stringify({
      assignment: { id: assignment.id, nivel: assignment.nivel, assigned_at: assignment.assigned_at, token: assignment.token, link: 'http://localhost:3000/it-test/' + assignment.token },
      result
    }, null, 2));
  }
}

main().catch(console.error);
