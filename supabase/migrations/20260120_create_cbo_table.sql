-- MIGRATION: Create CBO (Classificação Brasileira de Ocupações) Reference Table
-- Date: 2026-01-20
-- Description: Creates a table to store CBO data locally for high performance and stability, 
-- compliant with "Option B" from architectural advice.
-- Includes Full-Text Search (FTS) capabilities.

-- ============================================
-- 1. Create Reference Table with FTS Trigger
-- ============================================
-- NOTE: Using Trigger instead of GENERATED ALWAYS AS because array_to_string/to_tsvector
-- can have immutability issues in some Postgres configurations for Generated Columns.

CREATE TABLE IF NOT EXISTS ref_cbo (
  code TEXT PRIMARY KEY, -- Código CBO (ex: '2124-05')
  title TEXT NOT NULL,   -- Título da Ocupação
  synonyms TEXT[],       -- Sinônimos (opcional, para enriquecer busca)
  fts_vector tsvector    -- Populated by trigger
);

-- Function to generate FTS vector
CREATE OR REPLACE FUNCTION ref_cbo_generate_fts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fts_vector := 
    setweight(to_tsvector('portuguese', NEW.title), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(array_to_string(NEW.synonyms, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep FTS updated
DROP TRIGGER IF EXISTS tsvectorupdate_ref_cbo ON ref_cbo;
CREATE TRIGGER tsvectorupdate_ref_cbo
BEFORE INSERT OR UPDATE ON ref_cbo
FOR EACH ROW EXECUTE FUNCTION ref_cbo_generate_fts();

-- ============================================
-- 2. Create Indexes for Performance
-- ============================================
-- B-Tree for exact lookups by code (already covered by PK, but good to be explicit if needed elsewhere)
-- GIN Index for Full-Text Search
CREATE INDEX IF NOT EXISTS ref_cbo_fts_idx ON ref_cbo USING GIN (fts_vector);
CREATE INDEX IF NOT EXISTS ref_cbo_title_trgm_idx ON ref_cbo USING GIN (title gin_trgm_ops); -- Requires pg_trgm extension if fuzzy search is needed

-- Ensure pg_trgm extension is available (useful for 'LIKE %...%' queries speedup too)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 3. Create RLS Policies
-- ============================================
ALTER TABLE ref_cbo ENABLE ROW LEVEL SECURITY;

-- Allow everyone (authenticated and anon) to read CBOs. 
-- Adjust if it should be restricted to authenticated users only.
CREATE POLICY "Everyone can read CBOs" ON ref_cbo
  FOR SELECT
  USING (true);

-- Only service_role (admins/scripts) can modify CBOs
CREATE POLICY "Only service_role can modify CBOs" ON ref_cbo
  FOR ALL
  USING (auth.uid() IS NULL); -- Usually service_role calls don't have auth.uid() or bypass RLS. 
                              -- Explicit denial for regular users:
CREATE POLICY "Deny modifications by users" ON ref_cbo
  FOR INSERT WITH CHECK (false);
CREATE POLICY "Deny updates by users" ON ref_cbo
  FOR UPDATE USING (false);
CREATE POLICY "Deny deletes by users" ON ref_cbo
  FOR DELETE USING (false);

-- ============================================
-- 4. Create Search Function (RPC)
-- ============================================
CREATE OR REPLACE FUNCTION search_cbo(
  search_term TEXT,
  limit_count INT DEFAULT 20
)
RETURNS TABLE (
  code TEXT,
  title TEXT,
  rank REAL
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    code,
    title,
    ts_rank(fts_vector, websearch_to_tsquery('portuguese', search_term)) as rank
  FROM ref_cbo
  WHERE 
    fts_vector @@ websearch_to_tsquery('portuguese', search_term)
    OR
    title ILIKE '%' || search_term || '%' -- Fallback for partial matches not caught by FTS stemming
  ORDER BY rank DESC, title ASC
  LIMIT limit_count;
$$;

-- Grant execution to everyone
GRANT EXECUTE ON FUNCTION search_cbo(TEXT, INT) TO anon, authenticated, service_role;
