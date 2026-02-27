'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';
import { ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, Minus, Eye, Filter, Download } from 'lucide-react';

interface ComparativeData {
  self_assessment_id: string;
  employee_id: string;
  employee_name: string;
  employee_position: string;
  self_score: number;
  self_risk_level: string;
  organizational_score: number;
  organizational_risk_level: string;
  perception_gap: number;
  gap_severity: string;
  perception_bias: string;
  dimensions_comparison: any;
  employee_comments: string;
  organizational_action_plan: string;
  responded_at: string;
  assessment_date: string;
}

interface Statistics {
  total_comparisons: number;
  critical_gaps: number;
  significant_gaps: number;
  aligned: number;
  optimistic_bias_count: number;
  pessimistic_bias_count: number;
  average_perception_gap: string;
}

export default function ComparativeAnalysisPage() {
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const [loading, setLoading] = useState(true);
  const [comparisons, setComparisons] = useState<ComparativeData[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<ComparativeData | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    if (currentOrg?.id) {
      loadComparativeAnalysis();
    }
  }, [currentOrg?.id]);

  const loadComparativeAnalysis = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;

      if (!token || !currentOrg?.id) return;

      const response = await fetch(
        `/api/v1/php/nr1/comparative-analysis/${currentOrg.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-org-id': currentOrg.id,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setComparisons(data.comparisons || []);
        setStatistics(data.statistics);
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Erro ao carregar análise:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGapColor = (severity: string) => {
    switch (severity) {
      case 'critical_gap': return 'bg-red-100 text-red-800 border-red-300';
      case 'significant_gap': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'moderate_gap': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'aligned': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getGapLabel = (severity: string) => {
    switch (severity) {
      case 'critical_gap': return 'Gap Crítico';
      case 'significant_gap': return 'Gap Significativo';
      case 'moderate_gap': return 'Gap Moderado';
      case 'aligned': return 'Alinhado';
      default: return severity;
    }
  };

  const getBiasIcon = (bias: string) => {
    switch (bias) {
      case 'optimistic_bias': return <TrendingUp className="w-4 h-4" />;
      case 'pessimistic_bias': return <TrendingDown className="w-4 h-4" />;
      case 'realistic_perception': return <Minus className="w-4 h-4" />;
      default: return null;
    }
  };

  const getBiasLabel = (bias: string) => {
    switch (bias) {
      case 'optimistic_bias': return 'Otimista';
      case 'pessimistic_bias': return 'Pessimista';
      case 'realistic_perception': return 'Realista';
      default: return bias;
    }
  };

  const filteredComparisons = comparisons.filter(c => 
    filterSeverity === 'all' || c.gap_severity === filterSeverity
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141042]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/php/nr1')}
          className="flex items-center gap-2 text-gray-600 hover:text-[#141042] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para NR-1
        </button>
        <h1 className="text-3xl font-bold text-[#141042] mb-2">
          Análise Comparativa NR-1
        </h1>
        <p className="text-gray-600">
          Comparação entre percepção dos funcionários (auto-avaliação) e avaliação organizacional
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total de Comparações</div>
            <div className="text-3xl font-bold text-[#141042]">{statistics.total_comparisons}</div>
          </div>
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <div className="text-sm text-red-600 mb-1">Gaps Críticos</div>
            <div className="text-3xl font-bold text-red-700">{statistics.critical_gaps}</div>
          </div>
          <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
            <div className="text-sm text-orange-600 mb-1">Gaps Significativos</div>
            <div className="text-3xl font-bold text-orange-700">{statistics.significant_gaps}</div>
          </div>
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="text-sm text-green-600 mb-1">Alinhados</div>
            <div className="text-3xl font-bold text-green-700">{statistics.aligned}</div>
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-[#141042] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
            Insights Automáticos
          </h2>
          <ul className="space-y-2">
            {insights.map((insight, idx) => (
              <li key={idx} className="text-gray-700 flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterSeverity === 'all'
                  ? 'bg-[#141042] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({comparisons.length})
            </button>
            <button
              onClick={() => setFilterSeverity('critical_gap')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterSeverity === 'critical_gap'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              Críticos ({comparisons.filter(c => c.gap_severity === 'critical_gap').length})
            </button>
            <button
              onClick={() => setFilterSeverity('significant_gap')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterSeverity === 'significant_gap'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              }`}
            >
              Significativos ({comparisons.filter(c => c.gap_severity === 'significant_gap').length})
            </button>
            <button
              onClick={() => setFilterSeverity('aligned')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filterSeverity === 'aligned'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              Alinhados ({comparisons.filter(c => c.gap_severity === 'aligned').length})
            </button>
          </div>
        </div>
      </div>

      {/* Comparisons List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Funcionário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percepção (Self)
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organizacional
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gap
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severidade
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Viés
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredComparisons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma comparação encontrada
                  </td>
                </tr>
              ) : (
                filteredComparisons.map((comparison) => (
                  <tr key={comparison.self_assessment_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{comparison.employee_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {comparison.employee_position || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold">{comparison.self_score.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold">{comparison.organizational_score?.toFixed(2) || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-bold ${
                        Math.abs(comparison.perception_gap) > 1 ? 'text-red-600' : 'text-gray-700'
                      }`}>
                        {comparison.perception_gap > 0 ? '+' : ''}{comparison.perception_gap.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getGapColor(comparison.gap_severity)}`}>
                        {getGapLabel(comparison.gap_severity)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1 text-sm text-gray-700">
                        {getBiasIcon(comparison.perception_bias)}
                        <span>{getBiasLabel(comparison.perception_bias)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setSelectedEmployee(comparison)}
                        className="text-[#141042] hover:text-[#2D1B69] transition"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#141042]">
                  Análise Detalhada: {selectedEmployee.employee_name}
                </h2>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mt-1">{selectedEmployee.employee_position}</p>
            </div>

            <div className="p-6">
              {/* Scores Comparison */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-600 mb-1">Percepção (Self)</div>
                  <div className="text-2xl font-bold text-blue-700">{selectedEmployee.self_score.toFixed(2)}</div>
                  <div className="text-xs text-blue-600 mt-1">{selectedEmployee.self_risk_level}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm text-purple-600 mb-1">Organizacional</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {selectedEmployee.organizational_score?.toFixed(2) || 'N/A'}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">{selectedEmployee.organizational_risk_level || 'N/A'}</div>
                </div>
                <div className={`p-4 rounded-lg border ${
                  Math.abs(selectedEmployee.perception_gap) > 1 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className={`text-sm mb-1 ${
                    Math.abs(selectedEmployee.perception_gap) > 1 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    Gap de Percepção
                  </div>
                  <div className={`text-2xl font-bold ${
                    Math.abs(selectedEmployee.perception_gap) > 1 ? 'text-red-700' : 'text-green-700'
                  }`}>
                    {selectedEmployee.perception_gap > 0 ? '+' : ''}{selectedEmployee.perception_gap.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Dimensions Comparison */}
              {selectedEmployee.dimensions_comparison && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#141042] mb-4">Comparação por Dimensão</h3>
                  <div className="space-y-3">
                    {Object.entries(selectedEmployee.dimensions_comparison).map(([key, value]: [string, any]) => (
                      <div key={key} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 text-sm">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className={`font-bold text-sm ${
                            Math.abs(value.gap) > 1 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            Gap: {value.gap > 0 ? '+' : ''}{value.gap}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Self:</span>
                            <span className="font-semibold text-blue-600">{value.self}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Org:</span>
                            <span className="font-semibold text-purple-600">{value.org}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              {selectedEmployee.employee_comments && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-[#141042] mb-2">Comentários do Funcionário</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-700">{selectedEmployee.employee_comments}</p>
                  </div>
                </div>
              )}

              {selectedEmployee.organizational_action_plan && (
                <div>
                  <h3 className="text-lg font-semibold text-[#141042] mb-2">Plano de Ação Organizacional</h3>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-gray-700">{selectedEmployee.organizational_action_plan}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
