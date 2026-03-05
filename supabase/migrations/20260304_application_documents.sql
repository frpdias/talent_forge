-- ============================================================
-- Migration: application_documents
-- Sprint 30 — Módulo de Documentação Admissional
-- Permite que candidatos em status 'in_documentation' enviem
-- documentos de admissão, que ficam visíveis ao recrutador.
-- ============================================================

-- 1. Tabela principal
-- ============================================================
CREATE TABLE IF NOT EXISTS application_documents (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_type   TEXT NOT NULL,
  -- Tipos válidos: rg | cpf | ctps | pis | comprovante_residencia |
  -- certidao_civil | foto | titulo_eleitor | reservista | escolaridade |
  -- cnh | aso | dados_bancarios | certidao_filhos | outros
  file_name       TEXT NOT NULL,
  bucket_path     TEXT NOT NULL, -- {application_id}/{document_type}_{timestamp}.{ext}
  uploaded_by     UUID REFERENCES auth.users(id),
  uploaded_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (application_id, document_type)
  -- Um documento por tipo por candidatura (upsert ao reenviar)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_application_documents_application_id
  ON application_documents(application_id);

CREATE INDEX IF NOT EXISTS idx_application_documents_uploaded_by
  ON application_documents(uploaded_by);

-- 2. RLS
-- ============================================================
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;

-- Candidato pode ver seus próprios documentos
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
        AND c.user_id = auth.uid()
    )
  );

-- Candidato pode inserir documentos em suas candidaturas
CREATE POLICY "Candidato pode inserir documentos"
  ON application_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM applications a
      JOIN candidates c ON c.id = a.candidate_id
      WHERE a.id = application_documents.application_id
        AND c.user_id = auth.uid()
        AND a.status = 'in_documentation'
    )
  );

-- Candidato pode atualizar (reenviar) documento
CREATE POLICY "Candidato pode atualizar documentos"
  ON application_documents FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- Recrutador pode ver documentos de candidaturas da sua org
CREATE POLICY "Recrutador pode ver documentos da org"
  ON application_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE a.id = application_documents.application_id
        AND is_org_member(j.org_id)
    )
  );

-- 3. Storage — bucket application-documents (privado)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'application-documents',
  'application-documents',
  false,
  10485760, -- 10MB por arquivo
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Candidato pode fazer upload em candidaturas onde é o dono
CREATE POLICY "Candidato pode fazer upload de documentos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'application-documents'
    AND auth.uid() IS NOT NULL
  );

-- Autenticados podem gerar signed URLs (candidato + recrutador)
CREATE POLICY "Autenticados podem ler documentos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'application-documents');

-- Candidato pode substituir arquivo (upsert)
CREATE POLICY "Candidato pode atualizar arquivo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'application-documents' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'application-documents');
