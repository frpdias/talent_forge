-- ============================================================================
-- Migration: Corrigir FK target_user_id em tfci_assessments
-- Data: 2026-02-02
-- Prioridade: P0 - CRÍTICO
-- Razão: FK aponta para auth.users mas deveria apontar para employees
-- ============================================================================

-- PROBLEMA: tfci_assessments.target_user_id REFERENCES auth.users(id)
-- CORREÇÃO: tfci_assessments.target_user_id deve REFERENCES employees(id)
-- JUSTIFICATIVA: Avaliações TFCI são para FUNCIONÁRIOS (employees), não users

-- ============================================================================
-- PASSO 1: Remover FK antiga (auth.users)
-- ============================================================================
ALTER TABLE tfci_assessments 
  DROP CONSTRAINT IF EXISTS tfci_assessments_target_user_id_fkey;

-- ============================================================================
-- PASSO 2: Criar FK nova (employees)
-- ============================================================================
ALTER TABLE tfci_assessments 
  ADD CONSTRAINT tfci_assessments_target_user_id_fkey 
  FOREIGN KEY (target_user_id) 
  REFERENCES employees(id) 
  ON DELETE CASCADE;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
DO $$
BEGIN
  -- Verificar se a FK existe e aponta para employees
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'tfci_assessments' 
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'target_user_id'
      AND ccu.table_name = 'employees'
  ) THEN
    RAISE NOTICE '✅ FK target_user_id agora aponta para employees.id';
  ELSE
    RAISE WARNING '⚠️ FK não foi criada corretamente';
  END IF;
END $$;

-- ============================================================================
-- QUERY DE VERIFICAÇÃO FINAL
-- ============================================================================
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'tfci_assessments' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'target_user_id';

-- Deve retornar:
-- tfci_assessments_target_user_id_fkey | target_user_id | employees | id
