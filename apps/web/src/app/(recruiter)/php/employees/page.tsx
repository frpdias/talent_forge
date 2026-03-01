'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Users, UserCheck, UserX } from 'lucide-react';
import { useOrgStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';

interface Employee {
  id: string;
  full_name: string;
  cpf?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  hire_date?: string;
  status: 'active' | 'inactive' | 'terminated';
}

export default function EmployeesPage() {
  const { currentOrg, phpContextOrgId } = useOrgStore();
  const effectiveOrgId = phpContextOrgId || currentOrg?.id;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'terminated'>('active');

  useEffect(() => {
    if (effectiveOrgId) {
      loadEmployees();
    }
  }, [effectiveOrgId, statusFilter]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await createClient().auth.getSession();
      const params = new URLSearchParams({
        organization_id: effectiveOrgId!,
      });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const res = await fetch(`/api/v1/php/employees?${params}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token || ''}`,
          'x-org-id': effectiveOrgId!,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
    emp.cpf?.includes(search) ||
    emp.position?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    inactive: employees.filter(e => e.status === 'inactive').length,
    terminated: employees.filter(e => e.status === 'terminated').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#141042]">Funcionários</h1>
          <p className="text-[#666666] mt-1">
            Gestão de colaboradores e organograma
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#1F4ED8] text-white rounded-lg hover:bg-[#1845B8] transition-colors">
          <Plus className="w-5 h-5" />
          Novo Funcionário
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-[#1F4ED8]" />
            </div>
            <div>
              <p className="text-sm text-[#666666]">Total</p>
              <p className="text-2xl font-bold text-[#141042]">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[#666666]">Ativos</p>
              <p className="text-2xl font-bold text-[#141042]">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <UserX className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-[#666666]">Inativos</p>
              <p className="text-2xl font-bold text-[#141042]">{stats.inactive}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-[#666666]">Desligados</p>
              <p className="text-2xl font-bold text-[#141042]">{stats.terminated}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999999]" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
            <option value="terminated">Desligados</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E5E5DC] shadow-[0_2px_8px_rgba(20,16,66,0.06),0_1px_2px_rgba(20,16,66,0.04)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#141042] border-t-transparent rounded-full animate-spin" />
            <p className="mt-2 text-[#666666]">Carregando funcionários...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-[#999999] mx-auto mb-3" />
            <p className="text-[#666666]">Nenhum funcionário encontrado</p>
            <p className="text-sm text-[#999999] mt-1">
              Comece cadastrando o primeiro funcionário
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#FAFAF8] border-b border-[#E5E5DC]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                  Departamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                  Admissão
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#666666] uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5DC]">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-[#FAFAF8] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-[#1F4ED8] font-semibold text-sm">
                          {employee.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-[#141042]">{employee.full_name}</p>
                        <p className="text-sm text-[#999999]">CPF: {employee.cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-'}</p>
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
                    {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('pt-BR') : '-'}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-[#1F4ED8] hover:text-[#1845B8] font-medium">
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
