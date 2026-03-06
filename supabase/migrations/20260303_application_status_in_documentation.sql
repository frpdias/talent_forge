-- Migration: Sprint 25 — Adiciona status 'in_documentation' ao enum application_status
-- Nova fase do pipeline: Em Documentação (entre in_process e hired)
--
-- IMPORTANTE: ALTER TYPE ADD VALUE não pode ser executado dentro de uma transação
-- com outros comandos que dependam do novo valor. Execute separado ou use BEGIN/COMMIT.

-- Adiciona o novo valor ao enum (após 'in_process', antes de 'hired')
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'in_documentation' AFTER 'in_process';

-- Atualiza o comentário da tabela para refletir o novo fluxo
COMMENT ON COLUMN applications.status IS
  'Fluxo: applied → in_process → in_documentation → hired | rejected';
