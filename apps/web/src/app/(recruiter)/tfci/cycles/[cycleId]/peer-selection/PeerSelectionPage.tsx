'use client';

import { useEffect, useState } from 'react';
import { PeerSelection } from '@/components/tfci/PeerSelection';
import { useTFCIPeerSelection } from '@/hooks/useTFCIPeerSelection';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface PeerSelectionPageProps {
  cycleId: string;
}

export function PeerSelectionPage({ cycleId }: PeerSelectionPageProps) {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string>('');
  const [orgId, setOrgId] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
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
      
      // Buscar employee vinculado ao usuário (que também traz org_id)
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id, full_name, department, position, organization_id')
        .eq('user_id', session.user.id)
        .single();
      
      if (empError || !employee) {
        // Tentar buscar org via query RPC como fallback
        console.error('Erro ao buscar employee:', empError);
        setAuthError('Funcionário não encontrado. Configure: UPDATE employees SET user_id = \'' + session.user.id + '\' WHERE id = \'<employee_id>\'');
        setAuthLoading(false);
        return;
      }
      
      setOrgId(employee.organization_id);
      setEmployeeId(employee.id);
      setAuthLoading(false);
    }
    
    getAuth();
  }, [router]);

  const {
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
  } = useTFCIPeerSelection({
    cycleId,
    accessToken,
    orgId,
    employeeId,
  });

  useEffect(() => {
    if (accessToken && orgId && employeeId) {
      Promise.all([fetchQuota(), fetchEligiblePeers()]);
    }
  }, [cycleId, accessToken, orgId, employeeId]);

  const handleSelectPeer = async (peerId: string) => {
    const result = await registerPeerSelection(peerId);
    if (!result?.success) {
      throw new Error(result?.error || 'Erro ao registrar seleção');
    }
  };

  const handleFinalize = async () => {
    // Primeiro gera os sorteios aleatórios
    const randomResult = await generateRandomSelections();
    if (!randomResult) {
      throw new Error('Erro ao gerar sorteios aleatórios');
    }

    // Depois gera todas as avaliações
    const assessmentResult = await generateAssessments();
    if (!assessmentResult) {
      throw new Error('Erro ao gerar avaliações');
    }

    // Redirecionar para lista de ciclos após sucesso
    setTimeout(() => {
      router.push('/php/tfci/cycles');
    }, 2000);
  };

  if (authLoading || (loading && !quota)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados de seleção...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro de Autenticação
          </h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  if (error && !quota) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro ao carregar dados
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => Promise.all([fetchQuota(), fetchEligiblePeers()])}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      <PeerSelection
        cycleId={cycleId}
        quota={quota}
        eligiblePeers={eligiblePeers}
        selectedPeerIds={selectedPeers}
        loading={loading}
        onSelectPeer={handleSelectPeer}
        onFinalize={handleFinalize}
      />
    </div>
  );
}
