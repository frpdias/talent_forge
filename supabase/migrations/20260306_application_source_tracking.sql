-- =====================================================================
-- Sprint D: Application Source Tracking
-- Rastrear origem das candidaturas (canal + UTM params)
-- 2026-03-06
-- =====================================================================

-- Adiciona colunas de rastreamento de origem na tabela applications
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS source TEXT,            -- canal: 'career_page' | 'direct' | 'linkedin' | 'gupy' | 'referral' | 'other'
  ADD COLUMN IF NOT EXISTS utm_source TEXT,        -- ex: 'linkedin', 'google', 'newsletter'
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,        -- ex: 'cpc', 'organic', 'email'
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT;      -- ex: 'dev-senior-jan26', 'recrutamento-ti'

-- Índice para analytics por source
CREATE INDEX IF NOT EXISTS applications_source_idx ON applications(source)
  WHERE source IS NOT NULL;

-- Índice composto para relatórios de UTM
CREATE INDEX IF NOT EXISTS applications_utm_idx ON applications(utm_source, utm_medium)
  WHERE utm_source IS NOT NULL;

-- Comentários descritivos
COMMENT ON COLUMN applications.source IS 'Canal de origem da candidatura: career_page | direct | linkedin | gupy | referral | other';
COMMENT ON COLUMN applications.utm_source IS 'UTM source: origem do tráfego (ex: linkedin, google)';
COMMENT ON COLUMN applications.utm_medium IS 'UTM medium: mídia do tráfego (ex: cpc, organic, email)';
COMMENT ON COLUMN applications.utm_campaign IS 'UTM campaign: nome da campanha de recrutamento';
