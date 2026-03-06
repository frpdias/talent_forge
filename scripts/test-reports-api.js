const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fjudsjzfnysaztcwlwgm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqdWRzanpmbnlzYXp0Y3dsd2dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU0MDc2MCwiZXhwIjoyMDgwMTE2NzYwfQ.z-Qc2Y6H_h9nkli5iiCqgFPvQmLf5eVKMJVTuce9MDk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReportsData() {
  console.log('🔍 Buscando dados reais do banco...\n');

  // 1. Buscar organizações
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(3);

  if (orgsError) {
    console.error('❌ Erro ao buscar organizações:', orgsError);
    return;
  }

  console.log('📊 Organizações encontradas:', orgs?.length);
  const orgId = orgs?.[0]?.id;
  console.log('🎯 Usando org_id:', orgId, '\n');

  if (!orgId) {
    console.log('❌ Nenhuma organização encontrada');
    return;
  }

  // 2. Buscar jobs
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, title, status')
    .eq('org_id', orgId);

  console.log('💼 Jobs encontrados:', jobs?.length);
  console.log('Jobs:', jobs);
  console.log('');

  // 3. Buscar candidatos
  const { data: candidates, error: candError } = await supabase
    .from('candidates')
    .select('id, full_name, email')
    .eq('owner_org_id', orgId);

  console.log('👥 Candidatos encontrados:', candidates?.length);
  console.log('Candidatos:', candidates);
  console.log('');

  // 4. Buscar applications
  const { data: applications, error: appsError } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      jobs!inner(org_id)
    `)
    .eq('jobs.org_id', orgId);

  console.log('📝 Applications encontradas:', applications?.length);
  console.log('Applications:', applications);
  console.log('');

  // 5. Buscar assessments
  const { data: assessments, error: assessError } = await supabase
    .from('assessments')
    .select(`
      id,
      normalized_score,
      assessment_kind,
      candidates!inner(owner_org_id)
    `)
    .eq('candidates.owner_org_id', orgId);

  console.log('🧠 Assessments encontrados:', assessments?.length);
  console.log('Assessments:', assessments);
  console.log('');

  // 6. Testar API de reports
  console.log('🌐 Testando API de relatórios...');
  
  try {
    const response = await fetch('http://localhost:3001/reports/dashboard', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsImtpZCI6IjdXS2tjNGQzK0t4bFhXTEoiLCJ0eXAiOiJKV1QifQ...',
        'x-org-id': orgId
      }
    });
    
    const data = await response.json();
    console.log('API Response:', data);
  } catch (err) {
    console.error('Erro ao chamar API:', err.message);
  }
}

testReportsData().catch(console.error);
