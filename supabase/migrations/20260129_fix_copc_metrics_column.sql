-- Fix COPC metrics table - corrigir nome da coluna 'source' para 'metric_source'
-- Data: 2026-01-29
-- Sprint 9: COPC Adapted

-- Verificar se a coluna 'source' existe (nome errado na migration original)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'copc_metrics' 
    AND column_name = 'source'
  ) THEN
    -- Renomear coluna 'source' para 'metric_source'
    ALTER TABLE copc_metrics RENAME COLUMN source TO metric_source;
    RAISE NOTICE 'Coluna source renomeada para metric_source';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'copc_metrics' 
    AND column_name = 'metric_source'
  ) THEN
    -- Se nenhuma das duas existe, criar a coluna correta
    ALTER TABLE copc_metrics 
    ADD COLUMN metric_source metric_source DEFAULT 'manual';
    RAISE NOTICE 'Coluna metric_source criada';
  ELSE
    RAISE NOTICE 'Coluna metric_source já existe';
  END IF;
END $$;

-- Garantir que a coluna tenha o tipo correto e default
ALTER TABLE copc_metrics 
ALTER COLUMN metric_source SET DEFAULT 'manual'::metric_source;

COMMENT ON COLUMN copc_metrics.metric_source IS 'Origem da métrica: manual, api, integration ou calculated';
