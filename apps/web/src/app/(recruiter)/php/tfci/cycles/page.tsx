'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface TfciCycle {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  participants_count: number;
  completion_rate: number;
  created_at: string;
}

export default function TfciCyclesPage() {
  const router = useRouter();
  const [cycles, setCycles] = useState<TfciCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    status: 'draft' as const,
  });

  useEffect(() => {
    initializeAndFetch();
  }, []);

  const initializeAndFetch = async () => {
    const supabase = createClient();
    
    // Buscar usuário e organização
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: orgMember, error: orgError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (orgError) {
      console.error('Error fetching org member:', orgError);
      setOrgError('Erro ao buscar sua organização.');
      setLoading(false);
      return;
    }

    if (orgMember?.org_id) {
      setOrgId(orgMember.org_id);
      await fetchCycles(orgMember.org_id);
      return;
    }

    setOrgError('Você não está associado a nenhuma organização.');
    setLoading(false);
  };

  const fetchCycles = async (organizationId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tfci_cycles')
        .select('*')
        .eq('org_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cycles:', error);
      } else {
        setCycles(data || []);
      }
    } catch (error) {
      console.error('Error fetching cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('tfci_cycles')
        .insert({
          org_id: orgId,
          name: formData.name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          status: formData.status,
          created_by: user?.id,
        });

      if (!error) {
        setShowForm(false);
        setFormData({ name: '', start_date: '', end_date: '', status: 'draft' });
        fetchCycles(orgId);
      }
    } catch (error) {
      console.error('Error creating cycle:', error);
    }
  };

  const updateCycleStatus = async (cycleId: string, status: string) => {
    if (!orgId) return;
    
    try {
      const supabase = createClient();
      await supabase
        .from('tfci_cycles')
        .update({ status })
        .eq('id', cycleId)
        .eq('org_id', orgId);
      
      fetchCycles(orgId);
    } catch (error) {
      console.error('Error updating cycle:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F4ED8]"></div>
      </div>
    );
  }

  if (orgError) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso indisponível</h2>
          <p className="text-sm text-gray-600 mb-4">{orgError}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1F4ED8]">Ciclos TFCI</h1>
          <p className="text-[#6B7280] mt-2 tracking-wide">
            Talent Forge Cultural Index — Avaliação comportamental 360°
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#1F4ED8] text-white font-semibold rounded-lg hover:bg-[#1845B8] transition-colors shadow-sm"
        >
          {showForm ? 'Cancelar' : 'Novo Ciclo'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-bold text-[#1F4ED8] mb-4">Criar Novo Ciclo</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#6B7280] mb-1">
                Nome do Ciclo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8] focus:border-transparent"
                placeholder="Ex: Avaliação Q1 2026"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#6B7280] mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1F4ED8]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#6B7280] mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar Ciclo
            </button>
          </form>
        </div>
      )}

      {cycles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum ciclo criado</h3>
          <p className="text-sm text-gray-500 mb-4">
            Crie seu primeiro ciclo de avaliação comportamental
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Criar Primeiro Ciclo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cycles.map((cycle) => (
            <div key={cycle.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{cycle.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cycle.status)}`}>
                  {cycle.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{new Date(cycle.start_date).toLocaleDateString('pt-BR')} - {new Date(cycle.end_date).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{cycle.participants_count} participantes</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Conclusão</span>
                  <span className="font-medium">{cycle.completion_rate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${cycle.completion_rate}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-2">
                {cycle.status === 'draft' && (
                  <button
                    onClick={() => updateCycleStatus(cycle.id, 'active')}
                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    Ativar
                  </button>
                )}
                <button
                  onClick={() => router.push(`/php/tfci/cycles/${cycle.id}`)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                >
                  Ver Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
