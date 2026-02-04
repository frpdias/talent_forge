-- Fix RLS policies for php_module_activations table
-- Issue: 403 error when querying php_module_activations

-- ============================================================================
-- PART 1: Enable RLS and create policies for php_module_activations
-- ============================================================================

ALTER TABLE php_module_activations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS php_module_activations_select ON php_module_activations;
DROP POLICY IF EXISTS php_module_activations_insert ON php_module_activations;
DROP POLICY IF EXISTS php_module_activations_update ON php_module_activations;
DROP POLICY IF EXISTS php_module_activations_delete ON php_module_activations;

-- SELECT: Users can see activations for organizations they are members of
CREATE POLICY php_module_activations_select ON php_module_activations
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om 
      WHERE om.org_id = php_module_activations.org_id 
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- INSERT: Only org admins can activate the module
CREATE POLICY php_module_activations_insert ON php_module_activations
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = php_module_activations.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
      AND om.status = 'active'
    )
  );

-- UPDATE: Only org admins can update activations
CREATE POLICY php_module_activations_update ON php_module_activations
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = php_module_activations.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
      AND om.status = 'active'
    )
  );

-- DELETE: Only org admins can delete activations
CREATE POLICY php_module_activations_delete ON php_module_activations
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = php_module_activations.org_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
    )
  );

-- Grant permissions
GRANT SELECT ON php_module_activations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON php_module_activations TO authenticated;

-- ============================================================================
-- PART 2: Fix RLS for tfci_cycles table (ciclos TF-CI)
-- ============================================================================

ALTER TABLE tfci_cycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tfci_cycles_select ON tfci_cycles;
DROP POLICY IF EXISTS tfci_cycles_insert ON tfci_cycles;
DROP POLICY IF EXISTS tfci_cycles_update ON tfci_cycles;
DROP POLICY IF EXISTS tfci_cycles_delete ON tfci_cycles;

-- SELECT: Users can see cycles for their organizations
CREATE POLICY tfci_cycles_select ON tfci_cycles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om 
      WHERE om.org_id = tfci_cycles.org_id 
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- INSERT: Org members can create cycles
CREATE POLICY tfci_cycles_insert ON tfci_cycles
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = tfci_cycles.org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- UPDATE: Org members can update cycles
CREATE POLICY tfci_cycles_update ON tfci_cycles
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = tfci_cycles.org_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- DELETE: Only admins can delete cycles
CREATE POLICY tfci_cycles_delete ON tfci_cycles
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = tfci_cycles.org_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
    )
  );

GRANT SELECT ON tfci_cycles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON tfci_cycles TO authenticated;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS policies for php_module_activations and tfci_cycles have been created.';
END $$;
