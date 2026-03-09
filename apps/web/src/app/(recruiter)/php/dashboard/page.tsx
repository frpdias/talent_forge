'use client';

import { usePhpModule } from '@/lib/hooks/usePhpModule';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Clock, Users } from 'lucide-react';

interface PhpScore {
  tfci_score: number | null;
  nr1_score: number | null;
  copc_score: number | null;
  php_score: number | null;
  alert_level: string | null;
  trend_vs_previous: string | null;
  score_date: string | null;
}

interface PhpActivity {
  nr1Count: number;
  tfciCount: number;
  copcCount: number;
  employeesCount: number;
}

function scoreColor(score: number | null) {
  if (score === null) return 'text-[#999999]';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-[#D97706]';
  return 'text-[#DC2626]';
}

function scoreBg(score: number | null) {
  if (score === null) return 'bg-[#F5F5F0]';
  if (score >= 80) return 'bg-green-50';
  if (score >= 60) return 'bg-yellow-50';
  return 'bg-red-50';
}

function TrendIcon({ trend }: { trend: string | null }) {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-[#999999]" />;
}

export default function PhpDashboardPage() {
  const { isActive, loading, orgId } = usePhpModule();
  const router = useRouter();
  const [score, setScore] = useState<PhpScore | null>(null);
  const [activity, setActivity] = useState<PhpActivity | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isActive) {
      router.push('/php/activation');
    }
  }, [isActive, loading, router]);

  useEffect(() => {
    if (!loading && isActive && orgId) {
      loadDashboardData(orgId);
    }
  }, [loading, isActive, orgId]);

  const loadDashboardData = async (organizationId: string) => {
    try {
      setDataLoading(true);
      const supabase = createClient();

      // Score integrado mais recente
      const { data: latestScore } = await supabase
        .from('php_integrated_scores')
        .select('tfci_score, nr1_score, copc_score, php_score, alert_level, trend_vs_previous, score_date')
        .eq('org_id', organizationId)
        .order('score_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      setScore(latestScore || null);

      // Contagens de atividade por pilar
      const [nr1Res, tfciRes, copcRes, empRes] = await Promise.all([
        supabase.from('nr1_risk_assessments').select('*', { count: 'exact', head: true }).eq('org_id', organizationId),
        supabase.from('tfci_cycles').select('*', { count: 'exact', head: true }).eq('org_id', organizationId),
        supabase.from('copc_metrics').select('*', { count: 'exact', head: true }).eq('org_id', organizationId),
        supabase.from('employees').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'active'),
      ]);

      setActivity({
        nr1Count: nr1Res.count ?? 0,
        tfciCount: tfciRes.count ?? 0,
        copcCount: copcRes.count ?? 0,
        employeesCount: empRes.count ?? 0,
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard PHP:', error);
    } finally {
      setDataLoading(false);
    }
  };

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

  const hasScore = score !== null;

  return (
    <div className="max-w-7xl mx-auto py-4 md:py-8 px-0">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1F4ED8]">
          Dashboard PHP
        </h1>
        <p className="text-[#666666] mt-2 tracking-wide">
          People, Health &amp; Performance — Visão integrada
        </p>
      </div>

      {/* Score PHP Integrado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Score Total */}
        <div className="lg:col-span-1 bg-linear-to-br from-[#1F4ED8] to-[#1845B8] rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.12)] p-6 text-white">
          <div className="text-sm font-semibold opacity-90 mb-2">Score PHP Total</div>
          {dataLoading ? (
            <div className="animate-pulse h-10 w-16 bg-white/20 rounded mb-1" />
          ) : (
            <>
              <div className="text-4xl font-bold mb-1">
                {hasScore && score.php_score !== null ? score.php_score.toFixed(1) : '--'}
              </div>
              {hasScore && score.trend_vs_previous && (
                <div className="flex items-center gap-1 opacity-80">
                  <TrendIcon trend={score.trend_vs_previous} />
                  <span className="text-xs capitalize">{score.trend_vs_previous === 'up' ? 'Subindo' : score.trend_vs_previous === 'down' ? 'Caindo' : 'Estável'}</span>
                </div>
              )}
              {!hasScore && (
                <div className="text-xs opacity-70 mt-1">Sem avaliações ainda</div>
              )}
            </>
          )}
          {hasScore && score.score_date && (
            <div className="text-xs opacity-60 mt-2">
              {new Date(score.score_date).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>

        {/* TFCI */}
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] border border-[#E5E5DC] p-6 hover:shadow-[0_8px_32px_rgba(20,16,66,0.10),0_2px_8px_rgba(20,16,66,0.06)] hover:-translate-y-px transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-[#666666]">TFCI</div>
            <div className="text-xs text-[#F97316] font-medium">30%</div>
          </div>
          {dataLoading ? (
            <div className="animate-pulse h-8 w-12 bg-[#E5E5DC] rounded" />
          ) : (
            <div className={`text-2xl font-bold mb-1 ${scoreColor(score?.tfci_score ?? null)}`}>
              {hasScore && score.tfci_score !== null ? score.tfci_score.toFixed(1) : '--'}
            </div>
          )}
          <div className="text-xs text-[#999999]">Comportamento</div>
          {activity && (
            <div className="mt-2 text-xs text-[#666666] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {activity.tfciCount} ciclo{activity.tfciCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* NR-1 */}
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] border border-[#E5E5DC] p-6 hover:shadow-[0_8px_32px_rgba(20,16,66,0.10),0_2px_8px_rgba(20,16,66,0.06)] hover:-translate-y-px transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-[#666666]">NR-1</div>
            <div className="text-xs text-[#F97316] font-medium">40%</div>
          </div>
          {dataLoading ? (
            <div className="animate-pulse h-8 w-12 bg-[#E5E5DC] rounded" />
          ) : (
            <div className={`text-2xl font-bold mb-1 ${scoreColor(score?.nr1_score ?? null)}`}>
              {hasScore && score.nr1_score !== null ? score.nr1_score.toFixed(1) : '--'}
            </div>
          )}
          <div className="text-xs text-[#999999]">Riscos Psicossociais</div>
          {activity && (
            <div className="mt-2 text-xs text-[#666666] flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {activity.nr1Count} avaliação{activity.nr1Count !== 1 ? 'ões' : ''}
            </div>
          )}
        </div>

        {/* COPC */}
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] border border-[#E5E5DC] p-6 hover:shadow-[0_8px_32px_rgba(20,16,66,0.10),0_2px_8px_rgba(20,16,66,0.06)] hover:-translate-y-px transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-[#666666]">COPC</div>
            <div className="text-xs text-[#F97316] font-medium">30%</div>
          </div>
          {dataLoading ? (
            <div className="animate-pulse h-8 w-12 bg-[#E5E5DC] rounded" />
          ) : (
            <div className={`text-2xl font-bold mb-1 ${scoreColor(score?.copc_score ?? null)}`}>
              {hasScore && score.copc_score !== null ? score.copc_score.toFixed(1) : '--'}
            </div>
          )}
          <div className="text-xs text-[#999999]">Performance</div>
          {activity && (
            <div className="mt-2 text-xs text-[#666666] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {activity.copcCount} métrica{activity.copcCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Status banner quando sem scores */}
      {!dataLoading && !hasScore && (
        <div className="mb-8 bg-[#FAFAF8] border border-[#E5E5DC] rounded-xl p-5 flex items-start gap-4">
          <div className="p-2 bg-[#F97316]/10 rounded-lg shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#F97316]" />
          </div>
          <div>
            <p className="font-medium text-[#141042]">Nenhum score calculado ainda</p>
            <p className="text-sm text-[#666666] mt-0.5">
              Os scores são calculados automaticamente após a realização de avaliações TFCI, NR-1 e COPC.
              Inicie um ciclo de avaliação para começar.
            </p>
          </div>
        </div>
      )}

      {/* Colaboradores ativos */}
      {activity && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-[#E5E5DC] rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-[#1F4ED8]" />
            </div>
            <div>
              <p className="text-xs text-[#666666]">Colaboradores Ativos</p>
              <p className="text-xl font-bold text-[#141042]">{activity.employeesCount}</p>
            </div>
          </div>
          <div className="bg-white border border-[#E5E5DC] rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-[#1F4ED8]/10 rounded-lg">
              <Clock className="w-5 h-5 text-[#1F4ED8]" />
            </div>
            <div>
              <p className="text-xs text-[#666666]">Ciclos TFCI</p>
              <p className="text-xl font-bold text-[#141042]">{activity.tfciCount}</p>
            </div>
          </div>
          <div className="bg-white border border-[#E5E5DC] rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <p className="text-xs text-[#666666]">Avaliações NR-1</p>
              <p className="text-xl font-bold text-[#141042]">{activity.nr1Count}</p>
            </div>
          </div>
          <div className="bg-white border border-[#E5E5DC] rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-[#666666]">Métricas COPC</p>
              <p className="text-xl font-bold text-[#141042]">{activity.copcCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Alertas & Ações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] border border-[#E5E5DC] p-6">
          <h3 className="text-lg font-bold text-[#1F4ED8] mb-4">Alertas Críticos</h3>
          {hasScore && score.alert_level && score.alert_level !== 'none' ? (
            <div className={`flex items-center gap-3 p-3 rounded-lg ${score.alert_level === 'critical' ? 'bg-red-50 border border-red-100' : 'bg-yellow-50 border border-yellow-100'}`}>
              <AlertTriangle className={`w-5 h-5 ${score.alert_level === 'critical' ? 'text-red-600' : 'text-[#D97706]'}`} />
              <p className={`text-sm font-medium ${score.alert_level === 'critical' ? 'text-red-700' : 'text-[#D97706]'}`}>
                Nível {score.alert_level === 'critical' ? 'Crítico' : score.alert_level === 'warning' ? 'Atenção' : 'Observação'} — Revise os pilares com score baixo
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-[#666666]">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-[#E5E5DC]" />
              <p className="text-sm">Nenhum alerta no momento</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] border border-[#E5E5DC] p-6">
          <h3 className="text-lg font-bold text-[#1F4ED8] mb-4">Planos de Ação</h3>
          <div className="text-center py-12 text-[#666666]">
            <svg className="w-12 h-12 mx-auto mb-3 text-[#E5E5DC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">Nenhum plano de ação ativo</p>
          </div>
        </div>
      </div>

      {/* Próximos Passos */}
      <div className="bg-[#FAFAF8] border border-[#E5E5DC] rounded-xl p-6">
        <h3 className="font-semibold text-[#141042] mb-4">Próximos Passos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className={`bg-white border rounded-lg p-4 ${activity?.tfciCount === 0 ? 'border-[#1F4ED8]/30' : 'border-[#E5E5DC]'}`}>
            <div className="flex items-center gap-2 mb-1">
              {activity?.tfciCount === 0 && <span className="w-2 h-2 rounded-full bg-[#1F4ED8]" />}
              <div className="font-medium text-[#141042]">1. Inicie Ciclo TFCI</div>
            </div>
            <p className="text-sm text-[#666666]">Crie a primeira avaliação comportamental</p>
          </div>
          <div className={`bg-white border rounded-lg p-4 ${activity?.nr1Count === 0 ? 'border-[#D97706]/30' : 'border-[#E5E5DC]'}`}>
            <div className="flex items-center gap-2 mb-1">
              {activity?.nr1Count === 0 && <span className="w-2 h-2 rounded-full bg-[#D97706]" />}
              <div className="font-medium text-[#141042]">2. Avalie Riscos NR-1</div>
            </div>
            <p className="text-sm text-[#666666]">Mapeie riscos psicossociais</p>
          </div>
          <div className={`bg-white border rounded-lg p-4 ${activity?.copcCount === 0 ? 'border-green-300' : 'border-[#E5E5DC]'}`}>
            <div className="flex items-center gap-2 mb-1">
              {activity?.copcCount === 0 && <span className="w-2 h-2 rounded-full bg-green-600" />}
              <div className="font-medium text-[#141042]">3. Registre Métricas COPC</div>
            </div>
            <p className="text-sm text-[#666666]">Monitore performance operacional</p>
          </div>
        </div>
      </div>
    </div>
  );
}
