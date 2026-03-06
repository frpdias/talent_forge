-- =============================================================================
-- TALENT FORGE - Script de População de Dados Demo
-- =============================================================================
-- Execute este script no SQL Editor do Supabase para criar dados de demonstração
-- =============================================================================

-- 1. CRIAR ORGANIZAÇÃO DEMO
-- =============================================================================
INSERT INTO organizations (id, name, slug, plan, settings)
VALUES (
  'demo-org-0001-0001-000000000001'::uuid,
  'Talent Forge Demo',
  'talent-forge-demo',
  'premium',
  '{"max_jobs": 50, "max_users": 10, "features": ["disc", "color", "pi", "reports", "pipeline"]}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  plan = EXCLUDED.plan;

-- 2. CRIAR USUÁRIOS DEMO (via auth.users simulado)
-- NOTA: Os usuários devem ser criados manualmente via interface ou Supabase Auth
-- Este script cria apenas os profiles

-- 2.1 Profile do Admin Demo
INSERT INTO user_profiles (id, user_type, full_name, phone, location, bio, onboarding_completed)
VALUES (
  'demo-admin-0001-0001-000000000001'::uuid,
  'admin',
  'Admin Demo',
  '(11) 99999-0001',
  'São Paulo, SP',
  'Administrador do sistema Talent Forge Demo',
  true
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type;

-- 2.2 Profile do Recruiter Demo
INSERT INTO user_profiles (id, user_type, full_name, phone, location, bio, current_title, onboarding_completed)
VALUES (
  'demo-recruiter-0001-0001-000001'::uuid,
  'recruiter',
  'Maria Recrutadora',
  '(11) 99999-0002',
  'São Paulo, SP',
  'Especialista em R&S com 8 anos de experiência em tech',
  'Tech Recruiter Senior',
  true
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type;

-- 2.3 Vincular membros à organização
INSERT INTO org_members (org_id, user_id, role)
VALUES 
  ('demo-org-0001-0001-000000000001'::uuid, 'demo-admin-0001-0001-000000000001'::uuid, 'admin'),
  ('demo-org-0001-0001-000000000001'::uuid, 'demo-recruiter-0001-0001-000001'::uuid, 'member')
ON CONFLICT (org_id, user_id) DO NOTHING;

-- 3. CRIAR VAGAS DE EXEMPLO
-- =============================================================================
INSERT INTO jobs (id, org_id, title, description, location, work_model, contract_type, experience_level, salary_min, salary_max, status, cbo_code, cbo_title)
VALUES 
  -- Vaga 1: Desenvolvedor Frontend
  (
    'demo-job-0001-0001-000000000001'::uuid,
    'demo-org-0001-0001-000000000001'::uuid,
    'Desenvolvedor Frontend Pleno',
    'Buscamos um desenvolvedor frontend com experiência em React e TypeScript para integrar nosso time de produtos. O profissional será responsável por desenvolver interfaces modernas e responsivas, colaborando com designers e backend developers.',
    'São Paulo, SP',
    'hybrid',
    'clt',
    'mid',
    8000,
    12000,
    'open',
    '212405',
    'Desenvolvedor de sistemas de informação'
  ),
  -- Vaga 2: UX Designer
  (
    'demo-job-0001-0001-000000000002'::uuid,
    'demo-org-0001-0001-000000000001'::uuid,
    'UX Designer Senior',
    'Procuramos um UX Designer experiente para liderar projetos de design de experiência do usuário. Responsável por pesquisas, wireframes, protótipos e testes de usabilidade.',
    'Rio de Janeiro, RJ',
    'remote',
    'clt',
    'senior',
    12000,
    18000,
    'open',
    '262410',
    'Designer de interiores'
  ),
  -- Vaga 3: Backend Developer
  (
    'demo-job-0001-0001-000000000003'::uuid,
    'demo-org-0001-0001-000000000001'::uuid,
    'Desenvolvedor Backend Node.js',
    'Vaga para desenvolvedor backend com experiência em Node.js, APIs REST e bancos de dados. Trabalhará em microsserviços e integrações.',
    'Belo Horizonte, MG',
    'hybrid',
    'clt',
    'mid',
    9000,
    14000,
    'open',
    '212405',
    'Desenvolvedor de sistemas de informação'
  ),
  -- Vaga 4: Product Manager
  (
    'demo-job-0001-0001-000000000004'::uuid,
    'demo-org-0001-0001-000000000001'::uuid,
    'Product Manager',
    'Buscamos um PM para gerenciar o roadmap de produtos digitais, priorizar features e trabalhar com times multidisciplinares.',
    'São Paulo, SP',
    'hybrid',
    'clt',
    'senior',
    15000,
    22000,
    'open',
    '142115',
    'Gerente de desenvolvimento de produtos'
  ),
  -- Vaga 5: Data Analyst
  (
    'demo-job-0001-0001-000000000005'::uuid,
    'demo-org-0001-0001-000000000001'::uuid,
    'Analista de Dados',
    'Profissional para análise de dados, criação de dashboards e insights para tomada de decisão.',
    'Curitiba, PR',
    'remote',
    'clt',
    'mid',
    7000,
    11000,
    'open',
    '211205',
    'Estatístico'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status;

-- 4. CRIAR CANDIDATOS FICTÍCIOS
-- =============================================================================
INSERT INTO candidate_profiles (id, user_id, full_name, email, phone, location, headline, experience_years, skills)
VALUES 
  -- Candidato 1
  (
    'demo-cand-0001-0001-000000000001'::uuid,
    'demo-cand-user-0001-0001-000001'::uuid,
    'João Silva',
    'joao.silva@demo.talentforge.com',
    '(11) 98765-0001',
    'São Paulo, SP',
    'Desenvolvedor Frontend | React | TypeScript',
    5,
    ARRAY['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Next.js']
  ),
  -- Candidato 2
  (
    'demo-cand-0001-0001-000000000002'::uuid,
    'demo-cand-user-0001-0001-000002'::uuid,
    'Maria Santos',
    'maria.santos@demo.talentforge.com',
    '(21) 98765-0002',
    'Rio de Janeiro, RJ',
    'UX Designer | Figma | User Research',
    7,
    ARRAY['Figma', 'Adobe XD', 'User Research', 'Prototyping', 'Design Systems']
  ),
  -- Candidato 3
  (
    'demo-cand-0001-0001-000000000003'::uuid,
    'demo-cand-user-0001-0001-000003'::uuid,
    'Pedro Costa',
    'pedro.costa@demo.talentforge.com',
    '(31) 98765-0003',
    'Belo Horizonte, MG',
    'Backend Developer | Node.js | Python',
    4,
    ARRAY['Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'Docker', 'AWS']
  ),
  -- Candidato 4
  (
    'demo-cand-0001-0001-000000000004'::uuid,
    'demo-cand-user-0001-0001-000004'::uuid,
    'Ana Oliveira',
    'ana.oliveira@demo.talentforge.com',
    '(11) 98765-0004',
    'São Paulo, SP',
    'Product Manager | Agile | Data-Driven',
    8,
    ARRAY['Product Management', 'Agile', 'Scrum', 'Data Analysis', 'Roadmapping']
  ),
  -- Candidato 5
  (
    'demo-cand-0001-0001-000000000005'::uuid,
    'demo-cand-user-0001-0001-000005'::uuid,
    'Lucas Ferreira',
    'lucas.ferreira@demo.talentforge.com',
    '(41) 98765-0005',
    'Curitiba, PR',
    'Data Analyst | Python | SQL',
    3,
    ARRAY['Python', 'SQL', 'Power BI', 'Tableau', 'Excel', 'Statistics']
  ),
  -- Candidato 6
  (
    'demo-cand-0001-0001-000000000006'::uuid,
    'demo-cand-user-0001-0001-000006'::uuid,
    'Fernanda Lima',
    'fernanda.lima@demo.talentforge.com',
    '(11) 98765-0006',
    'São Paulo, SP',
    'Full Stack Developer | React | Node.js',
    6,
    ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker']
  ),
  -- Candidato 7
  (
    'demo-cand-0001-0001-000000000007'::uuid,
    'demo-cand-user-0001-0001-000007'::uuid,
    'Ricardo Mendes',
    'ricardo.mendes@demo.talentforge.com',
    '(21) 98765-0007',
    'Rio de Janeiro, RJ',
    'DevOps Engineer | Kubernetes | CI/CD',
    5,
    ARRAY['Kubernetes', 'Docker', 'AWS', 'CI/CD', 'Terraform', 'Linux']
  ),
  -- Candidato 8
  (
    'demo-cand-0001-0001-000000000008'::uuid,
    'demo-cand-user-0001-0001-000008'::uuid,
    'Carla Souza',
    'carla.souza@demo.talentforge.com',
    '(31) 98765-0008',
    'Belo Horizonte, MG',
    'QA Engineer | Automation | Selenium',
    4,
    ARRAY['Selenium', 'Cypress', 'Jest', 'Python', 'API Testing', 'Agile']
  ),
  -- Candidato 9
  (
    'demo-cand-0001-0001-000000000009'::uuid,
    'demo-cand-user-0001-0001-000009'::uuid,
    'Bruno Almeida',
    'bruno.almeida@demo.talentforge.com',
    '(11) 98765-0009',
    'São Paulo, SP',
    'Mobile Developer | React Native | Flutter',
    4,
    ARRAY['React Native', 'Flutter', 'iOS', 'Android', 'TypeScript', 'Firebase']
  ),
  -- Candidato 10
  (
    'demo-cand-0001-0001-000000000010'::uuid,
    'demo-cand-user-0001-0001-000010'::uuid,
    'Julia Martins',
    'julia.martins@demo.talentforge.com',
    '(41) 98765-0010',
    'Curitiba, PR',
    'Tech Lead | Architecture | Mentoring',
    10,
    ARRAY['System Design', 'Architecture', 'Leadership', 'Java', 'Cloud', 'Microservices']
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email;

-- 5. CRIAR CANDIDATURAS (APPLICATIONS)
-- =============================================================================
INSERT INTO applications (id, job_id, candidate_id, status, stage, source)
VALUES 
  -- Candidaturas para Vaga Frontend
  ('demo-app-0001-0001-000000000001'::uuid, 'demo-job-0001-0001-000000000001'::uuid, 'demo-cand-0001-0001-000000000001'::uuid, 'in_review', 'interview', 'linkedin'),
  ('demo-app-0001-0001-000000000002'::uuid, 'demo-job-0001-0001-000000000001'::uuid, 'demo-cand-0001-0001-000000000006'::uuid, 'pending', 'screening', 'site'),
  
  -- Candidaturas para Vaga UX
  ('demo-app-0001-0001-000000000003'::uuid, 'demo-job-0001-0001-000000000002'::uuid, 'demo-cand-0001-0001-000000000002'::uuid, 'in_review', 'proposal', 'linkedin'),
  
  -- Candidaturas para Vaga Backend
  ('demo-app-0001-0001-000000000004'::uuid, 'demo-job-0001-0001-000000000003'::uuid, 'demo-cand-0001-0001-000000000003'::uuid, 'in_review', 'interview', 'referral'),
  ('demo-app-0001-0001-000000000005'::uuid, 'demo-job-0001-0001-000000000003'::uuid, 'demo-cand-0001-0001-000000000007'::uuid, 'pending', 'screening', 'indeed'),
  
  -- Candidaturas para Vaga PM
  ('demo-app-0001-0001-000000000006'::uuid, 'demo-job-0001-0001-000000000004'::uuid, 'demo-cand-0001-0001-000000000004'::uuid, 'in_review', 'interview', 'linkedin'),
  ('demo-app-0001-0001-000000000007'::uuid, 'demo-job-0001-0001-000000000004'::uuid, 'demo-cand-0001-0001-000000000010'::uuid, 'pending', 'screening', 'site'),
  
  -- Candidaturas para Vaga Data Analyst
  ('demo-app-0001-0001-000000000008'::uuid, 'demo-job-0001-0001-000000000005'::uuid, 'demo-cand-0001-0001-000000000005'::uuid, 'in_review', 'interview', 'linkedin'),
  ('demo-app-0001-0001-000000000009'::uuid, 'demo-job-0001-0001-000000000005'::uuid, 'demo-cand-0001-0001-000000000008'::uuid, 'pending', 'applied', 'site')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  stage = EXCLUDED.stage;

-- 6. CRIAR ASSESSMENTS DISC COMPLETOS
-- =============================================================================
-- Criar assessments base
INSERT INTO assessments (id, candidate_id, assessment_type, status, completed_at)
VALUES 
  ('demo-assess-0001-0001-000000001'::uuid, 'demo-cand-0001-0001-000000000001'::uuid, 'disc', 'completed', NOW() - INTERVAL '5 days'),
  ('demo-assess-0001-0001-000000002'::uuid, 'demo-cand-0001-0001-000000000002'::uuid, 'disc', 'completed', NOW() - INTERVAL '4 days'),
  ('demo-assess-0001-0001-000000003'::uuid, 'demo-cand-0001-0001-000000000003'::uuid, 'disc', 'completed', NOW() - INTERVAL '3 days'),
  ('demo-assess-0001-0001-000000004'::uuid, 'demo-cand-0001-0001-000000000004'::uuid, 'disc', 'completed', NOW() - INTERVAL '2 days'),
  ('demo-assess-0001-0001-000000005'::uuid, 'demo-cand-0001-0001-000000000005'::uuid, 'disc', 'completed', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status;

-- Criar resultados DISC detalhados
INSERT INTO disc_assessments (id, assessment_id, dominance_score, influence_score, steadiness_score, conscientiousness_score, primary_profile, secondary_profile, description, strengths, challenges, work_style, communication_style)
VALUES 
  -- João Silva - Perfil I (Influência)
  (
    'demo-disc-0001-0001-000000000001'::uuid,
    'demo-assess-0001-0001-000000001'::uuid,
    45, 85, 55, 40,
    'I', 'S',
    'Profissional comunicativo e entusiasta, com forte capacidade de influenciar e motivar equipes.',
    ARRAY['Comunicação persuasiva', 'Criatividade', 'Networking', 'Otimismo'],
    ARRAY['Atenção aos detalhes', 'Organização', 'Foco em tarefas repetitivas'],
    'Colaborativo, prefere trabalhar em equipe e ambientes dinâmicos.',
    'Expressivo e animado, gosta de conversas e interações sociais.'
  ),
  -- Maria Santos - Perfil C (Consciência)
  (
    'demo-disc-0001-0001-000000000002'::uuid,
    'demo-assess-0001-0001-000000002'::uuid,
    35, 50, 45, 90,
    'C', 'S',
    'Profissional analítica e detalhista, com forte foco em qualidade e precisão.',
    ARRAY['Análise crítica', 'Atenção aos detalhes', 'Planejamento', 'Qualidade'],
    ARRAY['Tomada de decisão rápida', 'Delegação', 'Flexibilidade'],
    'Metódico e organizado, prefere processos bem definidos.',
    'Formal e preciso, prefere comunicação escrita e documentada.'
  ),
  -- Pedro Costa - Perfil D (Dominância)
  (
    'demo-disc-0001-0001-000000000003'::uuid,
    'demo-assess-0001-0001-000000003'::uuid,
    88, 45, 30, 55,
    'D', 'C',
    'Profissional orientado a resultados, com forte capacidade de liderança e tomada de decisão.',
    ARRAY['Liderança', 'Tomada de decisão', 'Foco em resultados', 'Autonomia'],
    ARRAY['Paciência', 'Empatia', 'Trabalho em equipe colaborativo'],
    'Direto e objetivo, prefere autonomia e desafios.',
    'Conciso e direto ao ponto, focado em resultados.'
  ),
  -- Ana Oliveira - Perfil D/I (Dominância/Influência)
  (
    'demo-disc-0001-0001-000000000004'::uuid,
    'demo-assess-0001-0001-000000004'::uuid,
    75, 70, 40, 45,
    'D', 'I',
    'Profissional dinâmica e persuasiva, com capacidade de liderar e influenciar equipes.',
    ARRAY['Liderança inspiradora', 'Comunicação', 'Visão estratégica', 'Negociação'],
    ARRAY['Atenção aos detalhes operacionais', 'Paciência com processos lentos'],
    'Ágil e orientada a metas, gosta de desafios e inovação.',
    'Assertiva e motivadora, inspira confiança nas equipes.'
  ),
  -- Lucas Ferreira - Perfil S (Estabilidade)
  (
    'demo-disc-0001-0001-000000000005'::uuid,
    'demo-assess-0001-0001-000000005'::uuid,
    30, 45, 85, 60,
    'S', 'C',
    'Profissional estável e confiável, com forte capacidade de cooperação e consistência.',
    ARRAY['Cooperação', 'Confiabilidade', 'Paciência', 'Consistência'],
    ARRAY['Adaptação a mudanças rápidas', 'Confronto', 'Tomada de decisão sob pressão'],
    'Consistente e metódico, prefere ambientes estáveis.',
    'Calmo e paciente, bom ouvinte e mediador.'
  )
ON CONFLICT (id) DO UPDATE SET
  primary_profile = EXCLUDED.primary_profile,
  secondary_profile = EXCLUDED.secondary_profile;

-- =============================================================================
-- FIM DO SCRIPT
-- =============================================================================
-- Após executar, os dados demo estarão disponíveis no sistema.
-- 
-- CREDENCIAIS DEMO (criar via Supabase Auth):
-- - Admin: demo-admin@talentforge.com
-- - Recruiter: demo-recruiter@talentforge.com  
-- - Candidato: demo-candidato@talentforge.com
-- =============================================================================
