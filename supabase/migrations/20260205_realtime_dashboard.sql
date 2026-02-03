-- Migration: Create PHP notifications and real-time tables
-- Sprint 14: Real-Time Dashboard

-- =====================================================
-- Tabela para notificações
-- =====================================================
CREATE TABLE IF NOT EXISTS php_notifications (
    id VARCHAR(100) PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Null means for all org users
    type VARCHAR(20) NOT NULL CHECK (type IN ('alert', 'info', 'success', 'warning')),
    category VARCHAR(20) NOT NULL CHECK (category IN ('tfci', 'nr1', 'copc', 'action_plan', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_php_notifications_org_id ON php_notifications(org_id);
CREATE INDEX IF NOT EXISTS idx_php_notifications_user_id ON php_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_php_notifications_read ON php_notifications(read);
CREATE INDEX IF NOT EXISTS idx_php_notifications_org_read ON php_notifications(org_id, read);
CREATE INDEX IF NOT EXISTS idx_php_notifications_created_at ON php_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_php_notifications_category ON php_notifications(category);

-- RLS
ALTER TABLE php_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Membros da org podem ver notificações (suas ou da org)
CREATE POLICY "php_notifications_select_org_members" ON php_notifications
    FOR SELECT
    USING (
        org_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
        AND (user_id IS NULL OR user_id = auth.uid())
    );

-- Policy: Service role pode inserir
CREATE POLICY "php_notifications_insert_service" ON php_notifications
    FOR INSERT
    WITH CHECK (true);

-- Policy: Usuários podem atualizar suas notificações (marcar como lida)
CREATE POLICY "php_notifications_update_own" ON php_notifications
    FOR UPDATE
    USING (
        org_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
        AND (user_id IS NULL OR user_id = auth.uid())
    )
    WITH CHECK (
        org_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- Tabela para tracking de presença de usuários
-- =====================================================
CREATE TABLE IF NOT EXISTS php_user_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    socket_id VARCHAR(100),
    page VARCHAR(255),
    is_online BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(org_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_php_user_presence_org_id ON php_user_presence(org_id);
CREATE INDEX IF NOT EXISTS idx_php_user_presence_user_id ON php_user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_php_user_presence_online ON php_user_presence(is_online);

-- RLS
ALTER TABLE php_user_presence ENABLE ROW LEVEL SECURITY;

-- Policy: Membros da org podem ver presença de outros membros
CREATE POLICY "php_user_presence_select_org_members" ON php_user_presence
    FOR SELECT
    USING (
        org_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Usuários podem atualizar sua própria presença
CREATE POLICY "php_user_presence_upsert_own" ON php_user_presence
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =====================================================
-- Tabela para comentários em tempo real
-- =====================================================
CREATE TABLE IF NOT EXISTS php_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('action_plan', 'action_item', 'assessment', 'cycle')),
    entity_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES php_comments(id) ON DELETE CASCADE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_php_comments_org_id ON php_comments(org_id);
CREATE INDEX IF NOT EXISTS idx_php_comments_entity ON php_comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_php_comments_user_id ON php_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_php_comments_parent_id ON php_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_php_comments_created_at ON php_comments(created_at DESC);

-- RLS
ALTER TABLE php_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Membros da org podem ver comentários
CREATE POLICY "php_comments_select_org_members" ON php_comments
    FOR SELECT
    USING (
        org_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Membros da org podem criar comentários
CREATE POLICY "php_comments_insert_org_members" ON php_comments
    FOR INSERT
    WITH CHECK (
        org_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

-- Policy: Usuários podem editar próprios comentários
CREATE POLICY "php_comments_update_own" ON php_comments
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy: Usuários podem deletar próprios comentários
CREATE POLICY "php_comments_delete_own" ON php_comments
    FOR DELETE
    USING (user_id = auth.uid());

-- =====================================================
-- Tabela para locks de edição
-- =====================================================
CREATE TABLE IF NOT EXISTS php_edit_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    locked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),
    
    UNIQUE(entity_type, entity_id)
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_php_edit_locks_entity ON php_edit_locks(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_php_edit_locks_expires ON php_edit_locks(expires_at);

-- RLS
ALTER TABLE php_edit_locks ENABLE ROW LEVEL SECURITY;

-- Policy: Membros da org podem ver locks
CREATE POLICY "php_edit_locks_select_org_members" ON php_edit_locks
    FOR SELECT
    USING (
        org_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Membros podem criar/deletar locks
CREATE POLICY "php_edit_locks_manage_org_members" ON php_edit_locks
    FOR ALL
    USING (
        org_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        org_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- Função para limpar locks expirados (cron job)
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_edit_locks()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM php_edit_locks
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comentários
-- =====================================================
COMMENT ON TABLE php_notifications IS 'Notificações em tempo real para usuários';
COMMENT ON TABLE php_user_presence IS 'Tracking de presença de usuários online';
COMMENT ON TABLE php_comments IS 'Comentários em tempo real em entidades PHP';
COMMENT ON TABLE php_edit_locks IS 'Locks de edição para evitar conflitos colaborativos';
COMMENT ON FUNCTION cleanup_expired_edit_locks IS 'Limpa locks de edição expirados (chamar via cron)';
