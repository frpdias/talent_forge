'use client';

import React, { useState, useEffect } from 'react';
import { Building, Plus, Search, Edit2, Trash2, Save, X, Building2, Mail, Phone, Globe, MapPin, Users, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import OrganizationDashboard from '@/components/admin/OrganizationDashboard';

interface Company {
  id: string;
  name: string;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  industry?: string | null;
  size?: string | null;
  created_at: string;
}

interface FormData {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  website: string;
  cep: string;
  address: string;
  city: string;
  state: string;
  industry: string;
  size: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);

  const emptyForm: FormData = {
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    website: '',
    cep: '',
    address: '',
    city: '',
    state: '',
    industry: '',
    size: 'small',
  };

  const [formData, setFormData] = useState<FormData>(emptyForm);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const url = editingId ? `/api/admin/companies/${editingId}` : '/api/admin/companies';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar empresa');
      }

      setMessage({
        type: 'success',
        text: editingId ? 'Empresa atualizada com sucesso!' : 'Empresa cadastrada com sucesso!',
      });

      // Resetar formulário
      setFormData(emptyForm);
      setShowForm(false);
      setEditingId(null);
      loadCompanies();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao salvar empresa',
      });
    }
  };

  const handleEdit = (company: Company) => {
    setFormData({
      name: company.name,
      cnpj: company.cnpj || '',
      email: company.email || '',
      phone: company.phone || '',
      website: company.website || '',
      cep: '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      industry: company.industry || '',
      size: company.size || 'small',
    });
    setEditingId(company.id);
    setShowForm(true);
    setMessage(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      const response = await fetch(`/api/admin/companies/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir empresa');
      }

      setMessage({
        type: 'success',
        text: 'Empresa excluída com sucesso!',
      });

      loadCompanies();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao excluir empresa',
      });
    }
  };

  const handleCancel = () => {
    setFormData(emptyForm);
    setShowForm(false);
    setEditingId(null);
    setMessage(null);
  };

  const fetchAddressByCep = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      if (!response.ok) return;
      const data = await response.json();
      if (data?.erro) return;

      setFormData((prev) => ({
        ...prev,
        address: data.logradouro || prev.address,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const filteredCompanies = companies.filter(company => {
    const term = searchTerm.toLowerCase();
    return (
      company.name.toLowerCase().includes(term) ||
      (company.cnpj || '').includes(searchTerm) ||
      (company.email || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#141042] flex items-center">
            <Building className="w-6 h-6 mr-3 text-[#141042]" />
            Empresas
          </h2>
          <p className="text-sm sm:text-base text-[#666666] mt-1">
            Gerencie o cadastro de empresas do sistema
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#141042]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Empresa</span>
          </button>
        )}
      </div>

      {/* Mensagem de Feedback */}
      {message && (
        <div
          className={`p-4 rounded-lg border flex items-start space-x-3 ${
            message.type === 'success'
              ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981]'
              : 'bg-[#EF4444]/10 border-[#EF4444] text-[#EF4444]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#141042]">
              {editingId ? 'Editar Empresa' : 'Nova Empresa'}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="text-[#666666] hover:text-[#141042] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-[#141042] mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Razão social ou nome fantasia"
                  className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#141042] mb-2">
                  CNPJ *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#141042] mb-2">
                  CEP
                </label>
                <input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, cep: value });
                    const cleaned = value.replace(/\D/g, '');
                    if (cleaned.length === 8) {
                      void fetchAddressByCep(cleaned);
                    }
                  }}
                  placeholder="00000-000"
                  className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#141042] mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@empresa.com.br"
                  className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#141042] mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 3000-0000"
                  className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#141042] mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.empresa.com.br"
                  className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-[#141042] mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, bairro"
                  className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#141042] mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="São Paulo"
                  className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#141042] mb-2">
                  Estado
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042] bg-white"
                >
                  <option value="">Selecione...</option>
                  <option value="SP">São Paulo</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="PR">Paraná</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="BA">Bahia</option>
                  <option value="PE">Pernambuco</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                </select>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#141042] mb-2">
                  Setor/Indústria
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="Ex: Tecnologia, Saúde, Educação"
                  className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#141042] mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Porte da Empresa
                </label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042] bg-white"
                >
                  <option value="small">Pequena (1-50 funcionários)</option>
                  <option value="medium">Média (51-250 funcionários)</option>
                  <option value="large">Grande (251-1000 funcionários)</option>
                  <option value="enterprise">Enterprise (1000+ funcionários)</option>
                </select>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-[#E5E5DC] text-[#666666] rounded-lg hover:bg-[#FAFAF8] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#141042]/90 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{editingId ? 'Atualizar' : 'Cadastrar'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Busca */}
      {!showForm && (
        <div className="bg-white border border-[#E5E5DC] rounded-xl p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#666666]" />
            <input
              type="text"
              placeholder="Buscar por nome, CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
            />
          </div>
        </div>
      )}

      {/* Lista de Empresas */}
      {!showForm && (
        <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-[#666666]">
              <div className="w-8 h-8 border-2 border-[#141042]/30 border-t-[#141042] rounded-full animate-spin mx-auto mb-2" />
              Carregando empresas...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-8 text-center text-[#666666]">
              {searchTerm ? (
                <p>Nenhuma empresa encontrada com "{searchTerm}"</p>
              ) : (
                <p>Nenhuma empresa cadastrada ainda.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAFAF8] border-b border-[#E5E5DC]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      CNPJ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Porte
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-[#666666] uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5DC]">
                  {filteredCompanies.map((company) => (
                    <React.Fragment key={company.id}>
                      <tr className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <button
                              onClick={() => setExpandedCompanyId(expandedCompanyId === company.id ? null : company.id)}
                              className="font-semibold text-[#141042] hover:text-[#3B82F6] transition-colors text-left"
                            >
                              {company.name}
                            </button>
                            {company.industry && (
                              <div className="text-sm text-[#666666]">{company.industry}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#666666]">
                          {company.cnpj || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="text-[#666666]">{company.email || '—'}</div>
                            {company.phone && (
                              <div className="text-[#999]">{company.phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            company.size === 'small' ? 'bg-[#3B82F6]/10 text-[#3B82F6]' :
                            company.size === 'medium' ? 'bg-[#10B981]/10 text-[#10B981]' :
                            company.size === 'large' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                            company.size === 'enterprise' ? 'bg-[#8B5CF6]/10 text-[#8B5CF6]' :
                            'bg-[#E5E5DC] text-[#666666]'
                          }`}>
                            {company.size === 'small' && 'Pequena'}
                            {company.size === 'medium' && 'Média'}
                            {company.size === 'large' && 'Grande'}
                            {company.size === 'enterprise' && 'Enterprise'}
                            {!company.size && '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(company)}
                              className="p-2 text-[#3B82F6] hover:bg-[#3B82F6]/10 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(company.id)}
                              className="p-2 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedCompanyId === company.id && (
                        <tr>
                          <td colSpan={5} className="p-0">
                            <OrganizationDashboard
                              companyId={company.id}
                              companyName={company.name}
                              isExpanded={true}
                              onToggle={() => setExpandedCompanyId(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Nota sobre evolução futura */}
      <div className="bg-[#3B82F6]/10 border border-[#3B82F6] rounded-lg p-4">
        <h4 className="font-semibold text-[#141042] mb-2 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-[#3B82F6]" />
          Evolução Futura
        </h4>
        <p className="text-sm text-[#666666]">
          Este cadastro de empresas será expandido no futuro para incluir: gestão de vagas por empresa, 
          histórico de contratações, relatórios customizados, integração com LinkedIn, e muito mais.
        </p>
      </div>
    </div>
  );
}
