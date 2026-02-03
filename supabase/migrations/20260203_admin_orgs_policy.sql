-- Migration: Allow admins to view all organizations
-- This fixes the admin tenants page that needs to show all organizations

-- First, let's create a helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT user_type = 'admin'
    FROM user_profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Admins can view all organizations" ON organizations;

-- Create policy for admins to view all organizations
CREATE POLICY "Admins can view all organizations" ON organizations
  FOR SELECT
  USING (
    is_platform_admin() = true
    OR is_org_member(id)
  );

-- Also ensure the existing select policy doesn't block admins
-- Update the organizations_select policy to include admin check
DROP POLICY IF EXISTS organizations_select ON organizations;

CREATE POLICY organizations_select ON organizations
  FOR SELECT
  USING (
    is_platform_admin() = true
    OR EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = organizations.id
      AND org_members.user_id = auth.uid()
    )
  );

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION is_platform_admin() TO authenticated;
