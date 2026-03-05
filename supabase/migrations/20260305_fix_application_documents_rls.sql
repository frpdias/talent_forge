-- ============================================================
-- Migration: fix_application_documents_rls
-- Sprint 30 — Fix RLS + função SECURITY DEFINER para upsert
--
-- Problema: As políticas RLS de INSERT/UPDATE falhavam porque
-- o JOIN via candidates.user_id é instável (campo nullable) e
-- auth.email() não está disponível no contexto de policy.
--
-- Solução: Criar função SECURITY DEFINER que valida internamente
-- e executa o upsert com privilégios elevados. O frontend chama
-- .rpc('upsert_application_document', ...) em vez de .from().upsert().
-- ============================================================

-- 1. Permissões de tabela
GRANT SELECT ON TABLE application_documents TO authenticated;
-- INSERT/UPDATE via função RPC — não expor diretamente ao role

-- 2. Remover políticas antigas de INSERT/UPDATE (serão substituídas pela função)
DROP POLICY IF EXISTS "Candidato pode ver seus documentos" ON application_documents;
DROP POLICY IF EXISTS "Candidato pode inserir documentos" ON application_documents;
DROP POLICY IF EXISTS "Candidato pode atualizar documentos" ON application_documents;

-- 3. Recriar política SELECT (sem JOIN instável via candidates)
CREATE POLICY "Candidato pode ver seus documentos"
  ON application_documents FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM applications a
      JOIN candidates c ON c.id = a.candidate_id
      WHERE a.id = application_documents.application_id
        AND (
          c.user_id = auth.uid()
          OR (c.email IS NOT NULL AND c.email = (auth.jwt() ->> 'email'))
        )
    )
  );

-- 4. Função SECURITY DEFINER para upsert seguro
--    Valida: (a) candidatura pertence ao auth.uid() ou ao email do JWT
--            (b) status = 'in_documentation'
--    Depois executa o upsert como superuser interno.
CREATE OR REPLACE FUNCTION public.upsert_application_document(
  p_application_id  UUID,
  p_document_type   TEXT,
  p_file_name       TEXT,
  p_bucket_path     TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   UUID  := auth.uid();
  v_email TEXT  := auth.jwt() ->> 'email';
  v_ok    BOOL;
BEGIN
  -- Verificar que a candidatura pertence ao usuário logado
  SELECT EXISTS (
    SELECT 1
    FROM applications a
    JOIN candidates c ON c.id = a.candidate_id
    WHERE a.id = p_application_id
      AND a.status = 'in_documentation'
      AND (
        c.user_id = v_uid
        OR (c.email IS NOT NULL AND c.email = v_email)
      )
  ) INTO v_ok;

  IF NOT v_ok THEN
    RAISE EXCEPTION 'Acesso negado: candidatura não pertence ao usuário ou não está em fase de documentação'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Upsert executado com SECURITY DEFINER (ignora RLS)
  INSERT INTO application_documents (
    application_id, document_type, file_name, bucket_path,
    uploaded_by, uploaded_at
  )
  VALUES (
    p_application_id, p_document_type, p_file_name, p_bucket_path,
    v_uid, NOW()
  )
  ON CONFLICT (application_id, document_type)
  DO UPDATE SET
    file_name   = EXCLUDED.file_name,
    bucket_path = EXCLUDED.bucket_path,
    uploaded_by = EXCLUDED.uploaded_by,
    uploaded_at = EXCLUDED.uploaded_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_application_document(UUID, TEXT, TEXT, TEXT) TO authenticated;
