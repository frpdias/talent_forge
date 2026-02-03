-- Adiciona valores faltantes ao enum assessment_status
-- Data: 2026-02-02
-- Prioridade: P0 - CRÍTICO  
-- Razão: Enum não tem 'active' e 'cancelled', causando erro ao ativar ciclos TFCI

-- Adicionar 'active' após 'draft'
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'assessment_status')
    AND enumlabel = 'active'
  ) THEN
    ALTER TYPE assessment_status ADD VALUE 'active' AFTER 'draft';
    RAISE NOTICE '✅ Adicionado valor "active" ao enum assessment_status';
  ELSE
    RAISE NOTICE '✅ Valor "active" já existe';
  END IF;
END $$;

-- Adicionar 'cancelled' no final
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'assessment_status')
    AND enumlabel = 'cancelled'
  ) THEN
    ALTER TYPE assessment_status ADD VALUE 'cancelled';
    RAISE NOTICE '✅ Adicionado valor "cancelled" ao enum assessment_status';
  ELSE
    RAISE NOTICE '✅ Valor "cancelled" já existe';
  END IF;
END $$;

-- Verificar resultado final
SELECT enumlabel, enumsortorder 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'assessment_status')
ORDER BY enumsortorder;
