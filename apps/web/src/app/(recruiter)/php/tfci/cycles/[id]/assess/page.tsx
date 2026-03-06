'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuthToken, createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';

const dimensions = [
  { key: 'collaboration_score', label: 'Colaboração', description: 'Trabalha bem em equipe, compartilha conhecimento' },
  { key: 'communication_score', label: 'Comunicação', description: 'Se expressa claramente, ouve ativamente' },
  { key: 'adaptability_score', label: 'Adaptabilidade', description: 'Lida bem com mudanças, flexível' },
  { key: 'accountability_score', label: 'Responsabilidade', description: 'Cumpre prazos, assume compromissos' },
  { key: 'leadership_score', label: 'Liderança', description: 'Inspira outros, toma iniciativa' },
];

const ratingLabels = [
  'Muito Abaixo',
  'Abaixo da Média',
  'Adequado',
  'Acima da Média',
  'Excepcional',
];

interface Employee {
  id: string;
  full_name: string;
  position: string | null;
  department: string | null;
  user_id: string | null;
}

export default function AssessmentFormPage() {
  const params = useParams();
  const router = useRouter();
  const cycleId = params.id as string;
  const { currentOrg, phpContextOrgId } = useOrgStore();
  const effectiveOrgId = phpContextOrgId || currentOrg?.id;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empSearch, setEmpSearch] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [formData, setFormData] = useState({
    target_user_id: '',
    collaboration_score: 0,
    communication_score: 0,
    adaptability_score: 0,
    accountability_score: 0,
    leadership_score: 0,
    comments: '',
    team_name: '',
    is_anonymous: false,
  });

  // Carregar employees da organização
  useEffect(() => {
    if (!effectiveOrgId) { setLoadingEmployees(false); return; }
    const load = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('employees')
          .select('id, full_name, position, department, user_id')
          .eq('organization_id', effectiveOrgId)
          .eq('status', 'active')
          .order('full_name');
        setEmployees(data || []);
      } catch (e) {
        console.error('Erro ao buscar employees:', e);
      } finally {
        setLoadingEmployees(false);
      }
    };
    load();
  }, [effectiveOrgId]);

  const filteredEmployees = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(empSearch.toLowerCase()) ||
      (e.department && e.department.toLowerCase().includes(empSearch.toLowerCase())) ||
      (e.position && e.position.toLowerCase().includes(empSearch.toLowerCase()))
  );

  const selectedEmployee = employees.find(
    (e) => (e.user_id || e.id) === formData.target_user_id
  );

  const [hoveredRating, setHoveredRating] = useState<{ dimension: string; value: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleScoreChange = (dimension: string, score: number) => {
    setFormData({ ...formData, [dimension]: score });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    const scores = [
      formData.collaboration_score,
      formData.communication_score,
      formData.adaptability_score,
      formData.accountability_score,
      formData.leadership_score,
    ];

    if (scores.some((score) => score === 0)) {
      alert('Por favor, avalie todas as dimensões');
      return;
    }

    if (!formData.target_user_id) {
      alert('Por favor, selecione o colaborador a ser avaliado');
      return;
    }

    setSubmitting(true);

    try {
      const token = await getAuthToken();
      if (!token) { alert('Sessão expirada. Faça login novamente.'); setSubmitting(false); return; }

      const response = await fetch('/api/v1/php/tfci/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          cycle_id: cycleId,
          target_user_id: formData.target_user_id,
          collaboration_score: formData.collaboration_score,
          communication_score: formData.communication_score,
          adaptability_score: formData.adaptability_score,
          accountability_score: formData.accountability_score,
          leadership_score: formData.leadership_score,
          comments: formData.comments || undefined,
          team_name: formData.team_name || undefined,
          is_anonymous: formData.is_anonymous,
        }),
      });

      if (response.ok) {
        alert('Avaliação enviada com sucesso!');
        router.push(`/php/tfci/cycles/${cycleId}`);
      } else {
        const error = await response.json();
        alert(error.message || 'Erro ao enviar avaliação');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Erro ao enviar avaliação');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <button
          onClick={() => router.push(`/php/tfci/cycles/${cycleId}`)}
          className="flex items-center gap-2 text-[#666666] hover:text-[#141042] mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>

        <h1 className="text-3xl font-bold text-[#141042]">Nova Avaliação Comportamental</h1>
        <p className="text-[#666666] mt-2">
          Avalie as competências comportamentais do colaborador de forma honesta e construtiva
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informações Básicas */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E5DC] p-6 space-y-4">
          <h2 className="text-xl font-semibold text-[#141042]">Informações da Avaliação</h2>

          {/* Seletor de Colaborador */}
          <div>
            <label className="block text-sm font-medium text-[#141042] mb-1">
              Colaborador a ser Avaliado *
            </label>
            {selectedEmployee ? (
              <div className="flex items-center gap-3 p-3 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg">
                <div className="w-10 h-10 bg-[#141042] text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {selectedEmployee.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#141042]">{selectedEmployee.full_name}</p>
                  <p className="text-xs text-[#666666]">{selectedEmployee.position} • {selectedEmployee.department}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, target_user_id: '', team_name: '' })}
                  className="text-[#999999] hover:text-[#EF4444] transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E5DC] rounded-lg focus:ring-2 focus:ring-[#141042] focus:border-transparent mb-2"
                  placeholder="Buscar por nome, cargo ou departamento..."
                />
                {loadingEmployees ? (
                  <p className="text-sm text-[#999999] p-2">Carregando colaboradores...</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-[#E5E5DC] rounded-lg divide-y divide-[#E5E5DC]">
                    {filteredEmployees.length === 0 ? (
                      <p className="text-sm text-[#999999] p-3">Nenhum colaborador encontrado</p>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              target_user_id: emp.user_id || emp.id,
                              team_name: emp.department || '',
                            });
                            setEmpSearch('');
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-[#FAFAF8] transition-colors text-left"
                        >
                          <div className="w-8 h-8 bg-[#3B82F6]/10 text-[#3B82F6] rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#141042] text-sm truncate">{emp.full_name}</p>
                            <p className="text-xs text-[#666666] truncate">{emp.position} • {emp.department}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#141042] mb-1">
              Equipe/Departamento
            </label>
            <input
              type="text"
              value={formData.team_name}
              onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
              className="w-full px-3 py-2 border border-[#E5E5DC] rounded-lg focus:ring-2 focus:ring-[#141042] bg-[#FAFAF8]"
              placeholder="Preenchido automaticamente"
              readOnly={!!selectedEmployee?.department}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.is_anonymous}
              onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
              className="w-4 h-4 text-[#141042] border-[#E5E5DC] rounded focus:ring-[#141042]"
            />
            <label htmlFor="anonymous" className="text-sm text-[#666666]">
              Enviar avaliação anônima (seu nome não será exibido)
            </label>
          </div>
        </div>

        {/* Dimensões de Avaliação */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E5DC] p-6 space-y-6">
          <h2 className="text-xl font-semibold text-[#141042]">Dimensões Comportamentais</h2>
          <p className="text-sm text-[#666666]">
            Avalie cada dimensão de 1 a 5 conforme a performance observada
          </p>

          {dimensions.map((dimension) => {
            const currentScore = formData[dimension.key as keyof typeof formData] as number;
            const hovered = hoveredRating?.dimension === dimension.key ? hoveredRating.value : null;
            const displayScore = hovered || currentScore;

            return (
              <div key={dimension.key} className="border-t border-[#E5E5DC] pt-6 first:border-0 first:pt-0">
                <div className="mb-3">
                  <h3 className="font-medium text-[#141042]">{dimension.label}</h3>
                  <p className="text-sm text-[#666666]">{dimension.description}</p>
                </div>

                <div className="flex items-center gap-4">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => handleScoreChange(dimension.key, score)}
                      onMouseEnter={() => setHoveredRating({ dimension: dimension.key, value: score })}
                      onMouseLeave={() => setHoveredRating(null)}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        currentScore === score
                          ? 'border-[#141042] bg-[#141042]/5 text-[#141042]'
                          : hovered && score <= hovered
                          ? 'border-[#141042]/30 bg-[#141042]/5'
                          : 'border-[#E5E5DC] hover:border-[#141042]/20'
                      }`}
                    >
                      <div className="text-2xl font-bold">{score}</div>
                      <div className="text-xs mt-1 truncate">
                        {displayScore === score ? ratingLabels[score - 1] : ''}
                      </div>
                    </button>
                  ))}
                </div>

                {currentScore > 0 && !hovered && (
                  <div className="mt-2 text-sm text-[#666666]">
                    Selecionado: <span className="font-medium text-[#141042]">{ratingLabels[currentScore - 1]}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Comentários */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E5DC] p-6">
          <h2 className="text-xl font-semibold text-[#141042] mb-4">Comentários (opcional)</h2>
          <textarea
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            className="w-full px-3 py-2 border border-[#E5E5DC] rounded-lg focus:ring-2 focus:ring-[#141042] focus:border-transparent"
            rows={4}
            placeholder="Adicione observações ou feedback construtivo..."
          />
          <p className="text-xs text-[#999999] mt-2">
            Os comentários são visíveis apenas para gestores e RH
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push(`/php/tfci/cycles/${cycleId}`)}
            className="flex-1 px-6 py-3 border border-[#E5E5DC] text-[#666666] rounded-lg hover:bg-[#FAFAF8] transition-colors"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-[#141042] text-white rounded-lg hover:bg-[#1a1656] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {submitting ? 'Enviando...' : 'Enviar Avaliação'}
          </button>
        </div>
      </form>
    </div>
  );
}
