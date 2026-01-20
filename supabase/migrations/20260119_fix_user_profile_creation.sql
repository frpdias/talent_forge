-- Fix user profile creation to ensure email and user_type are always saved
-- Date: 2026-01-19

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update function to ensure email is always saved
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'candidate')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    user_type = COALESCE(EXCLUDED.user_type, user_profiles.user_type);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure RLS policies are correct
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- Create comprehensive policies
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add policy for service role to read all profiles
CREATE POLICY "Service role can read all profiles" ON public.user_profiles
  FOR SELECT
  USING (auth.jwt()->>'role' = 'service_role');
