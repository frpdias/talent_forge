-- Fix RLS policies for org_members and organizations tables
-- Issue: Circular dependency + JOIN queries failing with 403
-- 
-- Root causes:
-- 1. org_members_select uses is_org_member(org_id) which queries org_members → circular
-- 2. Frontend queries do JOINs: org_members?select=organizations(name) 
--    This requires organizations table RLS to allow access based on org_members relationship
--
-- Solution:
-- 1. Simplify org_members_select to only check user_id = auth.uid()
-- 2. Add policy to organizations to allow access via org_members relationship

-- ============================================================================
-- PART 1: Fix org_members policies
-- ============================================================================

-- Drop and recreate org_members_select policy WITHOUT is_org_member()
DROP POLICY IF EXISTS org_members_select ON org_members;

-- Allow users to see their own memberships (no circular dependency)
CREATE POLICY org_members_select ON org_members
  FOR SELECT 
  USING (user_id = auth.uid());

-- Keep other org_members policies (insert, update, delete can use is_org_member)
-- These are safe because SELECT policy above allows reading org_members first

DROP POLICY IF EXISTS org_members_insert ON org_members;
CREATE POLICY org_members_insert ON org_members
  FOR INSERT 
  WITH CHECK (is_org_member(org_id));

DROP POLICY IF EXISTS org_members_update ON org_members;
CREATE POLICY org_members_update ON org_members
  FOR UPDATE 
  USING (is_org_member(org_id));

DROP POLICY IF EXISTS org_members_delete ON org_members;
CREATE POLICY org_members_delete ON org_members
  FOR DELETE 
  USING (is_org_member(org_id));

-- ============================================================================
-- PART 2: Fix organizations policies to allow JOINs from org_members
-- ============================================================================

-- Drop existing organizations SELECT policy
DROP POLICY IF EXISTS orgs_select ON organizations;
DROP POLICY IF EXISTS organizations_select ON organizations;

-- New policy: Allow users to see organizations where they are members
-- This enables queries like: org_members?select=organizations(name)
CREATE POLICY organizations_select ON organizations
  FOR SELECT 
  USING (
    -- Option 1: User is a direct member of this organization
    is_org_member(id)
    OR
    -- Option 2: This org is referenced in a org_members row that belongs to the user
    -- This is needed for JOINs from org_members queries
    EXISTS (
      SELECT 1 FROM org_members om 
      WHERE om.org_id = organizations.id 
      AND om.user_id = auth.uid()
    )
  );

-- Keep other organizations policies unchanged
DROP POLICY IF EXISTS orgs_insert ON organizations;
DROP POLICY IF EXISTS organizations_insert ON organizations;
CREATE POLICY organizations_insert ON organizations
  FOR INSERT 
  WITH CHECK (true); -- Allow creation; restrict via application logic if needed

DROP POLICY IF EXISTS orgs_update ON organizations;
DROP POLICY IF EXISTS organizations_update ON organizations;
CREATE POLICY organizations_update ON organizations
  FOR UPDATE 
  USING (is_org_member(id));

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Test 1: Check that policies were created
-- SELECT tablename, policyname, cmd FROM pg_policies 
-- WHERE tablename IN ('org_members', 'organizations') 
-- ORDER BY tablename, policyname;

-- Test 2: Verify user can query their org_members with organization JOIN
-- SELECT om.user_id, om.role, o.name as org_name
-- FROM org_members om
-- JOIN organizations o ON o.id = om.org_id
-- WHERE om.user_id = auth.uid();
