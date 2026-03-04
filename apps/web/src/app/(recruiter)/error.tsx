'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function RecruiterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('[RecruiterError]', error.digest ?? error.message);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
      <div className="bg-white border border-[#E5E5DC] rounded-xl shadow-sm p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-12 h-12 text-[#D97706]" />
        </div>
        <h1 className="text-2xl font-bold text-[#141042] mb-2">Algo deu errado</h1>
        <p className="text-[#666666] mb-6 text-sm">
          Ocorreu um erro inesperado. Nossa equipe foi notificada.
        </p>
        {error.digest && (
          <p className="text-xs text-[#999999] mb-6 font-mono">ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1554] transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
