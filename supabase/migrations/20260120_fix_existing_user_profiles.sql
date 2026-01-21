-- Fix existing users without profiles
-- This migration ensures all existing auth.users have corresponding user_profiles entries

-- Insert missing user profiles for existing users
INSERT INTO user_profiles (id, full_name, user_type, email_verified, onboarding_completed, created_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email
  ) as full_name,
  COALESCE(
    (au.raw_user_meta_data->>'user_type')::user_type,
    'candidate'
  ) as user_type,
  au.email_confirmed_at IS NOT NULL as email_verified,
  COALESCE((au.raw_user_meta_data->>'onboarding_completed')::boolean, false) as onboarding_completed,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Log the results
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Created % missing user profiles', inserted_count;
END $$;
