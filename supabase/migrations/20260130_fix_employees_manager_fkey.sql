-- Migration: Fix employees self-reference foreign key
-- Data: 2026-01-30
-- Descrição: Adiciona nome explícito à constraint de manager_id para resolver erro de schema cache

-- Drop e recriar a constraint com nome explícito
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_manager_id_fkey;

ALTER TABLE employees 
ADD CONSTRAINT fk_employees_manager 
FOREIGN KEY (manager_id) 
REFERENCES employees(id) 
ON DELETE SET NULL;

-- Refresh do schema cache (caso necessário)
NOTIFY pgrst, 'reload schema';
