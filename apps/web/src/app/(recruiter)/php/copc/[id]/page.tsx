'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { createClient, getAuthToken } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';

interface CopcMetric {
  id: string;
  org_id: string;
  team_id?: string;
  metric_date: string;
  overall_performance_score: number;
  // Quality (35%)
  quality_score: number;
  rework_rate: number;
  // Efficiency (20%)
  process_adherence_rate: number;
  average_handle_time: number;
  // Effectiveness (20%)
  first_call_resolution_rate: number;
  delivery_consistency: number;
  // CX (15%)
  customer_satisfaction_score: number;
  nps_score: number;
  // People (10%)
  absenteeism_rate: number;
  engagement_score: number;
  operational_stress_level: number;
  notes?: string;
  created_at: string;
  [key: string]: unknown;
}

const COPC_CATEGORIES = [
  { key: 'quality_score', label: 'Qualidade', weight: 35, description: 'Quality Score (QA principal)' },
  { key: 'process_adherence_rate', label: 'Eficiência', weight: 20, description: 'Aderência a processos operacionais' },
  { key: 'first_call_resolution_rate', label: 'Efetividade', weight: 20, description: 'Resolução na primeira chamada / entrega' },
  { key: 'customer_satisfaction_score', label: 'Customer Experience', weight: 15, description: 'Satisfação do cliente (CSAT)' },
  { key: 'people_inverted', label: 'People (Bem-estar)', weight: 10, description: 'Bem-estar da equipe (100 - absenteísmo)' },
];

