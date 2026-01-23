const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fjudsjzfnysaztcwlwgm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqdWRzanpmbnlzYXp0Y3dsd2dtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDU0MDc2MCwiZXhwIjoyMDgwMTE2NzYwfQ.z-Qc2Y6H_h9nkli5iiCqgFPvQmLf5eVKMJVTuce9MDk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedReportsData() {
  console.log('🌱 Populando dados para relatórios...\n');

  const orgId = '00000000-0000-0000-0000-000000000000';

  // 1. Criar vagas com pipeline stages
  console.log('📝 Criando vagas...');
  
  const jobs = [
    { title: 'Desenvolvedor Full Stack Sr', description: 'Vaga para dev full stack', status: 'open', org_id: orgId },
    { title: 'Designer UX/UI', description: 'Designer para produto digital', status: 'open', org_id: orgId },
  ];

  const { data: createdJobs, error: jobsError } = await supabase
    .from('jobs')
    .insert(jobs)
    .select();

  if (jobsError) {
    console.error('Erro ao criar vagas:', jobsError);
    return;
  }

  console.log(`✅ ${createdJobs.length} vagas criadas`);

  // 2. Criar pipeline stages para cada vaga
  console.log('\n📊 Criando pipeline stages...');
  
  for (const job of createdJobs) {
    const stages = [
      { name: 'Candidaturas', position: 0, job_id: job.id },
      { name: 'Triagem', position: 1, job_id: job.id },
      { name: 'Entrevista', position: 2, job_id: job.id },
      { name: 'Proposta', position: 3, job_id: job.id },
      { name: 'Contratação', position: 4, job_id: job.id },
    ];

    const { error: stagesError } = await supabase
      .from('pipeline_stages')
      .insert(stages);

    if (stagesError) {
      console.error(`Erro ao criar stages para ${job.title}:`, stagesError);
    }
  }

  console.log('✅ Pipeline stages criados');

  // 3. Buscar os stages criados
  const { data: allStages } = await supabase
    .from('pipeline_stages')
    .select('*')
    .in('job_id', createdJobs.map(j => j.id))
    .order('position');

  // 4. Criar candidatos
  console.log('\n👥 Criando candidatos...');
  
  const candidates = [
    { full_name: 'João Silva', email: 'joao.silva@example.com', owner_org_id: orgId },
    { full_name: 'Maria Santos', email: 'maria.santos@example.com', owner_org_id: orgId },
    { full_name: 'Pedro Oliveira', email: 'pedro.oliveira@example.com', owner_org_id: orgId },
    { full_name: 'Ana Costa', email: 'ana.costa@example.com', owner_org_id: orgId },
    { full_name: 'Carlos Ferreira', email: 'carlos.ferreira@example.com', owner_org_id: orgId },
  ];

  const { data: createdCandidates, error: candError } = await supabase
    .from('candidates')
    .insert(candidates)
    .select();

  if (candError) {
    console.error('Erro ao criar candidatos:', candError);
    return;
  }

  console.log(`✅ ${createdCandidates.length} candidatos criados`);

  // 5. Criar aplicações distribuídas nos stages
  console.log('\n📝 Criando applications...');
  
  const job1Stages = allStages.filter(s => s.job_id === createdJobs[0].id);
  
  const applications = [
    // Vaga 1 - Full Stack
    { candidate_id: createdCandidates[0].id, job_id: createdJobs[0].id, current_stage_id: job1Stages[0].id, status: 'in_process' },
    { candidate_id: createdCandidates[1].id, job_id: createdJobs[0].id, current_stage_id: job1Stages[0].id, status: 'in_process' },
    { candidate_id: createdCandidates[2].id, job_id: createdJobs[0].id, current_stage_id: job1Stages[1].id, status: 'in_process' },
    { candidate_id: createdCandidates[3].id, job_id: createdJobs[0].id, current_stage_id: job1Stages[2].id, status: 'in_process' },
    { candidate_id: createdCandidates[4].id, job_id: createdJobs[0].id, current_stage_id: job1Stages[3].id, status: 'in_process' },
  ];

  const { error: appsError } = await supabase
    .from('applications')
    .insert(applications);

  if (appsError) {
    console.error('Erro ao criar applications:', appsError);
    return;
  }

  console.log(`✅ ${applications.length} applications criadas`);

  // 6. Criar assessments
  console.log('\n🧠 Criando assessments...');
  
  const assessments = [
    {
      candidate_id: createdCandidates[0].id,
      candidate_user_id: createdCandidates[0].user_id || '00000000-0000-0000-0000-000000000001',
      assessment_type: 'big_five',
      status: 'completed',
      title: 'Avaliação Big Five - João Silva',
      description: 'Avaliação comportamental',
      completed_at: new Date().toISOString(),
      raw_score: {
        openness: 80,
        conscientiousness: 85,
        extraversion: 75,
        agreeableness: 90,
        neuroticism: 40
      },
      interpreted_score: {
        overall: 85,
        bigFive: {
          openness: 80,
          conscientiousness: 85,
          extraversion: 75,
          agreeableness: 90,
          neuroticism: 40
        }
      }
    },
    {
      candidate_id: createdCandidates[1].id,
      candidate_user_id: createdCandidates[1].user_id || '00000000-0000-0000-0000-000000000002',
      assessment_type: 'big_five',
      status: 'completed',
      title: 'Avaliação Big Five - Maria Santos',
      description: 'Avaliação comportamental',
      completed_at: new Date().toISOString(),
      raw_score: {
        openness: 75,
        conscientiousness: 80,
        extraversion: 70,
        agreeableness: 85,
        neuroticism: 45
      },
      interpreted_score: {
        overall: 78,
        bigFive: {
          openness: 75,
          conscientiousness: 80,
          extraversion: 70,
          agreeableness: 85,
          neuroticism: 45
        }
      }
    },
    {
      candidate_id: createdCandidates[2].id,
      candidate_user_id: createdCandidates[2].user_id || '00000000-0000-0000-0000-000000000003',
      assessment_type: 'disc',
      status: 'completed',
      title: 'Avaliação DISC - Pedro Oliveira',
      description: 'Avaliação DISC',
      completed_at: new Date().toISOString(),
      raw_score: {
        dominance: 70,
        influence: 85,
        steadiness: 75,
        conscientiousness: 80
      },
      interpreted_score: {
        overall: 82,
        disc: {
          dominance: 70,
          influence: 85,
          steadiness: 75,
          conscientiousness: 80
        }
      }
    },
  ];

  const { error: assessError } = await supabase
    .from('assessments')
    .insert(assessments);

  if (assessError) {
    console.error('Erro ao criar assessments:', assessError);
    console.log('Continuando sem assessments...');
  } else {
    console.log(`✅ ${assessments.length} assessments criados`);
  }

  console.log('\n✨ Dados de relatórios populados com sucesso!');
  console.log('\n📊 Resumo:');
  console.log(`   - ${createdJobs.length} vagas`);
  console.log(`   - ${createdCandidates.length} candidatos`);
  console.log(`   - ${applications.length} applications`);
  console.log(`   - ${assessments.length} assessments`);
  console.log(`\n🎯 Org ID: ${orgId}`);
}

seedReportsData().catch(console.error);
