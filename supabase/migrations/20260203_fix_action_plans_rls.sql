-- Migration: Fix php_action_items RLS policies for INSERT and DELETE
-- Date: 2026-02-03
-- Description: Add missing INSERT and DELETE policies for action items

-- =====================================================================
-- FIX: php_action_items needs INSERT and DELETE policies
-- =====================================================================

-- Policy para INSERT: membros da org podem criar items
DROP POLICY IF EXISTS "members_insert_action_items" ON php_action_items;
CREATE POLICY "members_insert_action_items"
ON php_action_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM php_action_plans 
    WHERE php_action_plans.id = php_action_items.action_plan_id 
    AND is_org_member(php_action_plans.org_id)
  )
);

-- Policy para DELETE: apenas managers/admins podem deletar items
DROP POLICY IF EXISTS "managers_delete_action_items" ON php_action_items;
CREATE POLICY "managers_delete_action_items"
ON php_action_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM php_action_plans 
    WHERE php_action_plans.id = php_action_items.action_plan_id 
    AND auth.uid() IN (
      SELECT user_id FROM org_members 
      WHERE org_id = php_action_plans.org_id 
      AND role IN ('admin', 'owner', 'manager')
    )
  )
);

-- Also add INSERT policy for action_plans (was missing)
DROP POLICY IF EXISTS "members_insert_action_plans" ON php_action_plans;
CREATE POLICY "members_insert_action_plans"
ON php_action_plans FOR INSERT
WITH CHECK (is_org_member(org_id));

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON POLICY "members_insert_action_items" ON php_action_items IS 
'Permite que membros da organização criem items em planos de ação existentes';

COMMENT ON POLICY "managers_delete_action_items" ON php_action_items IS 
'Apenas gestores/admins podem deletar items de planos de ação';

COMMENT ON POLICY "members_insert_action_plans" ON php_action_plans IS 
'Membros da organização podem criar novos planos de ação';
