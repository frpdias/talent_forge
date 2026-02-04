'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, User, Calendar, Briefcase, Users, Loader2 } from 'lucide-react';
import { useOrgStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { HIERARCHY_LEVELS } from '@/lib/constants/hierarchy';

interface Employee {
  id?: string;
  full_name: string;
  cpf: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  hire_date: string;
  position?: string;
  department?: string;
  manager_id?: string;
  hierarchy_level?: string;
  status: 'active' | 'inactive' | 'terminated';
  organization_id: string;
}

interface Manager {
  id: string;
  full_name: string;
  position?: string;
}

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  
  const companyId = params?.id as string;
  const employeeId = params?.employeeId as string;

  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [storeHydrated, setStoreHydrated] = useState(false);
  const [originalCPF, setOriginalCPF] = useState(''); // CPF original do banco
  const [formData, setFormData] = useState<Employee>({
    full_name: '',
    cpf: '',
    email: '',
    phone: '',
    birth_date: '',
    hire_date: new Date().toISOString().split('T')[0],
    position: '',
    department: '',
    manager_id: '',
    hierarchy_level: '',
    status: 'active',
    organization_id: companyId,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hidratar a store no cliente
  useEffect(() => {
    console.log('🔑 Iniciando hidratação da store...');
    useOrgStore.persist.rehydrate();
    setTimeout(() => {
      setStoreHydrated(true);
    }, 100);
  }, []);

  useEffect(() => {
    console.log('🔍 useEffect check:', { storeHydrated, currentOrgId: currentOrg?.id, employeeId });
    if (storeHydrated && currentOrg?.id && employeeId) {
      console.log('🔄 Carregando dados com org:', currentOrg.id);
      loadEmployee();
      loadManagers();
    }
  }, [employeeId, currentOrg?.id, storeHydrated]);

  const loadEmployee = async () => {
    try {
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      if (!token || !currentOrg?.id) {
        console.error('❌ Token ou organização não encontrados', { token: !!token, orgId: currentOrg?.id });
        setLoadingData(false);
        return;
      }
      
      const url = `http://localhost:3001/api/v1/php/employees/${employeeId}`;
      console.log('📡 Buscando employee:', { employeeId, orgId: currentOrg.id, url });
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-org-id': currentOrg.id, // ID do tenant do recrutador
        },
      });

      console.log('📡 Resposta:', response.status, response.statusText);

      if (response.ok) {
        const employee = await response.json();
        console.log('✅ Funcionário carregado:', employee);
        const formattedCPF = formatCPF(employee.cpf || '');
        setOriginalCPF(formattedCPF); // Salvar CPF original
        setFormData({
          ...employee,
          birth_date: employee.birth_date ? employee.birth_date.split('T')[0] : '',
          hire_date: employee.hire_date ? employee.hire_date.split('T')[0] : '',
          cpf: formattedCPF,
        });
        // Limpar erros ao carregar dados válidos do banco
        setErrors({});
      } else {
        const errorBody = await response.text();
        console.error('❌ Erro ao carregar funcionário:', response.status, errorBody);
        alert(`Erro ao carregar dados do funcionário: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error loading employee:', error);
      alert('Erro ao carregar dados do funcionário');
    } finally {
      setLoadingData(false);
    }
  };

  const loadManagers = async () => {
    try {
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      if (!token || !currentOrg?.id) {
        console.error('Token ou organização não encontrados');
        return;
      }
      
      const response = await fetch(`http://localhost:3001/api/v1/php/employees?organization_id=${companyId}&status=active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-org-id': currentOrg.id, // ID do tenant do recrutador
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrar para não mostrar o próprio funcionário como gestor dele mesmo
        setManagers(data.filter((m: Manager) => m.id !== employeeId));
      } else {
        console.error('Erro ao carregar gestores:', response.status);
      }
    } catch (error) {
      console.error('Error loading managers:', error);
    }
  };

  const formatCPF = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '');
    
    if (numbers.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numbers)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 >= 10) digit1 = 0;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers.charAt(i)) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 >= 10) digit2 = 0;

    return digit1 === parseInt(numbers.charAt(9)) && digit2 === parseInt(numbers.charAt(10));
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    setFormData({ ...formData, cpf: formatted });
    
    // Só validar se o CPF estiver completo (14 caracteres = XXX.XXX.XXX-XX)
    if (formatted.length === 14) {
      if (!validateCPF(formatted)) {
        setErrors({ ...errors, cpf: 'CPF inválido' });
      } else {
        const newErrors = { ...errors };
        delete newErrors.cpf;
        setErrors(newErrors);
      }
    } else if (formatted.length > 0 && formatted.length < 14) {
      // Limpar erro se CPF está incompleto mas sendo digitado
      const newErrors = { ...errors };
      delete newErrors.cpf;
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 handleSubmit iniciado');
    console.log('📋 FormData atual:', formData);
    console.log('📋 CPF atual:', formData.cpf, 'length:', formData.cpf.length);
    console.log('📋 CPF validação:', validateCPF(formData.cpf));
    console.log('🏢 CompanyId:', companyId);
    console.log('🏢 CurrentOrg:', currentOrg);
    
    // Validações
    const newErrors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório';
    }
    
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (formData.cpf !== originalCPF) {
      // Só validar CPF se foi modificado pelo usuário
      if (formData.cpf.length === 14 && !validateCPF(formData.cpf)) {
        newErrors.cpf = 'CPF inválido';
      } else if (formData.cpf.length < 14) {
        newErrors.cpf = 'CPF incompleto';
      }
    }
    // Se CPF não foi modificado, aceita o valor do banco (já foi validado na criação)
    
    if (!formData.hire_date) {
      newErrors.hire_date = 'Data de admissão é obrigatória';
    }
    
    if (Object.keys(newErrors).length > 0) {
      console.log('❌ Erros de validação:', newErrors);
      setErrors(newErrors);
      return;
    }

    console.log('✅ Validações passaram');
    setLoading(true);

    try {
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.error('❌ Token não encontrado');
        alert('Erro de autenticação. Por favor, faça login novamente.');
        setLoading(false);
        return;
      }
      
      const payload = {
        full_name: formData.full_name,
        birth_date: formData.birth_date,
        termination_date: formData.termination_date || null,
        manager_id: formData.manager_id || null,
        position: formData.position,
        department: formData.department,
        status: formData.status,
        metadata: {
          email: formData.email,
          phone: formData.phone,
        }
      };
      
      console.log('📤 Enviando payload:', payload);
      console.log('🔑 x-org-id:', currentOrg?.id || companyId);

      const response = await fetch(`http://localhost:3001/api/v1/php/employees/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-org-id': currentOrg?.id || companyId, // ID do tenant do recrutador
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (response.ok) {
        console.log('✅ Funcionário atualizado com sucesso!');
        alert('Funcionário atualizado com sucesso!');
        router.push(`/dashboard/companies/${companyId}?tab=employees`);
      } else {
        const error = await response.json();
        console.error('❌ Erro da API:', error);
        alert(`Erro ao atualizar funcionário: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('❌ Erro no catch:', error);
      alert('Erro ao atualizar funcionário');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData || !storeHydrated || !currentOrg?.id) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#141042] animate-spin" />
          <p className="text-[#666666]">
            {!storeHydrated ? 'Inicializando...' : !currentOrg?.id ? 'Carregando organização...' : 'Carregando dados do funcionário...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/dashboard/companies/${companyId}?tab=employees`)}
            className="flex items-center gap-2 text-[#666666] hover:text-[#141042] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Funcionários
          </button>
          
          <h1 className="text-2xl font-bold text-[#141042] flex items-center gap-2">
            <User className="w-6 h-6" />
            Editar Funcionário
          </h1>
          <p className="text-sm text-[#666666]">
            Atualize os dados de {formData.full_name}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-[#E5E5DC] p-6">
          <div className="space-y-6">
            {/* Dados Pessoais */}
            <div>
              <h2 className="text-lg font-semibold text-[#141042] mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados Pessoais
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#141042] mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`w-full px-4 py-2 bg-[#FAFAF8] border rounded-lg focus:outline-none focus:border-[#141042] ${
                      errors.full_name ? 'border-red-500' : 'border-[#E5E5DC]'
                    }`}
                    placeholder="João Silva Santos"
                  />
                  {errors.full_name && (
                    <p className="text-xs text-red-600 mt-1">{errors.full_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-1">
                    CPF *
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => handleCPFChange(e.target.value)}
                    maxLength={14}
                    className={`w-full px-4 py-2 bg-[#FAFAF8] border rounded-lg focus:outline-none focus:border-[#141042] ${
                      errors.cpf ? 'border-red-500' : 'border-[#E5E5DC]'
                    }`}
                    placeholder="000.000.000-00"
                  />
                  {errors.cpf && (
                    <p className="text-xs text-red-600 mt-1">{errors.cpf}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.birth_date || ''}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                    placeholder="joao.silva@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                    placeholder="(11) 98765-4321"
                  />
                </div>
              </div>
            </div>

            {/* Dados Profissionais */}
            <div>
              <h2 className="text-lg font-semibold text-[#141042] mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Dados Profissionais
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-1">
                    Data de Admissão *
                  </label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className={`w-full px-4 py-2 bg-[#FAFAF8] border rounded-lg focus:outline-none focus:border-[#141042] ${
                      errors.hire_date ? 'border-red-500' : 'border-[#E5E5DC]'
                    }`}
                  />
                  {errors.hire_date && (
                    <p className="text-xs text-red-600 mt-1">{errors.hire_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-1">
                    Cargo
                  </label>
                  <select
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                  >
                    <option value="">Selecione um cargo...</option>
                    {HIERARCHY_LEVELS.map((level) => (
                      <optgroup key={level.group} label={level.group}>
                        {level.positions.map((position) => (
                          <option key={position} value={position}>
                            {position}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                    placeholder="TI / Desenvolvimento"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-1">
                    Gestor Direto
                  </label>
                  <select
                    value={formData.manager_id || ''}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                    className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                  >
                    <option value="">Sem gestor direto</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.full_name} {manager.position && `- ${manager.position}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#141042] mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'terminated' })}
                    className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="terminated">Desligado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-[#E5E5DC]">
              <button
                type="button"
                onClick={() => router.push(`/dashboard/companies/${companyId}?tab=employees`)}
                className="px-6 py-2 border border-[#E5E5DC] text-[#141042] rounded-lg hover:bg-[#FAFAF8] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1557] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
