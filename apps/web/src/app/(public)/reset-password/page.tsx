'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { KeyRound, Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase injeta o token no hash da URL — precisamos aguardar a sessão ser estabelecida
  useEffect(() => {
    const supabase = createClient();

    const checkSession = async () => {
      // Deixa o Supabase processar o hash/code da URL de recovery
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      } else {
        // Aguarda o evento de sessão (recovery flow via hash)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' && session) {
            setSessionReady(true);
            subscription.unsubscribe();
          }
        });
      }
      setValidating(false);
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError('Não foi possível redefinir a senha. O link pode ter expirado.');
        return;
      }

      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabel = ['', 'Fraca', 'Média', 'Forte'];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-400', 'bg-emerald-500'];

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1 text-2xl font-bold mb-2">
            <span style={{ color: '#141042' }}>TALENT</span>
            <span style={{ color: '#10B981' }}>FORGE</span>
          </div>
          <p className="text-sm text-[#666666]">Plataforma de Recrutamento Inteligente</p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(20,16,66,0.08)] border border-[#E5E5DC] p-8">
          {validating ? (
            <div className="text-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#141042] mx-auto mb-3" />
              <p className="text-sm text-[#666666]">Validando link...</p>
            </div>
          ) : done ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-[#141042] mb-2">Senha redefinida!</h2>
              <p className="text-sm text-[#666666]">
                Sua senha foi atualizada com sucesso. Redirecionando para o login...
              </p>
            </div>
          ) : !sessionReady ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="h-8 w-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-[#141042] mb-2">Link inválido ou expirado</h2>
              <p className="text-sm text-[#666666] mb-6">
                Solicite um novo link de recuperação de senha.
              </p>
              <a
                href="/forgot-password"
                className="inline-block px-5 py-2.5 bg-[#141042] text-white text-sm font-medium rounded-lg hover:bg-[#1a164f] transition-colors"
              >
                Solicitar novo link
              </a>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 bg-[rgba(20,16,66,0.06)] rounded-xl flex items-center justify-center mb-4">
                  <KeyRound className="h-6 w-6 text-[#141042]" />
                </div>
                <h2 className="text-xl font-bold text-[#141042] mb-1">Redefinir senha</h2>
                <p className="text-sm text-[#666666]">Escolha uma nova senha para sua conta.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nova senha */}
                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-1.5">
                    Nova senha
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      autoFocus
                      className="w-full pl-10 pr-10 py-2.5 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042] focus:border-transparent text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#141042]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Barra de força */}
                  {password.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-[#E5E5DC]'}`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-medium ${strength === 1 ? 'text-red-500' : strength === 2 ? 'text-amber-500' : 'text-emerald-600'}`}>
                        {strengthLabel[strength]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirmar senha */}
                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-1.5">
                    Confirmar nova senha
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repita a nova senha"
                      required
                      className="w-full pl-10 pr-10 py-2.5 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042] focus:border-transparent text-sm transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#141042]"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirm.length > 0 && password !== confirm && (
                    <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || password.length < 8 || password !== confirm}
                  className="w-full py-2.5 bg-[#141042] text-white font-medium rounded-lg hover:bg-[#1a164f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Redefinir senha'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
