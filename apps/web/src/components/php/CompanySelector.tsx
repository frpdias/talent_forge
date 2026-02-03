'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Building2, ChevronDown, Check, AlertCircle } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  status: string;
  php_module_active: boolean;
}

export function CompanySelector() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadOrganizations();
  }, []);

  async function loadOrganizations() {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }

      // Buscar organizações do usuário através de org_members
      const { data: memberships, error: memberError } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (memberError) {
        console.error('Erro ao buscar memberships:', memberError);
        setError('Erro ao carregar suas organizações');
        setLoading(false);
        return;
      }

      if (!memberships || memberships.length === 0) {
        setError('Você não está vinculado a nenhuma empresa');
        setLoading(false);
        return;
      }

      const orgIds = memberships.map(m => m.org_id);

      // Buscar dados das organizações
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, slug, status, php_module_active')
        .in('id', orgIds)
        .eq('status', 'active');

      if (orgsError) {
        console.error('Erro ao buscar organizações:', orgsError);
        setError('Erro ao carregar dados das empresas');
        setLoading(false);
        return;
      }

      setOrganizations(orgs || []);
      
      // Selecionar a primeira org ativa ou a que tem PHP ativo
      if (orgs && orgs.length > 0) {
        const activePhp = orgs.find(o => o.php_module_active);
        setSelectedOrg(activePhp || orgs[0]);
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Erro ao carregar organizações');
    }

    setLoading(false);
  }

  async function handleSelectOrg(org: Organization) {
    setSelectedOrg(org);
    setIsOpen(false);
    
    // Salvar no localStorage para persistir entre páginas
    localStorage.setItem('php_selected_org', org.id);
  }

  async function handleActivatePhp(org: Organization) {
    setActivating(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ php_module_active: true })
        .eq('id', org.id);

      if (updateError) {
        console.error('Erro ao ativar PHP:', updateError);
        setError('Erro ao ativar módulo PHP');
        setActivating(false);
        return;
      }

      // Atualizar lista local
      setOrganizations(prev => 
        prev.map(o => o.id === org.id ? { ...o, php_module_active: true } : o)
      );
      setSelectedOrg({ ...org, php_module_active: true });
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Erro ao ativar módulo');
    }

    setActivating(false);
  }

  if (loading) {
    return (
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm">Carregando empresas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-b border-red-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
            <button 
              onClick={loadOrganizations}
              className="ml-2 text-xs underline hover:no-underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="bg-yellow-50 border-b border-yellow-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Nenhuma empresa encontrada. Entre em contato com o administrador.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-medium">Empresa:</span>
            </div>
            
            {/* Dropdown de seleção */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-blue-300 hover:shadow transition-all min-w-[200px]"
              >
                <span className="font-medium text-gray-900 truncate">
                  {selectedOrg?.name || 'Selecione...'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full min-w-[280px] bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  {organizations.map(org => (
                    <button
                      key={org.id}
                      onClick={() => handleSelectOrg(org)}
                      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${
                        selectedOrg?.id === org.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-gray-900">{org.name}</span>
                        <span className="text-xs text-gray-500">{org.slug}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {org.php_module_active && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            PHP Ativo
                          </span>
                        )}
                        {selectedOrg?.id === org.id && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status e Ação */}
          <div className="flex items-center gap-3">
            {selectedOrg && !selectedOrg.php_module_active ? (
              <button
                onClick={() => handleActivatePhp(selectedOrg)}
                disabled={activating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {activating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Ativando...</span>
                  </>
                ) : (
                  <>
                    <span>Ativar Módulo PHP</span>
                  </>
                )}
              </button>
            ) : selectedOrg?.php_module_active ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Módulo PHP Ativo</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
