-- ============================================================
-- Sprint 42 — Ativar sino de notificações
-- Triggers que alimentam a tabela `notifications` nos eventos
-- de recrutamento + habilita realtime no sino
-- ============================================================

-- ============================================================
-- 1. Habilitar Realtime na tabela notifications
-- ============================================================
ALTER publication supabase_realtime ADD TABLE public.notifications;

-- Garantir REPLICA IDENTITY FULL para que o realtime envie o payload completo
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- ============================================================
-- 2. Trigger: nova candidatura recebida
--    Dispara quando um registro é inserido em `applications`
-- ============================================================
CREATE OR REPLACE FUNCTION notify_new_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_title  TEXT;
  v_org_id     UUID;
  v_cand_name  TEXT;
  v_member     RECORD;
BEGIN
  -- Busca título e org da vaga
  SELECT title, org_id
    INTO v_job_title, v_org_id
    FROM jobs
   WHERE id = NEW.job_id;

  -- Busca nome do candidato
  SELECT full_name
    INTO v_cand_name
    FROM candidates
   WHERE id = NEW.candidate_id;

  -- Insere notificação para cada membro ativo da org (admin/manager/recruiter)
  FOR v_member IN
    SELECT user_id
      FROM org_members
     WHERE org_id = v_org_id
       AND status = 'active'
       AND role IN ('admin', 'manager', 'recruiter')
  LOOP
    INSERT INTO notifications (user_id, type, title, message, action_url)
    VALUES (
      v_member.user_id,
      'application',
      'Nova candidatura recebida',
      COALESCE(v_cand_name, 'Candidato') || ' se candidatou para "' || COALESCE(v_job_title, 'uma vaga') || '"',
      '/dashboard/pipeline'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_application ON applications;
CREATE TRIGGER trigger_notify_new_application
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_application();

-- ============================================================
-- 3. Trigger: candidato contratado (status → 'hired')
-- ============================================================
CREATE OR REPLACE FUNCTION notify_application_hired()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_title  TEXT;
  v_org_id     UUID;
  v_cand_name  TEXT;
  v_member     RECORD;
BEGIN
  IF NEW.status = 'hired' AND (OLD.status IS NULL OR OLD.status <> 'hired') THEN

    SELECT title, org_id
      INTO v_job_title, v_org_id
      FROM jobs
     WHERE id = NEW.job_id;

    SELECT full_name
      INTO v_cand_name
      FROM candidates
     WHERE id = NEW.candidate_id;

    FOR v_member IN
      SELECT user_id
        FROM org_members
       WHERE org_id = v_org_id
         AND status = 'active'
         AND role IN ('admin', 'manager', 'recruiter')
    LOOP
      INSERT INTO notifications (user_id, type, title, message, action_url)
      VALUES (
        v_member.user_id,
        'system',
        'Candidato contratado!',
        COALESCE(v_cand_name, 'Candidato') || ' foi contratado(a) para "' || COALESCE(v_job_title, 'uma vaga') || '"',
        '/dashboard/pipeline'
      );
    END LOOP;

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_application_hired ON applications;
CREATE TRIGGER trigger_notify_application_hired
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_hired();

-- ============================================================
-- 4. Trigger: assessment concluído
--    Dispara quando normalized_score é preenchido (assessment enviado)
-- ============================================================
CREATE OR REPLACE FUNCTION notify_assessment_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_title  TEXT;
  v_org_id     UUID;
  v_cand_name  TEXT;
  v_member     RECORD;
BEGIN
  -- Só dispara quando normalized_score passa de NULL para preenchido
  IF NEW.normalized_score IS NOT NULL AND OLD.normalized_score IS NULL THEN

    -- Busca vaga (pode ser NULL se assessment sem job_id)
    IF NEW.job_id IS NOT NULL THEN
      SELECT title, org_id
        INTO v_job_title, v_org_id
        FROM jobs
       WHERE id = NEW.job_id;
    END IF;

    -- Se não tem job, busca org via candidato (owner_org_id)
    IF v_org_id IS NULL THEN
      SELECT owner_org_id
        INTO v_org_id
        FROM candidates
       WHERE id = NEW.candidate_id;
    END IF;

    SELECT full_name
      INTO v_cand_name
      FROM candidates
     WHERE id = NEW.candidate_id;

    IF v_org_id IS NOT NULL THEN
      FOR v_member IN
        SELECT user_id
          FROM org_members
         WHERE org_id = v_org_id
           AND status = 'active'
           AND role IN ('admin', 'manager', 'recruiter')
      LOOP
        INSERT INTO notifications (user_id, type, title, message, action_url)
        VALUES (
          v_member.user_id,
          'assessment',
          'Assessment concluído',
          COALESCE(v_cand_name, 'Candidato') || ' completou um assessment'
            || CASE WHEN v_job_title IS NOT NULL THEN ' para "' || v_job_title || '"' ELSE '' END,
          '/dashboard/candidates'
        );
      END LOOP;
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_assessment_completed ON assessments;
CREATE TRIGGER trigger_notify_assessment_completed
  AFTER UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION notify_assessment_completed();

-- ============================================================
-- 5. Política de INSERT via service role (para os triggers)
--    Os triggers rodam como SECURITY DEFINER (superuser),
--    portanto bypassam RLS — nenhuma política adicional necessária.
--    Mas garantir que a política existente não bloqueie o UPDATE de leitura:
-- ============================================================
DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);
