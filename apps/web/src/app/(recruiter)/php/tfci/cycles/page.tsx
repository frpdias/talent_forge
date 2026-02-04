'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Plus, 
  ChevronRight, 
  BarChart3,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Play,
  Eye,
  ClipboardCheck,
  UserCheck,
  Star
} from 'lucide-react';

interface TfciAssessment {
  id: string;
  cycle_id: string;
  evaluator_id: string | null;
  target_user_id: string;
  overall_score: number;
  collaboration_score: number;
  communication_score: number;
  adaptability_score: number;
  accountability_score: number;
  leadership_score: number;
  submitted_at: string;
}

interface TfciCycleWithStats {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  participants_count: number;
  completion_rate: number;
  created_at: string;
  // Estatísticas calculadas das avaliações
  total_assessments: number;
  unique_evaluators: number;
  unique_targets: number;
  avg_overall_score: number;
  assessments_by_peers: number; // Avaliações feitas por pares/indicados
}

export default function TfciCyclesPage() {
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const [cycles, setCycles] = useState<TfciCycleWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    status: 'draft' as const,
  });

  // Estatísticas calculadas do painel geral
  const stats = {
    totalCycles: cycles.length,
    activeCycles: cycles.filter(c => c.status === 'active').length,
    completedCycles: cycles.filter(c => c.status === 'completed').length,
    totalAssessments: cycles.reduce((acc, c) => acc + c.total_assessments, 0),
    totalEvaluators: cycles.reduce((acc, c) => acc + c.unique_evaluators, 0),
    avgScore: cycles.length > 0 
      ? (cycles.reduce((acc, c) => acc + (c.avg_overall_score || 0), 0) / cycles.filter(c => c.avg_overall_score > 0).length || 0).toFixed(1)
      : '0.0',
    totalParticipants: cycles.reduce((acc, c) => acc + c.unique_targets, 0),
  };

  useEffect(() => {
    if (currentOrg?.id) {
      setLoading(true);
      setCycles([]);
      fetchCycles(currentOrg.id);
    } else {
      setLoading(false);
      setCycles([]);
    }
  }, [currentOrg?.id]);

  const fetchCycles = async (organizationId: string) => {
    try {
      const supabase = createClient();
      
      // Buscar ciclos
      const { data: cyclesData, error: cyclesError } = await supabase
        .from('tfci_cycles')
        .select('*')
        .eq('org_id', organizationId)
        .order('created_at', { ascending: false });

      if (cyclesError) {
        console.error('Error fetching cycles:', cyclesError);
        setLoading(false);
        return;
      }

      // Buscar todas as avaliações da organização
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('tfci_assessments')
        .select('*')
        .eq('org_id', organizationId);

      if (assessmentsError) {
        console.error('Error fetching assessments:', assessmentsError);
      }

      // Calcular estatísticas por ciclo
      const cyclesWithStats: TfciCycleWithStats[] = (cyclesData || []).map(cycle => {
        const cycleAssessments = (assessmentsData || []).filter(a => a.cycle_id === cycle.id);
        
        // Contagem de avaliadores únicos e alvos únicos
        const uniqueEvaluators = new Set(cycleAssessments.filter(a => a.evaluator_id).map(a => a.evaluator_id)).size;
        const uniqueTargets = new Set(cycleAssessments.map(a => a.target_user_id)).size;
        
        // Média de score geral
        const scoresWithValues = cycleAssessments.filter(a => a.overall_score != null);
        const avgOverallScore = scoresWithValues.length > 0
          ? scoresWithValues.reduce((acc, a) => acc + Number(a.overall_score), 0) / scoresWithValues.length
          : 0;

        // Avaliações feitas por pares (não auto-avaliação)
        const peerAssessments = cycleAssessments.filter(a => a.evaluator_id && a.evaluator_id !== a.target_user_id).length;

        // Taxa de conclusão: (avaliadores únicos / participantes esperados) * 100
        const expectedParticipants = cycle.participants_count || uniqueTargets || 1;
        const completionRate = Math.min(100, Math.round((uniqueEvaluators / expectedParticipants) * 100));

        return {
          ...cycle,
          total_assessments: cycleAssessments.length,
          unique_evaluators: uniqueEvaluators,
          unique_targets: uniqueTargets,
          avg_overall_score: avgOverallScore,
          assessments_by_peers: peerAssessments,
          completion_rate: completionRate > 0 ? completionRate : cycle.completion_rate,
          participants_count: uniqueTargets > 0 ? uniqueTargets : cycle.participants_count,
        };
      });

      setCycles(cyclesWithStats);
    } catch (error) {
      console.error('Error fetching cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?.id) return;

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('tfci_cycles')
        .insert({
          org_id: currentOrg.id,
          name: formData.name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status,
          created_by: user?.id,
        });

      if (!error) {
        setShowForm(false);
        setFormData({ name: '', start_date: '', end_date: '', status: 'draft' });
        fetchCycles(currentOrg.id);
      }
    } catch (error) {
      console.error('Error creating cycle:', error);
    }
  };

  const updateCycleStatus = async (cycleId: string, status: string) => {
    if (!currentOrg?.id) return;
    
    try {
      const supabase = createClient();
      await supabase
        .from('tfci_cycles')
        .update({ status })
        .eq('id', cycleId)
        .eq('org_id', currentOrg.id);
      
      fetchCycles(currentOrg.id);
    } catch (error) {
      console.error('Error updating cycle:', error);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      draft: { 
        bg: 'bg-gray-100', 
        text: 'text-gray-700', 
        border: 'border-gray-200',
        icon: Clock,
        label: 'Rascunho'
      },
      active: { 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700', 
        border: 'border-emerald-200',
        icon: Play,
        label: 'Ativo'
      },
      completed: { 
        bg: 'bg-blue-50', 
        text: 'text-blue-700', 
        border: 'border-blue-200',
        icon: CheckCircle2,
        label: 'Concluído'
      },
      cancelled: { 
        bg: 'bg-red-50', 
        text: 'text-red-700', 
        border: 'border-red-200',
        icon: AlertCircle,
        label: 'Cancelado'
      },
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading && !currentOrg?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFAF8]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141042]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header Corporativo */}
      <div className="bg-white border-b border-[#E5E5DC]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#141042] to-[#2D2A6E] flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-[#141042]">
                    Ciclos de Avaliação TFCI
                  </h1>
                  {currentOrg && (
                    <span className="px-3 py-1 bg-[#F5F5F0] text-[#666666] text-sm rounded-full flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {currentOrg.name}
                    </span>
                  )}
                </div>
                <p className="text-[#666666] mt-1">
                  Talent Forge Cultural Index — Avaliação comportamental 360°
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#141042] text-white font-medium rounded-lg hover:bg-[#1D1A5A] transition-all shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Novo Ciclo
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#E5E5DC] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#999999] font-medium">Total de Ciclos</p>
                <p className="text-3xl font-bold text-[#141042] mt-1">{stats.totalCycles}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#F5F5F0] flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#141042]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E5DC] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#999999] font-medium">Ciclos Ativos</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.activeCycles}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Play className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E5DC] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#999999] font-medium">Total Avaliações</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalAssessments}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E5DC] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#999999] font-medium">Avaliadores</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.totalEvaluators}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E5DC] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#999999] font-medium">Nota Média</p>
                <p className="text-3xl font-bold text-[#F97316] mt-1">{stats.avgScore}</p>
                <p className="text-xs text-[#999999]">de 5.0</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                <Star className="w-6 h-6 text-[#F97316]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E5DC] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#999999] font-medium">Avaliados</p>
                <p className="text-3xl font-bold text-[#141042] mt-1">{stats.totalParticipants}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#F5F5F0] flex items-center justify-center">
                <Users className="w-6 h-6 text-[#141042]" />
              </div>
            </div>
          </div>
        </div>

        {/* Formulário de Novo Ciclo */}
        {showForm && (
          <div className="bg-white rounded-xl border border-[#E5E5DC] p-6 mb-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[#141042] flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#141042]">Criar Novo Ciclo de Avaliação</h2>
                <p className="text-sm text-[#666666]">Configure os parâmetros do ciclo TFCI</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#141042] mb-2">
                  Nome do Ciclo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:ring-2 focus:ring-[#141042] focus:border-transparent transition-all text-[#141042] placeholder-[#999999]"
                  placeholder="Ex: Avaliação Comportamental Q1 2026"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[#141042] mb-2">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data de Início
                    </span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:ring-2 focus:ring-[#141042] focus:border-transparent transition-all text-[#141042]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#141042] mb-2">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data de Término
                    </span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:ring-2 focus:ring-[#141042] focus:border-transparent transition-all text-[#141042]"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-[#E5E5DC] text-[#666666] font-medium rounded-lg hover:bg-[#F5F5F0] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[#141042] text-white font-medium rounded-lg hover:bg-[#1D1A5A] transition-all shadow-sm"
                >
                  Criar Ciclo de Avaliação
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Ciclos */}
        {cycles.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E5E5DC] p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-[#F5F5F0] flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10 text-[#999999]" />
            </div>
            <h3 className="text-xl font-bold text-[#141042] mb-2">Nenhum ciclo criado</h3>
            <p className="text-[#666666] mb-6 max-w-md mx-auto">
              Comece criando seu primeiro ciclo de avaliação comportamental TFCI para avaliar a cultura organizacional.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#141042] text-white font-medium rounded-lg hover:bg-[#1D1A5A] transition-all shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Criar Primeiro Ciclo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-[#141042]">Ciclos de Avaliação</h2>
              <p className="text-sm text-[#666666]">{cycles.length} ciclo(s) encontrado(s)</p>
            </div>

            {cycles.map((cycle) => {
              const statusConfig = getStatusConfig(cycle.status);
              const StatusIcon = statusConfig.icon;
              const daysRemaining = getDaysRemaining(cycle.end_date);
              const isExpiringSoon = cycle.status === 'active' && daysRemaining <= 7 && daysRemaining > 0;
              const isOverdue = cycle.status === 'active' && daysRemaining < 0;

              return (
                <div 
                  key={cycle.id} 
                  className="bg-white rounded-xl border border-[#E5E5DC] p-6 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between">
                    {/* Informações Principais */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-[#141042]">{cycle.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusConfig.label}
                        </span>
                        {isExpiringSoon && (
                          <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
                            ⏰ {daysRemaining} dias restantes
                          </span>
                        )}
                        {isOverdue && (
                          <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full border border-red-200">
                            ⚠️ Prazo expirado
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-[#999999] mb-1">Período</p>
                          <p className="font-medium text-[#141042] flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-[#666666]" />
                            {formatDate(cycle.start_date)} — {formatDate(cycle.end_date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[#999999] mb-1">Avaliações</p>
                          <p className="font-medium text-[#141042] flex items-center gap-1.5">
                            <ClipboardCheck className="w-4 h-4 text-blue-600" />
                            <span className="text-blue-600 font-bold">{cycle.total_assessments}</span>
                            {cycle.assessments_by_peers > 0 && (
                              <span className="text-xs text-[#666666]">
                                ({cycle.assessments_by_peers} de pares)
                              </span>
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[#999999] mb-1">Avaliadores / Avaliados</p>
                          <p className="font-medium text-[#141042] flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-purple-600" />
                            <span className="text-purple-600">{cycle.unique_evaluators}</span>
                            <span className="text-[#999999]">/</span>
                            <Users className="w-4 h-4 text-[#666666]" />
                            <span>{cycle.unique_targets}</span>
                          </p>
                        </div>

                        <div>
                          <p className="text-[#999999] mb-1">Nota Média TFCI</p>
                          <div className="flex items-center gap-2">
                            <Star className={`w-4 h-4 ${cycle.avg_overall_score >= 4 ? 'text-emerald-500' : cycle.avg_overall_score >= 3 ? 'text-amber-500' : 'text-[#F97316]'}`} />
                            <span className={`text-lg font-bold ${cycle.avg_overall_score >= 4 ? 'text-emerald-600' : cycle.avg_overall_score >= 3 ? 'text-amber-600' : 'text-[#F97316]'}`}>
                              {cycle.avg_overall_score > 0 ? cycle.avg_overall_score.toFixed(1) : '—'}
                            </span>
                            <span className="text-xs text-[#999999]">/ 5.0</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-[#999999] mb-1">Taxa de Conclusão</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-[#E5E5DC] rounded-full overflow-hidden max-w-[80px]">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  cycle.completion_rate >= 80 ? 'bg-emerald-500' :
                                  cycle.completion_rate >= 50 ? 'bg-amber-500' : 'bg-[#F97316]'
                                }`}
                                style={{ width: `${cycle.completion_rate}%` }}
                              />
                            </div>
                            <span className={`font-bold text-sm ${
                              cycle.completion_rate >= 80 ? 'text-emerald-600' :
                              cycle.completion_rate >= 50 ? 'text-amber-600' : 'text-[#F97316]'
                            }`}>
                              {cycle.completion_rate}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 ml-6">
                      {cycle.status === 'draft' && (
                        <button
                          onClick={() => updateCycleStatus(cycle.id, 'active')}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-all"
                        >
                          <Play className="w-4 h-4" />
                          Ativar
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/php/tfci/cycles/${cycle.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F0] text-[#141042] text-sm font-medium rounded-lg hover:bg-[#E5E5DC] transition-all group-hover:bg-[#141042] group-hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                        Detalhes
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legenda das 5 Dimensões TFCI */}
        <div className="mt-8 bg-white rounded-xl border border-[#E5E5DC] p-6">
          <h3 className="text-sm font-semibold text-[#141042] mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            As 5 Dimensões Avaliadas no TFCI
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: 'Colaboração', desc: 'Trabalho em equipe', color: 'bg-blue-500' },
              { name: 'Comunicação', desc: 'Clareza e escuta', color: 'bg-emerald-500' },
              { name: 'Adaptabilidade', desc: 'Flexibilidade', color: 'bg-amber-500' },
              { name: 'Responsabilidade', desc: 'Compromisso', color: 'bg-purple-500' },
              { name: 'Liderança', desc: 'Iniciativa', color: 'bg-rose-500' },
            ].map((dim) => (
              <div key={dim.name} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${dim.color}`} />
                <div>
                  <p className="text-sm font-medium text-[#141042]">{dim.name}</p>
                  <p className="text-xs text-[#999999]">{dim.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
