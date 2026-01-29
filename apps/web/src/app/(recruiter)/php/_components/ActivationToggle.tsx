'use client';

import { useState } from 'react';
import { usePhpModule } from '@/lib/hooks/usePhpModule';

interface ActivationToggleProps {
  onSuccess?: () => void;
}

export default function ActivationToggle({ onSuccess }: ActivationToggleProps) {
  const { isActive, activationPlan, refetch } = usePhpModule();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>(activationPlan || 'full');

  const handleToggle = async () => {
    try {
      setLoading(true);

      const endpoint = isActive ? '/api/v1/php/deactivate' : '/api/v1/php/activate';
      const body = isActive ? undefined : JSON.stringify({
        activation_plan: selectedPlan,
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      if (!response.ok) {
        throw new Error('Failed to toggle PHP module');
      }

      await refetch();
      onSuccess?.();
    } catch (error) {
      console.error('Error toggling PHP module:', error);
      alert('Erro ao ativar/desativar módulo PHP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Módulo PHP (People, Health & Performance)
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Sistema integrado de monitoramento comportamental, riscos psicossociais e performance operacional
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isActive ? 'Ativo' : 'Inativo'}
          </span>
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isActive ? 'bg-blue-600' : 'bg-gray-200'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {!isActive && (
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Plano de Ativação
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedPlan('full')}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                selectedPlan === 'full'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">Completo</div>
              <div className="text-xs text-gray-500 mt-1">TFCI + NR-1 + COPC</div>
            </button>
            <button
              onClick={() => setSelectedPlan('tfci_only')}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                selectedPlan === 'tfci_only'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">TFCI</div>
              <div className="text-xs text-gray-500 mt-1">Comportamento</div>
            </button>
            <button
              onClick={() => setSelectedPlan('nr1_only')}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                selectedPlan === 'nr1_only'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">NR-1</div>
              <div className="text-xs text-gray-500 mt-1">Riscos Psicossociais</div>
            </button>
            <button
              onClick={() => setSelectedPlan('copc_only')}
              className={`p-3 rounded-lg border-2 text-left transition-colors ${
                selectedPlan === 'copc_only'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">COPC</div>
              <div className="text-xs text-gray-500 mt-1">Performance</div>
            </button>
          </div>
        </div>
      )}

      {isActive && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900">Módulo Ativo</h4>
              <p className="text-sm text-blue-700 mt-1">
                Plano: <span className="font-semibold">{activationPlan}</span>
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Acesse o dashboard para visualizar indicadores e métricas integradas
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
