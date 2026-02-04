'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import { useOrgStore } from '@/lib/store';

const NR1_DIMENSIONS = [
  { key: 'workload_pace_risk', name: 'Carga de Trabalho & Ritmo' },
  { key: 'goal_pressure_risk', name: 'Pressão por Metas & Tempo' },
  { key: 'role_clarity_risk', name: 'Clareza de Papéis & Expectativas' },
  { key: 'autonomy_control_risk', name: 'Autonomia & Controle' },
  { key: 'leadership_support_risk', name: 'Suporte da Liderança' },
  { key: 'peer_collaboration_risk', name: 'Suporte entre Colegas / Colaboração' },
  { key: 'recognition_justice_risk', name: 'Reconhecimento & Justiça Percebida' },
  { key: 'communication_change_risk', name: 'Comunicação & Mudanças' },
  { key: 'conflict_harassment_risk', name: 'Conflitos / Assédio / Relações Difíceis' },
  { key: 'recovery_boundaries_risk', name: 'Recuperação & Limites' },
];

const RISK_LABELS = [
  { value: 1, label: 'Baixo', description: 'Situação adequada' },
  { value: 2, label: 'Médio', description: 'Requer atenção' },
  { value: 3, label: 'Alto', description: 'Ação urgente necessária' },
];

export default function NewNr1AssessmentPage() {
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, number>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?.id) {
      alert('Selecione uma empresa primeiro');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch('/api/v1/php/nr1/assessments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-org-id': currentOrg.id,
        },
        body: JSON.stringify({
          org_id: currentOrg.id,
          ...formData,
        }),
      });

      if (response.ok) {
        router.push('/php/nr1');
      } else {
        alert('Erro ao criar avaliação');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao criar avaliação');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (value: number) => {
    if (value === 3) return 'text-red-600 bg-red-50 border-red-300';
    if (value === 2) return 'text-yellow-600 bg-yellow-50 border-yellow-300';
    return 'text-green-600 bg-green-50 border-green-300';
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#666666] hover:text-[#141042] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-[#141042]">
            Nova Avaliação NR-1
          </h1>
          <p className="text-[#666666] mt-1">
            Avalie os 10 fatores de risco psicossocial (escala 1-3)
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {NR1_DIMENSIONS.map((dimension) => (
            <div
              key={dimension.key}
              className="bg-white border border-[#E5E5DC] rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-[#141042] mb-4">
                {dimension.name}
              </h3>

              <div className="grid grid-cols-3 gap-4">
                {RISK_LABELS.map((risk) => (
                  <button
                    key={risk.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, [dimension.key]: risk.value })
                    }
                    className={`p-4 border-2 rounded-lg transition ${
                      formData[dimension.key] === risk.value
                        ? getRiskColor(risk.value)
                        : 'border-[#E5E5DC] bg-white hover:bg-[#FAFAF8]'
                    }`}
                  >
                    <div className="text-center">
                      <p className="font-semibold">{risk.value}</p>
                      <p className="text-sm">{risk.label}</p>
                      <p className="text-xs mt-1 text-[#999999]">
                        {risk.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-[#E5E5DC] rounded-lg text-[#666666] hover:bg-[#FAFAF8] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || Object.keys(formData).length !== 10}
              className="flex items-center gap-2 px-6 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1656] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Salvando...' : 'Salvar Avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
