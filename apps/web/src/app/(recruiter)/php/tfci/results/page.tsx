'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  ArrowLeft,
  Search,
  Filter,
  Star,
  ChevronRight,
  Award,
  Target,
  Download,
  Eye,
  UserCheck,
  Briefcase
} from 'lucide-react';

interface EmployeeResult {
  id: string;
  full_name: string;
  email: string;
  position: string | null;
  department: string | null;
  // Scores agregados
  assessments_count: number;
  avg_overall_score: number | null;
  avg_collaboration_score: number | null;
  avg_communication_score: number | null;
  avg_adaptability_score: number | null;
  avg_accountability_score: number | null;
  avg_leadership_score: number | null;
  last_assessment_date: string | null;
}

interface CycleOption {
  id: string;
  name: string;
  status: string;
}

export default function TfciResultsPage() {
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const [results, setResults] = useState<EmployeeResult[]>([]);
  const [cycles, setCycles] = useState<CycleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCycle, setSelectedCycle] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'assessments'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (currentOrg?.id) {
      fetchCycles(currentOrg.id);
      fetchResults(currentOrg.id);
    } else {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  useEffect(() => {
    if (currentOrg?.id) {
      fetchResults(currentOrg.id, selectedCycle);
    }
  }, [selectedCycle, currentOrg?.id]);

  const fetchCycles = async (organizationId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tfci_cycles')
        .select('id, name, status')
        .eq('org_id', organizationId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCycles(data);
      }
    } catch (error) {
      console.error('Erro ao buscar ciclos:', error);
    }
  };

  const fetchResults = async (organizationId: string, cycleId?: string) => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Buscar funcionários com suas avaliações
      let query = supabase
        .from('employees')
        .select(`
          id,
          full_name,
          email,
          position,
          department
        `)
        .eq('org_id', organizationId)
        .eq('is_active', true);

      const { data: employeesData, error: employeesError } = await query;

      if (employeesError) {
        console.error('Erro ao buscar funcionários:', employeesError);
        setResults([]);
        return;
      }

      // Para cada funcionário, buscar suas avaliações recebidas
      const resultsWithScores: EmployeeResult[] = [];

      for (const employee of employeesData || []) {
        let assessmentsQuery = supabase
          .from('tfci_assessments')
          .select('*')
          .eq('target_user_id', employee.id)
          .not('submitted_at', 'is', null);

        if (cycleId && cycleId !== 'all') {
          assessmentsQuery = assessmentsQuery.eq('cycle_id', cycleId);
        }

        const { data: assessmentsData } = await assessmentsQuery;

        if (assessmentsData && assessmentsData.length > 0) {
          const validAssessments = assessmentsData.filter(a => a.overall_score !== null);
          
          const avgOverall = validAssessments.length > 0
            ? validAssessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) / validAssessments.length
            : null;
          
          const avgCollaboration = validAssessments.length > 0
            ? validAssessments.reduce((sum, a) => sum + (a.collaboration_score || 0), 0) / validAssessments.length
            : null;
          
          const avgCommunication = validAssessments.length > 0
            ? validAssessments.reduce((sum, a) => sum + (a.communication_score || 0), 0) / validAssessments.length
            : null;
          
          const avgAdaptability = validAssessments.length > 0
            ? validAssessments.reduce((sum, a) => sum + (a.adaptability_score || 0), 0) / validAssessments.length
            : null;
          
          const avgAccountability = validAssessments.length > 0
            ? validAssessments.reduce((sum, a) => sum + (a.accountability_score || 0), 0) / validAssessments.length
            : null;
          
          const avgLeadership = validAssessments.length > 0
            ? validAssessments.reduce((sum, a) => sum + (a.leadership_score || 0), 0) / validAssessments.length
            : null;

          const lastAssessment = assessmentsData
            .filter(a => a.submitted_at)
            .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0];

          resultsWithScores.push({
            id: employee.id,
            full_name: employee.full_name,
            email: employee.email,
            position: employee.position,
            department: employee.department,
            assessments_count: assessmentsData.length,
            avg_overall_score: avgOverall,
            avg_collaboration_score: avgCollaboration,
            avg_communication_score: avgCommunication,
            avg_adaptability_score: avgAdaptability,
            avg_accountability_score: avgAccountability,
            avg_leadership_score: avgLeadership,
            last_assessment_date: lastAssessment?.submitted_at || null
          });
        }
      }

      setResults(resultsWithScores);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results
    .filter(result => {
      const matchesSearch = 
        result.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (result.position?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      
      return matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.full_name.localeCompare(b.full_name);
          break;
        case 'score':
          comparison = (a.avg_overall_score || 0) - (b.avg_overall_score || 0);
          break;
        case 'assessments':
          comparison = a.assessments_count - b.assessments_count;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const stats = {
    totalEmployees: results.length,
    avgOverallScore: results.length > 0
      ? (results.filter(r => r.avg_overall_score).reduce((sum, r) => sum + (r.avg_overall_score || 0), 0) / 
         results.filter(r => r.avg_overall_score).length).toFixed(1)
      : '0.0',
    totalAssessments: results.reduce((sum, r) => sum + r.assessments_count, 0),
    topPerformers: results.filter(r => (r.avg_overall_score || 0) >= 4.0).length
  };

  const formatScore = (score: number | null) => {
    if (score === null || score === undefined) return '-';
    return score.toFixed(1);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number | null) => {
    if (score === null) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Sem dados</span>;
    if (score >= 4.5) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Excelente</span>;
    if (score >= 3.5) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Bom</span>;
    if (score >= 2.5) return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Regular</span>;
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Precisa Melhorar</span>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/php/tfci/cycles')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resultados TFCI</h1>
            <p className="text-gray-600">Resultados consolidados das avaliações comportamentais</p>
          </div>
        </div>
        <button
          onClick={() => {/* Exportar relatório */}}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Exportar Relatório
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Colaboradores Avaliados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Média Geral</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgOverallScore}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Avaliações</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAssessments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Award className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Top Performers (≥4.0)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.topPerformers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-4">
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Ciclos</option>
              {cycles.map(cycle => (
                <option key={cycle.id} value={cycle.id}>{cycle.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'score' | 'assessments')}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="score">Ordenar por Nota</option>
              <option value="name">Ordenar por Nome</option>
              <option value="assessments">Ordenar por Nº Avaliações</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredResults.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum resultado encontrado</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Tente ajustar os filtros de busca'
                : 'Ainda não há avaliações concluídas para exibir resultados'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Colaborador</th>
                  <th className="text-center px-4 py-4 text-sm font-medium text-gray-600">Avaliações</th>
                  <th className="text-center px-4 py-4 text-sm font-medium text-gray-600">Média Geral</th>
                  <th className="text-center px-4 py-4 text-sm font-medium text-gray-600">Colaboração</th>
                  <th className="text-center px-4 py-4 text-sm font-medium text-gray-600">Comunicação</th>
                  <th className="text-center px-4 py-4 text-sm font-medium text-gray-600">Adaptabilidade</th>
                  <th className="text-center px-4 py-4 text-sm font-medium text-gray-600">Responsabilidade</th>
                  <th className="text-center px-4 py-4 text-sm font-medium text-gray-600">Liderança</th>
                  <th className="text-center px-4 py-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {result.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{result.full_name}</p>
                          <p className="text-sm text-gray-500">{result.position || result.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        {result.assessments_count}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-lg font-bold ${getScoreColor(result.avg_overall_score)}`}>
                        {formatScore(result.avg_overall_score)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-medium ${getScoreColor(result.avg_collaboration_score)}`}>
                        {formatScore(result.avg_collaboration_score)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-medium ${getScoreColor(result.avg_communication_score)}`}>
                        {formatScore(result.avg_communication_score)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-medium ${getScoreColor(result.avg_adaptability_score)}`}>
                        {formatScore(result.avg_adaptability_score)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-medium ${getScoreColor(result.avg_accountability_score)}`}>
                        {formatScore(result.avg_accountability_score)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`font-medium ${getScoreColor(result.avg_leadership_score)}`}>
                        {formatScore(result.avg_leadership_score)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getScoreBadge(result.avg_overall_score)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => router.push(`/php/tfci/results/${result.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Legenda de Classificação</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-sm text-gray-600">Excelente (≥4.5)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-sm text-gray-600">Bom (3.5-4.4)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-sm text-gray-600">Regular (2.5-3.4)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-sm text-gray-600">Precisa Melhorar (&lt;2.5)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
