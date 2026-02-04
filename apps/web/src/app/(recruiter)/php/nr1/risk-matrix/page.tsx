'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';

interface Nr1Assessment {
  id: string;
  org_id: string;
  assessed_user_id: string;
  overall_risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  assessment_date: string;
}

interface RiskMatrixData {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  avgScore: number;
}

const RISK_LABELS = ['Baixo', 'Médio', 'Alto', 'Crítico'];
const RISK_COLORS = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];

export default function RiskMatrixPage() {
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const [assessments, setAssessments] = useState<Nr1Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [matrixData, setMatrixData] = useState<RiskMatrixData>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
    avgScore: 0,
  });

  useEffect(() => {
    if (currentOrg?.id) {
      loadAssessments();
    }
  }, [currentOrg?.id]);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;

      if (!token || !currentOrg?.id) {
        console.error('Token ou organização não encontrados');
        return;
      }

      const response = await fetch(
        `http://localhost:3001/api/v1/php/nr1/assessments?org_id=${currentOrg.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-org-id': currentOrg.id,
          },
        }
      );

      if (response.ok) {
        const data: Nr1Assessment[] = await response.json();
        setAssessments(data);

        // Calcular estatísticas
        const stats: RiskMatrixData = {
          critical: data.filter(a => a.overall_risk_level === 'critical').length,
          high: data.filter(a => a.overall_risk_level === 'high').length,
          medium: data.filter(a => a.overall_risk_level === 'medium').length,
          low: data.filter(a => a.overall_risk_level === 'low').length,
          total: data.length,
          avgScore: data.length > 0 ? data.reduce((sum, a) => sum + a.risk_score, 0) / data.length : 0,
        };

        setMatrixData(stats);
      }
    } catch (error) {
      console.error('Error loading assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (count: number) => {
    return matrixData.total > 0 ? ((count / matrixData.total) * 100).toFixed(1) : '0.0';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getOverallRiskLevel = () => {
    const criticalPercent = parseFloat(getPercentage(matrixData.critical));
    const highPercent = parseFloat(getPercentage(matrixData.high));

    if (criticalPercent > 20) return { level: 'Crítico', color: 'text-red-600', bg: 'bg-red-100' };
    if (criticalPercent > 10 || highPercent > 30) return { level: 'Alto', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (highPercent > 15) return { level: 'Médio', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Baixo', color: 'text-green-600', bg: 'bg-green-100' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] p-6 flex items-center justify-center">
        <p className="text-[#666666]">Carregando matriz de riscos...</p>
      </div>
    );
  }

  const overallRisk = getOverallRiskLevel();

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/php/nr1')}
            className="flex items-center gap-2 text-[#666666] hover:text-[#141042] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Avaliações NR-1
          </button>

          <h1 className="text-3xl font-bold text-[#141042] mb-2">
            Matriz de Riscos Psicossociais
          </h1>
          <p className="text-[#666666]">
            Visualização consolidada dos riscos NR-1 na organização
          </p>
        </div>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-[#E5E5DC] p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-[#141042]" />
              <span className="text-sm text-[#666666]">Total de Avaliações</span>
            </div>
            <p className="text-3xl font-bold text-[#141042]">{matrixData.total}</p>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E5DC] p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-[#141042]" />
              <span className="text-sm text-[#666666]">Score Médio</span>
            </div>
            <p className="text-3xl font-bold text-[#141042]">{matrixData.avgScore.toFixed(1)}</p>
          </div>

          <div className={`rounded-lg border p-6 ${overallRisk.bg}`}>
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className={`w-5 h-5 ${overallRisk.color}`} />
              <span className={`text-sm ${overallRisk.color}`}>Risco Organizacional</span>
            </div>
            <p className={`text-3xl font-bold ${overallRisk.color}`}>{overallRisk.level}</p>
          </div>
        </div>

        {/* Distribuição de Riscos */}
        <div className="bg-white rounded-lg border border-[#E5E5DC] p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#141042] mb-6">Distribuição de Riscos</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { level: 'low', label: 'Baixo', count: matrixData.low, color: 'green' },
              { level: 'medium', label: 'Médio', count: matrixData.medium, color: 'yellow' },
              { level: 'high', label: 'Alto', count: matrixData.high, color: 'orange' },
              { level: 'critical', label: 'Crítico', count: matrixData.critical, color: 'red' },
            ].map((risk) => (
              <div key={risk.level} className="text-center">
                <div className={`w-full h-32 bg-${risk.color}-100 border-2 border-${risk.color}-300 rounded-lg flex items-center justify-center mb-3`}>
                  <span className={`text-4xl font-bold text-${risk.color}-700`}>
                    {risk.count}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#141042] mb-1">{risk.label}</p>
                <p className="text-xs text-[#666666]">{getPercentage(risk.count)}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de Barras */}
        <div className="bg-white rounded-lg border border-[#E5E5DC] p-6">
          <h2 className="text-xl font-semibold text-[#141042] mb-6">Visualização por Nível de Risco</h2>

          <div className="space-y-4">
            {[
              { level: 'critical', label: 'Crítico', count: matrixData.critical, color: 'bg-red-500' },
              { level: 'high', label: 'Alto', count: matrixData.high, color: 'bg-orange-500' },
              { level: 'medium', label: 'Médio', count: matrixData.medium, color: 'bg-yellow-500' },
              { level: 'low', label: 'Baixo', count: matrixData.low, color: 'bg-green-500' },
            ].map((risk) => {
              const percentage = parseFloat(getPercentage(risk.count));
              
              return (
                <div key={risk.level} className="flex items-center gap-4">
                  <div className="w-24 text-right">
                    <span className="text-sm font-medium text-[#141042]">{risk.label}</span>
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                    <div
                      className={`h-full ${risk.color} transition-all duration-500 flex items-center justify-end pr-3`}
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage > 0 && (
                        <span className="text-xs font-bold text-white">
                          {risk.count} ({percentage}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recomendações */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Recomendações</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            {matrixData.critical > 0 && (
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Ação Imediata:</strong> {matrixData.critical} avaliação(ões) com risco crítico requerem planos de ação urgentes.
                </span>
              </li>
            )}
            {matrixData.high > 0 && (
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Prioritário:</strong> {matrixData.high} avaliação(ões) com risco alto devem ser tratadas em até 30 dias.
                </span>
              </li>
            )}
            {overallRisk.level === 'Baixo' && (
              <li className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <span>
                  <strong>Parabéns!</strong> A organização mantém um bom nível de saúde psicossocial. Continue monitorando.
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-blue-600">ℹ</span>
              <span>
                Realize avaliações periódicas (recomendado: a cada 6 meses) para acompanhar a evolução dos riscos.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
