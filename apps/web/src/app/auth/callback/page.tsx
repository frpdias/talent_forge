'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get('type') || 'candidate';

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const supabase = createClient();
    
    // Wait for session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth callback error:', error);
      router.push('/login');
      return;
    }

    if (!session) {
      router.push('/login');
      return;
    }

    // Check user type from metadata
    const actualUserType = session.user.user_metadata?.user_type || userType;

    if (actualUserType === 'candidate') {
      // Check if candidate has completed onboarding
      const { data: profile } = await supabase
        .from('candidate_profiles')
        .select('onboarding_completed')
        .eq('user_id', session.user.id)
        .single();

      if (!profile || !profile.onboarding_completed) {
        router.push('/onboarding');
      } else {
        router.push('/candidate');
      }
    } else {
      // Recruiter flow (existing logic)
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[#141042] animate-spin mx-auto mb-4" />
        <p className="text-fluid-base text-[#666666]">Configurando sua conta...</p>
      </div>
    </div>
  );
}
