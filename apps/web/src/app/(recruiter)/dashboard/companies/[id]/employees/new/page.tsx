'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, User, Calendar, Briefcase, Users } from 'lucide-react';
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
  status: 'active' | 'inactive' | 'terminated';
  organization_id: string;
}

interface Manager {
  id: string;
  full_name: string;
  position?: string;
}

export default function NewEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  
  const companyId = params?.id as string;

  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);
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
    status: 'active',
    organization_id: companyId,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadManagers();
  }, []);

  const loadManagers = async () => {
    try {
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.error('Token não encontrado');
        return;
      }
      
      const response = await fetch(`http://localhost:3001/api/v1/php/employees?organization_id=${companyId}&status=active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-org-id': companyId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setManagers(data);
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

    // Em desenvolvimento, aceitar qualquer CPF com formato válido (11 dígitos não repetidos)
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }

    // Em produção, fazer validação completa dos dígitos verificadores
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
    
    if (formatted.length === 14) {
      if (!validateCPF(formatted)) {
        setErrors({ ...errors, cpf: 'CPF inválido' });
      } else {
        const newErrors = { ...errors };
        delete newErrors.cpf;
        setErrors(newErrors);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    const newErrors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório';
    }
    
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!validateCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }
    
    if (!formData.hire_date) {
      newErrors.hire_date = 'Data de admissão é obrigatória';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        alert('Erro de autenticação. Por favor, faça login novamente.');
        setLoading(false);
        return;
      }
      
      const payload = {
        ...formData,
        cpf: formData.cpf.replace(/\D/g, ''),
        manager_id: formData.manager_id || undefined,
      };
      
      console.log('Criando funcionário:', payload);

      const response = await fetch('http://localhost:3001/api/v1/php/employees', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-org-id': companyId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Funcionário criado com sucesso!');
        router.push(`/dashboard/companies/${companyId}?tab=employees`);
      } else {
        const error = await response.json();
        console.error('Erro da API:', error);
        alert(`Erro ao criar funcionário: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('Erro ao criar funcionário');
    } finally {
      setLoading(false);
    }
  };

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
            Adicionar Funcionário
          </h1>
          <p className="text-sm text-[#666666]">
            Preencha os dados do novo funcionário
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
                    value={formData.birth_date}
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
                    value={formData.email}
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
                    value={formData.phone}
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
                    value={formData.position}
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
                    value={formData.department}
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
                    value={formData.manager_id}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                    className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                  >
                    <option value="">Selecione um gestor</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.full_name} {manager.position && `- ${manager.position}`}
                      </option>
                    ))}
                  </select>
                  {managers.length === 0 && (
                    <p className="text-xs text-[#666666] mt-1">
                      Nenhum gestor disponível. Este será o primeiro funcionário.
                    </p>
                  )}
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
                {loading ? 'Salvando...' : 'Salvar Funcionário'}
              </button>
            </div>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Atenção:</strong> Após criar o funcionário, você pode vinculá-lo a um usuário da plataforma através da página de perfil.
          </p>
        </div>
      </div>
    </div>
  );
}