export default function CopcMetricDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentOrg, phpContextOrgId } = useOrgStore();
  const effectiveOrgId = phpContextOrgId || currentOrg?.id;
  const [metric, setMetric] = useState<CopcMetric | null>(null);
  const [loading, setLoading] = useState(true);
  const metricId = params?.id as string;

  useEffect(() => {
    if (effectiveOrgId && metricId) {
      loadMetric();
    }
  }, [effectiveOrgId, metricId]);

  const loadMetric = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();

      if (!token || !effectiveOrgId) {
        console.error('Token ou organização não encontrados');
        return;
      }

      const response = await fetch(
        `/api/v1/php/copc/metrics/${metricId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-org-id': effectiveOrgId!,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMetric(data);
      } else {
        console.error('Erro ao carregar métrica:', response.status);
      }
    } catch (error) {
      console.error('Error loading metric:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return { bg: 'bg-green-500', text: 'text-green-700', label: 'Excelente' };
    if (score >= 70) return { bg: 'bg-blue-500', text: 'text-blue-700', label: 'Bom' };
    if (score >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-700', label: 'Atenção' };
    return { bg: 'bg-red-500', text: 'text-red-700', label: 'Crítico' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] p-6 flex items-center justify-center">
        <p className="text-[#666666]">Carregando métrica...</p>
      </div>
    );
  }

  if (!metric) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-[#E5E5DC] mx-auto mb-4" />
          <p className="text-[#666666] mb-4">Métrica não encontrada</p>
          <button
            onClick={() => router.push('/php/copc')}
            className="text-[#141042] hover:text-[#1a1557] font-medium"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  const overallColor = getScoreColor(metric.overall_performance_score);
  const derivedStatus = metric.overall_performance_score >= 85 ? 'excellent'
    : metric.overall_performance_score >= 70 ? 'good'
    : metric.overall_performance_score >= 50 ? 'warning'
    : 'critical';

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/php/copc')}
            className="flex items-center gap-2 text-[#666666] hover:text-[#141042] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Métricas COPC
          </button>

          <div className="bg-white rounded-lg border border-[#E5E5DC] p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#141042] mb-2">
                  Métrica COPC - {new Date(metric.metric_date).toLocaleDateString('pt-BR')}
                </h1>
                <div className="flex items-center gap-4 text-sm text-[#666666]">
                  <span>Registrado em: {new Date(metric.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className={`px-6 py-3 rounded-lg ${overallColor.bg} bg-opacity-10 border-2 border-${overallColor.bg.replace('bg-', '')}`}>
                  <p className="text-xs text-[#666666] mb-1">Score Geral</p>
                  <p className={`text-3xl font-bold ${overallColor.text}`}>
                    {metric.overall_performance_score.toFixed(1)}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${
                  derivedStatus === 'excellent' ? 'bg-green-100 text-green-800' :
                  derivedStatus === 'good' ? 'bg-blue-100 text-blue-800' :
                  derivedStatus === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {overallColor.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg border border-[#E5E5DC] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#141042] mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Breakdown por Categoria
          </h2>

          <div className="space-y-4">
            {COPC_CATEGORIES.map((category) => {
              const score = category.key === 'people_inverted'
                ? (100 - (metric.absenteeism_rate || 0))
                : (metric[category.key] as number) || 0;
              const color = getScoreColor(score);

              return (
                <div key={category.key}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#141042]">
                          {category.label} ({category.weight}%)
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${color.bg} bg-opacity-20 ${color.text}`}>
                          {score.toFixed(1)} - {color.label}
                        </span>
                      </div>
                      <p className="text-xs text-[#666666] mb-2">{category.description}</p>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${color.bg}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calculation Formula */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">
            📐 Fórmula de Cálculo do Score Geral
          </h3>
          <div className="text-xs text-blue-800 space-y-2">
            <p className="font-mono">
              Score Geral = (Qualidade × 0.35) + (Eficiência × 0.20) + (Efetividade × 0.20) + (CX × 0.15) + (People × 0.10)
            </p>
            <p className="font-mono">
              = ({(metric.quality_score || 0).toFixed(1)} × 0.35) + 
              ({(metric.process_adherence_rate || 0).toFixed(1)} × 0.20) + 
              ({(metric.first_call_resolution_rate || 0).toFixed(1)} × 0.20) + 
              ({(metric.customer_satisfaction_score || 0).toFixed(1)} × 0.15) + 
              ({(100 - (metric.absenteeism_rate || 0)).toFixed(1)} × 0.10)
            </p>
            <p className="font-mono font-bold">
              = {metric.overall_performance_score.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Notes */}
        {metric.notes && (
          <div className="bg-white rounded-lg border border-[#E5E5DC] p-6 mb-6">
            <h2 className="text-lg font-semibold text-[#141042] mb-3">
              Observações
            </h2>
            <p className="text-[#666666] whitespace-pre-wrap">{metric.notes}</p>
          </div>
        )}

        {/* Recommendations */}
        <div className={`rounded-lg p-6 ${
          derivedStatus === 'critical' || derivedStatus === 'warning'
            ? 'bg-red-50 border border-red-200'
            : 'bg-green-50 border border-green-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-3 ${
            derivedStatus === 'critical' || derivedStatus === 'warning'
              ? 'text-red-900'
              : 'text-green-900'
          }`}>
            {derivedStatus === 'critical' && <><AlertTriangle className="w-5 h-5 inline mr-2" />Ação Urgente Necessária</>}
            {derivedStatus === 'warning' && <><AlertTriangle className="w-5 h-5 inline mr-2" />Recomendações de Melhoria</>}
            {(derivedStatus === 'good' || derivedStatus === 'excellent') && <><TrendingUp className="w-5 h-5 inline mr-2" />Desempenho Positivo</>}
          </h3>
          <ul className={`space-y-2 text-sm ${
            derivedStatus === 'critical' || derivedStatus === 'warning'
              ? 'text-red-800'
              : 'text-green-800'
          }`}>
            {derivedStatus === 'critical' && (
              <>
                <li>• Criar plano de ação imediato para reverter scores críticos</li>
                <li>• Identificar causas raiz dos baixos índices de performance</li>
                <li>• Considerar intervenções de liderança e suporte adicional</li>
              </>
            )}
            {derivedStatus === 'warning' && (
              <>
                <li>• Monitorar tendências nas próximas medições</li>
                <li>• Implementar melhorias incrementais nas áreas de atenção</li>
                <li>• Realizar feedback com equipe sobre desafios operacionais</li>
              </>
            )}
            {(derivedStatus === 'good' || derivedStatus === 'excellent') && (
              <>
                <li>• Manter práticas atuais e documentar processos bem-sucedidos</li>
                <li>• Compartilhar boas práticas com outras equipes</li>
                <li>• Continuar monitoramento para sustentabilidade</li>
              </>
            )}
          </ul>
        </div>

        {/* Metadata */}
        <div className="mt-6 text-sm text-[#999999] text-center">
          Registrado em {new Date(metric.created_at).toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
}
