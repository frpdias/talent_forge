'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface TfciCycle {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  participants_count: number;
  completion_rate: number;
}

interface Assessment {
  id: string;
  evaluator_name: string | null;
  target_user_name: string;
  collaboration_score: number;
  communication_score: number;
  adaptability_score: number;
  accountability_score: number;
  leadership_score: number;
  is_anonymous: boolean;
  created_at: string;
}

export default function CycleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cycleId = params.id as string;

  const [cycle, setCycle] = useState<TfciCycle | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assessments' | 'heatmap'>('assessments');

  useEffect(() => {
    fetchCycleData();
  }, [cycleId]);

  const fetchCycleData = async () => {
    try {
      const supabase = createClient();
      
      // Buscar ciclo
      const { data: cycleData, error: cycleError } = await supabase
        .from('tfci_cycles')
        .select('*')
        .eq('id', cycleId)
        .single();
      
      if (cycleError) {
        console.error('Error fetching cycle:', cycleError);
      } else {
        setCycle(cycleData);
      }
      
      // Buscar assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('tfci_assessments')
        .select('*')
        .eq('cycle_id', cycleId)
        .order('created_at', { ascending: false });
      
      if (assessmentsError) {
        console.error('Error fetching assessments:', assessmentsError);
      } else {
        setAssessments(assessmentsData || []);
      }
    } catch (error) {
      console.error('Error fetching cycle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600 font-semibold';
    if (score >= 3) return 'text-yellow-600 font-medium';
    return 'text-red-600 font-semibold';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <p className="text-gray-600">Ciclo não encontrado</p>
          <button
            onClick={() => router.push('/php/tfci/cycles')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar para Ciclos
          </button>
        </div>
      </div>
    );
  }

  const dimensions = [
    { key: 'collaboration_score', label: 'Colaboração' },
    { key: 'communication_score', label: 'Comunicação' },
    { key: 'adaptability_score', label: 'Adaptabilidade' },
    { key: 'accountability_score', label: 'Responsabilidade' },
    { key: 'leadership_score', label: 'Liderança' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/php/tfci/cycles')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para Ciclos
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{cycle.name}</h1>
            <p className="text-gray-600 mt-2">
              {new Date(cycle.start_date).toLocaleDateString('pt-BR')} - {new Date(cycle.end_date).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              cycle.status === 'active' ? 'bg-green-100 text-green-800' :
              cycle.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {cycle.status}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {cycle.status === 'active' && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => router.push(`/php/tfci/cycles/${cycle.id}/assess`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              ✍️ Enviar Avaliação
            </button>
            <button
              onClick={() => router.push(`/php/tfci/cycles/${cycle.id}/heatmap`)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              📊 Ver Heatmap
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-600 mb-1">Participantes</div>
          <div className="text-3xl font-bold text-gray-900">{cycle.participants_count}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-600 mb-1">Avaliações</div>
          <div className="text-3xl font-bold text-gray-900">{assessments.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-sm text-gray-600 mb-1">Taxa de Conclusão</div>
          <div className="text-3xl font-bold text-gray-900">{cycle.completion_rate}%</div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${cycle.completion_rate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('assessments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assessments'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Avaliações ({assessments.length})
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'heatmap'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Heatmap
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'assessments' && (
        <div className="space-y-4">
          {assessments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <p className="text-gray-600">Nenhuma avaliação enviada ainda</p>
            </div>
          ) : (
            assessments.map((assessment) => (
              <div key={assessment.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{assessment.target_user_name}</h3>
                    <p className="text-sm text-gray-600">
                      Avaliado por: {assessment.is_anonymous ? 'Anônimo' : assessment.evaluator_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(assessment.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-4">
                  {dimensions.map((dim) => (
                    <div key={dim.key} className="text-center">
                      <div className="text-xs text-gray-600 mb-1">{dim.label}</div>
                      <div className={`text-2xl font-bold ${getScoreColor(assessment[dim.key as keyof Assessment] as number)}`}>
                        {assessment[dim.key as keyof Assessment]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'heatmap' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Visualize o heatmap completo com todas as dimensões
            </p>
            <button
              onClick={() => router.push(`/php/tfci/cycles/${cycleId}/heatmap`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📊 Abrir Heatmap Completo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
