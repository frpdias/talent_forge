-- Verificar se a aplicação, vaga e recrutador estão na mesma organização
SELECT 
  a.id as application_id,
  a.status,
  j.id as job_id,
  j.title as job_title,
  j.org_id as job_org_id,
  c.id as candidate_id,
  c.owner_org_id as candidate_org_id,
  -- Verificar qual usuário é o recrutador
  (SELECT array_agg(om.user_id) FROM org_members om WHERE om.org_id = j.org_id) as recruiters_in_org
FROM applications a
JOIN jobs j ON j.id = a.job_id
JOIN candidates c ON c.id = a.candidate_id
WHERE a.id = '006127a9-9eb3-4106-8dbc-5ebb8add8782';
