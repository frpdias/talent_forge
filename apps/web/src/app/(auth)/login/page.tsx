'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Check if user is candidate by looking at candidate_profiles
      console.log('🔍 Buscando candidate_profiles para:', data.user.id);
      const { data: candidateProfile, error: profileError } = await supabase
        .from('candidate_profiles')
        .select('id, onboarding_completed')
        .eq('user_id', data.user.id)
        .single();

      console.log('📋 Resultado da busca:', candidateProfile);
      console.log('❌ Erro na busca:', profileError);

      // Default to candidate flow
      if (!candidateProfile) {
        // New candidate - go to onboarding
        console.log('➡️ Novo candidato - redirecionando para onboarding');
        router.push('/onboarding');
      } else if (candidateProfile.onboarding_completed) {
        // Completed onboarding - go to dashboard
        console.log('✅ Onboarding completo - redirecionando para /candidate');
        router.push('/candidate');
      } else {
        // Incomplete onboarding - go to onboarding
        console.log('⏳ Onboarding incompleto - redirecionando para onboarding');
        router.push('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#141042] relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-[#141042] via-[#1e1860] to-[#141042]" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 md:w-64 h-48 md:h-64 bg-[#D9D9C6] rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-8 lg:p-12 w-full">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-[#141042] font-bold text-xl">FO</span>
            </div>
            <span className="text-xl lg:text-2xl font-semibold text-white">TalentForge</span>
          </Link>
          
          <div className="max-w-md">
            <h1 className="text-3xl lg:text-4xl font-semibold text-white leading-tight mb-4 lg:mb-6">
              Bem-vindo de volta
            </h1>
            <p className="text-white/60 text-base lg:text-lg leading-relaxed">
              Acesse sua conta para continuar gerenciando talentos e processos seletivos.
            </p>
          </div>
          
          <p className="text-white/40 text-xs lg:text-sm">
            © 2025 FO Consulting. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8 sm:mb-10">
            <Link href="/" className="inline-flex items-center space-x-2 sm:space-x-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#141042] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">FO</span>
              </div>
              <span className="text-xl sm:text-2xl font-semibold text-[#141042]">TalentForge</span>
            </Link>
          </div>

          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#141042] mb-2">Entrar</h2>
            <p className="text-sm sm:text-base text-[#666666]">
              Não tem uma conta?{' '}
              <Link href="/register" className="text-[#141042] font-medium hover:underline">
                Criar conta
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center space-x-2 sm:space-x-3 px-4 py-3 sm:py-3.5 border border-[#E5E5DC] rounded-xl hover:bg-[#F5F5F0] transition-colors mb-4 sm:mb-6"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-[#141042] font-medium text-sm sm:text-base">Continuar com Google</span>
          </button>

          <div className="relative mb-4 sm:mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E5DC]" />
            </div>
            <div className="relative flex justify-center text-xs sm:text-sm">
              <span className="px-4 bg-[#FAFAF8] text-[#666666]">ou</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#141042] mb-1.5 sm:mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#666666]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-white border border-[#E5E5DC] rounded-xl text-sm sm:text-base text-[#141042] placeholder-[#999] focus:outline-none focus:border-[#141042] focus:ring-2 focus:ring-[#141042]/10 transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#141042] mb-1.5 sm:mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#666666]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 bg-white border border-[#E5E5DC] rounded-xl text-sm sm:text-base text-[#141042] placeholder-[#999] focus:outline-none focus:border-[#141042] focus:ring-2 focus:ring-[#141042]/10 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#141042]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-[#E5E5DC] text-[#141042] focus:ring-[#141042]" />
                <span className="text-xs sm:text-sm text-[#666666]">Lembrar de mim</span>
              </label>
              <Link href="/forgot-password" className="text-xs sm:text-sm text-[#141042] font-medium hover:underline">
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#141042] hover:bg-[#1e1860] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 sm:py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all glow-hover text-sm sm:text-base"
            >
              {loading ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
