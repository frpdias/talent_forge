'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { API_V1_URL } from '@/lib/api-config';
import { Heart, AlertTriangle, CheckCircle, Info, ArrowLeft, XCircle } from 'lucide-react';

interface SelfAssessmentData {
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
  comments: string;
}

const DIMENSIONS = [
  {
    key: 'workload_pace_risk',
    label: 'Carga de Trabalho & Ritmo',
    description: 'Como você avalia o volume, intensidade e velocidade das suas demandas?',
    examples: 'Volume de trabalho, prazos, intensidade das tarefas'
  },
  {
    key: 'goal_pressure_risk',
    label: 'Pressão por Metas & Tempo',
    description: 'Como você avalia a pressão para atingir metas e cumprir prazos?',
    examples: 'Expectativas de desempenho, prazos apertados, cobranças'
  },
  {
    key: 'role_clarity_risk',
    label: 'Clareza de Papéis & Expectativas',
    description: 'Você tem clareza sobre suas responsabilidades e o que é esperado de você?',
    examples: 'Definição de funções, expectativas claras, prioridades'
  },
  {
    key: 'autonomy_control_risk',
    label: 'Autonomia & Controle',
    description: 'Você sente que tem liberdade para tomar decisões sobre seu trabalho?',
    examples: 'Poder de decisão, controle sobre métodos, flexibilidade'
  },
  {
    key: 'leadership_support_risk',
    label: 'Suporte da Liderança',
    description: 'Como você avalia o apoio e orientação que recebe dos seus gestores?',
    examples: 'Disponibilidade do gestor, feedback, apoio em decisões'
  },
  {
    key: 'peer_collaboration_risk',
    label: 'Suporte entre Colegas / Colaboração',
    description: 'Como você avalia o trabalho em equipe e cooperação com colegas?',
    examples: 'Espírito de equipe, colaboração, ajuda mútua'
  },
  {
    key: 'recognition_justice_risk',
    label: 'Reconhecimento & Justiça Percebida',
    description: 'Você sente que seu trabalho é reconhecido e o tratamento é justo?',
    examples: 'Valorização, equidade, reconhecimento de esforços'
  },
  {
    key: 'communication_change_risk',
    label: 'Comunicação & Mudanças',
    description: 'Como você avalia a clareza na comunicação e gestão de mudanças?',
    examples: 'Transparência, informação sobre mudanças, comunicação clara'
  },
  {
    key: 'conflict_harassment_risk',
    label: 'Conflitos / Assédio / Relações Difíceis',
    description: 'O ambiente está livre de conflitos, assédio ou relações hostis?',
    examples: 'Respeito mútuo, ausência de assédio, resolução de conflitos'
  },
  {
    key: 'recovery_boundaries_risk',
    label: 'Recuperação & Limites',
    description: 'Você consegue manter equilíbrio entre trabalho e vida pessoal?',
    examples: 'Descanso adequado, desconexão fora do horário, pausas'
  }
];

const SCALE_LABELS = {
  1: 'Muito Ruim',
  2: 'Ruim',
  3: 'Regular',
  4: 'Bom',
  5: 'Muito Bom'
};

export default function NR1SelfAssessmentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141042]"></div>
      </div>
    }>
      <NR1SelfAssessmentContent />
    </Suspense>
  );
}

