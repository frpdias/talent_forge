-- Permite que usuários autenticados (recrutadores) gerem signed URLs e leiam
-- currículos do bucket 'resumes', mantendo a restrição de escrita apenas ao candidato dono.

-- Policy de leitura para autenticados
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can read resumes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes');
