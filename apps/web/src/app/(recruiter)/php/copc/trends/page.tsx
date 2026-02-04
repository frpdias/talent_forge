'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';

interface CopcMetric {
  id: string;
  metric_date: string;
  overall_performance_score: number;
  quality_score: number;
  efficiency_score: number;
  effectiveness_score: number;
  cx_score: number;
  people_score: number;
}

interface TrendData {
  category: string;
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export default function CopcTrendsPage() {
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<CopcMetric[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (currentOrg?.id) {
      loadMetrics();
    }
  }, [currentOrg?.id, period]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;

      if (!token || !currentOrg?.id) {
        console.error('Token ou organização não encontrados');
        return;
      }

      const response = await fetch(
        `http://localhost:3001/api/v1/php/copc/metrics?org_id=${currentOrg.id}&period=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-org-id': currentOrg.id,
          },
        }
      );

      if (response.ok) {
        const data: CopcMetric[] = await response.json();
        setMetrics(data);
        calculateTrends(data);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrends = (data: CopcMetric[]) => {
    if (data.length < 2) {
      setTrends([]);
      return;
    }

    // Ordenar por data (mais recente primeiro)
    const sorted = [...data].sort((a, b) => 
      new Date(b.metric_date).getTime() - new Date(a.metric_date).getTime()
    );

    const latest = sorted[0];
    const previous = sorted[1];

    const categories = [
      { key: 'overall_performance_score', label: 'Score Geral' },
      { key: 'quality_score', label: 'Qualidade' },
      { key: 'efficiency_score', label: 'Eficiência' },
      { key: 'effectiveness_score', label: 'Efetividade' },
      { key: 'cx_score', label: 'Customer Experience' },
      { key: 'people_score', label: 'People (Bem-estar)' },
    ];

    const trendData: TrendData[] = categories.map(cat => {
      const current = latest[cat.key as keyof CopcMetric] as number;
      const prev = previous[cat.key as keyof CopcMetric] as number;
      const change = current - prev;
      const percentChange = ((change / prev) * 100);

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(percentChange) > 2) {
        trend = change > 0 ? 'up' : 'down';
      }

      return {
        category: cat.label,
        current,
        previous: prev,
        change: percentChange,
        trend,
      };
    });

    setTrends(trendData);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'down':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] p-6 flex items-center justify-center">
        <p className="text-[#666666]">Carregando análise de tendências...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/php/copc')}
            className="flex items-center gap-2 text-[#666666] hover:text-[#141042] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Métricas COPC
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#141042] mb-2">
                Análise de Tendências COPC
              </h1>
              <p className="text-[#666666]">
                Acompanhe a evolução das métricas ao longo do tempo
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-[#666666]">Período:</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as '7d' | '30d' | '90d')}
                className="px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-[#E5E5DC] p-6">
            <p className="text-sm text-[#666666] mb-2">Total de Métricas</p>
            <p className="text-3xl font-bold text-[#141042]">{metrics.length}</p>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E5DC] p-6">
            <p className="text-sm text-[#666666] mb-2">Tendências Positivas</p>
            <p className="text-3xl font-bold text-green-600">
              {trends.filter(t => t.trend === 'up').length}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E5DC] p-6">
            <p className="text-sm text-[#666666] mb-2">Tendências Negativas</p>
            <p className="text-3xl font-bold text-red-600">
              {trends.filter(t => t.trend === 'down').length}
            </p>
          </div>
        </div>

        {/* Trends Table */}
        {trends.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E5E5DC] p-12 text-center">
            <AlertCircle className="w-16 h-16 text-[#E5E5DC] mx-auto mb-4" />
            <p className="text-[#666666] mb-2">
              Dados insuficientes para análise de tendências
            </p>
            <p className="text-sm text-[#999999]">
              São necessárias pelo menos 2 métricas para calcular tendências
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E5E5DC] overflow-hidden">
            <div className="p-6 border-b border-[#E5E5DC]">
              <h2 className="text-xl font-semibold text-[#141042]">
                Comparação Período Atual vs Anterior
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAFAF8]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                      Atual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                      Anterior
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                      Variação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                      Tendência
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#E5E5DC]">
                  {trends.map((trend) => (
                    <tr key={trend.category} className="hover:bg-[#FAFAF8]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#141042]">
                        {trend.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#141042]">
                        <span className="font-bold">{trend.current.toFixed(1)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#666666]">
                        {trend.previous.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${
                          trend.change > 0 ? 'text-green-600' :
                          trend.change < 0 ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getTrendColor(trend.trend)}`}>
                          {getTrendIcon(trend.trend)}
                          <span className="text-xs font-medium">
                            {trend.trend === 'up' ? 'Crescimento' :
                             trend.trend === 'down' ? 'Declínio' :
                             'Estável'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Insights */}
        {trends.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              💡 Insights Automáticos
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              {trends.some(t => t.trend === 'down' && t.category === 'Score Geral') && (
                <li>• <strong>Atenção:</strong> O score geral está em declínio. Revisar todas as categorias.</li>
              )}
              {trends.filter(t => t.trend === 'down').length >= 3 && (
                <li>• <strong>Alerta:</strong> Múltiplas categorias em declínio. Ação corretiva necessária.</li>
              )}
              {trends.filter(t => t.trend === 'up').length >= 4 && (
                <li>• <strong>Positivo:</strong> Tendência geral de melhoria. Manter práticas atuais.</li>
              )}
              {trends.some(t => t.category === 'People (Bem-estar)' && t.trend === 'down') && (
                <li>• <strong>Importante:</strong> Bem-estar da equipe em declínio. Considerar ações de suporte.</li>
              )}
              <li>• Compare as tendências com metas organizacionais e ajuste estratégias conforme necessário.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
