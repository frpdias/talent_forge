'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, AlertTriangle, CheckCircle, Users, BarChart3, Clock, Send } from 'lucide-react';
import { useOrgStore } from '@/lib/store';
import { getAuthToken } from '@/lib/supabase/client';
import { Nr1CompliancePDF } from '@/components/reports/Nr1CompliancePDF';

interface Nr1Assessment {
  id: string;
  assessment_date: string;
  overall_risk_level: 'low' | 'medium' | 'high';
  overall_risk?: string;
  is_campaign?: boolean;
  campaign_name?: string;
  scope?: string;
  scope_target?: string;
  total_invited?: number;
  total_responded?: number;
  status?: string;
  team_id?: string;
  user_id?: string;
  workload_pace_risk: number;
  goal_pressure_risk: number;
  role_clarity_risk: number;
  autonomy_control_risk: number;
  leadership_support_risk: number;
  peer_collaboration_risk: number;
  recognition_justice_risk: number;
  communication_change_risk: number;
  conflict_harassment_risk: number;
  recovery_boundaries_risk: number;
}

export default function Nr1ListPage() {
  const router = useRouter();
  const { currentOrg, phpContextOrgId } = useOrgStore();
  const effectiveOrgId = phpContextOrgId || currentOrg?.id;
  const [assessments, setAssessments] = useState<Nr1Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [aggregating, setAggregating] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    campaigns_active: 0,
    campaigns_completed: 0,
    total_responses: 0,
  });

  useEffect(() => {
    if (effectiveOrgId) {
      setLoading(true);
      setAssessments([]);
      fetchAssessments(effectiveOrgId);
    } else {
      setLoading(false);
      setAssessments([]);
    }
  }, [effectiveOrgId]);

  const fetchAssessments = async (organizationId: string) => {
    try {
      const token = await getAuthToken() ?? '';

      const response = await fetch(
        `/api/v1/php/nr1/assessments?org_id=${organizationId}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-org-id': organizationId,
          },
        }
      );

      if (!response.ok) {
        console.error('Erro NR-1:', response.status);
        setAssessments([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const list: Nr1Assessment[] = Array.isArray(data) ? data : [];
      setAssessments(list);

      const campaigns = list.filter(a => a.is_campaign);
      setStats({
        total: list.length,
        campaigns_active: campaigns.filter(a => a.status === 'active').length,
        campaigns_completed: campaigns.filter(a => a.status === 'completed').length,
        total_responses: campaigns.reduce((sum, a) => sum + (a.total_responded || 0), 0),
      });
    } catch (error) {
      console.error('Erro ao carregar assessments:', error);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAggregate = async (campaignId: string) => {
    setAggregating(campaignId);
    try {
      const token = await getAuthToken() ?? '';
      const res = await fetch(`/api/v1/php/nr1/assessments/${campaignId}/aggregate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-org-id': effectiveOrgId || '',
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Erro: ${err.error || 'Erro ao agregar'}`);
        return;
      }

      const result = await res.json();
      alert(`✅ Agregação concluída! Risco geral: ${result.aggregation.overall_risk_level} (${result.aggregation.total_responses} respostas)`);
      if (effectiveOrgId) fetchAssessments(effectiveOrgId);
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setAggregating(null);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': case 'alto':
        return 'text-red-600 bg-red-50';
      case 'medium': case 'médio':
        return 'text-yellow-600 bg-yellow-50';
      case 'low': case 'baixo':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-[#666666] bg-[#FAFAF8]';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'high': case 'alto': return 'Alto';
      case 'medium': case 'médio': return 'Médio';
      case 'low': case 'baixo': return 'Baixo';
      default: return level || '—';
    }
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'active':
        return { label: 'Em Andamento', color: 'text-blue-600 bg-blue-50' };
      case 'completed':
        return { label: 'Concluída', color: 'text-green-600 bg-green-50' };
      case 'cancelled':
        return { label: 'Cancelada', color: 'text-gray-600 bg-gray-50' };
      case 'draft':
        return { label: 'Rascunho', color: 'text-yellow-600 bg-yellow-50' };
      default:
        return { label: 'Avaliação Manual', color: 'text-purple-600 bg-purple-50' };
    }
  };

  const getCompletionPercent = (a: Nr1Assessment) => {
    if (!a.total_invited || a.total_invited === 0) return 0;
    return Math.round(((a.total_responded || 0) / a.total_invited) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141042]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#141042]">
              NR-1 Digital — Riscos Psicossociais
            </h1>
            <p className="text-[#666666] mt-1">
              Campanhas de avaliação baseadas nas respostas dos colaboradores
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Nr1CompliancePDF assessments={assessments} />
            <button
              onClick={() => router.push('/php/nr1/new')}
              className="flex items-center gap-2 px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1656] transition"
            >
              <Plus className="w-5 h-5" />
              Nova Campanha
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-[#E5E5DC] rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-[#3B82F6]" />
              <div>
                <p className="text-[#999999] text-sm">Total Avaliações</p>
                <p className="text-2xl font-bold text-[#141042]">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E5DC] rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-[#3B82F6]" />
              <div>
                <p className="text-[#999999] text-sm">Campanhas Ativas</p>
                <p className="text-2xl font-bold text-[#3B82F6]">{stats.campaigns_active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E5DC] rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-[#10B981]" />
              <div>
                <p className="text-[#999999] text-sm">Campanhas Concluídas</p>
                <p className="text-2xl font-bold text-[#10B981]">{stats.campaigns_completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E5DC] rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-[#8B5CF6]" />
              <div>
                <p className="text-[#999999] text-sm">Total Respostas</p>
                <p className="text-2xl font-bold text-[#8B5CF6]">{stats.total_responses}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#E5E5DC] rounded-xl shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E5DC] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#141042]">
              Campanhas & Avaliações NR-1
            </h2>
            <button
              onClick={() => router.push('/php/nr1/invitations')}
              className="text-sm text-[#3B82F6] hover:text-[#2563EB] font-medium flex items-center gap-1"
            >
              <Send className="w-4 h-4" />
              Gerenciar Convites
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E5E5DC]">
              <thead className="bg-[#FAFAF8]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Campanha / Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Participação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Risco Geral
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E5E5DC]">
                {assessments.map((assessment) => {
                  const statusBadge = getStatusBadge(assessment.status);
                  const completion = getCompletionPercent(assessment);
                  const isCampaign = assessment.is_campaign;
                  const riskLevel = assessment.overall_risk || assessment.overall_risk_level;
                  const canAggregate = isCampaign && assessment.status === 'active' && (assessment.total_responded || 0) > 0;

                  return (
                    <tr
                      key={assessment.id}
                      className="hover:bg-[#FAFAF8] cursor-pointer"
                      onClick={() => router.push(`/php/nr1/${assessment.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-[#141042]">
                            {assessment.campaign_name || `Avaliação ${new Date(assessment.assessment_date).toLocaleDateString('pt-BR')}`}
                          </p>
                          <p className="text-xs text-[#999999]">
                            {new Date(assessment.assessment_date).toLocaleDateString('pt-BR')}
                            {assessment.scope_target && ` · ${assessment.scope_target}`}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isCampaign ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-30 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-[#10B981] h-2 rounded-full transition-all"
                                style={{ width: `${completion}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#666666]">
                              {assessment.total_responded || 0}/{assessment.total_invited || 0} ({completion}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#999999]">Manual</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {riskLevel ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(riskLevel)}`}>
                            {getRiskLabel(riskLevel)}
                          </span>
                        ) : (
                          <span className="text-xs text-[#999999]">Aguardando</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {canAggregate && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAggregate(assessment.id); }}
                              disabled={aggregating === assessment.id}
                              className="px-3 py-1 text-xs bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition disabled:opacity-50"
                            >
                              {aggregating === assessment.id ? 'Agregando...' : 'Agregar Resultados'}
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/php/nr1/${assessment.id}`); }}
                            className="text-[#141042] hover:text-[#1a1656]"
                          >
                            Detalhes
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {assessments.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-[#E5E5DC] mx-auto mb-3" />
              <p className="text-[#999999] mb-1">Nenhuma campanha encontrada</p>
              <p className="text-sm text-[#999999] mb-4">
                Crie uma campanha para coletar avaliações dos colaboradores
              </p>
              <button
                onClick={() => router.push('/php/nr1/new')}
                className="text-[#141042] hover:text-[#1a1656] font-medium"
              >
                Criar primeira campanha
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
