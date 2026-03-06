-- =============================================
-- MIGRATION: Enhanced Notes System
-- Sprint 5: Sistema de Anotações Contextualizado
-- =============================================

-- 1. Adicionar campo 'context' às notas para identificar onde foram feitas
ALTER TABLE candidate_notes 
ADD COLUMN IF NOT EXISTS context TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Criar enum para contextos válidos (opcional, mas recomendado)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'note_context') THEN
    CREATE TYPE note_context AS ENUM ('profile', 'resume', 'assessments', 'interview', 'general');
  END IF;
END $$;

-- Alterar coluna para usar o enum (fazer backup antes em produção)
-- ALTER TABLE candidate_notes ALTER COLUMN context TYPE note_context USING context::note_context;

-- 2. Criar índice para buscar notas por contexto
CREATE INDEX IF NOT EXISTS candidate_notes_context_idx ON candidate_notes(context);
CREATE INDEX IF NOT EXISTS candidate_notes_author_idx ON candidate_notes(author_id);

-- 3. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_candidate_notes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS candidate_notes_updated_at ON candidate_notes;
CREATE TRIGGER candidate_notes_updated_at
  BEFORE UPDATE ON candidate_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_notes_timestamp();

-- 4. View para notas enriquecidas com info do autor
CREATE OR REPLACE VIEW v_candidate_notes_enriched AS
SELECT 
  cn.id,
  cn.candidate_id,
  cn.author_id,
  cn.note,
  cn.context,
  cn.created_at,
  cn.updated_at,
  up.full_name as author_name,
  up.email as author_email,
  c.full_name as candidate_name
FROM candidate_notes cn
LEFT JOIN user_profiles up ON up.id = cn.author_id
LEFT JOIN candidates c ON c.id = cn.candidate_id;

-- 5. Função para buscar notas com filtros
CREATE OR REPLACE FUNCTION get_candidate_notes_with_context(
  p_candidate_id UUID,
  p_context TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  candidate_id UUID,
  author_id UUID,
  author_name TEXT,
  note TEXT,
  context TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vn.id,
    vn.candidate_id,
    vn.author_id,
    vn.author_name,
    vn.note,
    vn.context,
    vn.created_at,
    vn.updated_at
  FROM v_candidate_notes_enriched vn
  WHERE vn.candidate_id = p_candidate_id
    AND (p_context IS NULL OR vn.context = p_context)
  ORDER BY vn.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Permissões
GRANT SELECT ON v_candidate_notes_enriched TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidate_notes_with_context(UUID, TEXT) TO authenticated;

-- 7. Comentários para documentação
COMMENT ON COLUMN candidate_notes.context IS 'Contexto onde a nota foi criada: profile, resume, assessments, interview, general';
COMMENT ON FUNCTION get_candidate_notes_with_context IS 'Retorna notas de um candidato, opcionalmente filtradas por contexto';

-- 8. Validação
SELECT '✅ Migration aplicada: Enhanced Notes System' as status;
SELECT COUNT(*) as total_notes FROM candidate_notes;
