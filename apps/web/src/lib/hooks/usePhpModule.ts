'use client';

import { useEffect, useState } from 'react';

interface PhpModuleStatus {
  isActive: boolean;
  activationPlan?: string;
  loading: boolean;
  error?: string;
}

export function usePhpModule() {
  const [status, setStatus] = useState<PhpModuleStatus>({
    isActive: false,
    loading: true,
  });

  const fetchStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: undefined }));
      
      const response = await fetch('/api/v1/php/status');
      if (!response.ok) {
        throw new Error('Failed to fetch PHP module status');
      }

      const data = await response.json();
      setStatus({
        isActive: data.is_active || false,
        activationPlan: data.activation_plan,
        loading: false,
      });
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return {
    isActive: status.isActive,
    activationPlan: status.activationPlan,
    loading: status.loading,
    error: status.error,
    refetch: fetchStatus,
  };
}
