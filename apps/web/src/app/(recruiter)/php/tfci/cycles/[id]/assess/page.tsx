'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

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

export default function AssessmentFormPage() {
  const params = useParams();
  const router = useRouter();
  const cycleId = params.id as string;

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
      const response = await fetch('/api/v1/php/tfci/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>

        <h1 className="text-3xl font-bold text-gray-900">Nova Avaliação Comportamental</h1>
        <p className="text-gray-600 mt-2">
          Avalie as competências comportamentais do colaborador de forma honesta e construtiva
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informações Básicas */}
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Informações da Avaliação</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Colaborador a ser Avaliado *
            </label>
            <input
              type="text"
              value={formData.target_user_id}
              onChange={(e) => setFormData({ ...formData, target_user_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ID do colaborador (UUID)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Em produção, isso seria um seletor de usuários
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipe/Departamento (opcional)
            </label>
            <input
              type="text"
              value={formData.team_name}
              onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Engenharia, Vendas..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.is_anonymous}
              onChange={(e) => setFormData({ ...formData, is_anonymous: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="anonymous" className="text-sm text-gray-700">
              Enviar avaliação anônima (seu nome não será exibido)
            </label>
          </div>
        </div>

        {/* Dimensões de Avaliação */}
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Dimensões Comportamentais</h2>
          <p className="text-sm text-gray-600">
            Avalie cada dimensão de 1 a 5 conforme a performance observada
          </p>

          {dimensions.map((dimension) => {
            const currentScore = formData[dimension.key as keyof typeof formData] as number;
            const hovered = hoveredRating?.dimension === dimension.key ? hoveredRating.value : null;
            const displayScore = hovered || currentScore;

            return (
              <div key={dimension.key} className="border-t border-gray-100 pt-6 first:border-0 first:pt-0">
                <div className="mb-3">
                  <h3 className="font-medium text-gray-900">{dimension.label}</h3>
                  <p className="text-sm text-gray-600">{dimension.description}</p>
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
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : hovered && score <= hovered
                          ? 'border-blue-300 bg-blue-25'
                          : 'border-gray-200 hover:border-gray-300'
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
                  <div className="mt-2 text-sm text-gray-600">
                    Selecionado: <span className="font-medium">{ratingLabels[currentScore - 1]}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Comentários */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Comentários (opcional)</h2>
          <textarea
            value={formData.comments}
            onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="Adicione observações ou feedback construtivo..."
          />
          <p className="text-xs text-gray-500 mt-2">
            Os comentários são visíveis apenas para gestores e RH
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push(`/php/tfci/cycles/${cycleId}`)}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {submitting ? 'Enviando...' : 'Enviar Avaliação'}
          </button>
        </div>
      </form>
    </div>
  );
}
