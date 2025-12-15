'use client';

import { Suspense, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#141042] animate-spin mx-auto mb-4" />
            <p className="text-fluid-base text-[#666666]">Configurando sua conta...</p>
          </div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get('type') || 'candidate';

  const handleCallback = useCallback(async () => {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      router.push('/login');
      return;
    }

    const actualUserType = session.user.user_metadata?.user_type || userType;

    if (actualUserType === 'candidate') {
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
      router.push('/admin');
    }
  }, [router, userType]);

  useEffect(() => {
    handleCallback();
  }, [handleCallback]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[#141042] animate-spin mx-auto mb-4" />
        <p className="text-fluid-base text-[#666666]">Configurando sua conta...</p>
      </div>
    </div>
  );
}
