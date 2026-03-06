-- Add php_module_active column to organizations table
-- This column tracks whether the PHP module (TFCI/NR-1/COPC) is active for a company

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS php_module_active BOOLEAN DEFAULT FALSE;

-- Add comment to column
COMMENT ON COLUMN public.organizations.php_module_active IS 'Indica se o módulo PHP está ativado para esta organização';

-- Index for faster queries filtering by php_module_active
CREATE INDEX IF NOT EXISTS idx_organizations_php_module_active 
ON public.organizations(php_module_active) 
WHERE php_module_active = TRUE;

-- Update existing organizations (companies with parent_org_id) to false by default
UPDATE public.organizations
SET php_module_active = FALSE
WHERE parent_org_id IS NOT NULL 
AND php_module_active IS NULL;
