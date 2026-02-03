-- Migration: Create AI usage tracking table
-- Sprint 13: OpenAI Enhanced

-- =====================================================
-- Tabela para tracking de uso da API OpenAI
-- =====================================================
CREATE TABLE IF NOT EXISTS php_ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    feature VARCHAR(100) NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para queries de relatórios
CREATE INDEX IF NOT EXISTS idx_php_ai_usage_org_id ON php_ai_usage(org_id);
CREATE INDEX IF NOT EXISTS idx_php_ai_usage_created_at ON php_ai_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_php_ai_usage_feature ON php_ai_usage(feature);
CREATE INDEX IF NOT EXISTS idx_php_ai_usage_org_created ON php_ai_usage(org_id, created_at DESC);

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE php_ai_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas membros da org podem ver uso
CREATE POLICY "php_ai_usage_select_org_members" ON php_ai_usage
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: API pode inserir (via service role)
CREATE POLICY "php_ai_usage_insert_service" ON php_ai_usage
    FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- Tabela para conversas com IA (histórico)
-- =====================================================
CREATE TABLE IF NOT EXISTS php_ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    conversation_id VARCHAR(100) NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]',
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_php_ai_conversations_org_id ON php_ai_conversations(org_id);
CREATE INDEX IF NOT EXISTS idx_php_ai_conversations_conversation_id ON php_ai_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_php_ai_conversations_user_id ON php_ai_conversations(user_id);

-- RLS
ALTER TABLE php_ai_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Usuário pode ver suas próprias conversas
CREATE POLICY "php_ai_conversations_select_owner" ON php_ai_conversations
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- Policy: Usuário pode inserir suas conversas
CREATE POLICY "php_ai_conversations_insert_owner" ON php_ai_conversations
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Usuário pode atualizar suas conversas
CREATE POLICY "php_ai_conversations_update_owner" ON php_ai_conversations
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =====================================================
-- Tabela para relatórios gerados
-- =====================================================
CREATE TABLE IF NOT EXISTS php_ai_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL, -- 'summary', 'detailed', 'executive', 'comparison'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    sections JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_php_ai_reports_org_id ON php_ai_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_php_ai_reports_type ON php_ai_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_php_ai_reports_created_at ON php_ai_reports(created_at);

-- RLS
ALTER TABLE php_ai_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Membros podem ver relatórios da org
CREATE POLICY "php_ai_reports_select_org_members" ON php_ai_reports
    FOR SELECT
    USING (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Membros podem criar relatórios
CREATE POLICY "php_ai_reports_insert_org_members" ON php_ai_reports
    FOR INSERT
    WITH CHECK (
        org_id IN (
            SELECT org_id FROM org_members 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- View para estatísticas de uso por org
-- =====================================================
CREATE OR REPLACE VIEW php_ai_usage_stats AS
SELECT 
    org_id,
    DATE_TRUNC('day', created_at) as usage_date,
    feature,
    COUNT(*) as request_count,
    SUM(input_tokens) as total_input_tokens,
    SUM(output_tokens) as total_output_tokens,
    SUM(cost_usd) as total_cost_usd
FROM php_ai_usage
GROUP BY org_id, DATE_TRUNC('day', created_at), feature;

-- =====================================================
-- Comentários
-- =====================================================
COMMENT ON TABLE php_ai_usage IS 'Tracking de uso da API OpenAI por organização';
COMMENT ON TABLE php_ai_conversations IS 'Histórico de conversas com IA';
COMMENT ON TABLE php_ai_reports IS 'Relatórios gerados pela IA';
COMMENT ON VIEW php_ai_usage_stats IS 'Estatísticas agregadas de uso de IA';
