-- Fix enum assessment_status conflict
-- Data: 2026-02-02
-- Prioridade: P0 - CRÍTICO
-- Razão: Duas migrations criaram o mesmo enum com valores diferentes

-- ============================================================================
-- DIAGNÓSTICO: Ver valores atuais do enum
-- ============================================================================
SELECT enumlabel, enumsortorder 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'assessment_status')
ORDER BY enumsortorder;

-- ============================================================================
-- SOLUÇÃO: Se necessário, recriar o enum com valores corretos
-- ============================================================================

DO $$ 
DECLARE
  has_draft BOOLEAN;
  has_active BOOLEAN;
  has_completed BOOLEAN;
  has_cancelled BOOLEAN;
  has_in_progress BOOLEAN;
  has_reviewed BOOLEAN;
BEGIN
  -- Verificar valores presentes
  SELECT 
    bool_or(enumlabel = 'draft'),
    bool_or(enumlabel = 'active'),
    bool_or(enumlabel = 'completed'),
    bool_or(enumlabel = 'cancelled'),
    bool_or(enumlabel = 'in_progress'),
    bool_or(enumlabel = 'reviewed')
  INTO has_draft, has_active, has_completed, has_cancelled, has_in_progress, has_reviewed
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'assessment_status');
  
  RAISE NOTICE 'Valores encontrados: draft=%, active=%, completed=%, cancelled=%, in_progress=%, reviewed=%',
    has_draft, has_active, has_completed, has_cancelled, has_in_progress, has_reviewed;
  
  -- Se tem valores errados (in_progress ou reviewed), adicionar os corretos se faltarem
  IF has_in_progress OR has_reviewed THEN
    -- Adicionar 'active' se não existir
    IF NOT has_active THEN
      ALTER TYPE assessment_status ADD VALUE IF NOT EXISTS 'active' AFTER 'draft';
      RAISE NOTICE '✅ Adicionado valor "active"';
    END IF;
    
    -- Adicionar 'cancelled' se não existir  
    IF NOT has_cancelled THEN
      ALTER TYPE assessment_status ADD VALUE IF NOT EXISTS 'cancelled';
      RAISE NOTICE '✅ Adicionado valor "cancelled"';
    END IF;
    
    RAISE WARNING '⚠️ Enum tem valores conflitantes (in_progress/reviewed). Valores corretos adicionados mas os antigos permanecem.';
    RAISE WARNING '💡 Recomendação: Ajustar tabelas que usam in_progress/reviewed para usar active/completed';
  ELSE
    RAISE NOTICE '✅ Enum assessment_status está correto: draft, active, completed, cancelled';
  END IF;
END $$;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================
SELECT 
  CASE 
    WHEN enumlabel IN ('draft', 'active', 'completed', 'cancelled') THEN '✅ CORRETO'
    ELSE '❌ REMOVER'
  END AS status,
  enumlabel, 
  enumsortorder 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'assessment_status')
ORDER BY enumsortorder;
