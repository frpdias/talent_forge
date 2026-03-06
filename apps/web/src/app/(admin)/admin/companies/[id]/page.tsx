'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Users, Calendar, MapPin, Mail, Phone, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Company {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  industry?: string;
  org_type: string;
  created_at: string;
}

interface Employee {
  id: string;
  full_name: string;
  cpf: string;
  position: string | null;
  department: string | null;
  hire_date: string;
  status: 'active' | 'inactive' | 'terminated';
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'employees'>('info');

  useEffect(() => {
    loadCompany();
    loadEmployees();
  }, [companyId]);

  const loadCompany = async () => {
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setCompany(data.company);
      }
    } catch (error) {
      console.error('Erro ao carregar empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data: { session } } = await createClient().auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch(`/api/v1/php/employees?organization_id=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-org-id': companyId,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#141042]"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#666666]">Empresa não encontrada</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/companies')}
          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#666666] hover:text-[#141042] hover:bg-[#FAFAF8] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <div className="h-6 w-px bg-[#E5E5DC]"></div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#3B82F6]/10 rounded-lg">
            <Building2 className="w-6 h-6 text-[#3B82F6]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#141042]">{company.name}</h1>
            <p className="text-sm text-[#666666]">
              {company.org_type === 'company' ? 'Empresa Cliente' : 'Headhunter/Consultoria'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E5E5DC]">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'info'
                ? 'border-[#141042] text-[#141042]'
                : 'border-transparent text-[#666666] hover:text-[#141042] hover:border-[#E5E5DC]'
            }`}
          >
            Informações
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'employees'
                ? 'border-[#141042] text-[#141042]'
                : 'border-transparent text-[#666666] hover:text-[#141042] hover:border-[#E5E5DC]'
            }`}
          >
            <Users className="w-4 h-4" />
            Funcionários
            <span className="px-2 py-0.5 bg-[#FAFAF8] text-[#666666] border border-[#E5E5DC] rounded-full text-xs">
              {employees.filter(e => e.status === 'active').length}
            </span>
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'info' ? (
        <div className="bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] p-6">
          <h2 className="text-lg font-semibold text-[#141042] mb-4">Dados da Empresa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {company.cnpj && (
              <div>
                <label className="text-sm font-medium text-[#666666]">CNPJ</label>
                <p className="text-[#141042] mt-1">{company.cnpj}</p>
              </div>
            )}
            {company.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#999999]" />
                <div>
                  <label className="text-sm font-medium text-[#666666]">Email</label>
                  <p className="text-[#141042] mt-1">{company.email}</p>
                </div>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#999999]" />
                <div>
                  <label className="text-sm font-medium text-[#666666]">Telefone</label>
                  <p className="text-[#141042] mt-1">{company.phone}</p>
                </div>
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#999999]" />
                <div>
                  <label className="text-sm font-medium text-[#666666]">Website</label>
                  <p className="mt-1">
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-[#3B82F6] hover:underline">
                      {company.website}
                    </a>
                  </p>
                </div>
              </div>
            )}
            {(company.address || company.city || company.state) && (
              <div className="flex items-start gap-2 md:col-span-2">
                <MapPin className="w-4 h-4 text-[#999999] mt-1" />
                <div>
                  <label className="text-sm font-medium text-[#666666]">Endereço</label>
                  <p className="text-[#141042] mt-1">
                    {[company.address, company.city, company.state].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}
            {company.industry && (
              <div>
                <label className="text-sm font-medium text-[#666666]">Setor</label>
                <p className="text-[#141042] mt-1">{company.industry}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#999999]" />
              <div>
                <label className="text-sm font-medium text-[#666666]">Cadastrado em</label>
                <p className="text-[#141042] mt-1">
                  {new Date(company.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)]">
          <div className="p-6 border-b border-[#E5E5DC]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#141042]">Funcionários Cadastrados</h2>
              <button
                onClick={() => router.push(`/admin/companies/${companyId}/employees/new`)}
                className="flex items-center gap-2 px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1557] transition-colors"
              >
                <Users className="w-4 h-4" />
                Adicionar Funcionário
              </button>
            </div>
          </div>

          {employees.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-[#999999] mx-auto mb-3" />
              <p className="text-[#666666]">Nenhum funcionário cadastrado</p>
              <p className="text-sm text-[#999999] mt-1">
                Adicione o primeiro funcionário para esta empresa
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#FAFAF8] border-b border-[#E5E5DC]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">Cargo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">Departamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">Admissão</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5DC]">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#3B82F6]/10 rounded-full flex items-center justify-center">
                          <span className="text-[#3B82F6] font-semibold text-sm">
                            {employee.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-[#141042]">{employee.full_name}</p>
                          <p className="text-sm text-[#999999]">CPF: {employee.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#141042]">
                      {employee.position || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#141042]">
                      {employee.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#666666]">
                      {new Date(employee.hire_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        employee.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : employee.status === 'inactive'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.status === 'active' ? 'Ativo' : employee.status === 'inactive' ? 'Inativo' : 'Desligado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
