'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useOrgStore } from '@/lib/store';

interface AiInsight {
  type: 'risk' | 'opportunity' | 'recommendation' | 'alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  module: 'tfci' | 'nr1' | 'copc' | 'integrated';
  title: string;
  description: string;
  actionable_items: string[];
  impact_score: number;
  confidence: number;
}

interface RiskPrediction {
  module: string;
  metric: string;
  current_value: number;
  predicted_value: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  risk_level: 'none' | 'watch' | 'warning' | 'critical';
  time_horizon: string;
  confidence: number;
}

export default function AiDashboard() {
  const { currentOrg } = useOrgStore();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [predictions, setPredictions] = useState<RiskPrediction[]>([]);

  useEffect(() => {
    if (currentOrg?.id) {
      setLoading(true);
      setInsights([]);
      setPredictions([]);
      loadAiData(currentOrg.id);
    } else {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  const loadAiData = async (organizationId: string) => {
    try {
      const token = localStorage.getItem('supabase_token');

      // Carregar insights
      const insightsRes = await fetch('/api/v1/php/ai/generate-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-org-id': organizationId,
        },
        body: JSON.stringify({ org_id: organizationId }),
      });

      if (insightsRes.ok) {
        const data = await insightsRes.json();
        setInsights(data.insights || []);
      }

      // Carregar predições
      const predictionsRes = await fetch('/api/v1/php/ai/predict-risks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-org-id': organizationId,
        },
        body: JSON.stringify({ org_id: organizationId, time_horizon: '30d' }),
      });

      if (predictionsRes.ok) {
        const data = await predictionsRes.json();
        setPredictions(data.predictions || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados AI:', error);
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return '🚨';
      case 'risk':
        return '⚠️';
      case 'opportunity':
        return '💡';
      case 'recommendation':
        return '📊';
      default:
        return '📌';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'high':
        return 'bg-[#FFF7ED] border-[#F97316] text-[#F97316]';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-600 font-bold';
      case 'warning':
        return 'text-[#F97316] font-semibold';
      case 'watch':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F4ED8] mx-auto"></div>
          <p className="mt-4 text-[#1F4ED8] font-semibold">Gerando insights com IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#141042] flex items-center gap-3">
                🤖 AI Insights Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Análises preditivas e recomendações automáticas
              </p>
            </div>
            <button
              onClick={() => currentOrg?.id && loadAiData(currentOrg.id)}
              disabled={!currentOrg?.id}
              className="px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1554] transition-colors disabled:opacity-50"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* AI Status Banner */}
        <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <p className="font-semibold text-[#141042]">
                  Sistema de IA v1.0 - Modo Heurístico
                </p>
                <p className="text-sm text-gray-600">
                  Análise baseada em regras e padrões detectados nos módulos TFCI, NR-1 e COPC
                </p>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>Confiança média: 80-85%</p>
              <p>Última atualização: agora</p>
            </div>
          </div>
        </div>

        {/* Insights Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#141042] mb-4">
            📊 Insights Detectados ({insights.length})
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {insights.length === 0 ? (
              <div className="p-8 bg-white rounded-lg border border-[#E5E5DC] text-center text-gray-500">
                <p className="text-4xl mb-4">🎯</p>
                <p>Nenhum insight detectado no momento.</p>
                <p className="text-sm mt-2">
                  Colete mais dados nos módulos TFCI, NR-1 e COPC para gerar análises.
                </p>
              </div>
            ) : (
              insights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-lg border-2 ${getSeverityColor(insight.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{getTypeIcon(insight.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">
                            {insight.title}
                          </h3>
                          <span className="px-2 py-1 text-xs rounded-full bg-white border">
                            {insight.module.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm mb-3">{insight.description}</p>
                        <div className="mb-3">
                          <p className="text-xs font-semibold mb-2">
                            ✅ Ações Recomendadas:
                          </p>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {insight.actionable_items.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex gap-4 text-xs">
                          <span>
                            📊 Impacto: <strong>{insight.impact_score}%</strong>
                          </span>
                          <span>
                            🎯 Confiança: <strong>{insight.confidence}%</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Risk Predictions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#141042] mb-4">
            🔮 Predições de Risco (30 dias)
          </h2>
          <div className="bg-white rounded-lg border border-[#E5E5DC] overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Módulo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Métrica
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Atual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Previsto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tendência
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nível de Risco
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Confiança
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {predictions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Nenhuma predição de risco detectada
                    </td>
                  </tr>
                ) : (
                  predictions.map((pred, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                          {pred.module.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{pred.metric}</td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {pred.current_value.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {pred.predicted_value.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {getTrendIcon(pred.trend)} {pred.trend}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm ${getRiskLevelColor(pred.risk_level)}`}
                      >
                        {pred.risk_level.toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm">{pred.confidence}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/php/tfci/cycles"
            className="p-6 bg-white rounded-lg border border-[#E5E5DC] hover:shadow-md transition-shadow"
          >
            <p className="text-2xl mb-2">📋</p>
            <h3 className="font-semibold text-[#141042] mb-1">
              Ver Ciclos TFCI
            </h3>
            <p className="text-sm text-gray-600">
              Análise comportamental detalhada
            </p>
          </Link>
          <Link
            href="/php/nr1"
            className="p-6 bg-white rounded-lg border border-[#E5E5DC] hover:shadow-md transition-shadow"
          >
            <p className="text-2xl mb-2">⚠️</p>
            <h3 className="font-semibold text-[#141042] mb-1">
              Ver Riscos NR-1
            </h3>
            <p className="text-sm text-gray-600">
              Compliance psicossocial
            </p>
          </Link>
          <Link
            href="/php/copc"
            className="p-6 bg-white rounded-lg border border-[#E5E5DC] hover:shadow-md transition-shadow"
          >
            <p className="text-2xl mb-2">📊</p>
            <h3 className="font-semibold text-[#141042] mb-1">
              Ver COPC Metrics
            </h3>
            <p className="text-sm text-gray-600">
              Performance operacional
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
