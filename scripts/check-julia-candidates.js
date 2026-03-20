const { createClient } = require('@supabase/supabase-js');
const sb = createClient(
  'https://fjudsjzfnysaztcwlwgm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqdWRzanpmbnlzYXp0Y3dsd2dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU0MDc2MCwiZXhwIjoyMDgwMTE2NzYwfQ.z-Qc2Y6H_h9nkli5iiCqgFPvQmLf5eVKMJVTuce9MDk'
);

async function run() {
  // Buscar TODOS os candidatos com esse user_id
  const { data: candidates } = await sb
    .from('candidates')
    .select('id, org_id, user_id, created_at')
    .eq('user_id', 'cc374127-33e1-4a04-a5fc-cf68a1e4cc91');

  console.log('Total de registros candidates para Julia:', candidates?.length);

  for (const cand of candidates || []) {
    // Buscar nome da org do candidate
    let orgName = 'sem org_id';
    if (cand.org_id) {
      const { data: org } = await sb.from('organizations').select('name').eq('id', cand.org_id).single();
      orgName = org?.name || cand.org_id.substring(0, 8);
    }

    // Buscar candidaturas desse candidate_id
    const { data: apps } = await sb
      .from('applications')
      .select('id, jobs(title, org_id, organizations(name))')
      .eq('candidate_id', cand.id);

    console.log('\n---');
    console.log(`candidate.id: ${cand.id.substring(0,8)} | candidate.org_id: ${cand.org_id ? cand.org_id.substring(0,8) : 'NULL'} (${orgName}) | criado: ${cand.created_at?.substring(0,10)}`);

    if (apps && apps.length > 0) {
      apps.forEach(a => {
        const j = a.jobs;
        console.log(`  candidatura: ${a.id.substring(0,8)} | vaga: "${j?.title}" | org da vaga: ${j?.org_id?.substring(0,8)} (${j?.organizations?.name})`);
      });
    } else {
      console.log('  sem candidaturas');
    }
  }

  // Verificar entrevistas
  console.log('\n=== ENTREVISTAS ===');
  const ids = candidates?.map(c => c.id) || [];
  const { data: interviews } = await sb
    .from('interviews')
    .select('id, candidate_id, title, scheduled_at, status')
    .in('candidate_id', ids);
  console.log('Total entrevistas:', interviews?.length);
  interviews?.forEach(i => {
    console.log(`  ${i.id.substring(0,8)} | candidate: ${i.candidate_id.substring(0,8)} | ${i.title} | ${i.scheduled_at?.substring(0,16)} | ${i.status}`);
  });
}

run().catch(console.error);
