'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, AlertTriangle, CheckCircle, Users } from 'lucide-react';

interface Nr1Assessment {
  id: string;
  assessment_date: string;
  overall_risk_level: 'low' | 'medium' | 'high';
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
  const [assessments, setAssessments] = useState<Nr1Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    high_risk: 0,
    medium_risk: 0,
    low_risk: 0,
  });

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const orgId = '00000000-0000-0000-0000-000000000000'; // TODO: Get from context
      const response = await fetch(
        `/api/v1/php/nr1/assessments?org_id=${orgId}&limit=50`
      );
      const data = await response.json();
      setAssessments(data);

      // Calculate stats
      setStats({
        total: data.length,
        high_risk: data.filter((a: Nr1Assessment) => a.overall_risk_level === 'high').length,
        medium_risk: data.filter((a: Nr1Assessment) => a.overall_risk_level === 'medium').length,
        low_risk: data.filter((a: Nr1Assessment) => a.overall_risk_level === 'low').length,
      });
    } catch (error) {
      console.error('Erro ao carregar assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'high':
        return 'Alto';
      case 'medium':
        return 'Médio';
      case 'low':
        return 'Baixo';
      default:
        return level;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F4ED8]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#141042]">
              NR-1 Digital — Riscos Psicossociais
            </h1>
            <p className="text-[#666666] mt-1">
              Compliance legal e gestão de saúde ocupacional
            </p>
          </div>
          <button
            onClick={() => router.push('/php/nr1/new')}
            className="flex items-center gap-2 px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1656] transition"
          >
            <Plus className="w-5 h-5" />
            Nova Avaliação
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-[#E5E5DC] rounded-lg p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-[#3B82F6]" />
              <div>
                <p className="text-[#999999] text-sm">Total Avaliações</p>
                <p className="text-2xl font-bold text-[#141042]">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E5DC] rounded-lg p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
              <div>
                <p className="text-[#999999] text-sm">Risco Alto</p>
                <p className="text-2xl font-bold text-[#EF4444]">{stats.high_risk}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E5DC] rounded-lg p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-[#F59E0B]" />
              <div>
                <p className="text-[#999999] text-sm">Risco Médio</p>
                <p className="text-2xl font-bold text-[#F59E0B]">{stats.medium_risk}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E5DC] rounded-lg p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-[#10B981]" />
              <div>
                <p className="text-[#999999] text-sm">Risco Baixo</p>
                <p className="text-2xl font-bold text-[#10B981]">{stats.low_risk}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#E5E5DC] rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E5DC]">
            <h2 className="text-lg font-semibold text-[#141042]">
              Histórico de Avaliações NR-1
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E5E5DC]">
              <thead className="bg-[#FAFAF8]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Nível de Risco
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Dimensões Críticas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-[#666666] uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E5E5DC]">
                {assessments.map((assessment) => {
                  const criticalDimensions = [
                    assessment.workload_pace_risk,
                    assessment.goal_pressure_risk,
                    assessment.role_clarity_risk,
                    assessment.autonomy_control_risk,
                    assessment.leadership_support_risk,
                    assessment.peer_collaboration_risk,
                    assessment.recognition_justice_risk,
                    assessment.communication_change_risk,
                    assessment.conflict_harassment_risk,
                    assessment.recovery_boundaries_risk,
                  ].filter(score => score === 3).length;

                  return (
                    <tr
                      key={assessment.id}
                      className="hover:bg-[#FAFAF8] cursor-pointer"
                      onClick={() => router.push(`/php/nr1/${assessment.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#141042]">
                        {new Date(assessment.assessment_date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(
                            assessment.overall_risk_level
                          )}`}
                        >
                          {getRiskLabel(assessment.overall_risk_level)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#666666]">
                        {criticalDimensions > 0 ? (
                          <span className="text-[#EF4444]">
                            {criticalDimensions} dimensão(ões) crítica(s)
                          </span>
                        ) : (
                          'Nenhuma'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-[#141042] hover:text-[#1a1656]">
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {assessments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#999999]">Nenhuma avaliação encontrada</p>
              <button
                onClick={() => router.push('/php/nr1/new')}
                className="mt-4 text-[#141042] hover:text-[#1a1656] font-medium"
              >
                Criar primeira avaliação
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
