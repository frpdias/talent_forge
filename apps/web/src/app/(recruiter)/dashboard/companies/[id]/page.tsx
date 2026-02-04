'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  Building2, Users, ArrowLeft, Plus, Edit, Trash2, Mail, Phone, MapPin, 
  Globe, Calendar, Briefcase, Network, Upload, Activity, ToggleLeft, ToggleRight,
  TrendingUp, Award, Shield, Clock, Target, BarChart3, FileText, CheckCircle2,
  AlertCircle, UserCheck, Building, Hash, Layers
} from 'lucide-react';
import { useOrgStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import OrgChart from '@/components/OrgChart';
import ImportCSVDialog from '@/components/ImportCSVDialog';
import { HIERARCHY_LEVELS } from '@/lib/hierarchy-constants';

interface Company {
  id: string;
  name: string;
  orgType?: string;
  slug?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  industry?: string;
  size?: string;
  parentOrgId?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Employee {
  id: string;
  full_name: string;
  cpf: string;
  position?: string;
  department?: string;
  hire_date?: string;
  status: string;
  email?: string;
  phone?: string;
  manager_id?: string;
  hierarchy_level?: string;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentOrg } = useOrgStore();
  
  const companyId = params?.id as string;
  const defaultTab = searchParams?.get('tab') || 'info';

  const [activeTab, setActiveTab] = useState<'info' | 'employees' | 'orgchart'>(defaultTab as 'info' | 'employees' | 'orgchart');
  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string>('');
  const [selectedHierarchyFilter, setSelectedHierarchyFilter] = useState<string>('all');
  
  // Estado do módulo PHP
  const [phpModuleActive, setPhpModuleActive] = useState(false);
  const [phpLoading, setPhpLoading] = useState(false);

  useEffect(() => {
    const loadAuth = async () => {
      const { data: { session } } = await createClient().auth.getSession();
      if (session?.access_token) {
        setAuthToken(session.access_token);
      }
    };
    loadAuth();
  }, []);

  useEffect(() => {
    if (companyId && currentOrg?.id) {
      loadCompany();
      loadEmployees();
      loadPhpModuleStatus();
    } else if (companyId && !currentOrg?.id) {
      console.warn('⏳ Aguardando currentOrg ser populado...');
    }
  }, [companyId, currentOrg?.id]);

  // Carregar status do módulo PHP
  const loadPhpModuleStatus = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('php_module_activations')
        .select('is_active')
        .eq('org_id', companyId)
        .single();
      
      if (data) {
        setPhpModuleActive(data.is_active);
      } else {
        setPhpModuleActive(false);
      }
    } catch (error) {
      console.error('Erro ao carregar status PHP:', error);
    }
  };

  // Toggle módulo PHP
  const togglePhpModule = async () => {
    setPhpLoading(true);
    try {
      const supabase = createClient();
      const newStatus = !phpModuleActive;
      
      // Upsert na tabela php_module_activations
      const { error } = await supabase
        .from('php_module_activations')
        .upsert({
          org_id: companyId,
          is_active: newStatus,
          activated_at: newStatus ? new Date().toISOString() : null,
          deactivated_at: newStatus ? null : new Date().toISOString(),
          activation_plan: 'full'
        }, {
          onConflict: 'org_id'
        });
      
      if (error) {
        console.error('Erro ao atualizar módulo PHP:', error);
        alert('Erro ao atualizar status do módulo PHP');
      } else {
        setPhpModuleActive(newStatus);
        alert(newStatus 
          ? '✅ Módulo PHP ativado! Agora você pode acessar TFCI, NR-1 e COPC para esta empresa.'
          : '⚠️ Módulo PHP desativado para esta empresa.'
        );
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setPhpLoading(false);
    }
  };

  const loadCompany = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      console.log('🔍 Debug loadCompany:', { 
        hasToken: !!token, 
        currentOrg,
        currentOrgId: currentOrg?.id 
      });
      
      if (!token || !currentOrg?.id) {
        console.error('❌ Token ou organização não encontrados', { token: !!token, currentOrg });
        setLoading(false);
        return;
      }
      
      const response = await fetch(`http://localhost:3001/api/v1/organizations/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-org-id': currentOrg.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Company data:', data);
        
        // Verificar se a empresa pertence a este recrutador
        if (data.parentOrgId && data.parentOrgId !== currentOrg.id) {
          alert('Você não tem permissão para acessar esta empresa');
          router.push('/dashboard/companies');
          return;
        }
        
        setCompany(data);
      } else {
        console.error('Erro ao carregar empresa:', response.status);
      }
    } catch (error) {
      console.error('Error loading company:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      console.log('🔍 Debug loadEmployees:', { 
        hasToken: !!token, 
        currentOrg,
        currentOrgId: currentOrg?.id,
        companyId 
      });
      
      if (!token || !currentOrg?.id) {
        console.error('❌ Token ou organização não encontrados', { token: !!token, currentOrg });
        return;
      }
      
      const response = await fetch(`http://localhost:3001/api/v1/php/employees?organization_id=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-org-id': currentOrg.id, // ID do recrutador, não da empresa
        },
      });

      console.log('📡 Response employees:', { 
        status: response.status, 
        ok: response.ok,
        url: response.url 
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Employees loaded:', data);
        setEmployees(data);
      } else {
        const errorText = await response.text();
        console.error('❌ Erro ao carregar funcionários:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;

    try {
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token;
      
      if (!token || !currentOrg?.id) {
        console.error('Token ou organização não encontrados');
        return;
      }
      
      const response = await fetch(`http://localhost:3001/api/v1/php/employees/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-org-id': currentOrg.id, // ID do recrutador, não da empresa
        },
      });

      if (response.ok) {
        await loadEmployees();
      } else {
        console.error('Erro ao excluir funcionário:', response.status);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  // Filtrar funcionários por cargo (usando position, não hierarchy_level)
  const filteredEmployees = selectedHierarchyFilter === 'all' 
    ? employees 
    : employees.filter(emp => emp.position === selectedHierarchyFilter);

  // Obter cargos disponíveis (position, não hierarchy_level)
  const availablePositions = [...new Set(employees.map(e => e.position).filter(Boolean))].sort();
  
  // Debug
  console.log('🔍 Debug filtro:', { 
    employeesCount: employees.length, 
    availablePositions,
    selectedHierarchyFilter,
    filteredCount: filteredEmployees.length 
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] p-6 flex items-center justify-center">
        <p className="text-[#666666]">Carregando...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] p-6 flex items-center justify-center">
        <p className="text-[#666666]">Empresa não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/companies')}
            className="flex items-center gap-2 text-[#666666] hover:text-[#141042] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Empresas
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#141042] flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                {company.name}
              </h1>
              {company.industry && (
                <p className="text-sm text-[#666666]">{company.industry}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-[#E5E5DC]">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-3 px-2 border-b-2 transition-colors ${
                activeTab === 'info'
                  ? 'border-[#141042] text-[#141042] font-medium'
                  : 'border-transparent text-[#666666] hover:text-[#141042]'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Informações
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`pb-3 px-2 border-b-2 transition-colors ${
                activeTab === 'employees'
                  ? 'border-[#141042] text-[#141042] font-medium'
                  : 'border-transparent text-[#666666] hover:text-[#141042]'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Funcionários ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab('orgchart')}
              className={`pb-3 px-2 border-b-2 transition-colors ${
                activeTab === 'orgchart'
                  ? 'border-[#141042] text-[#141042] font-medium'
                  : 'border-transparent text-[#666666] hover:text-[#141042]'
              }`}
            >
              <Network className="w-4 h-4 inline mr-2" />
              Organograma
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'info' && (
          <CompanyInfoTab 
            company={company}
            employees={employees}
            phpModuleActive={phpModuleActive}
            phpLoading={phpLoading}
            togglePhpModule={togglePhpModule}
          />
        )}

        {activeTab === 'employees' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[#141042]">
                Funcionários Cadastrados
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setImportDialogOpen(true)}
                  className="px-4 py-2 border border-[#141042] text-[#141042] rounded-lg hover:bg-[#FAFAF8] transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Importar CSV
                </button>
                <button
                  onClick={() => router.push(`/dashboard/companies/${companyId}/employees/new`)}
                  className="px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1557] transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Funcionário
                </button>
              </div>
            </div>

            {/* Filtro de Cargo */}
            {employees.length > 0 && (
              <div className="mb-4 flex items-center gap-3 p-3 bg-[#FAFAF8] rounded-lg border border-[#E5E5DC]">
                <label className="text-sm font-medium text-[#141042]">
                  Filtrar por Cargo:
                </label>
                <select
                  value={selectedHierarchyFilter}
                  onChange={(e) => setSelectedHierarchyFilter(e.target.value)}
                  className="px-3 py-2 border border-[#E5E5DC] rounded-lg text-sm text-[#141042] bg-white focus:outline-none focus:ring-2 focus:ring-[#141042] focus:border-transparent min-w-[300px]"
                >
                  <option value="all">Todos os cargos ({employees.length})</option>
                  {availablePositions.length > 0 ? (
                    availablePositions.map((position) => {
                      const count = employees.filter(e => e.position === position).length;
                      return (
                        <option key={position} value={position}>
                          {position} ({count})
                        </option>
                      );
                    })
                  ) : (
                    <option disabled>Nenhum cargo definido</option>
                  )}
                </select>
                {selectedHierarchyFilter !== 'all' && (
                  <button
                    onClick={() => setSelectedHierarchyFilter('all')}
                    className="text-sm text-[#666666] hover:text-[#141042] underline"
                  >
                    Limpar filtro
                  </button>
                )}
              </div>
            )}

            {employees.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#E5E5DC] p-12 text-center">
                <Users className="w-16 h-16 text-[#666666] mx-auto mb-4" />
                <p className="text-[#666666] mb-4">Nenhum funcionário cadastrado ainda</p>
                <button
                  onClick={() => router.push(`/dashboard/companies/${companyId}/employees/new`)}
                  className="px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1557] transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Primeiro Funcionário
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-[#E5E5DC] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-[#FAFAF8] border-b border-[#E5E5DC]">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#141042]">Nome</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#141042]">CPF</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#141042]">Cargo</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#141042]">Departamento</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#141042]">Data Admissão</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#141042]">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#141042]">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees
                      .sort((a, b) => {
                        // Ordena por hierarchy_level (do maior cargo para o menor - N1 primeiro)
                        const levelA = HIERARCHY_LEVELS.find(l => l.code === a.hierarchy_level);
                        const levelB = HIERARCHY_LEVELS.find(l => l.code === b.hierarchy_level);
                        const orderA = levelA?.order || 999;
                        const orderB = levelB?.order || 999;
                        
                        // Se hierarquia for diferente, ordena por ordem crescente (N1=1, N2=2, etc.)
                        if (orderA !== orderB) {
                          return orderA - orderB;
                        }
                        
                        // Se hierarquia for igual, ordena alfabeticamente por nome
                        return a.full_name.localeCompare(b.full_name);
                      })
                      .map((employee) => (
                      <tr key={employee.id} className="border-b border-[#E5E5DC] hover:bg-[#FAFAF8]">
                        <td className="py-3 px-4 text-sm text-[#141042]">{employee.full_name}</td>
                        <td className="py-3 px-4 text-sm text-[#666666]">{employee.cpf}</td>
                        <td className="py-3 px-4 text-sm text-[#666666]">
                          <div className="flex items-center gap-2">
                            {employee.position && (
                              <>
                                <Briefcase className="w-4 h-4" />
                                <span>{employee.position}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-[#666666]">{employee.department}</td>
                        <td className="py-3 px-4 text-sm text-[#666666]">
                          {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded ${
                            employee.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : employee.status === 'inactive'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {employee.status === 'active' ? 'Ativo' : employee.status === 'inactive' ? 'Inativo' : 'Demitido'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/dashboard/companies/${companyId}/employees/${employee.id}/edit`)}
                              className="p-2 border border-[#E5E5DC] text-[#141042] rounded hover:bg-[#FAFAF8] transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="p-2 border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orgchart' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#141042]">
                Organograma da Empresa
              </h2>
              <p className="text-sm text-[#666666] mt-1">
                Visualização hierárquica dos funcionários e suas relações de reporte.
              </p>
            </div>
            <OrgChart employees={employees} />
          </div>
        )}
      </div>

      {/* Import CSV Dialog */}
      {currentOrg?.id && authToken && (
        <ImportCSVDialog
          isOpen={importDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onImportComplete={() => {
            loadEmployees();
            setImportDialogOpen(false);
          }}
          companyId={companyId}
          orgId={currentOrg.id}
          token={authToken}
        />
      )}
    </div>
  );
}

// ============================================================================
// Componente CompanyInfoTab - Aba de Informações Corporativa
// ============================================================================
interface CompanyInfoTabProps {
  company: Company;
  employees: Employee[];
  phpModuleActive: boolean;
  phpLoading: boolean;
  togglePhpModule: () => void;
}

function CompanyInfoTab({ company, employees, phpModuleActive, phpLoading, togglePhpModule }: CompanyInfoTabProps) {
  // Métricas calculadas dos funcionários
  const employeeStats = useMemo(() => {
    if (employees.length === 0) {
      return {
        total: 0,
        byDepartment: {},
        byStatus: { active: 0, inactive: 0 },
        recentHires: 0,
        positionsCount: 0,
        managersCount: 0,
      };
    }

    const byDepartment: Record<string, number> = {};
    const byStatus = { active: 0, inactive: 0 };
    let managersCount = 0;

    // Contar contratações recentes (últimos 90 dias)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    let recentHires = 0;

    employees.forEach(emp => {
      // Por departamento
      const dept = emp.department || 'Não definido';
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;

      // Por status
      if (emp.status === 'active') {
        byStatus.active++;
      } else {
        byStatus.inactive++;
      }

      // Managers
      if (employees.some(e => e.manager_id === emp.id)) {
        managersCount++;
      }

      // Contratações recentes
      if (emp.hire_date) {
        const hireDate = new Date(emp.hire_date);
        if (hireDate >= ninetyDaysAgo) {
          recentHires++;
        }
      }
    });

    const positions = new Set(employees.map(e => e.position).filter(Boolean));

    return {
      total: employees.length,
      byDepartment,
      byStatus,
      recentHires,
      positionsCount: positions.size,
      managersCount,
    };
  }, [employees]);

  // Top departamentos
  const topDepartments = useMemo(() => {
    const entries = Object.entries(employeeStats.byDepartment);
    return entries.sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [employeeStats.byDepartment]);

  // Top 3 gestores (funcionários que têm subordinados diretos)
  const topManagers = useMemo(() => {
    if (employees.length === 0) return [];

    // Contar quantos subordinados diretos cada funcionário tem
    const subordinateCount: Record<string, number> = {};
    employees.forEach(emp => {
      if (emp.manager_id) {
        subordinateCount[emp.manager_id] = (subordinateCount[emp.manager_id] || 0) + 1;
      }
    });

    // Filtrar apenas funcionários que são gestores (têm subordinados)
    const managers = employees
      .filter(emp => subordinateCount[emp.id])
      .map(emp => ({
        ...emp,
        directReports: subordinateCount[emp.id] || 0,
      }))
      .sort((a, b) => b.directReports - a.directReports)
      .slice(0, 3);

    return managers;
  }, [employees]);

  // Formatar data relativa
  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} dias`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses`;
    return `${Math.floor(diffDays / 365)} anos`;
  };

  return (
    <div className="space-y-6">
      {/* Header da Empresa */}
      <div className="bg-white rounded-xl border border-[#E5E5DC] p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#141042] flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#141042]">{company.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-[#666666] text-sm">
                {company.industry && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {company.industry}
                  </span>
                )}
                {company.orgType && (
                  <span className="px-2 py-0.5 rounded-full bg-[#F5F5F0] text-[#141042] text-xs font-medium">
                    {company.orgType === 'company' ? 'Empresa Cliente' : 'Headhunter'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Status do PHP Module */}
          <div className={`px-4 py-2 rounded-lg ${phpModuleActive ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-center gap-2 text-sm">
              <Activity className={`w-4 h-4 ${phpModuleActive ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={phpModuleActive ? 'text-green-700 font-medium' : 'text-gray-500'}>
                PHP {phpModuleActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg p-4">
            <div className="flex items-center gap-2 text-[#666666] text-sm mb-1">
              <Users className="w-4 h-4" />
              Colaboradores
            </div>
            <p className="text-2xl font-bold text-[#141042]">{employeeStats.total}</p>
          </div>
          <div className="bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg p-4">
            <div className="flex items-center gap-2 text-[#666666] text-sm mb-1">
              <Layers className="w-4 h-4" />
              Departamentos
            </div>
            <p className="text-2xl font-bold text-[#141042]">{Object.keys(employeeStats.byDepartment).length}</p>
          </div>
          <div className="bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg p-4">
            <div className="flex items-center gap-2 text-[#666666] text-sm mb-1">
              <Briefcase className="w-4 h-4" />
              Cargos
            </div>
            <p className="text-2xl font-bold text-[#141042]">{employeeStats.positionsCount}</p>
          </div>
          <div className="bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg p-4">
            <div className="flex items-center gap-2 text-[#666666] text-sm mb-1">
              <Clock className="w-4 h-4" />
              Cadastrado há
            </div>
            <p className="text-2xl font-bold text-[#141042]">{formatRelativeDate(company.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Módulo PHP */}
          <div className={`rounded-xl border-2 p-6 transition-all ${
            phpModuleActive 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  phpModuleActive ? 'bg-green-500' : 'bg-gray-400'
                }`}>
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#141042] text-lg">
                    Módulo PHP
                  </h3>
                  <p className="text-sm text-[#666666] mb-3">
                    People, Health & Performance — Avaliações comportamentais completas
                  </p>
                  
                  {/* Features do PHP */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className={`flex items-center gap-2 text-sm ${phpModuleActive ? 'text-green-700' : 'text-gray-500'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>TFCI (30%)</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${phpModuleActive ? 'text-green-700' : 'text-gray-500'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>NR-1 (40%)</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${phpModuleActive ? 'text-green-700' : 'text-gray-500'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>COPC (30%)</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={togglePhpModule}
                disabled={phpLoading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm ${
                  phpModuleActive 
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-200' 
                    : 'bg-[#141042] text-white hover:bg-[#1a1557] shadow-gray-200'
                } ${phpLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {phpLoading ? (
                  <span className="animate-spin">⏳</span>
                ) : phpModuleActive ? (
                  <>
                    <ToggleRight className="w-5 h-5" />
                    Ativo
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5" />
                    Ativar Módulo
                  </>
                )}
              </button>
            </div>
            
            {phpModuleActive && (
              <div className="mt-5 pt-5 border-t border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Módulo ativo e pronto para uso</span>
                </div>
                <p className="text-sm text-green-600 mt-1 ml-7">
                  Esta empresa pode participar de ciclos de avaliação TFCI, NR-1 e COPC.
                </p>
              </div>
            )}
          </div>

          {/* Dados Corporativos */}
          <div className="bg-white rounded-xl border border-[#E5E5DC] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E5DC] bg-[#FAFAF8]">
              <h2 className="text-lg font-semibold text-[#141042] flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Dados Corporativos
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Identificação */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-[#141042] uppercase tracking-wide border-b pb-2">
                    Identificação
                  </h3>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F5F5F0] flex items-center justify-center">
                      <Hash className="w-5 h-5 text-[#666666]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#666666]">CNPJ</p>
                      <p className="font-medium text-[#141042]">{company.cnpj || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F5F5F0] flex items-center justify-center">
                      <Building className="w-5 h-5 text-[#666666]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#666666]">Porte</p>
                      <p className="font-medium text-[#141042]">{company.size || 'Não informado'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F5F5F0] flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-[#666666]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#666666]">Setor</p>
                      <p className="font-medium text-[#141042]">{company.industry || 'Não informado'}</p>
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-[#141042] uppercase tracking-wide border-b pb-2">
                    Contato
                  </h3>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F5F5F0] flex items-center justify-center">
                      <Mail className="w-5 h-5 text-[#666666]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#666666]">Email</p>
                      {company.email ? (
                        <a href={`mailto:${company.email}`} className="font-medium text-[#141042] hover:underline">
                          {company.email}
                        </a>
                      ) : (
                        <p className="font-medium text-[#999999]">—</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F5F5F0] flex items-center justify-center">
                      <Phone className="w-5 h-5 text-[#666666]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#666666]">Telefone</p>
                      <p className="font-medium text-[#141042]">{company.phone || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F5F5F0] flex items-center justify-center">
                      <Globe className="w-5 h-5 text-[#666666]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#666666]">Website</p>
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" 
                           className="font-medium text-[#141042] hover:underline">
                          {company.website}
                        </a>
                      ) : (
                        <p className="font-medium text-[#999999]">—</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Localização - Full Width */}
                {(company.address || company.city || company.state) && (
                  <div className="md:col-span-2 space-y-4 pt-4 border-t border-[#E5E5DC]">
                    <h3 className="text-sm font-medium text-[#141042] uppercase tracking-wide">
                      Localização
                    </h3>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F5F5F0] flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[#666666]" />
                      </div>
                      <div>
                        {company.address && <p className="font-medium text-[#141042]">{company.address}</p>}
                        {(company.city || company.state) && (
                          <p className="text-[#666666]">
                            {[company.city, company.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card de Principais Gestores */}
          {topManagers.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E5E5DC] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E5DC] bg-[#FAFAF8]">
                <h2 className="text-lg font-semibold text-[#141042] flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Principais Gestores
                </h2>
                <p className="text-sm text-[#666666] mt-1">
                  Líderes com mais subordinados diretos
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {topManagers.map((manager, index) => (
                    <div 
                      key={manager.id}
                      className={`relative rounded-xl p-5 ${
                        index === 0 
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200' 
                          : 'bg-[#FAFAF8] border border-[#E5E5DC]'
                      }`}
                    >
                      {/* Badge de posição */}
                      <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${
                        index === 0 
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' 
                          : index === 1
                            ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white'
                            : 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                      }`}>
                        {index + 1}º
                      </div>
                      
                      {/* Avatar */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
                          index === 0 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-[#141042] text-white'
                        }`}>
                          {manager.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[#141042] truncate" title={manager.full_name}>
                            {manager.full_name}
                          </h4>
                          <p className="text-sm text-[#666666] truncate" title={manager.position || 'Cargo não definido'}>
                            {manager.position || 'Cargo não definido'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div className="space-y-2">
                        {manager.department && (
                          <div className="flex items-center gap-2 text-sm">
                            <Layers className="w-4 h-4 text-[#999999]" />
                            <span className="text-[#666666] truncate" title={manager.department}>
                              {manager.department}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-[#999999]" />
                          <span className="text-[#666666]">
                            <span className="font-semibold text-[#141042]">{manager.directReports}</span>
                            {' '}{manager.directReports === 1 ? 'subordinado direto' : 'subordinados diretos'}
                          </span>
                        </div>

                        {manager.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-[#999999]" />
                            <a 
                              href={`mailto:${manager.email}`}
                              className="text-[#141042] hover:underline truncate"
                              title={manager.email}
                            >
                              {manager.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coluna Direita - 1/3 */}
        <div className="space-y-6">
          {/* Resumo de Equipe */}
          <div className="bg-white rounded-xl border border-[#E5E5DC] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E5DC] bg-[#FAFAF8]">
              <h2 className="text-lg font-semibold text-[#141042] flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Resumo da Equipe
              </h2>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Ativos vs Inativos */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[#666666]">Colaboradores Ativos</span>
                  <span className="font-semibold text-green-600">{employeeStats.byStatus.active}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: employeeStats.total > 0 
                      ? `${(employeeStats.byStatus.active / employeeStats.total) * 100}%` 
                      : '0%' 
                    }}
                  />
                </div>
              </div>

              {/* Gestores */}
              <div className="flex items-center justify-between py-3 border-t border-[#E5E5DC]">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#666666]" />
                  <span className="text-sm text-[#666666]">Gestores</span>
                </div>
                <span className="font-semibold text-[#141042]">{employeeStats.managersCount}</span>
              </div>

              {/* Contratações Recentes */}
              <div className="flex items-center justify-between py-3 border-t border-[#E5E5DC]">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#666666]" />
                  <span className="text-sm text-[#666666]">Contratações (90 dias)</span>
                </div>
                <span className={`font-semibold ${employeeStats.recentHires > 0 ? 'text-green-600' : 'text-[#141042]'}`}>
                  {employeeStats.recentHires > 0 ? `+${employeeStats.recentHires}` : '0'}
                </span>
              </div>

              {/* Sem funcionários */}
              {employeeStats.total === 0 && (
                <div className="text-center py-4 text-[#666666]">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum colaborador cadastrado</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Departamentos */}
          {topDepartments.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E5E5DC] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E5DC] bg-[#FAFAF8]">
                <h2 className="text-lg font-semibold text-[#141042] flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Departamentos
                </h2>
              </div>
              
              <div className="p-6 space-y-3">
                {topDepartments.map(([dept, count], index) => (
                  <div key={dept} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#141042]/10 flex items-center justify-center text-xs font-medium text-[#141042]">
                        {index + 1}
                      </span>
                      <span className="text-sm text-[#141042] truncate max-w-[140px]" title={dept}>
                        {dept}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-[#666666]">
                      {count} {count === 1 ? 'pessoa' : 'pessoas'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datas Importantes */}
          <div className="bg-white rounded-xl border border-[#E5E5DC] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E5DC] bg-[#FAFAF8]">
              <h2 className="text-lg font-semibold text-[#141042] flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Registro
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-[#666666] mb-1">Data de Cadastro</p>
                <p className="font-medium text-[#141042]">
                  {new Date(company.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              
              {company.updatedAt && company.updatedAt !== company.createdAt && (
                <div className="pt-3 border-t border-[#E5E5DC]">
                  <p className="text-xs text-[#666666] mb-1">Última Atualização</p>
                  <p className="font-medium text-[#141042]">
                    {new Date(company.updatedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}