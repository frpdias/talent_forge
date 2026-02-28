'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Plus, Search, Edit, Eye, Trash2, MapPin, Mail, Phone } from 'lucide-react';
import { useOrgStore } from '@/lib/store';
import { HIERARCHY_LEVELS } from '@/lib/constants/hierarchy';
import { API_V1_URL } from '@/lib/api-config';

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
  size?: string;
  created_at: string;
}

const SIZE_BADGES = {
  small: { label: 'Pequena', color: 'bg-blue-100 text-blue-800' },
  medium: { label: 'Média', color: 'bg-green-100 text-green-800' },
  large: { label: 'Grande', color: 'bg-orange-100 text-orange-800' },
  enterprise: { label: 'Enterprise', color: 'bg-purple-100 text-purple-800' },
};

export default function RecruiterCompaniesPage() {
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [consultingCNPJ, setConsultingCNPJ] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    industry: '',
    size: 'small',
    // Dados do administrador
    adminName: '',
    adminCpf: '',
    adminEmail: '',
    adminPhone: '',
    adminPosition: 'Diretor Executivo',
    adminHireDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadCompanies();
  }, [currentOrg]);

  const formatCNPJ = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  const formatCPF = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleCNPJChange = (value: string) => {
    const formatted = formatCNPJ(value);
    setFormData({ ...formData, cnpj: formatted });
    
    // Se CNPJ completo (14 dígitos), consultar API
    const numbers = formatted.replace(/\D/g, '');
    if (numbers.length === 14) {
      consultarCNPJ(numbers);
    }
  };

  const consultarCNPJ = async (cnpj: string) => {
    setConsultingCNPJ(true);
    setErrors({});

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setErrors({ cnpj: 'CNPJ não encontrado na Receita Federal' });
        } else {
          setErrors({ cnpj: 'Erro ao consultar CNPJ. Tente novamente.' });
        }
        return;
      }

      const data = await response.json();

      // Mapear dados da API para o formulário
      setFormData(prev => ({
        ...prev,
        name: data.razao_social || data.nome_fantasia || prev.name,
        email: data.email || prev.email,
        phone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1}) ${data.telefone_1}` : prev.phone,
        address: data.logradouro ? `${data.logradouro}, ${data.numero || 'S/N'}${data.complemento ? ' - ' + data.complemento : ''}` : prev.address,
        city: data.municipio || prev.city,
        state: data.uf || prev.state,
        industry: data.cnae_fiscal_descricao || prev.industry,
        size: data.porte ? mapPorte(data.porte) : prev.size,
      }));

      // Limpar erro de CNPJ se existir
      const newErrors = { ...errors };
      delete newErrors.cnpj;
      setErrors(newErrors);

    } catch (error) {
      console.error('Erro ao consultar CNPJ:', error);
      setErrors({ cnpj: 'Erro ao consultar CNPJ. Verifique sua conexão.' });
    } finally {
      setConsultingCNPJ(false);
    }
  };

  const mapPorte = (porte: string): string => {
    const porteMap: Record<string, string> = {
      'ME': 'small',
      'EPP': 'small',
      'DEMAIS': 'medium',
      'GRANDE': 'large',
    };
    return porteMap[porte.toUpperCase()] || 'small';
  };

  const loadCompanies = async () => {
    try {
      setLoading(true);
      
      // Buscar token do Supabase (sessão atual)
      const { data: { session } } = await (await import('@/lib/supabase/client')).createClient().auth.getSession();
      const token = session?.access_token;

      if (!token || !currentOrg?.id) {
        setLoading(false);
        return;
      }
      
      // Buscar empresas onde parent_org_id = currentOrg.id (empresas deste recrutador)
      const response = await fetch(`${API_V1_URL}/organizations?parent_org_id=${currentOrg.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.adminName || !formData.adminCpf) {
      alert('❌ Nome e CPF do administrador são obrigatórios');
      return;
    }

    setSaving(true);
    
    try {
      // Buscar token do Supabase (sessão atual)
      const { data: { session } } = await (await import('@/lib/supabase/client')).createClient().auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert('Sessão expirada. Faça login novamente.');
        setSaving(false);
        return;
      }

      const endpoint = editingCompany
        ? `${API_V1_URL}/organizations/${editingCompany.id}`
        : '${API_V1_URL}/organizations';
      
      const method = editingCompany ? 'PATCH' : 'POST';
      
      const payload = {
        name: formData.name,
        cnpj: formData.cnpj,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        industry: formData.industry,
        size: formData.size,
        parentOrgId: currentOrg?.id, // Vincular ao recrutador
        orgType: 'company', // Sempre company
      };

      console.log('Enviando payload:', payload);

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.log('Resposta da API:', responseData);

      if (response.ok) {
        // Se for nova empresa (não edição), criar administrador
        if (!editingCompany) {
          const companyId = responseData.id;
          
          // Criar administrador
          const adminPayload = {
            full_name: formData.adminName,
            cpf: formData.adminCpf.replace(/\D/g, ''),
            email: formData.adminEmail || undefined,
            phone: formData.adminPhone || undefined,
            hire_date: formData.adminHireDate,
            position: formData.adminPosition,
            department: 'Diretoria',
            status: 'active',
            organization_id: companyId,
          };

          console.log('Criando administrador:', adminPayload);

          const adminResponse = await fetch('${API_V1_URL}/php/employees', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-org-id': companyId,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(adminPayload),
          });

          if (!adminResponse.ok) {
            const adminError = await adminResponse.json();
            console.error('Erro ao criar administrador:', adminError);
            alert('⚠️ Empresa criada, mas houve erro ao criar o administrador. Você pode adicioná-lo manualmente.');
          } else {
            console.log('✅ Administrador criado com sucesso');
          }
        }

        await loadCompanies();
        setShowForm(false);
        setEditingCompany(null);
        setFormData({
          name: '',
          cnpj: '',
          email: '',
          phone: '',
          website: '',
          address: '',
          city: '',
          state: '',
          industry: '',
          size: 'small',
          adminName: '',
          adminCpf: '',
          adminEmail: '',
          adminPhone: '',
          adminPosition: 'Diretor Executivo',
          adminHireDate: new Date().toISOString().split('T')[0],
        });
        alert('✅ Empresa e administrador criados com sucesso!');
      } else {
        // Mostrar erro da API
        const errorMessage = responseData.message || responseData.error || 'Erro ao criar empresa';
        alert(`❌ Erro: ${errorMessage}`);
        console.error('Erro da API:', responseData);
      }
    } catch (error) {
      console.error('Error saving company:', error);
      alert('❌ Erro ao criar empresa. Verifique o console para mais detalhes.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      cnpj: company.cnpj || '',
      email: company.email || '',
      phone: company.phone || '',
      website: company.website || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      industry: company.industry || '',
      size: company.size || 'small',
      // Admin fields não são preenchidos na edição
      adminName: '',
      adminCpf: '',
      adminEmail: '',
      adminPhone: '',
      adminPosition: 'Diretor Executivo',
      adminHireDate: new Date().toISOString().split('T')[0],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      // Buscar token do Supabase (sessão atual)
      const { data: { session } } = await (await import('@/lib/supabase/client')).createClient().auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert('Sessão expirada. Faça login novamente.');
        return;
      }

      const response = await fetch(`${API_V1_URL}/organizations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await loadCompanies();
      }
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  const handleViewDetails = (id: string) => {
    router.push(`/dashboard/companies/${id}`);
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj?.includes(searchTerm) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#141042] flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Minhas Empresas
            </h1>
            <p className="text-sm text-[#666666]">
              Gerencie as empresas clientes e seus funcionários
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingCompany(null);
              setFormData({
                name: '',
                cnpj: '',
                email: '',
                phone: '',
                website: '',
                address: '',
                city: '',
                state: '',
                industry: '',
                size: 'small',
                adminName: '',
                adminCpf: '',
                adminEmail: '',
                adminPhone: '',
                adminPosition: 'Diretor Executivo',
                adminHireDate: new Date().toISOString().split('T')[0],
              });
            }}
            className="px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1557] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Empresa
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
            <input
              type="text"
              placeholder="Buscar por nome, CNPJ ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042] transition-colors"
            />
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#141042] mb-4">
                  {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#141042] mb-1">
                        Nome da Empresa *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#141042] mb-1">
                        CNPJ
                        {consultingCNPJ && (
                          <span className="ml-2 text-xs text-blue-600">🔍 Consultando...</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={formData.cnpj}
                        onChange={(e) => handleCNPJChange(e.target.value)}
                        maxLength={18}
                        className={`w-full px-4 py-2 bg-[#FAFAF8] border rounded-lg focus:outline-none focus:border-[#141042] ${
                          errors.cnpj ? 'border-red-500' : 'border-[#E5E5DC]'
                        }`}
                        placeholder="00.000.000/0000-00"
                        disabled={consultingCNPJ}
                      />
                      {errors.cnpj && (
                        <p className="text-xs text-red-600 mt-1">{errors.cnpj}</p>
                      )}
                      <p className="text-xs text-[#666666] mt-1">
                        ✨ Digite o CNPJ e os dados serão preenchidos automaticamente
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#141042] mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#141042] mb-1">Telefone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#141042] mb-1">Website</label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#141042] mb-1">Endereço</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#141042] mb-1">Cidade</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#141042] mb-1">Estado</label>
                      <select
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                      >
                        <option value="">Selecione...</option>
                        <option value="SP">São Paulo</option>
                        <option value="RJ">Rio de Janeiro</option>
                        <option value="MG">Minas Gerais</option>
                        <option value="RS">Rio Grande do Sul</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#141042] mb-1">Setor</label>
                      <input
                        type="text"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#141042] mb-1">Porte</label>
                      <select
                        value={formData.size}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                        className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                      >
                        <option value="small">Pequena (1-50)</option>
                        <option value="medium">Média (51-250)</option>
                        <option value="large">Grande (251-1000)</option>
                        <option value="enterprise">Enterprise (1000+)</option>
                      </select>
                    </div>
                  </div>

                  {/* Seção Administrador - Apenas para nova empresa */}
                  {!editingCompany && (
                    <>
                      <div className="pt-6 mt-6 border-t-2 border-[#E5E5DC]">
                        <h3 className="text-md font-semibold text-[#141042] mb-1">
                          👤 Administrador da Empresa
                        </h3>
                        <p className="text-sm text-[#666666] mb-4">
                          Cadastre o gestor direto que será o administrador inicial da empresa
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[#141042] mb-1">
                              Nome Completo *
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.adminName}
                              onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                              className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                              placeholder="Nome completo do administrador"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[#141042] mb-1">
                              CPF *
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.adminCpf}
                              onChange={(e) => setFormData({ ...formData, adminCpf: formatCPF(e.target.value) })}
                              className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                              placeholder="000.000.000-00"
                              maxLength={14}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[#141042] mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={formData.adminEmail}
                              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                              className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                              placeholder="email@empresa.com"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[#141042] mb-1">
                              Telefone
                            </label>
                            <input
                              type="tel"
                              value={formData.adminPhone}
                              onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                              className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                              placeholder="(11) 99999-9999"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[#141042] mb-1">
                              Cargo
                            </label>
                            <select
                              value={formData.adminPosition}
                              onChange={(e) => setFormData({ ...formData, adminPosition: e.target.value })}
                              className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                            >
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
                              Data de Admissão
                            </label>
                            <input
                              type="date"
                              value={formData.adminHireDate}
                              onChange={(e) => setFormData({ ...formData, adminHireDate: e.target.value })}
                              className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042]"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E5DC]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingCompany(null);
                      }}
                      className="px-4 py-2 border border-[#E5E5DC] text-[#141042] rounded-lg hover:bg-[#FAFAF8] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Salvando...' : (editingCompany ? 'Salvar Alterações' : 'Criar Empresa')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Companies List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#666666]">Carregando empresas...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-[#E5E5DC]">
            <Building2 className="w-16 h-16 text-[#666666] mx-auto mb-4" />
            <p className="text-[#666666] mb-4">
              {searchTerm ? 'Nenhuma empresa encontrada' : 'Você ainda não cadastrou nenhuma empresa'}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1557] transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Primeira Empresa
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company) => (
              <div
                key={company.id}
                className="bg-white rounded-lg border border-[#E5E5DC] p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[#141042]">{company.name}</h3>
                    {company.industry && (
                      <p className="text-xs text-[#666666]">{company.industry}</p>
                    )}
                  </div>
                  {company.size && (
                    <span className={`text-xs px-2 py-1 rounded ${SIZE_BADGES[company.size as keyof typeof SIZE_BADGES]?.color || ''}`}>
                      {SIZE_BADGES[company.size as keyof typeof SIZE_BADGES]?.label || company.size}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-[#666666] mb-4">
                  {company.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{company.email}</span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.city && company.state && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{company.city}, {company.state}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewDetails(company.id)}
                    className="flex-1 px-3 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1557] transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                  </button>
                  <button
                    onClick={() => handleEdit(company)}
                    className="px-3 py-2 border border-[#E5E5DC] text-[#141042] rounded-lg hover:bg-[#FAFAF8] transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(company.id)}
                    className="px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