function NR1SelfAssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(!!token);
  const [tokenError, setTokenError] = useState<string>('');
  const [invitationData, setInvitationData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [employee, setEmployee] = useState<any>(null);
  const [formData, setFormData] = useState<SelfAssessmentData>({
    workload_pace_risk: 3,
    goal_pressure_risk: 3,
    role_clarity_risk: 3,
    autonomy_control_risk: 3,
    leadership_support_risk: 3,
    peer_collaboration_risk: 3,
    recognition_justice_risk: 3,
    communication_change_risk: 3,
    conflict_harassment_risk: 3,
    recovery_boundaries_risk: 3,
    comments: ''
  });

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      loadEmployeeData();
    }
  }, [token]);

  const validateToken = async () => {
    setValidatingToken(true);
    setTokenError('');

    try {
      const res = await fetch(`/api/v1/php/nr1/invitations/token/${token}`);
      
      if (!res.ok) {
        const error = await res.json();
        setTokenError(error.message || 'Token inválido');
        setValidatingToken(false);
        return;
      }

      const data = await res.json();
      
      if (!data.valid) {
        setTokenError('Token inválido ou expirado');
        setValidatingToken(false);
        return;
      }

      // Salvar dados do convite e funcionário
      setInvitationData(data.invitation);
      setEmployee({
        id: data.invitation.employee_id,
        full_name: data.invitation.employee.full_name,
        position: data.invitation.employee.position,
        organization_id: data.invitation.org_id
      });
      
      setValidatingToken(false);
    } catch (error: any) {
      console.error('Erro ao validar token:', error);
      setTokenError('Erro ao validar convite. Tente novamente.');
      setValidatingToken(false);
    }
  };

  const loadEmployeeData = async () => {
    try {
      const { data: { session } } = await createClient().auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Buscar funcionário associado ao usuário logado
      const { data: employeeData, error } = await createClient()
        .from('employees')
        .select('id, full_name, position, organization_id')
        .eq('user_id', session.user.id)
        .single();

      if (error || !employeeData) {
        console.error('Erro ao carregar dados do funcionário:', error);
        return;
      }

      setEmployee(employeeData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const calculateScore = () => {
    const values = Object.entries(formData)
      .filter(([key]) => key !== 'comments')
      .map(([, value]) => Number(value));
    
    const sum = values.reduce((acc, val) => acc + val, 0);
    return (sum / values.length).toFixed(2);
  };

  const getRiskLevel = (score: number) => {
    if (score >= 4.5) return { level: 'low', label: 'Baixo', color: 'green' };
    if (score >= 3.5) return { level: 'medium', label: 'Médio', color: 'yellow' };
    if (score >= 2.5) return { level: 'high', label: 'Alto', color: 'orange' };
    return { level: 'critical', label: 'Crítico', color: 'red' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employee) {
      alert('Dados do funcionário não encontrados');
      return;
    }

    try {
      setLoading(true);
      const { data: { session } } = await createClient().auth.getSession();
      const authToken = session?.access_token;

      if (!authToken && !token) {
        alert('Sessão expirada. Faça login novamente.');
        return;
      }

      const score = parseFloat(calculateScore());
      const riskInfo = getRiskLevel(score);

      const payload = {
        org_id: employee.organization_id,
        employee_id: employee.id,
        ...formData,
        self_score: score,
        self_risk_level: riskInfo.level,
        status: 'completed',
        // Incluir invitation_id se veio via token
        ...(invitationData && { invitation_id: invitationData.id })
      };

      const response = await fetch('${API_V1_URL}/php/nr1/self-assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
          'x-org-id': employee.organization_id
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('✅ Avaliação enviada com sucesso!');
        // Se veio via token, mostrar mensagem de conclusão
        if (token) {
          alert('Obrigado por responder! Você pode fechar esta página.');
        } else {
          router.push('/dashboard');
        }
      } else {
        const errorData = await response.json();
        alert(`Erro ao enviar avaliação: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao enviar:', error);
      alert('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const currentDimension = DIMENSIONS[currentStep];
  const progress = ((currentStep + 1) / DIMENSIONS.length) * 100;
  const score = parseFloat(calculateScore());
  const riskInfo = getRiskLevel(score);

  // Validando token
  if (validatingToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141042] mx-auto mb-4"></div>
          <p className="text-gray-600">Validando convite...</p>
        </div>
      </div>
    );
  }

  // Erro no token
  if (tokenError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Convite Inválido</h1>
          <p className="text-gray-700 mb-6">{tokenError}</p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Verifique se o link está correto</p>
            <p>• O convite pode ter expirado (30 dias)</p>
            <p>• Este convite já pode ter sido respondido</p>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Entre em contato com o RH se precisar de um novo convite.
          </p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141042]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Token Info Banner */}
      {token && invitationData && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-900">Convite NR-1 Auto-Avaliação</p>
              <p className="text-sm text-blue-700 mt-1">
                Você foi convidado pelo RH para responder esta avaliação. Suas respostas são confidenciais.
              </p>
              {invitationData.expires_at && (
                <p className="text-xs text-blue-600 mt-2">
                  Válido até: {new Date(invitationData.expires_at).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        {!token && (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-[#141042] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        )}
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-8 h-8 text-pink-600" />
          <h1 className="text-3xl font-bold text-[#141042]">
            Avaliação NR-1: Sua Percepção
          </h1>
        </div>
        <p className="text-gray-600">
          Esta pesquisa é confidencial e ajuda a empresa a identificar e prevenir riscos psicossociais no ambiente de trabalho.
        </p>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold text-[#141042] mb-1">Sobre esta avaliação:</p>
              <p>Você está avaliando como <strong>percebe</strong> seu ambiente de trabalho. Não existem respostas certas ou erradas. Seja honesto(a) para que possamos melhorar as condições de trabalho.</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Dimensão {currentStep + 1} de {DIMENSIONS.length}
            </span>
            <span className="text-sm text-gray-600">{progress.toFixed(0)}% concluído</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#141042] h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Dimension Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#141042] mb-2">
              {currentDimension.label}
            </h2>
            <p className="text-gray-700 mb-2">{currentDimension.description}</p>
            <p className="text-sm text-gray-500 italic">
              Exemplos: {currentDimension.examples}
            </p>
          </div>

          {/* Rating Scale */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecione sua avaliação:
            </label>
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, [currentDimension.key]: value }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData[currentDimension.key as keyof SelfAssessmentData] === value
                      ? 'border-[#141042] bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl font-bold text-[#141042] mb-1">{value}</div>
                  <div className="text-xs text-gray-600">{SCALE_LABELS[value as keyof typeof SCALE_LABELS]}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mb-8">
          <button
            type="button"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>

          {currentStep < DIMENSIONS.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => Math.min(DIMENSIONS.length - 1, prev + 1))}
              className="px-6 py-2 text-white bg-[#141042] rounded-lg hover:bg-purple-800"
            >
              Próxima
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep(DIMENSIONS.length)}
              className="px-6 py-2 text-white bg-[#141042] rounded-lg hover:bg-purple-800"
            >
              Revisar e Enviar
            </button>
          )}
        </div>

        {/* Summary/Review Step */}
        {currentStep === DIMENSIONS.length && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-[#141042] mb-6">Revisão da Avaliação</h2>

            {/* Score Preview */}
            <div className={`mb-6 p-6 rounded-lg bg-${riskInfo.color}-50 border-2 border-${riskInfo.color}-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-1">Seu Score Geral</div>
                  <div className="text-4xl font-bold text-[#141042]">{score}</div>
                </div>
                <div className={`px-4 py-2 rounded-full bg-${riskInfo.color}-100 text-${riskInfo.color}-700 font-semibold`}>
                  Risco: {riskInfo.label}
                </div>
              </div>
            </div>

            {/* Dimensions Summary */}
            <div className="space-y-3 mb-6">
              {DIMENSIONS.map((dim, idx) => (
                <div key={dim.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{dim.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-[#141042]">
                      {formData[dim.key as keyof SelfAssessmentData]}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(idx)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Comments */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentários Adicionais (Opcional)
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                placeholder="Compartilhe qualquer observação adicional sobre seu ambiente de trabalho..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(DIMENSIONS.length - 1)}
                className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Enviar Avaliação
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <strong>Atenção:</strong> Após enviar, você não poderá alterar suas respostas. Revise cuidadosamente antes de finalizar.
                </p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
