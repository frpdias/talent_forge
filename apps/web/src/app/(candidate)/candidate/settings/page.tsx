'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Settings, LogOut, Calendar } from 'lucide-react';

export default function CandidateSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };


  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#141042]">Configurações</h1>
        <p className="text-xs sm:text-sm text-[#666666]">Preferências básicas da conta do candidato.</p>
      </header>

      <div className="rounded-2xl border border-[#E5E5DC] bg-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F0] text-[#141042]">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#141042]">Preferências</h2>
            <p className="text-xs text-[#999]">Ainda em construção.</p>
          </div>
        </div>
        <p className="text-sm text-[#666666]">
          Esta área será usada para notificações e privacidade. Nenhuma configuração adicional foi criada na
          arquitetura canônica.
        </p>
      </div>

      <div className="rounded-2xl border border-[#E5E5DC] bg-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F0] text-[#141042]">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#141042]">Google Agenda</h2>
            <p className="text-xs text-[#999]">Em breve</p>
          </div>
        </div>
        <p className="text-sm text-[#666666]">
          As entrevistas serão sincronizadas pelo recrutador. Você verá aqui apenas as reuniões agendadas com ele.
        </p>
        <button
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#E5E5DC] px-4 py-2 text-sm font-medium text-[#666666]"
          disabled
        >
          Conectar Google Agenda
        </button>
      </div>

      <button
        onClick={handleLogout}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-[#141042] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1f1a66] disabled:opacity-60"
      >
        <LogOut className="h-4 w-4" />
        {loading ? 'Saindo...' : 'Sair da conta'}
      </button>
    </div>
  );
}
