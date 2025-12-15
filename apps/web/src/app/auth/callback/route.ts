import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const userType = searchParams.get('type') || 'candidate';
  const next = searchParams.get('next') ?? '/onboarding';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Update user type if provided
      const { data: { user } } = await supabase.auth.getUser();
      if (user && userType) {
        await supabase.from('user_profiles').upsert({
          id: user.id,
          user_type: userType,
          full_name: user.user_metadata?.full_name || user.email,
        });
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_error`);
}
