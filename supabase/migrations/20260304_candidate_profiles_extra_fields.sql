-- ============================================================
-- Migration: candidate_profiles — campos extras para o drawer do recrutador
-- Sprint 30 — Adiciona colunas ausentes usadas em ApplicationDetailsDrawer
-- ============================================================

ALTER TABLE candidate_profiles
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS experience_years INT;
