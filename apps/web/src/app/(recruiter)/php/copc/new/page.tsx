'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useOrgStore } from '@/lib/store';

export default function NewCopcMetric() {
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Quality (35%)
  const [qualityScore, setQualityScore] = useState<number | ''>('');
  const [reworkRate, setReworkRate] = useState<number | ''>('');

  // Efficiency (20%)
  const [processAdherenceRate, setProcessAdherenceRate] = useState<number | ''>(
    '',
  );
  const [averageHandleTime, setAverageHandleTime] = useState<number | ''>('');

  // Effectiveness (20%)
  const [firstCallResolutionRate, setFirstCallResolutionRate] = useState<
    number | ''
  >('');
  const [deliveryConsistency, setDeliveryConsistency] = useState<number | ''>(
    '',
  );

  // CX (15%)
  const [customerSatisfactionScore, setCustomerSatisfactionScore] = useState<
    number | ''
  >('');
  const [npsScore, setNpsScore] = useState<number | ''>('');

  // People (10%)
  const [absenteeismRate, setAbsenteeismRate] = useState<number | ''>('');
  const [engagementScore, setEngagementScore] = useState<number | ''>('');
  const [operationalStressLevel, setOperationalStressLevel] = useState<
    number | ''
  >('');

  // Metadata
  const [notes, setNotes] = useState('');

  const calculatePreviewScore = (): number => {
    const quality = Number(qualityScore) || 0;
    const adherence = Number(processAdherenceRate) || 0;
    const fcr = Number(firstCallResolutionRate) || 0;
    const csat = Number(customerSatisfactionScore) || 0;
    const absRate = Number(absenteeismRate) || 0;

    return (
      quality * 0.35 +
      adherence * 0.2 +
      fcr * 0.2 +
      csat * 0.15 +
      (100 - absRate) * 0.1
    );
  };

  const isFormValid = (): boolean => {
    return (
      qualityScore !== '' &&
      reworkRate !== '' &&
      processAdherenceRate !== '' &&
      averageHandleTime !== '' &&
      firstCallResolutionRate !== '' &&
      deliveryConsistency !== '' &&
      customerSatisfactionScore !== '' &&
      npsScore !== '' &&
      absenteeismRate !== '' &&
      engagementScore !== '' &&
      operationalStressLevel !== ''
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      alert('Por favor, preencha todas as métricas obrigatórias.');
      return;
    }
    if (!currentOrg?.id) {
      alert('Selecione uma empresa primeiro');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('supabase_token');

      const payload = {
        org_id: currentOrg.id,
        quality_score: Number(qualityScore),
        rework_rate: Number(reworkRate),
        process_adherence_rate: Number(processAdherenceRate),
        average_handle_time: Number(averageHandleTime),
        first_call_resolution_rate: Number(firstCallResolutionRate),
        delivery_consistency: Number(deliveryConsistency),
        customer_satisfaction_score: Number(customerSatisfactionScore),
        nps_score: Number(npsScore),
        absenteeism_rate: Number(absenteeismRate),
        engagement_score: Number(engagementScore),
        operational_stress_level: Number(operationalStressLevel),
        notes: notes || null,
        metric_source: 'manual',
      };

      const res = await fetch('/api/v1/php/copc/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-org-id': currentOrg.id,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao criar métrica');
      }

      alert('✅ Métrica COPC criada com sucesso!');
      router.push('/php/copc');
    } catch (error: any) {
      console.error('Erro ao criar métrica:', error);
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[#FAFAF8] min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/php/copc"
            className="text-sm text-gray-600 hover:text-[#141042] mb-4 inline-block"
          >
            ← Voltar ao Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[#141042]">Nova Métrica COPC</h1>
          <p className="text-gray-600 mt-1">
            Registre as 11 métricas operacionais e de bem-estar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quality (35%) */}
          <div className="bg-white p-6 rounded-lg border border-[#E5E5DC]">
            <h3 className="text-lg font-semibold text-[#141042] mb-4">
              📊 Qualidade (35%)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Score (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={qualityScore}
                  onChange={(e) => setQualityScore(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 92.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rework Rate (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={reworkRate}
                  onChange={(e) => setReworkRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 5.2"
                />
              </div>
            </div>
          </div>

          {/* Efficiency (20%) */}
          <div className="bg-white p-6 rounded-lg border border-[#E5E5DC]">
            <h3 className="text-lg font-semibold text-[#141042] mb-4">
              ⚡ Eficiência (20%)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Process Adherence Rate (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={processAdherenceRate}
                  onChange={(e) =>
                    setProcessAdherenceRate(Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 88.3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Average Handle Time (segundos)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={averageHandleTime}
                  onChange={(e) =>
                    setAverageHandleTime(Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 360"
                />
              </div>
            </div>
          </div>

          {/* Effectiveness (20%) */}
          <div className="bg-white p-6 rounded-lg border border-[#E5E5DC]">
            <h3 className="text-lg font-semibold text-[#141042] mb-4">
              🎯 Efetividade (20%)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Call Resolution Rate (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={firstCallResolutionRate}
                  onChange={(e) =>
                    setFirstCallResolutionRate(Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 78.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Consistency (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={deliveryConsistency}
                  onChange={(e) =>
                    setDeliveryConsistency(Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 94.2"
                />
              </div>
            </div>
          </div>

          {/* CX (15%) */}
          <div className="bg-white p-6 rounded-lg border border-[#E5E5DC]">
            <h3 className="text-lg font-semibold text-[#141042] mb-4">
              😊 Customer Experience (15%)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Satisfaction Score (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={customerSatisfactionScore}
                  onChange={(e) =>
                    setCustomerSatisfactionScore(Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 85.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NPS Score (-100 a 100)
                </label>
                <input
                  type="number"
                  min="-100"
                  max="100"
                  step="1"
                  value={npsScore}
                  onChange={(e) => setNpsScore(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 42"
                />
              </div>
            </div>
          </div>

          {/* People (10%) */}
          <div className="bg-white p-6 rounded-lg border border-[#E5E5DC]">
            <h3 className="text-lg font-semibold text-[#141042] mb-4">
              👥 People & Bem-estar (10%)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Absenteeism Rate (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={absenteeismRate}
                  onChange={(e) => setAbsenteeismRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 3.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Engagement Score (1-5)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={engagementScore}
                  onChange={(e) => setEngagementScore(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="Ex: 4.2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operational Stress Level (1-3)
                </label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  step="1"
                  value={operationalStressLevel}
                  onChange={(e) =>
                    setOperationalStressLevel(Number(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  placeholder="1, 2 ou 3"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white p-6 rounded-lg border border-[#E5E5DC]">
            <h3 className="text-lg font-semibold text-[#141042] mb-4">
              📝 Observações (Opcional)
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
              placeholder="Contexto adicional sobre as métricas..."
            />
          </div>

          {/* Preview Score */}
          {isFormValid() && (
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    📊 Preview do COPC Score
                  </p>
                  <p className="text-4xl font-bold text-[#141042]">
                    {calculatePreviewScore().toFixed(1)}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-600">
                  <p>Qualidade: {(Number(qualityScore) * 0.35).toFixed(1)}</p>
                  <p>
                    Eficiência:{' '}
                    {(Number(processAdherenceRate) * 0.2).toFixed(1)}
                  </p>
                  <p>
                    Efetividade:{' '}
                    {(Number(firstCallResolutionRate) * 0.2).toFixed(1)}
                  </p>
                  <p>
                    CX: {(Number(customerSatisfactionScore) * 0.15).toFixed(1)}
                  </p>
                  <p>
                    People:{' '}
                    {((100 - Number(absenteeismRate)) * 0.1).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className="flex-1 px-6 py-3 bg-[#141042] text-white rounded-lg hover:bg-[#1a1554] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Salvando...' : '💾 Salvar Métrica'}
            </button>
            <Link
              href="/php/copc"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
