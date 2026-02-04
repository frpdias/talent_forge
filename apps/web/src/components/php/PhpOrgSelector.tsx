'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhpOrg {
  id: string;
  name: string;
  orgType: string;
  slug: string;
  role?: string;
}

/**
 * Seletor de organizações que mostra apenas orgs com o módulo PHP ativo.
 * Use este componente dentro das páginas do módulo PHP.
 */
export function PhpOrgSelector() {
  const { currentOrg, setCurrentOrg } = useOrgStore();
  const [phpOrgs, setPhpOrgs] = useState<PhpOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    loadPhpOrgs();
  }, []);

  const loadPhpOrgs = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Buscar todas as orgs do usuário
      const { data: memberships, error: membershipsError } = await supabase
        .from('org_members')
        .select('org_id, role, organizations(id, name, org_type, slug)')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (membershipsError || !memberships) {
        console.error('[PhpOrgSelector] Erro ao buscar memberships:', membershipsError);
        setPhpOrgs([]);
        setLoading(false);
        return;
      }

      // Buscar quais orgs têm PHP ativo
      const orgIds = memberships.map(m => m.org_id);
      
      if (orgIds.length === 0) {
        console.log('[PhpOrgSelector] Usuário não pertence a nenhuma org');
        setPhpOrgs([]);
        setLoading(false);
        return;
      }

      const { data: activations, error: activationsError } = await supabase
        .from('php_module_activations')
        .select('org_id')
        .in('org_id', orgIds)
        .eq('is_active', true);

      if (activationsError) {
        console.error('[PhpOrgSelector] Erro ao buscar ativações:', activationsError);
      }

      const activeOrgIds = new Set((activations || []).map(a => a.org_id));
      console.log('[PhpOrgSelector] Orgs com PHP ativo:', activeOrgIds);

      const orgs = memberships
        .filter(m => activeOrgIds.has(m.org_id))
        .map((m: any) => {
          const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
          if (!org) return null;
          return {
            id: org.id,
            name: org.name,
            orgType: org.org_type,
            slug: org.slug,
            role: m.role,
          };
        })
        .filter(Boolean) as PhpOrg[];

      console.log('[PhpOrgSelector] Orgs filtradas com PHP ativo:', orgs.map(o => o.name));
      setPhpOrgs(orgs);
      
      // Se a org atual não tem PHP ativo, selecionar a primeira que tem
      if (orgs.length > 0 && !orgs.find(o => o.id === currentOrg?.id)) {
        setCurrentOrg(orgs[0]);
      }
    } catch (error) {
      console.error('[PhpOrgSelector] Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrg = (org: PhpOrg) => {
    console.log('[PhpOrgSelector] Selecionando org:', org.id, org.name);
    setCurrentOrg(org);
    setDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg animate-pulse">
        <Building2 className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-400">Carregando...</span>
      </div>
    );
  }

  if (phpOrgs.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <Building2 className="h-4 w-4 text-yellow-600" />
        <span className="text-sm text-yellow-700">Nenhuma empresa com PHP ativo</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full min-w-[200px]"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700 truncate">
            {currentOrg?.name || 'Selecionar empresa'}
          </span>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform flex-shrink-0', dropdownOpen && 'rotate-180')} />
      </button>

      {dropdownOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setDropdownOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {phpOrgs.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSelectOrg(org)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors',
                  currentOrg?.id === org.id && 'bg-blue-50'
                )}
              >
                <span className={cn(
                  'truncate',
                  currentOrg?.id === org.id ? 'font-medium text-blue-700' : 'text-gray-700'
                )}>
                  {org.name}
                </span>
                {currentOrg?.id === org.id && (
                  <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
