-- Função auxiliar para resolver auth.users.id a partir do email
-- Usada no recruiter assessments API para resolver candidate_user_id
-- quando candidates.user_id é null e candidate_profiles não tem registro.
CREATE OR REPLACE FUNCTION public.get_auth_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id FROM auth.users WHERE email = p_email LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_user_id_by_email(text) TO service_role;
