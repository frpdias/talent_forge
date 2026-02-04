'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';
import { 
  ClipboardCheck, 
  Users, 
  Calendar, 
  TrendingUp, 
  ArrowLeft,
  Eye,
  Search,
  Filter,
  Star,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface TfciAssessment {
  id: string;
  cycle_id: string;
  evaluator_id: string | null;
  target_user_id: string;
  overall_score: number | null;
  collaboration_score: number | null;
  communication_score: number | null;
  adaptability_score: number | null;
  accountability_score: number | null;
  leadership_score: number | null;
  submitted_at: string | null;
  created_at: string;
  status: 'pending' | 'in_progress' | 'completed';
  // Dados relacionados
  cycle?: {
    id: string;
    name: string;
    status: string;
  };
  evaluator?: {
    id: string;
    full_name: string;
    email: string;
  };
  target?: {
    id: string;
    full_name: string;
    email: string;
    position?: string;
  };
}

export default function TfciAssessmentsPage() {
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const [assessments, setAssessments] = useState<TfciAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (currentOrg?.id) {
      fetchAssessments(currentOrg.id);
    } else {
      setLoading(false);
    }
  }, [currentOrg?.id]);

  const fetchAssessments = async (organizationId: string) => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Buscar avaliações com dados relacionados
      const { data, error } = await supabase
        .from('tfci_assessments')
        .select(`
          *,
          cycle:tfci_cycles(id, name, status),
          evaluator:employees!tfci_assessments_evaluator_id_fkey(id, full_name, email),
          target:employees!tfci_assessments_target_user_id_fkey(id, full_name, email, position)
        `)
        .eq('org_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar avaliações:', error);
        // Tentar busca simplificada se falhar
        const { data: simpleData, error: simpleError } = await supabase
          .from('tfci_assessments')
          .select('*')
          .eq('org_id', organizationId)
          .order('created_at', { ascending: false });

        if (!simpleError && simpleData) {
          setAssessments(simpleData);
        }
      } else {
        setAssessments(data || []);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = 
      (assessment.target?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       assessment.evaluator?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       assessment.cycle?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: assessments.length,
    completed: assessments.filter(a => a.status === 'completed' || a.submitted_at).length,
    pending: assessments.filter(a => a.status === 'pending' && !a.submitted_at).length,
    inProgress: assessments.filter(a => a.status === 'in_progress').length,
    avgScore: assessments.filter(a => a.overall_score).length > 0
      ? (assessments.filter(a => a.overall_score).reduce((sum, a) => sum + (a.overall_score || 0), 0) / 
         assessments.filter(a => a.overall_score).length).toFixed(1)
      : '0.0'
  };

  const getStatusBadge = (assessment: TfciAssessment) => {
    if (assessment.submitted_at || assessment.status === 'completed') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Concluída</span>;
    }
    if (assessment.status === 'in_progress') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Em Progresso</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Pendente</span>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatScore = (score: number | null) => {
    if (score === null || score === undefined) return '-';
    return score.toFixed(1);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
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
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Avaliações TFCI</h1>
            <p className="text-gray-500">Gerencie todas as avaliações comportamentais</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Concluídas</p>
              <p className="text-xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Em Progresso</p>
              <p className="text-xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pendentes</p>
              <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Média Geral</p>
              <p className="text-xl font-bold text-gray-900">{stats.avgScore}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, avaliador ou ciclo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Todos os status</option>
              <option value="completed">Concluídas</option>
              <option value="in_progress">Em Progresso</option>
              <option value="pending">Pendentes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filteredAssessments.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma avaliação encontrada</h3>
            <p className="text-gray-500">
              {assessments.length === 0 
                ? 'Crie um ciclo TFCI para iniciar as avaliações.'
                : 'Nenhuma avaliação corresponde aos filtros selecionados.'}
            </p>
            {assessments.length === 0 && (
              <button
                onClick={() => router.push('/php/tfci/cycles')}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Ir para Ciclos
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avaliado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avaliador</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ciclo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAssessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {assessment.target?.full_name || 'Colaborador'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {assessment.target?.position || assessment.target?.email || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-900">
                          {assessment.evaluator?.full_name || 'Auto-avaliação'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {assessment.evaluator?.email || '-'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">
                        {assessment.cycle?.name || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(assessment)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${
                        (assessment.overall_score || 0) >= 4 ? 'text-green-600' :
                        (assessment.overall_score || 0) >= 3 ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {formatScore(assessment.overall_score)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(assessment.submitted_at || assessment.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => router.push(`/php/tfci/assessments/${assessment.id}`)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
