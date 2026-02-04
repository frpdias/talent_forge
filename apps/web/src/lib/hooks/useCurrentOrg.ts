'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useOrgStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';

interface CurrentOrgResult {
  orgId: string | null;
  orgName: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook centralizado para obter a organização atual do usuário.
 * 
 * Prioridade:
 * 1. currentOrg do Zustand store (organização selecionada pelo dropdown)
 * 2. Fallback: primeira organização do usuário no banco (após timeout)
 * 
 * Todas as páginas do módulo PHP devem usar este hook para garantir
 * consistência na obtenção do org_id.
 */
export function useCurrentOrg(): CurrentOrgResult {
  const { currentOrg } = useOrgStore();
  const [dbOrg, setDbOrg] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const fetchFromDb = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }

      const { data: orgMember, error: orgError } = await supabase
        .from('org_members')
        .select('org_id, organizations(id, name)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (orgError) {
        console.error('[useCurrentOrg] Erro ao buscar org:', orgError);
        setError('Erro ao buscar sua organização');
        setLoading(false);
        return;
      }

      if (!orgMember?.org_id) {
        setError('Você não está associado a nenhuma organização');
        setLoading(false);
        return;
      }

      const org = orgMember.organizations as { id: string; name: string } | null;
      setDbOrg({ id: orgMember.org_id, name: org?.name || '' });
      setLoading(false);
    } catch (err) {
      console.error('[useCurrentOrg] Erro:', err);
      setError('Erro inesperado ao buscar organização');
      setLoading(false);
    }
  }, []);

  // Efeito para buscar do DB como fallback
  useEffect(() => {
    // Se já tem org no store, não precisa buscar do DB
    if (currentOrg?.id) {
      setLoading(false);
      setError(null);
      return;
    }

    // Se ainda não buscou do DB, aguardar um pouco pela hydration do zustand
    if (!fetchedRef.current) {
      const timeout = setTimeout(() => {
        if (!currentOrg?.id) {
          console.log('[useCurrentOrg] Fallback para busca no DB');
          fetchedRef.current = true;
          fetchFromDb();
        }
      }, 1000); // Aguarda 1s para hydration do zustand

      return () => clearTimeout(timeout);
    }
  }, [currentOrg?.id, fetchFromDb]);

  // Prioridade: store > db
  const orgId = currentOrg?.id || dbOrg?.id || null;
  const orgName = currentOrg?.name || dbOrg?.name || null;

  // Debug log quando org muda
  useEffect(() => {
    if (orgId) {
      console.log('[useCurrentOrg] Org atual:', orgId, orgName);
    }
  }, [orgId, orgName]);

  return {
    orgId,
    orgName,
    loading: loading && !orgId, // Não está loading se já tem orgId
    error: orgId ? null : error,
    refetch: fetchFromDb,
  };
}
