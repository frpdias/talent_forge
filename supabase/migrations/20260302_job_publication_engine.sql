-- Sprint 18: Job Publisher Engine — Publicação Multi-Canal
-- Tabelas: job_publication_channels, job_publications, job_publication_logs
-- Canais: gupy, vagas, linkedin, indeed, catho, infojobs, custom
-- Arquitetura: vaga canônica no TalentForge → adapters → plataformas externas

-- =====================================================================
-- 1. job_publication_channels — Canais configurados por organização
-- =====================================================================

CREATE TABLE IF NOT EXISTS job_publication_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  channel_code TEXT NOT NULL CHECK (channel_code IN (
    'gupy', 'vagas', 'linkedin', 'indeed', 'catho', 'infojobs', 'custom'
  )),
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  credentials JSONB DEFAULT '{}'::jsonb,    -- Tokens/API keys  
  config JSONB DEFAULT '{}'::jsonb,          -- Configurações específicas do canal
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, channel_code)
);

CREATE INDEX idx_pub_channels_org ON job_publication_channels(org_id);
CREATE INDEX idx_pub_channels_active ON job_publication_channels(org_id, is_active) WHERE is_active = TRUE;

COMMENT ON TABLE job_publication_channels IS 'Canais de publicação de vagas configurados por organização';
COMMENT ON COLUMN job_publication_channels.credentials IS 'Tokens/API keys — nunca expor em logs ou respostas de API';

-- =====================================================================
-- 2. job_publications — Status de publicação de cada vaga em cada canal
-- =====================================================================

CREATE TABLE IF NOT EXISTS job_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  channel_id UUID REFERENCES job_publication_channels(id) ON DELETE CASCADE NOT NULL,
  external_id TEXT,                           -- ID da vaga na plataforma externa
  external_url TEXT,                          -- URL pública da vaga no canal
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'publishing', 'published', 'failed', 'expired', 'unpublished'
  )),
  payload_sent JSONB,                        -- Payload enviado ao canal (auditoria)
  response_received JSONB,                   -- Resposta do canal (auditoria)
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, channel_id)
);

CREATE INDEX idx_pub_job ON job_publications(job_id);
CREATE INDEX idx_pub_channel ON job_publications(channel_id);
CREATE INDEX idx_pub_status ON job_publications(status);
CREATE INDEX idx_pub_job_status ON job_publications(job_id, status);

COMMENT ON TABLE job_publications IS 'Status de publicação de cada vaga em cada canal externo';

-- =====================================================================
-- 3. job_publication_logs — Audit trail de cada tentativa
-- =====================================================================

CREATE TABLE IF NOT EXISTS job_publication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID REFERENCES job_publications(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'create', 'publish', 'update', 'unpublish', 'expire', 'retry', 'webhook'
  )),
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  request_payload JSONB,
  response_payload JSONB,
  error_detail TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pub_logs_publication ON job_publication_logs(publication_id);
CREATE INDEX idx_pub_logs_created ON job_publication_logs(created_at DESC);

COMMENT ON TABLE job_publication_logs IS 'Audit trail — cada tentativa de publicação registrada individualmente';

-- =====================================================================
-- 4. RLS
-- =====================================================================

ALTER TABLE job_publication_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_publication_logs ENABLE ROW LEVEL SECURITY;

-- Channels: acesso via org_id direto
CREATE POLICY channels_org_access ON job_publication_channels
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = job_publication_channels.org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- Publications: acesso via jobs → org_members
CREATE POLICY publications_org_access ON job_publications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      JOIN org_members om ON om.org_id = j.org_id
      WHERE j.id = job_publications.job_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- Logs: acesso via publications → jobs → org_members
CREATE POLICY logs_org_access ON job_publication_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM job_publications jp
      JOIN jobs j ON j.id = jp.job_id
      JOIN org_members om ON om.org_id = j.org_id
      WHERE jp.id = job_publication_logs.publication_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON job_publication_channels TO authenticated;
GRANT SELECT, INSERT, UPDATE ON job_publications TO authenticated;
GRANT SELECT, INSERT ON job_publication_logs TO authenticated;

-- =====================================================================
-- 5. Trigger: updated_at automático
-- =====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_job_publication_channels_updated_at
  BEFORE UPDATE ON job_publication_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_publications_updated_at
  BEFORE UPDATE ON job_publications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
  RAISE NOTICE 'Sprint 18: job_publication_channels, job_publications, job_publication_logs criadas com RLS';
END $$;
