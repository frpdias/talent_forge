-- Candidate job detail and apply functions
-- Date: 2026-01-22

CREATE OR REPLACE FUNCTION public.get_open_job(p_job_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  location text,
  employment_type employment_type,
  seniority seniority_level,
  salary_min numeric,
  salary_max numeric,
  created_at timestamptz,
  requirements text,
  benefits text,
  department text,
  type text,
  external_apply_url text,
  cbo_code text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    j.id,
    j.title,
    j.description,
    j.location,
    j.employment_type,
    j.seniority,
    j.salary_min,
    j.salary_max,
    j.created_at,
    j.requirements,
    j.benefits,
    j.department,
    j.type,
    j.external_apply_url,
    j.cbo_code
  FROM public.jobs j
  WHERE j.id = p_job_id
    AND j.status = 'open'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_open_job(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.apply_to_job(p_job_id uuid)
RETURNS TABLE (
  application_id uuid,
  out_candidate_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_job_org uuid;
  v_candidate_id uuid;
  v_profile record;
  v_first_stage uuid;
BEGIN
  v_user_id := auth.uid();
  v_email := auth.email();

  SELECT org_id INTO v_job_org
  FROM public.jobs
  WHERE id = p_job_id
    AND status = 'open';

  IF v_job_org IS NULL THEN
    RAISE EXCEPTION 'Vaga não encontrada ou indisponível';
  END IF;

  SELECT id INTO v_candidate_id
  FROM public.candidates
  WHERE owner_org_id = v_job_org
    AND (user_id = v_user_id OR email = v_email)
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_candidate_id IS NULL THEN
    SELECT full_name, phone, current_title
    INTO v_profile
    FROM public.candidate_profiles
    WHERE user_id = v_user_id OR email = v_email
    LIMIT 1;

    INSERT INTO public.candidates (
      owner_org_id,
      full_name,
      email,
      phone,
      current_title,
      user_id,
      created_by
    ) VALUES (
      v_job_org,
      COALESCE(v_profile.full_name, v_email, 'Candidato'),
      v_email,
      v_profile.phone,
      v_profile.current_title,
      v_user_id,
      v_user_id
    )
    RETURNING id INTO v_candidate_id;
  ELSE
    UPDATE public.candidates
    SET user_id = COALESCE(user_id, v_user_id),
        email = COALESCE(email, v_email)
    WHERE id = v_candidate_id;
  END IF;

  SELECT id INTO v_first_stage
  FROM public.pipeline_stages
  WHERE job_id = p_job_id
  ORDER BY position ASC
  LIMIT 1;

  INSERT INTO public.applications (
    job_id,
    candidate_id,
    current_stage_id,
    status,
    created_by
  ) VALUES (
    p_job_id,
    v_candidate_id,
    v_first_stage,
    'applied',
    v_user_id
  )
  ON CONFLICT (job_id, candidate_id)
  DO UPDATE SET
    updated_at = now()
  RETURNING applications.id, applications.candidate_id
  INTO application_id, out_candidate_id;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_to_job(uuid) TO authenticated;
