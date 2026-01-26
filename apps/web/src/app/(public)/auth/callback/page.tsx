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
      // New candidate after registration - go to onboarding
      console.log('✅ Novo candidato registrado - redirecionando para /cadastro');
      router.push('/cadastro');
    } else {
      // Recruiter/admin - go to dashboard
      console.log('✅ Recrutador registrado - redirecionando para /dashboard');
      router.push('/dashboard');
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
