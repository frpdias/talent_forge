import { Loader2 } from 'lucide-react';

/**
 * Fallback visual para a rota /auth/callback.
 * O fluxo OAuth real é tratado server-side em /api/auth/callback/route.ts
 * (troca de código PKCE + lookup de user_profiles + redirect inteligente).
 * Esta página só é exibida se o usuário navegar diretamente para esta URL.
 */
export default function AuthCallback() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[#141042] animate-spin mx-auto mb-4" />
        <p className="text-fluid-base text-[#666666]">Configurando sua conta...</p>
      </div>
    </div>
  );
}
