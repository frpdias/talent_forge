'use client';

import React, { useEffect, useState } from 'react';
import { EligiblePeer, PeerSelectionQuota } from '@/types/tfci';
import { Users, Check, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PeerSelectionProps {
  cycleId: string;
  quota: PeerSelectionQuota | null;
  eligiblePeers: EligiblePeer[];
  selectedPeerIds: Set<string>;
  loading: boolean;
  onSelectPeer: (peerId: string) => Promise<void>;
  onFinalize: () => Promise<void>;
}

export function PeerSelection({
  cycleId,
  quota,
  eligiblePeers,
  selectedPeerIds,
  loading,
  onSelectPeer,
  onFinalize,
}: PeerSelectionProps) {
  const [processingPeerId, setProcessingPeerId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isComplete = quota ? selectedPeerIds.size >= quota.quota : false;
  const canFinalize = quota && quota.remaining === 0;

  const handleSelectPeer = async (peerId: string) => {
    try {
      setProcessingPeerId(peerId);
      setMessage(null);
      await onSelectPeer(peerId);
      setMessage({ type: 'success', text: 'Par selecionado com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erro ao selecionar par' 
      });
    } finally {
      setProcessingPeerId(null);
    }
  };

  const handleFinalize = async () => {
    try {
      setMessage(null);
      await onFinalize();
      setMessage({ 
        type: 'success', 
        text: 'Sorteios e avaliações gerados com sucesso!' 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erro ao finalizar' 
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com quota */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Seleção de Pares - Avaliação 360°
            </h2>
            <p className="text-gray-600">
              Escolha colegas do mesmo cargo e departamento para avaliar você
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* Barra de progresso */}
        {quota && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Progresso: {selectedPeerIds.size} de {quota.quota} escolhidos
              </span>
              <span className={`font-semibold ${isComplete ? 'text-green-600' : 'text-blue-600'}`}>
                {quota.remaining} restante(s)
              </span>
            </div>
            <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                  isComplete ? 'bg-green-600' : 'bg-blue-600'
                }`}
                style={{ width: `${(selectedPeerIds.size / quota.quota) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-4 gap-4 pt-2 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-900">{quota.peerCount}</div>
                <div className="text-gray-500">Pares Disponíveis</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-600">{quota.quota}</div>
                <div className="text-gray-500">Você Deve Escolher</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">{quota.manualCount}</div>
                <div className="text-gray-500">Já Escolhidos</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-orange-600">{quota.remaining}</div>
                <div className="text-gray-500">Faltam</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mensagens */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Lista de pares elegíveis */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Colegas Elegíveis ({eligiblePeers.length})
        </h3>

        {eligiblePeers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum colega elegível encontrado</p>
            <p className="text-sm mt-1">
              É necessário ter colegas no mesmo cargo e departamento
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eligiblePeers.map((peer) => {
              const isSelected = selectedPeerIds.has(peer.peerId);
              const isProcessing = processingPeerId === peer.peerId;
              const isDisabled = !peer.canBeChosen || isProcessing || loading;

              return (
                <div
                  key={peer.peerId}
                  className={`relative border rounded-lg p-4 transition-all ${
                    isSelected
                      ? 'border-green-500 bg-green-50'
                      : !peer.canBeChosen
                      ? 'border-red-300 bg-red-50 opacity-60'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  {/* Badge de status */}
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {isSelected && (
                      <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                        Selecionado
                      </span>
                    )}
                    {!peer.canBeChosen && (
                      <span className="px-2 py-0.5 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                        Limite Atingido
                      </span>
                    )}
                  </div>

                  {/* Informações do par */}
                  <div className="mb-3 pr-20">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {peer.peerName}
                    </h4>
                    <p className="text-sm text-gray-600 truncate">{peer.peerPosition}</p>
                    <p className="text-xs text-gray-500 truncate">{peer.peerEmail}</p>
                  </div>

                  {/* Indicador de escolhas */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500">
                      Escolhido {peer.timesChosen}/2 vezes
                    </span>
                    <div className="flex gap-1">
                      {[0, 1].map((i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < peer.timesChosen ? 'bg-orange-500' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Botão de seleção */}
                  <button
                    onClick={() => handleSelectPeer(peer.peerId)}
                    disabled={isDisabled || isSelected}
                    className={`w-full py-2 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
                      isSelected
                        ? 'bg-green-600 text-white cursor-not-allowed'
                        : !peer.canBeChosen
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processando...
                      </>
                    ) : isSelected ? (
                      <>
                        <Check className="w-4 h-4" />
                        Selecionado
                      </>
                    ) : !peer.canBeChosen ? (
                      <>
                        <X className="w-4 h-4" />
                        Indisponível
                      </>
                    ) : (
                      'Selecionar'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Botão de finalizar */}
      {quota && quota.remaining === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Seleção Completa! 🎉
              </h3>
              <p className="text-gray-600">
                Você escolheu todos os pares necessários. Clique em "Finalizar" para gerar os
                sorteios automáticos e criar as avaliações.
              </p>
            </div>
            <button
              onClick={handleFinalize}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Finalizar Seleção
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
