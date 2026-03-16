-- Função que limpa todas as referências FK a auth.users antes de deletar o usuário
-- Cada statement tem seu próprio bloco de exceção — um erro não interrompe os demais
-- Data: 2026-03-15

CREATE OR REPLACE FUNCTION admin_cleanup_user_references(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  BEGIN UPDATE application_events   SET actor_id    = NULL WHERE actor_id    = p_user_id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'application_events: %', SQLERRM; END;
  BEGIN UPDATE interviews            SET created_by  = NULL WHERE created_by  = p_user_id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'interviews: %', SQLERRM; END;
  BEGIN UPDATE invitations           SET invited_by  = NULL WHERE invited_by  = p_user_id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'invitations: %', SQLERRM; END;
  BEGIN UPDATE application_documents SET uploaded_by = NULL WHERE uploaded_by = p_user_id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'application_documents: %', SQLERRM; END;
  BEGIN UPDATE nr1_assessment_invitations SET invited_by = NULL WHERE invited_by = p_user_id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'nr1_assessment_invitations: %', SQLERRM; END;
  BEGIN UPDATE recruitment_module_activations SET activated_by = NULL WHERE activated_by = p_user_id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'recruitment_module_activations: %', SQLERRM; END;
  BEGIN UPDATE php_module_activations SET activated_by = NULL WHERE activated_by = p_user_id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'php_module_activations: %', SQLERRM; END;
  BEGIN UPDATE teams                 SET manager_id  = NULL WHERE manager_id  = p_user_id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'teams: %', SQLERRM; END;
  BEGIN UPDATE tfci_cycles           SET created_by  = NULL WHERE created_by  = p_user_id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'tfci_cycles: %', SQLERRM; END;
  BEGIN UPDATE nr1_risk_assessments  SET assessed_by = NULL WHERE assessed_by = p_user_id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'nr1_risk_assessments: %', SQLERRM; END;
  BEGIN UPDATE copc_metrics          SET created_by  = NULL WHERE created_by  = p_user_id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'copc_metrics: %', SQLERRM; END;
  BEGIN UPDATE copc_metric_entries   SET created_by  = NULL WHERE created_by  = p_user_id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'copc_metric_entries: %', SQLERRM; END;
  BEGIN UPDATE php_action_plans      SET assigned_to = NULL WHERE assigned_to = p_user_id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'php_action_plans assigned_to: %', SQLERRM; END;
  BEGIN UPDATE php_action_plans      SET created_by  = NULL WHERE created_by  = p_user_id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'php_action_plans created_by: %', SQLERRM; END;
  BEGIN UPDATE php_action_items      SET assigned_to = NULL WHERE assigned_to = p_user_id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'php_action_items: %', SQLERRM; END;

  -- NOT NULL: precisa deletar a linha
  BEGIN DELETE FROM assessment_invitations WHERE invited_by = p_user_id; EXCEPTION WHEN OTHERS THEN RAISE WARNING 'assessment_invitations: %', SQLERRM; END;
END;
$$;

REVOKE ALL ON FUNCTION admin_cleanup_user_references(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_cleanup_user_references(UUID) TO service_role;
