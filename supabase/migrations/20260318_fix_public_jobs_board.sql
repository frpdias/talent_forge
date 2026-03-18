-- ============================================================
-- Fix: board global /vagas — exibir todas as vagas open+public
-- Problema: career_page_enabled bloqueava vagas da org "Candidatos"
--           e is_public=false nas vagas impediam exibição
-- Sprint 50 (2026-03-18)
-- ============================================================

-- 1. Corrigir vagas que estão open mas is_public = false
--    (vagas abertas devem ser visíveis no board público)
UPDATE jobs
SET is_public = TRUE
WHERE status = 'open'
  AND is_public = FALSE;

-- 2. Recriar v_public_jobs sem o filtro career_page_enabled
--    O board global deve mostrar todas as vagas open+public,
--    independente de a org ter career page ativa.
--    (career_page_enabled é relevante apenas para /careers/{slug})
CREATE OR REPLACE VIEW v_public_jobs AS
SELECT
  j.id,
  j.org_id,
  j.title,
  j.description,
  j.description_html,
  j.location,
  j.employment_type,
  j.work_modality,
  j.seniority::TEXT          AS seniority,
  j.salary_range,
  j.benefits,
  j.requirements,
  j.application_deadline,
  j.created_at,
  o.name                     AS org_name,
  o.slug                     AS org_slug,
  o.industry                 AS org_industry,
  o.logo_url                 AS org_logo_url,
  o.career_page_headline,
  o.career_page_logo_url,
  o.career_page_color,
  o.career_page_secondary_color,
  o.career_page_banner_url,
  o.career_page_about,
  o.career_page_whatsapp_url,
  o.career_page_instagram_url,
  o.career_page_linkedin_url,
  o.career_page_show_contact
FROM jobs j
JOIN organizations o ON o.id = j.org_id
WHERE
  j.is_public = TRUE
  AND j.status = 'open'
  AND o.status = 'active';

COMMENT ON VIEW v_public_jobs IS
  'Vagas públicas do board global (/vagas). Exige is_public=true, status=open e org ativa. NÃO exige career_page_enabled (esse filtro é exclusivo de /careers/{slug}).';
