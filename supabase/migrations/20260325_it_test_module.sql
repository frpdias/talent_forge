-- =====================================================================
-- IT Test Module — Módulo de Teste de Informática
-- Sprint 61 — 2026-03-25
-- Fluxo:
--   Junior  → atribuído automaticamente a todos os candidatos
--   Pleno / Senior → recrutador ativa manualmente por candidato
--   Substituição: uma atribuição ativa por (candidate_id, org_id)
--   Score: it_test_results.score → candidate_technical_reviews.score_testes
-- =====================================================================

-- ── 1. Banco de questões ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS it_test_questions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nivel          TEXT        NOT NULL CHECK (nivel IN ('junior', 'pleno', 'senior')),
  categoria      TEXT        NOT NULL,
  pergunta       TEXT        NOT NULL,
  alternativa_a  TEXT        NOT NULL,
  alternativa_b  TEXT        NOT NULL,
  alternativa_c  TEXT        NOT NULL,
  alternativa_d  TEXT        NOT NULL,
  resposta       TEXT        NOT NULL CHECK (resposta IN ('A','B','C','D')),
  display_order  INT         NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: leitura pública (candidatos sem login precisam ver as perguntas via token)
ALTER TABLE it_test_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "it_test_questions: leitura pública"
  ON it_test_questions FOR SELECT
  USING (true);

-- ── 2. Atribuições ─────────────────────────────────────────────────────
-- Uma única atribuição ativa por candidato/org; substituição via ON CONFLICT
CREATE TABLE IF NOT EXISTS it_test_assignments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  UUID        NOT NULL REFERENCES candidates(id)     ON DELETE CASCADE,
  org_id        UUID        NOT NULL REFERENCES organizations(id)  ON DELETE CASCADE,
  nivel         TEXT        NOT NULL CHECK (nivel IN ('junior', 'pleno', 'senior')),
  assigned_by   UUID        REFERENCES user_profiles(user_id),   -- NULL = automático (Junior)
  token         TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, org_id)
);

ALTER TABLE it_test_assignments ENABLE ROW LEVEL SECURITY;

-- Recrutadores org-members veem/criam atribuições da sua org
CREATE POLICY "it_test_assignments: recrutador vê e cria"
  ON it_test_assignments FOR ALL
  USING  (is_org_member(org_id))
  WITH CHECK (is_org_member(org_id));

-- Acesso por token é tratado via service_role na API pública (sem RLS)

-- ── 3. Resultados ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS it_test_results (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id    UUID        NOT NULL UNIQUE REFERENCES it_test_assignments(id) ON DELETE CASCADE,
  candidate_id     UUID        NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  org_id           UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nivel            TEXT        NOT NULL CHECK (nivel IN ('junior', 'pleno', 'senior')),
  total_questions  INT         NOT NULL,
  correct_answers  INT         NOT NULL,
  score            NUMERIC(5,2) NOT NULL GENERATED ALWAYS AS (
                     ROUND((correct_answers::NUMERIC / NULLIF(total_questions, 0)) * 100, 2)
                   ) STORED,
  answers          JSONB       NOT NULL DEFAULT '{}',   -- { "question_id": "A"|"B"|"C"|"D" }
  completed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE it_test_results ENABLE ROW LEVEL SECURITY;

-- Recrutadores veem resultados da sua org
CREATE POLICY "it_test_results: recrutador vê"
  ON it_test_results FOR SELECT
  USING (is_org_member(org_id));

-- ── 4. Índices ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_it_test_questions_nivel     ON it_test_questions (nivel);
CREATE INDEX IF NOT EXISTS idx_it_test_assignments_cand    ON it_test_assignments (candidate_id, org_id);
CREATE INDEX IF NOT EXISTS idx_it_test_assignments_token   ON it_test_assignments (token);
CREATE INDEX IF NOT EXISTS idx_it_test_results_candidate   ON it_test_results (candidate_id, org_id);

-- ── 5. Permissões service_role ─────────────────────────────────────────
GRANT SELECT ON it_test_questions   TO service_role;
GRANT ALL    ON it_test_assignments TO service_role;
GRANT ALL    ON it_test_results     TO service_role;

-- ── 6. Permissões authenticated (leitura de questões) ──────────────────
GRANT SELECT ON it_test_questions   TO authenticated;
GRANT ALL    ON it_test_assignments TO authenticated;
GRANT ALL    ON it_test_results     TO authenticated;

-- ── FIM ────────────────────────────────────────────────────────────────
