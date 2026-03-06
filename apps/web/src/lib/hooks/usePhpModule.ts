'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCurrentOrg } from '@/lib/hooks/useCurrentOrg';

interface PhpModuleStatus {
  isActive: boolean;
  activationPlan?: string;
  loading: boolean;
  error?: string;
}

export function usePhpModule() {
  const { orgId, loading: orgLoading, error: orgError } = useCurrentOrg();
  const [status, setStatus] = useState<PhpModuleStatus>({
    isActive: false,
    loading: true,
  });

  useEffect(() => {
    if (orgLoading) {
      return; // Aguardar org carregar
    }

    if (orgError || !orgId) {
      setStatus({
        isActive: false,
        loading: false,
        error: orgError || 'Organização não encontrada',
      });
      return;
    }

    fetchStatus(orgId);
  }, [orgId, orgLoading, orgError]);

  const fetchStatus = async (organizationId: string) => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: undefined }));
      
      const supabase = createClient();

      // Buscar status do módulo PHP
      const { data: activation } = await supabase
        .from('php_module_activations')
        .select('is_active, activation_plan, activated_at, settings')
        .eq('org_id', organizationId)
        .maybeSingle();

      setStatus({
        isActive: activation?.is_active || false,
        activationPlan: activation?.activation_plan,
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

  return {
    isActive: status.isActive,
    activationPlan: status.activationPlan,
    loading: status.loading || orgLoading,
    error: status.error,
    orgId,
    refetch: () => orgId && fetchStatus(orgId),
  };
}
