'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, FileText, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';

interface Nr1Assessment {
  id: string;
  org_id: string;
  assessed_user_id: string;
  assessed_by_id: string;
  assessment_date: string;
  overall_risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  status: 'draft' | 'completed' | 'action_plan_created';
  action_plan_id?: string;
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
  comments?: string;
  created_at: string;
  updated_at: string;
}

const NR1_DIMENSIONS = [
  { key: 'workload_pace_risk', label: 'Carga e Ritmo de Trabalho' },
  { key: 'goal_pressure_risk', label: 'Pressão por Metas' },
  { key: 'role_clarity_risk', label: 'Clareza de Papéis' },
  { key: 'autonomy_control_risk', label: 'Autonomia e Controle' },
  { key: 'leadership_support_risk', label: 'Suporte da Liderança' },
  { key: 'peer_collaboration_risk', label: 'Colaboração entre Pares' },
  { key: 'recognition_justice_risk', label: 'Reconhecimento e Justiça' },
  { key: 'communication_change_risk', label: 'Comunicação e Mudanças' },
  { key: 'conflict_harassment_risk', label: 'Conflitos e Assédio' },
  { key: 'recovery_boundaries_risk', label: 'Recuperação e Limites' },
];

const RISK_COLORS = {
  1: { bg: 'bg-green-100', text: 'text-green-800', label: 'Baixo', border: 'border-green-200' },
  2: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Médio', border: 'border-yellow-200' },
  3: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Alto', border: 'border-orange-200' },
  4: { bg: 'bg-red-100', text: 'text-red-800', label: 'Crítico', border: 'border-red-200' },
};

export default function Nr1DetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const [assessment, setAssessment] = useState<Nr1Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const assessmentId = params?.id as string;

  useEffect(() => {
    if (currentOrg?.id && assessmentId) {
      loadAssessment();
    }
  }, [currentOrg?.id, assessmentId]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;

      if (!token || !currentOrg?.id) {
        console.error('Token ou organização não encontrados');
        return;
      }

      const response = await fetch(
        `http://localhost:3001/api/v1/php/nr1/assessments/${assessmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-org-id': currentOrg.id,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAssessment(data);
      } else {
        console.error('Erro ao carregar avaliação:', response.status);
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (score: number): 1 | 2 | 3 | 4 => {
    if (score >= 4) return 4;
    if (score >= 3) return 3;
    if (score >= 2) return 2;
    return 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] p-6 flex items-center justify-center">
        <p className="text-[#666666]">Carregando avaliação...</p>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-[#E5E5DC] mx-auto mb-4" />
          <p className="text-[#666666] mb-4">Avaliação não encontrada</p>
          <button
            onClick={() => router.push('/php/nr1')}
            className="text-[#141042] hover:text-[#1a1557] font-medium"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/php/nr1')}
            className="flex items-center gap-2 text-[#666666] hover:text-[#141042] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Avaliações NR-1
          </button>

          <div className="bg-white rounded-lg border border-[#E5E5DC] p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#141042] mb-2">
                  Avaliação NR-1 - Riscos Psicossociais
                </h1>
                <div className="flex items-center gap-4 text-sm text-[#666666]">
                  <span>Data: {new Date(assessment.assessment_date).toLocaleDateString('pt-BR')}</span>
                  <span>Score: {assessment.risk_score.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  assessment.overall_risk_level === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                  assessment.overall_risk_level === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                  assessment.overall_risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                  'bg-green-100 text-green-800 border-green-200'
                }`}>
                  Risco {assessment.overall_risk_level === 'critical' ? 'Crítico' : 
                         assessment.overall_risk_level === 'high' ? 'Alto' :
                         assessment.overall_risk_level === 'medium' ? 'Médio' : 'Baixo'}
                </span>

                <span className={`text-xs px-2 py-1 rounded ${
                  assessment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  assessment.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {assessment.status === 'draft' && 'Rascunho'}
                  {assessment.status === 'completed' && 'Concluída'}
                  {assessment.status === 'action_plan_created' && 'Com Plano'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dimensões de Risco */}
        <div className="bg-white rounded-lg border border-[#E5E5DC] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#141042] mb-4">
            Dimensões Avaliadas (10 Fatores NR-1)
          </h2>

          <div className="space-y-4">
            {NR1_DIMENSIONS.map((dimension) => {
              const score = assessment[dimension.key as keyof Nr1Assessment] as number;
              const level = getRiskLevel(score);
              const riskColor = RISK_COLORS[level];

              return (
                <div key={dimension.key} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[#141042]">
                        {dimension.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${riskColor.bg} ${riskColor.text} ${riskColor.border}`}>
                        {riskColor.label} ({score.toFixed(1)})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          level === 4 ? 'bg-red-500' :
                          level === 3 ? 'bg-orange-500' :
                          level === 2 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comentários */}
        {assessment.comments && (
          <div className="bg-white rounded-lg border border-[#E5E5DC] p-6 mb-6">
            <h2 className="text-lg font-semibold text-[#141042] mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Observações e Comentários
            </h2>
            <p className="text-[#666666] whitespace-pre-wrap">{assessment.comments}</p>
          </div>
        )}

        {/* Plano de Ação */}
        <div className="bg-white rounded-lg border border-[#E5E5DC] p-6">
          <h2 className="text-lg font-semibold text-[#141042] mb-3">
            Plano de Ação
          </h2>

          {assessment.action_plan_id ? (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Plano de Ação Criado</p>
                  <p className="text-xs text-green-600">ID: {assessment.action_plan_id.slice(0, 8)}...</p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/php/action-plans/${assessment.action_plan_id}`)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Ver Plano
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#666666]" />
                <div>
                  <p className="text-sm font-medium text-[#666666]">Nenhum plano de ação criado</p>
                  <p className="text-xs text-[#999999]">Recomenda-se criar um plano para riscos altos/críticos</p>
                </div>
              </div>
              {(assessment.overall_risk_level === 'high' || assessment.overall_risk_level === 'critical') && (
                <button
                  onClick={() => router.push(`/php/action-plans/new?assessment_id=${assessment.id}`)}
                  className="px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1557] transition-colors text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Criar Plano
                </button>
              )}
            </div>
          )}
        </div>

        {/* Metadados */}
        <div className="mt-6 text-sm text-[#999999] text-center">
          Criado em {new Date(assessment.created_at).toLocaleString('pt-BR')} • 
          Atualizado em {new Date(assessment.updated_at).toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
}
