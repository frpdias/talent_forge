-- =====================================================================
-- Fix: Habilitar career page e vagas públicas da FARTECH
-- 2026-03-09
-- =====================================================================

-- 1. Habilitar career page da org FARTECH
UPDATE organizations
SET career_page_enabled = TRUE
WHERE slug = 'fartech';

-- 2. Marcar todas as vagas abertas da FARTECH como públicas
UPDATE jobs
SET is_public = TRUE
WHERE org_id = (SELECT id FROM organizations WHERE slug = 'fartech')
  AND status = 'open';

-- 3. Verificar resultado
SELECT
  j.id,
  j.title,
  j.status,
  j.is_public,
  o.slug,
  o.career_page_enabled
FROM jobs j
JOIN organizations o ON o.id = j.org_id
WHERE o.slug = 'fartech';
