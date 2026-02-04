'use client';

import { useEffect, useState } from 'react';
import { Organogram } from '@/components/tfci/Organogram';
import { useOrganogram } from '@/hooks/useOrganogram';
import { Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function OrganogramPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string>('');
  const [orgId, setOrgId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [orgName, setOrgName] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);
  
  // Obter sessão do Supabase
  useEffect(() => {
    async function getAuth() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      setAccessToken(session.access_token);
      setUserId(session.user.id);
      
      // Buscar employee do usuário (traz organization_id)
      const { data: employee } = await supabase
        .from('employees')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .single();
      
      if (employee) {
        setOrgId(employee.organization_id);
        
        // Buscar nome da organização
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', employee.organization_id)
          .single();
        
        if (org) {
          setOrgName(org.name);
        }
      }
      
      setAuthLoading(false);
    }
    
    getAuth();
  }, [router]);

  const {
    hierarchy,
    employees,
    loading,
    error,
    fetchHierarchy,
    fetchEmployees,
    buildFilteredHierarchy,
  } = useOrganogram({
    organizationId: orgId,
    accessToken,
    orgId,
  });

  useEffect(() => {
    if (orgId && accessToken) {
      fetchHierarchy();
      fetchEmployees();
    }
  }, [orgId, accessToken]);

  // Construir hierarquia filtrada baseada no usuário atual
  const filteredHierarchy = userId && employees.length > 0
    ? buildFilteredHierarchy(userId, employees)
    : hierarchy;

  if (authLoading || (loading && !hierarchy)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando organograma...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro ao carregar organograma
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchHierarchy()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!filteredHierarchy) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum organograma encontrado
          </h2>
          <p className="text-gray-600">
            Não foi possível carregar a estrutura hierárquica da organização.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Organogram
        hierarchy={filteredHierarchy}
        title={`Organograma - ${orgName || 'Organização'}`}
      />
    </div>
  );
}
