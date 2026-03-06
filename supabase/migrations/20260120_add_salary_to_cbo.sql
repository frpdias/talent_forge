-- MIGRATION: Add Salary Info to CBO
-- Date: 2026-01-20
-- Description: Adds average salary range columns to the CBO reference table
-- to enable auto-filling salary suggestions in job forms.

ALTER TABLE ref_cbo
ADD COLUMN IF NOT EXISTS avg_salary_min NUMERIC,
ADD COLUMN IF NOT EXISTS avg_salary_max NUMERIC;
