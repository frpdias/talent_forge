'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Plus } from 'lucide-react';
import { useOrgStore } from '@/lib/store';
import { createClient, getAuthToken } from '@/lib/supabase/client';

interface CategoryScore {
  category: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface MetricEntry {
  id: string;
  metric_date: string;
  overall_performance_score: number;
  quality_score: number;
  customer_satisfaction_score: number;
  team_id: string;
}

export default function CopcDashboard() {
  const router = useRouter();
  const { currentOrg, phpContextOrgId } = useOrgStore();
  const effectiveOrgId = phpContextOrgId || currentOrg?.id;
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryScore[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [recentMetrics, setRecentMetrics] = useState<MetricEntry[]>([]);

  useEffect(() => {
    if (effectiveOrgId) {
      setLoading(true);
      setCategories([]);
      setRecentMetrics([]);
      loadData(effectiveOrgId);
    } else {
      setLoading(false);
    }
  }, [effectiveOrgId]);

  const loadData = async (organizationId: string) => {
    try {
      const token = await getAuthToken() ?? '';

      // Carregar dashboard
      const dashboardRes = await fetch(
        `/api/v1/php/copc/dashboard/${organizationId}?period=30d`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-org-id': organizationId,
          },
        },
      );

      if (dashboardRes.ok) {
        const dashboard = await dashboardRes.json();
        const summary = dashboard.summary;

        setOverallScore(summary.overall || 0);
        setCategories([
          { category: 'Qualidade', score: summary.quality || 0, trend: 'stable', change: 0 },
          { category: 'Eficiência', score: summary.efficiency || 0, trend: 'stable', change: 0 },
          { category: 'Efetividade', score: summary.effectiveness || 0, trend: 'stable', change: 0 },
          { category: 'CX', score: summary.cx || 0, trend: 'stable', change: 0 },
          { category: 'People', score: summary.people || 0, trend: 'stable', change: 0 },
        ]);
      }

      // Carregar métricas recentes
      const metricsRes = await fetch(
        `/api/v1/php/copc/metrics?org_id=${organizationId}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-org-id': organizationId,
          },
        },
      );

      if (metricsRes.ok) {
        const metrics = await metricsRes.json();
        setRecentMetrics(metrics);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados COPC:', error);
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getScoreTextColor = (score: number): string => {
    if (score >= 80) return 'text-green-700';
    if (score >= 60) return 'text-yellow-700';
    return 'text-red-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141042] mx-auto"></div>
          <p className="mt-4 text-[#666666]">Carregando dashboard COPC...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#141042]">
              COPC Adapted Dashboard
            </h1>
            <p className="text-[#666666] mt-1">
              Performance operacional e bem-estar organizacional
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/php/copc/areas"
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#141042] font-medium border border-[#E5E5DC] rounded-lg hover:bg-[#FAFAF8] hover:border-[#141042] transition-all shadow-sm"
            >
              <BarChart3 className="w-4 h-4" />
              KPIs por Área
            </Link>
            <Link
              href="/php/copc/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#141042] text-white font-medium rounded-lg hover:bg-[#1D1A5A] transition-all shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Nova Métrica
            </Link>
          </div>
        </div>

        {/* Overall COPC Score */}
        <div className={`mb-8 p-8 rounded-xl border-2 ${getScoreColor(overallScore)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-2">COPC Score Geral</p>
              <p className={`text-5xl font-bold ${getScoreTextColor(overallScore)}`}>
                {overallScore.toFixed(1)}
              </p>
              <p className="text-xs mt-2 opacity-80">Últimos 30 dias</p>
            </div>
            <div className="text-right">
              <p className="text-sm mb-1">
                {overallScore >= 80 && '✅ Excelente'}
                {overallScore >= 60 && overallScore < 80 && '⚠️ Adequado'}
                {overallScore < 60 && '❌ Atenção Necessária'}
              </p>
              <p className="text-xs opacity-70">
                Baseado em 11 métricas COPC v1.0
              </p>
            </div>
          </div>
        </div>

        {/* Category Scores */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {categories.map((cat) => (
            <div
              key={cat.category}
              className="p-6 bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] hover:shadow-[0_8px_32px_rgba(20,16,66,0.10),0_2px_8px_rgba(20,16,66,0.06)] hover:-translate-y-px transition-all duration-300"
            >
              <p className="text-sm text-[#666666] mb-2">{cat.category}</p>
              <p className={`text-3xl font-bold ${getScoreTextColor(cat.score)}`}>
                {cat.score.toFixed(1)}
              </p>
              <div className="mt-2 flex items-center text-xs text-[#999999]">
                {cat.trend === 'up' && <span className="text-[#10B981]">↑</span>}
                {cat.trend === 'down' && <span className="text-[#EF4444]">↓</span>}
                {cat.trend === 'stable' && <span className="text-[#999999]">→</span>}
                <span className="ml-1">
                  {cat.change > 0 ? `+${cat.change.toFixed(1)}` : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Category Weights Info */}
        <div className="mb-8 p-6 bg-[#FAFAF8] rounded-xl border border-[#E5E5DC]">
          <h3 className="text-sm font-semibold text-[#141042] mb-3">
            📊 Pesos das Categorias COPC
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="font-medium text-[#666666]">Qualidade:</span>{' '}
              <span className="text-[#666666]">35%</span>
            </div>
            <div>
              <span className="font-medium text-[#666666]">Eficiência:</span>{' '}
              <span className="text-[#666666]">20%</span>
            </div>
            <div>
              <span className="font-medium text-[#666666]">Efetividade:</span>{' '}
              <span className="text-[#666666]">20%</span>
            </div>
            <div>
              <span className="font-medium text-[#666666]">CX:</span>{' '}
              <span className="text-[#666666]">15%</span>
            </div>
            <div>
              <span className="font-medium text-[#666666]">People:</span>{' '}
              <span className="text-[#666666]">10%</span>
            </div>
          </div>
        </div>

        {/* Recent Metrics Table */}
        <div className="bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] overflow-hidden">
          <div className="p-6 border-b border-[#E5E5DC]">
            <h2 className="text-xl font-semibold text-[#141042]">
              Métricas Recentes
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAFAF8]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Score Geral
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Qualidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    CX
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E5E5DC]">
                {recentMetrics.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#666666]">
                      <p className="text-sm">
                        Nenhuma métrica registrada ainda.
                      </p>
                      <Link
                        href="/php/copc/new"
                        className="text-[#141042] hover:underline text-sm mt-2 inline-block"
                      >
                        Criar primeira métrica →
                      </Link>
                    </td>
                  </tr>
                ) : (
                  recentMetrics.map((metric) => (
                    <tr
                      key={metric.id}
                      className="hover:bg-[#FAFAF8] cursor-pointer"
                      onClick={() => router.push(`/php/copc/${metric.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#141042]">
                        {new Date(metric.metric_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(metric.overall_performance_score)}`}
                        >
                          {metric.overall_performance_score?.toFixed(1) || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#141042]">
                        {metric.quality_score?.toFixed(1) || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#141042]">
                        {metric.customer_satisfaction_score?.toFixed(1) || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#999999]">
                        {metric.team_id ? `Time ${metric.team_id.substring(0, 8)}...` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
