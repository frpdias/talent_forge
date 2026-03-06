'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, ArrowLeft, Users, Building2, Search, CheckCircle2 } from 'lucide-react';
import { useOrgStore } from '@/lib/store';
import { createClient, getAuthToken } from '@/lib/supabase/client';

interface Employee {
  id: string;
  full_name: string;
  position: string | null;
  department: string | null;
}

export default function NewNr1CampaignPage() {
  const router = useRouter();
  const { currentOrg, phpContextOrgId } = useOrgStore();
  const effectiveOrgId = phpContextOrgId || currentOrg?.id;

  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [scope, setScope] = useState<'organization' | 'department' | 'team'>('organization');
  const [scopeTarget, setScopeTarget] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [step, setStep] = useState(1); // 1=config, 2=select employees, 3=confirm

  useEffect(() => {
    if (effectiveOrgId) {
      loadEmployees();
    }
  }, [effectiveOrgId]);

  const loadEmployees = async () => {
    if (!effectiveOrgId) return;
    setLoadingEmployees(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, position, department')
        .eq('organization_id', effectiveOrgId)
        .order('full_name');

      if (!error && data) {
        setEmployees(data);
        const depts = [...new Set(data.map(e => e.department).filter(Boolean))] as string[];
        setDepartments(depts);
      }
    } catch (err) {
      console.error('Erro ao carregar funcionários:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchTerm ||
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.position || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (scope === 'department' && scopeTarget) {
      return matchesSearch && emp.department === scopeTarget;
    }
    return matchesSearch;
  });

  const toggleEmployee = (id: string) => {
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(e => e.id));
    }
  };

  const handleSubmit = async () => {
    if (!effectiveOrgId || selectedEmployees.length === 0) return;
    setLoading(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        alert('Sessão expirada. Faça login novamente.');
        return;
      }

      // 1. Criar campanha (assessment com is_campaign=true)
      const campaignRes = await fetch('/api/v1/php/nr1/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-org-id': effectiveOrgId,
        },
        body: JSON.stringify({
          org_id: effectiveOrgId,
          is_campaign: true,
          campaign_name: campaignName || `Campanha NR-1 — ${new Date().toLocaleDateString('pt-BR')}`,
          scope,
          scope_target: scopeTarget || null,
          total_invited: selectedEmployees.length,
          total_responded: 0,
          status: 'active',
        }),
      });

      if (!campaignRes.ok) {
        const err = await campaignRes.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao criar campanha');
      }

      const campaign = await campaignRes.json();

      // 2. Criar convites vinculados à campanha
      const invRes = await fetch('/api/v1/php/nr1/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-org-id': effectiveOrgId,
        },
        body: JSON.stringify({
          org_id: effectiveOrgId,
          employee_ids: selectedEmployees,
          campaign_id: campaign.id,
        }),
      });

      if (!invRes.ok) {
        const err = await invRes.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao criar convites');
      }

      alert(`✅ Campanha criada! ${selectedEmployees.length} convites enviados.`);
      router.push('/php/nr1');
    } catch (error: any) {
      console.error('Erro:', error);
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#666666] hover:text-[#141042] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-[#141042]">
            Nova Campanha NR-1
          </h1>
          <p className="text-[#666666] mt-1">
            Crie uma campanha de avaliação de riscos psicossociais. Os colaboradores receberão convites para responder anonimamente.
          </p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { n: 1, label: 'Configuração' },
            { n: 2, label: 'Selecionar Colaboradores' },
            { n: 3, label: 'Confirmar & Enviar' },
          ].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  step >= n
                    ? 'bg-[#141042] text-white'
                    : 'bg-[#E5E5DC] text-[#999999]'
                }`}
              >
                {step > n ? <CheckCircle2 className="w-5 h-5" /> : n}
              </div>
              <span className={`text-sm ${step >= n ? 'text-[#141042] font-medium' : 'text-[#999999]'}`}>
                {label}
              </span>
              {n < 3 && <div className={`flex-1 h-0.5 ${step > n ? 'bg-[#141042]' : 'bg-[#E5E5DC]'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Configuration */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white border border-[#E5E5DC] rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#141042] mb-4">Dados da Campanha</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-1">
                    Nome da Campanha
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder={`Campanha NR-1 — ${new Date().toLocaleDateString('pt-BR')}`}
                    className="w-full px-4 py-2.5 border border-[#E5E5DC] rounded-lg text-[#141042] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#141042]/20 focus:border-[#141042]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-2">
                    Escopo da Avaliação
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'organization' as const, label: 'Organização Inteira', icon: Building2 },
                      { value: 'department' as const, label: 'Departamento', icon: Users },
                      { value: 'team' as const, label: 'Equipe Específica', icon: Users },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { setScope(value); setScopeTarget(''); setSelectedEmployees([]); }}
                        className={`p-4 border-2 rounded-lg transition text-left ${
                          scope === value
                            ? 'border-[#141042] bg-[#141042]/5'
                            : 'border-[#E5E5DC] hover:bg-[#FAFAF8]'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-2 ${scope === value ? 'text-[#141042]' : 'text-[#999999]'}`} />
                        <p className={`text-sm font-medium ${scope === value ? 'text-[#141042]' : 'text-[#666666]'}`}>
                          {label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {scope === 'department' && departments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-[#141042] mb-1">
                      Departamento
                    </label>
                    <select
                      value={scopeTarget}
                      onChange={(e) => { setScopeTarget(e.target.value); setSelectedEmployees([]); }}
                      className="w-full px-4 py-2.5 border border-[#E5E5DC] rounded-lg text-[#141042] focus:outline-none focus:ring-2 focus:ring-[#141042]/20"
                    >
                      <option value="">Selecione...</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                )}

                {scope === 'team' && (
                  <div>
                    <label className="block text-sm font-medium text-[#141042] mb-1">
                      Nome da Equipe
                    </label>
                    <input
                      type="text"
                      value={scopeTarget}
                      onChange={(e) => setScopeTarget(e.target.value)}
                      placeholder="Ex: Equipe de Engenharia"
                      className="w-full px-4 py-2.5 border border-[#E5E5DC] rounded-lg text-[#141042] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#141042]/20"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-[#141042] text-white rounded-lg hover:bg-[#1a1656] transition font-medium"
              >
                Próximo: Selecionar Colaboradores
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Employees */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white border border-[#E5E5DC] rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#141042]">
                  Selecionar Colaboradores
                </h2>
                <span className="text-sm text-[#666666]">
                  {selectedEmployees.length} de {filteredEmployees.length} selecionados
                </span>
              </div>

              {/* Search + Select All */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, cargo ou departamento..."
                    className="w-full pl-10 pr-4 py-2.5 border border-[#E5E5DC] rounded-lg text-[#141042] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#141042]/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="px-4 py-2.5 border border-[#E5E5DC] rounded-lg text-sm font-medium text-[#141042] hover:bg-[#FAFAF8] transition whitespace-nowrap"
                >
                  {selectedEmployees.length === filteredEmployees.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
              </div>

              {/* Employee List */}
              {loadingEmployees ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#141042]" />
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-[#999999]">
                  {employees.length === 0
                    ? 'Nenhum colaborador cadastrado nesta organização'
                    : 'Nenhum colaborador encontrado com os filtros atuais'}
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto border border-[#E5E5DC] rounded-lg divide-y divide-[#E5E5DC]">
                  {filteredEmployees.map((emp) => (
                    <label
                      key={emp.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${
                        selectedEmployees.includes(emp.id)
                          ? 'bg-[#141042]/5'
                          : 'hover:bg-[#FAFAF8]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(emp.id)}
                        onChange={() => toggleEmployee(emp.id)}
                        className="w-4 h-4 rounded border-[#E5E5DC] text-[#141042] focus:ring-[#141042]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#141042] truncate">
                          {emp.full_name}
                        </p>
                        <p className="text-xs text-[#999999] truncate">
                          {[emp.position, emp.department].filter(Boolean).join(' · ') || 'Sem cargo/departamento'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 border border-[#E5E5DC] rounded-lg text-[#666666] hover:bg-[#FAFAF8] transition"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedEmployees.length === 0}
                className="px-6 py-2.5 bg-[#141042] text-white rounded-lg hover:bg-[#1a1656] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo: Confirmar
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white border border-[#E5E5DC] rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[#141042] mb-6">Resumo da Campanha</h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-[#E5E5DC]">
                  <span className="text-sm text-[#666666]">Nome</span>
                  <span className="text-sm font-medium text-[#141042]">
                    {campaignName || `Campanha NR-1 — ${new Date().toLocaleDateString('pt-BR')}`}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#E5E5DC]">
                  <span className="text-sm text-[#666666]">Escopo</span>
                  <span className="text-sm font-medium text-[#141042]">
                    {scope === 'organization' ? 'Organização Inteira' : scope === 'department' ? `Depto: ${scopeTarget}` : `Equipe: ${scopeTarget}`}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#E5E5DC]">
                  <span className="text-sm text-[#666666]">Colaboradores</span>
                  <span className="text-sm font-medium text-[#141042]">
                    {selectedEmployees.length} convites serão enviados
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#E5E5DC]">
                  <span className="text-sm text-[#666666]">Validade dos Convites</span>
                  <span className="text-sm font-medium text-[#141042]">30 dias</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Como funciona:</strong> Cada colaborador selecionado receberá um link único para responder
                  a autoavaliação NR-1 (10 dimensões, escala 1-5). As respostas são anônimas e serão agregadas
                  automaticamente em um relatório de risco organizacional.
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 border border-[#E5E5DC] rounded-lg text-[#666666] hover:bg-[#FAFAF8] transition"
              >
                Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                {loading ? 'Criando Campanha...' : `Criar Campanha & Enviar ${selectedEmployees.length} Convites`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
