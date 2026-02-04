-- Fix RLS policies for org_members table
-- Issue: 400 error when querying org_members with anon key
-- Root cause: is_org_member function or RLS policy causing issues

-- ============================================================================
-- PART 1: Recreate is_org_member function to be more robust
-- ============================================================================

-- NOTE: Using same parameter name "org" as the original function
-- PostgreSQL doesn't allow changing parameter names with CREATE OR REPLACE

CREATE OR REPLACE FUNCTION is_org_member(org UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM org_members 
    WHERE org_id = org 
    AND user_id = auth.uid()
    AND status = 'active'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- PART 2: Fix org_members RLS policies
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS org_members_select ON org_members;
DROP POLICY IF EXISTS org_members_insert ON org_members;
DROP POLICY IF EXISTS org_members_update ON org_members;
DROP POLICY IF EXISTS org_members_delete ON org_members;
DROP POLICY IF EXISTS "org_members_select" ON org_members;
DROP POLICY IF EXISTS "org_members_insert" ON org_members;
DROP POLICY IF EXISTS "org_members_update" ON org_members;
DROP POLICY IF EXISTS "org_members_delete" ON org_members;

-- SELECT: Users can see their own memberships
CREATE POLICY org_members_select ON org_members
  FOR SELECT 
  USING (user_id = auth.uid());

-- INSERT: Only admins of the org can add new members
CREATE POLICY org_members_insert ON org_members
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
      AND om.status = 'active'
    )
  );

-- UPDATE: Only admins can update memberships
CREATE POLICY org_members_update ON org_members
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
      AND om.status = 'active'
    )
  );

-- DELETE: Only admins can delete memberships
CREATE POLICY org_members_delete ON org_members
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
    )
  );

-- ============================================================================
-- PART 3: Fix organizations RLS policies for JOINs
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS orgs_select ON organizations;
DROP POLICY IF EXISTS organizations_select ON organizations;
DROP POLICY IF EXISTS orgs_insert ON organizations;
DROP POLICY IF EXISTS organizations_insert ON organizations;
DROP POLICY IF EXISTS orgs_update ON organizations;
DROP POLICY IF EXISTS organizations_update ON organizations;
DROP POLICY IF EXISTS orgs_delete ON organizations;
DROP POLICY IF EXISTS organizations_delete ON organizations;

-- SELECT: Users can see organizations they are members of
CREATE POLICY organizations_select ON organizations
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om 
      WHERE om.org_id = organizations.id 
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

-- INSERT: Anyone can create an organization (they become admin)
CREATE POLICY organizations_insert ON organizations
  FOR INSERT 
  WITH CHECK (true);

-- UPDATE: Only org admins can update
CREATE POLICY organizations_update ON organizations
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
    )
  );

-- DELETE: Only org admins can delete
CREATE POLICY organizations_delete ON organizations
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
      AND om.status = 'active'
    )
  );

-- ============================================================================
-- PART 4: Grant permissions
-- ============================================================================

GRANT SELECT ON org_members TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON org_members TO authenticated;

GRANT SELECT ON organizations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON organizations TO authenticated;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS policies for org_members and organizations have been updated.';
  RAISE NOTICE 'Users can now query their own memberships and the organizations they belong to.';
END $$;
