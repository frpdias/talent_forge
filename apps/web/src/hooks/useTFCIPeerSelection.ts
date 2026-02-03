'use client';

import { useState, useCallback } from 'react';
import {
  PeerSelectionQuota,
  EligiblePeer,
  PeerSelectionResult,
  GenerateRandomSelectionsResult,
  GenerateAssessmentsResult,
} from '@/types/tfci';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UseTFCIPeerSelectionProps {
  cycleId: string;
  accessToken: string;
  orgId: string;
  employeeId: string;
}

export function useTFCIPeerSelection({
  cycleId,
  accessToken,
  orgId,
  employeeId,
}: UseTFCIPeerSelectionProps) {
  const [quota, setQuota] = useState<PeerSelectionQuota | null>(null);
  const [eligiblePeers, setEligiblePeers] = useState<EligiblePeer[]>([]);
  const [selectedPeers, setSelectedPeers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    'x-org-id': orgId,
    'x-employee-id': employeeId,
  };

  // Buscar quota de seleção
  const fetchQuota = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/tfci/cycles/${cycleId}/peer-selection/quota?employeeId=${employeeId}&organizationId=${orgId}`,
        { headers }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar quota');
      
      const data: PeerSelectionQuota = await response.json();
      setQuota(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [cycleId, accessToken, orgId, employeeId]);

  // Buscar pares elegíveis
  const fetchEligiblePeers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/tfci/cycles/${cycleId}/peer-selection/eligible-peers?employeeId=${employeeId}&organizationId=${orgId}`,
        { headers }
      );
      
      if (!response.ok) throw new Error('Erro ao buscar pares elegíveis');
      
      const data: EligiblePeer[] = await response.json();
      setEligiblePeers(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [cycleId, accessToken, orgId, employeeId]);

  // Registrar seleção de par
  const registerPeerSelection = useCallback(
    async (selectedPeerId: string): Promise<PeerSelectionResult | null> => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${API_BASE_URL}/tfci/cycles/${cycleId}/peer-selection/register?employeeId=${employeeId}`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ selectedPeerId }),
          }
        );

        if (!response.ok) throw new Error('Erro ao registrar seleção');

        const result: PeerSelectionResult = await response.json();
        
        if (result.success) {
          setSelectedPeers(prev => new Set([...prev, selectedPeerId]));
          // Atualizar dados
          await Promise.all([fetchQuota(), fetchEligiblePeers()]);
        }
        
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [cycleId, accessToken, orgId, employeeId, fetchQuota, fetchEligiblePeers]
  );

  // Gerar sorteios aleatórios
  const generateRandomSelections = useCallback(async (): Promise<GenerateRandomSelectionsResult | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/tfci/cycles/${cycleId}/peer-selection/generate-random?organizationId=${orgId}`,
        {
          method: 'POST',
          headers,
        }
      );

      if (!response.ok) throw new Error('Erro ao gerar sorteios');

      const result: GenerateRandomSelectionsResult = await response.json();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [cycleId, accessToken, orgId, employeeId]);

  // Gerar todas as avaliações
  const generateAssessments = useCallback(async (): Promise<GenerateAssessmentsResult | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/tfci/cycles/${cycleId}/peer-selection/generate-assessments?organizationId=${orgId}`,
        {
          method: 'POST',
          headers,
        }
      );

      if (!response.ok) throw new Error('Erro ao gerar avaliações');

      const result: GenerateAssessmentsResult = await response.json();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [cycleId, accessToken, orgId, employeeId]);

  return {
    quota,
    eligiblePeers,
    selectedPeers,
    loading,
    error,
    fetchQuota,
    fetchEligiblePeers,
    registerPeerSelection,
    generateRandomSelections,
    generateAssessments,
  };
}
