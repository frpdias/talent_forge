-- Migration: candidates resume upload
-- Adiciona suporte a currículo na tabela candidates (fluxo do recrutador)
-- e ativa policy de INSERT no bucket 'resumes' para autenticados.

-- 1. Colunas na tabela candidates
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS resume_url TEXT,
  ADD COLUMN IF NOT EXISTS resume_filename TEXT;

-- 2. Policy de upload no bucket resumes para recrutadores autenticados
--    (bucket criado em 20260304_resumes_bucket_recruiter_read.sql)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated can upload resumes'
  ) THEN
    CREATE POLICY "Authenticated can upload resumes"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'resumes');
  END IF;
END $$;

SELECT '✅ candidates.resume_url + candidates.resume_filename adicionados' AS status;
SELECT '✅ Policy INSERT no bucket resumes criada para authenticated' AS status;
