-- Verificar se a aplicação tem created_by preenchido
SELECT 
  a.id as application_id,
  a.created_by,
  a.job_id,
  a.status,
  c.id as candidate_id,
  c.user_id as candidate_user_id,
  c.email as candidate_email,
  j.title as job_title
FROM public.applications a
JOIN public.candidates c ON c.id = a.candidate_id
JOIN public.jobs j ON j.id = a.job_id
WHERE a.id = '006127a9-9eb3-4106-8dbc-5ebb8add8782';
