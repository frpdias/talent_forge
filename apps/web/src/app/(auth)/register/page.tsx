'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Building2, UserCircle, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') as 'recruiter' | 'candidate' | null;
  
  const [userType, setUserType] = useState<'recruiter' | 'candidate'>(typeParam || 'recruiter');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      setError('Você precisa aceitar os termos de uso.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      
      // Verificar se as variáveis de ambiente estão configuradas
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Configuração do Supabase não encontrada. Configure as variáveis de ambiente.');
      }
      
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: userType,
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?type=${userType}`,
        },
      });

      if (authError) {
        console.error('Supabase Auth Error:', authError);
        throw authError;
      }

      // Create user_profile record if user was created
      if (data.user && !data.user.identities?.length) {
        // User already exists, no need to create profile
        console.log('User already exists, skipping profile creation');
      } else if (data.user) {
        // Create user_profile for the new user
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            user_type: userType,
            full_name: fullName || email,
            email_verified: false,
            onboarding_completed: false,
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't throw - user auth was successful, profile can be created later
        }
      }
      
      console.log('Signup success:', data);
      setSuccess(true);
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Mapear mensagens de erro do Supabase para português
      const errorMessages: Record<string, string> = {
        'Failed to fetch': 'Erro de conexão. Verifique sua internet e tente novamente.',
        'User already registered': 'Este email já está cadastrado. Tente fazer login.',
        'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
        'Invalid email': 'Email inválido. Verifique o formato do email.',
        'Signup requires a valid password': 'Por favor, digite uma senha válida.',
        'Email address cannot be used as it is not authorized': 'Este domínio de email não é permitido.',
        'email_address_invalid': 'Este email não é válido. Use um email real.',
      };
      
      const errorCode = err.error_code || err.code || '';
      const errorMessage = err.message || '';
      
      const friendlyMessage = 
        errorMessages[errorCode] || 
        errorMessages[errorMessage] || 
        errorMessage || 
        'Erro ao criar conta. Tente novamente.';
      
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?type=${userType}`,
      },
    });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Check className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#141042] mb-3 sm:mb-4">Verifique seu email</h2>
          <p className="text-sm sm:text-base text-[#666666] mb-6 sm:mb-8">
            Enviamos um link de confirmação para <strong className="text-[#141042]">{email}</strong>
          </p>
          <Link 
            href="/login"
            className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 bg-[#141042] text-white rounded-xl font-medium hover:bg-[#1e1860] transition-colors text-sm sm:text-base"
          >
            Ir para Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#141042] relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-[#141042] via-[#1e1860] to-[#141042]" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/3 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/4 w-48 md:w-64 h-48 md:h-64 bg-[#D9D9C6] rounded-full blur-3xl" />
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
              {userType === 'recruiter' 
                ? 'Encontre os melhores talentos'
                : 'Encontre sua próxima oportunidade'}
            </h1>
            <p className="text-white/60 text-base lg:text-lg leading-relaxed">
              {userType === 'recruiter'
                ? 'Crie processos seletivos inteligentes com avaliações baseadas em IA.'
                : 'Descubra vagas compatíveis com seu perfil e acompanhe suas candidaturas.'}
            </p>
          </div>
          
          <p className="text-white/40 text-xs lg:text-sm">
            © 2025 FO Consulting. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-md py-4 sm:py-0">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6 sm:mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 sm:space-x-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#141042] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">FO</span>
              </div>
              <span className="text-xl sm:text-2xl font-semibold text-[#141042]">TalentForge</span>
            </Link>
          </div>

          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#141042] mb-2">Criar conta</h2>
            <p className="text-sm sm:text-base text-[#666666]">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-[#141042] font-medium hover:underline">
                Fazer login
              </Link>
            </p>
          </div>

          {/* Full name */}
          <div className="mb-4 sm:mb-5">
            <label className="block text-xs sm:text-sm font-medium text-[#141042] mb-1.5">
              Nome completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Digite seu nome completo"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-[#E5E5DC] rounded-xl text-sm sm:text-base outline-none focus:border-[#141042] focus:ring-2 focus:ring-[#141042]/10"
            />
          </div>

          {/* User Type Selection */}
          <div className="mb-6 sm:mb-8">
            <label className="block text-xs sm:text-sm font-medium text-[#141042] mb-2 sm:mb-3">Eu sou...</label>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setUserType('recruiter')}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  userType === 'recruiter'
                    ? 'border-[#141042] bg-[#141042]/5'
                    : 'border-[#E5E5DC] hover:border-[#141042]/30'
                }`}
              >
                <Building2 className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1.5 sm:mb-2 ${userType === 'recruiter' ? 'text-[#141042]' : 'text-[#666666]'}`} />
                <span className={`block text-xs sm:text-sm font-medium ${userType === 'recruiter' ? 'text-[#141042]' : 'text-[#666666]'}`}>
                  Recrutador
                </span>
              </button>
              <button
                type="button"
                onClick={() => setUserType('candidate')}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                  userType === 'candidate'
                    ? 'border-[#141042] bg-[#141042]/5'
                    : 'border-[#E5E5DC] hover:border-[#141042]/30'
                }`}
              >
                <UserCircle className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1.5 sm:mb-2 ${userType === 'candidate' ? 'text-[#141042]' : 'text-[#666666]'}`} />
                <span className={`block text-xs sm:text-sm font-medium ${userType === 'candidate' ? 'text-[#141042]' : 'text-[#666666]'}`}>
                  Candidato
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Google Register */}
          <button
            onClick={handleGoogleRegister}
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
          <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
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
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
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

            <label className="flex items-start space-x-2 sm:space-x-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-[#E5E5DC] text-[#141042] focus:ring-[#141042]" 
              />
              <span className="text-xs sm:text-sm text-[#666666]">
                Li e aceito os{' '}
                <a href="/terms" className="text-[#141042] font-medium hover:underline">Termos de Uso</a>
                {' '}e a{' '}
                <a href="/privacy" className="text-[#141042] font-medium hover:underline">Política de Privacidade</a>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !acceptTerms}
              className="w-full bg-[#141042] hover:bg-[#1e1860] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 sm:py-3.5 px-4 rounded-xl flex items-center justify-center transition-all glow-hover text-sm sm:text-base"
            >
              {loading ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Criar conta</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
