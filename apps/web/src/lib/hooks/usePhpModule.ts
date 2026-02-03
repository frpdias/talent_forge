'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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
      
      const supabase = createClient();
      
      // Buscar usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar organização do usuário
      const { data: orgMember, error: orgError } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (orgError) {
        throw new Error('Erro ao buscar organização do usuário');
      }

      if (!orgMember?.org_id) {
        throw new Error('Usuário não pertence a nenhuma organização');
      }

      // Buscar status do módulo PHP
      const { data: activation } = await supabase
        .from('php_module_activations')
        .select('is_active, activation_plan, activated_at, settings')
        .eq('org_id', orgMember.org_id)
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
