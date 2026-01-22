-- Backfill DISC traits into assessments from disc_assessments

UPDATE assessments a
SET
  traits = jsonb_set(
    COALESCE(a.traits, '{}'::jsonb),
    '{disc}',
    jsonb_build_object(
      'D', da.dominance_score,
      'I', da.influence_score,
      'S', da.steadiness_score,
      'C', da.conscientiousness_score,
      'primary', da.primary_profile,
      'secondary', da.secondary_profile,
      'description', da.description
    ),
    true
  ),
  normalized_score = COALESCE(
    a.normalized_score,
    ROUND((COALESCE(da.dominance_score, 0) + COALESCE(da.influence_score, 0) + COALESCE(da.steadiness_score, 0) + COALESCE(da.conscientiousness_score, 0)) / 4.0)
  ),
  status = CASE
    WHEN a.status IS NULL OR a.status = 'in_progress' THEN 'completed'
    ELSE a.status
  END,
  completed_at = COALESCE(a.completed_at, da.created_at)
FROM disc_assessments da
WHERE da.assessment_id = a.id
  AND (a.traits IS NULL OR a.traits->'disc' IS NULL);
