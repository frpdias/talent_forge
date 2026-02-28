'use client';

import { usePhpModule } from '@/lib/hooks/usePhpModule';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PhpDashboardPage() {
  const { isActive, loading } = usePhpModule();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isActive) {
      router.push('/php/activation');
    }
  }, [isActive, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141042]"></div>
      </div>
    );
  }

  if (!isActive) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1F4ED8]">
          Dashboard PHP
        </h1>
        <p className="text-[#666666] mt-2 tracking-wide">
          People, Health &amp; Performance — Visão integrada
        </p>
      </div>

      {/* Score PHP Integrado */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-1 bg-linear-to-br from-[#1F4ED8] to-[#1845B8] rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.12)] p-6 text-white">
          <div className="text-sm font-semibold opacity-90 mb-2">Score PHP Total</div>
          <div className="text-4xl font-bold mb-1">--</div>
          <div className="text-xs opacity-80">Aguardando dados</div>
        </div>

        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] border border-[#E5E5DC] p-6 hover:shadow-[0_8px_32px_rgba(20,16,66,0.10),0_2px_8px_rgba(20,16,66,0.06)] hover:-translate-y-px transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-[#666666]">TFCI</div>
            <div className="text-xs text-[#F97316] font-medium">30%</div>
          </div>
          <div className="text-2xl font-bold text-[#1F4ED8] mb-1">--</div>
          <div className="text-xs text-[#999999]">Comportamento</div>
        </div>

        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] border border-[#E5E5DC] p-6 hover:shadow-[0_8px_32px_rgba(20,16,66,0.10),0_2px_8px_rgba(20,16,66,0.06)] hover:-translate-y-px transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-[#666666]">NR-1</div>
            <div className="text-xs text-[#F97316] font-medium">40%</div>
          </div>
          <div className="text-2xl font-bold text-[#1F4ED8] mb-1">--</div>
          <div className="text-xs text-[#999999]">Riscos Psicossociais</div>
        </div>

        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] border border-[#E5E5DC] p-6 hover:shadow-[0_8px_32px_rgba(20,16,66,0.10),0_2px_8px_rgba(20,16,66,0.06)] hover:-translate-y-px transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-[#666666]">COPC</div>
            <div className="text-xs text-[#F97316] font-medium">30%</div>
          </div>
          <div className="text-2xl font-bold text-[#1F4ED8] mb-1">--</div>
          <div className="text-xs text-[#999999]">Performance</div>
        </div>
      </div>

      {/* Alertas & Ações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] border border-[#E5E5DC] p-6">
          <h3 className="text-lg font-bold text-[#1F4ED8] mb-4">Alertas Críticos</h3>
          <div className="text-center py-12 text-[#666666]">
            <svg className="w-16 h-16 mx-auto mb-4 text-[#E5E5DC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Nenhum alerta no momento</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] border border-[#E5E5DC] p-6">
          <h3 className="text-lg font-bold text-[#1F4ED8] mb-4">Planos de Ação</h3>
          <div className="text-center py-12 text-[#666666]">
            <svg className="w-16 h-16 mx-auto mb-4 text-[#E5E5DC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">Nenhum plano de ação ativo</p>
          </div>
        </div>
      </div>

      {/* Links Rápidos */}
      <div className="bg-[#FAFAF8] border border-[#E5E5DC] rounded-xl p-6">
        <h3 className="font-semibold text-[#141042] mb-4">Próximos Passos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E5E5DC] rounded-lg p-4">
            <div className="font-medium text-[#141042] mb-1">1. Configure Equipes</div>
            <p className="text-sm text-[#666666]">Crie times para análises coletivas</p>
          </div>
          <div className="bg-white border border-[#E5E5DC] rounded-lg p-4">
            <div className="font-medium text-[#141042] mb-1">2. Inicie Ciclo TFCI</div>
            <p className="text-sm text-[#666666]">Crie primeira avaliação comportamental</p>
          </div>
          <div className="bg-white border border-[#E5E5DC] rounded-lg p-4">
            <div className="font-medium text-[#141042] mb-1">3. Avalie Riscos NR-1</div>
            <p className="text-sm text-[#666666]">Mapeie riscos psicossociais</p>
          </div>
        </div>
      </div>
    </div>
  );
}
