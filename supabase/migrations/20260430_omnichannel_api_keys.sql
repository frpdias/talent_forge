-- Migration: OmniChannel API Keys
-- Tokens de integração por organização para o OmniChannel Fartech

CREATE TABLE IF NOT EXISTS public.omnichannel_api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  api_key     TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  label       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS omnichannel_api_keys_org_idx ON public.omnichannel_api_keys(org_id);
CREATE INDEX IF NOT EXISTS omnichannel_api_keys_key_idx ON public.omnichannel_api_keys(api_key);

ALTER TABLE public.omnichannel_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can manage omnichannel keys" ON public.omnichannel_api_keys;
CREATE POLICY "Org members can manage omnichannel keys"
  ON public.omnichannel_api_keys FOR ALL
  TO authenticated
  USING (is_org_member(org_id))
  WITH CHECK (is_org_member(org_id));

-- Função SECURITY DEFINER para validar token sem expor a tabela diretamente
DROP FUNCTION IF EXISTS validate_omnichannel_key(text);
CREATE OR REPLACE FUNCTION validate_omnichannel_key(p_key text)
RETURNS TABLE(org_id uuid, valid boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id, (revoked_at IS NULL) AS valid
  FROM omnichannel_api_keys
  WHERE api_key = p_key
  LIMIT 1;
$$;

SELECT '✅ Tabela omnichannel_api_keys criada com RLS + função validate_omnichannel_key' AS status;
