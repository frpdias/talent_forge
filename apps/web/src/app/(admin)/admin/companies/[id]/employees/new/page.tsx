'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, User, Calendar, Briefcase, Building2, Users, TrendingUp, Award } from 'lucide-react';
import { 
  HIERARCHY_LEVELS, 
  SENIORITY_LEVELS, 
  CAREER_TRACKS, 
  getDepartmentsByLevel,
  canBeManager,
  getHierarchyLevel
} from '@/lib/hierarchy-constants';

interface Manager {
  id: string;
  full_name: string;
  position?: string;
  hierarchy_level?: string;
}

interface FormData {
  full_name: string;
  cpf: string;
  birth_date: string;
  hire_date: string;
  position: string;
  department: string;
  hierarchy_level: string;
  seniority_level: string;
  career_track: string;
  manager_id: string;
  status: 'active' | 'inactive' | 'terminated';
}

export default function NewEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    cpf: '',
    birth_date: '',
    hire_date: new Date().toISOString().split('T')[0], // Default to today
    position: '',
    department: '',
    hierarchy_level: '',
    seniority_level: '',
    career_track: '',
    manager_id: '',
    status: 'active',
  });

  const [managers, setManagers] = useState<Manager[]>([]);
  const [filteredManagers, setFilteredManagers] = useState<Manager[]>([]);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [error, setError] = useState('');

  // Load potential managers (employees from same org)
  useEffect(() => {
    const loadManagers = async () => {
      try {
        const token = localStorage.getItem('supabase.auth.token');
        const response = await fetch(
          `http://localhost:3001/api/v1/php/employees?organization_id=${companyId}&status=active`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-org-id': companyId,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setManagers(data);
        }
      } catch (err) {
        console.error('Error loading managers:', err);
      } finally {
        setLoadingManagers(false);
      }
    };

    loadManagers();
  }, [companyId]);

  // Filter managers based on hierarchy level
  useEffect(() => {
    if (!formData.hierarchy_level) {
      setFilteredManagers([]);
      return;
    }

    // N1 (Conselho) não tem gestor
    if (formData.hierarchy_level === 'N1') {
      setFilteredManagers([]);
      return;
    }

    // Filtrar gestores válidos (nível superior)
    const valid = managers.filter((manager) => {
      if (!manager.hierarchy_level) return false;
      return canBeManager(manager.hierarchy_level, formData.hierarchy_level);
    });

    setFilteredManagers(valid);

    // Limpar gestor selecionado se não for mais válido
    if (formData.manager_id && !valid.find((m) => m.id === formData.manager_id)) {
      setFormData((prev) => ({ ...prev, manager_id: '' }));
    }
  }, [formData.hierarchy_level, managers, formData.manager_id]);

  // Update available departments when hierarchy level changes
  useEffect(() => {
    if (formData.hierarchy_level) {
      const depts = getDepartmentsByLevel(formData.hierarchy_level);
      setAvailableDepartments(depts);

      // Limpar departamento se não for mais válido
      if (formData.department && !depts.includes(formData.department)) {
        setFormData((prev) => ({ ...prev, department: '' }));
      }
    } else {
      setAvailableDepartments([]);
    }
  }, [formData.hierarchy_level, formData.department]);

  // Format CPF as user types
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  // Validate CPF format
  const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    
    // Check if all digits are the same
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    // Validate CPF algorithm
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(numbers.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(numbers.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers.substring(10, 11))) return false;
    
    return true;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData({ ...formData, cpf: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!formData.full_name.trim()) {
      setError('Nome completo é obrigatório');
      return;
    }

    if (!formData.cpf.trim()) {
      setError('CPF é obrigatório');
      return;
    }

    if (!validateCPF(formData.cpf)) {
      setError('CPF inválido');
      return;
    }

    if (!formData.hire_date) {
      setError('Data de contratação é obrigatória');
      return;
    }

    if (!formData.hierarchy_level) {
      setError('Nível hierárquico é obrigatório');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('supabase.auth.token');
      
      // Prepare payload
      const payload = {
        organization_id: companyId,
        full_name: formData.full_name.trim(),
        cpf: formData.cpf.replace(/\D/g, ''), // Remove formatting
        birth_date: formData.birth_date || null,
        hire_date: formData.hire_date,
        position: formData.position.trim() || null,
        department: formData.department || null,
        hierarchy_level: formData.hierarchy_level,
        seniority_level: formData.seniority_level || null,
        career_track: formData.career_track || null,
        manager_id: formData.manager_id || null,
        status: formData.status,
      };

      const response = await fetch('http://localhost:3001/api/v1/php/employees', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-org-id': companyId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar funcionário');
      }

      // Success - redirect to company page with employees tab
      router.push(`/admin/companies/${companyId}?tab=employees`);
    } catch (err: any) {
      console.error('Error creating employee:', err);
      setError(err.message || 'Erro ao criar funcionário');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/admin/companies/${companyId}?tab=employees`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-white rounded-lg border border-[#E5E5DC] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#141042]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#141042]">Novo Funcionário</h1>
            <p className="text-sm text-[#666666]">Cadastre um novo funcionário para esta empresa</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-[#E5E5DC] p-6 space-y-6">
          {/* Dados Pessoais */}
          <div>
            <h2 className="text-lg font-semibold text-[#141042] mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Dados Pessoais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#141042] mb-2">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042] transition-colors"
                  placeholder="João da Silva"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#141042] mb-2">
                  CPF <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042] transition-colors"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#141042] mb-2">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042] transition-colors"
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
                <label className="block text-sm font-medium text-[#141042] mb-2">
                  Data de Contratação <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#141042] mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042] transition-colors"
                  required
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="terminated">Desligado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#141042] mb-2">
                  Nível Hierárquico <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.hierarchy_level}
                  onChange={(e) => setFormData({ ...formData, hierarchy_level: e.target.value })}
                  className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042] transition-colors"
                  required
                >
                  <option value="">Selecione...</option>
                  {HIERARCHY_LEVELS.map((level) => (
                    <option key={level.code} value={level.code}>
                      {level.code} - {level.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#666666] mt-1">{formData.hierarchy_level && getHierarchyLevel(formData.hierarchy_level)?.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#141042] mb-2">
                  Senioridade
                </label>
                <select
                  value={formData.seniority_level}
                  onChange={(e) => setFormData({ ...formData, seniority_level: e.target.value })}
                  className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042] transition-colors"
                >
                  <option value="">Selecione...</option>
                  {SENIORITY_LEVELS.map((level) => (
                    <option key={level.code} value={level.code}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#141042] mb-2">
                  Trilha de Carreira
                </label>
                <select
                  value={formData.career_track}
                  onChange={(e) => setFormData({ ...formData, career_track: e.target.value })}
                  className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042] transition-colors"
                >
                  <option value="">Selecione...</option>
                  {CAREER_TRACKS.map((track) => (
                    <option key={track.code} value={track.code}>
                      {track.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#666666] mt-1">{formData.career_track && CAREER_TRACKS.find(t => t.code === formData.career_track)?.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#141042] mb-2">
                  Cargo/Posição
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042] transition-colors"
                  placeholder="Analista de Sistemas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#141042] mb-2">
                  Departamento
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042] transition-colors"
                  disabled={availableDepartments.length === 0}
                >
                  <option value="">Selecione...</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {formData.hierarchy_level && availableDepartments.length === 0 && (
                  <p className="text-xs text-[#666666] mt-1">Selecione um nível hierárquico primeiro</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#141042] mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Gestor Imediato
                </label>
                {loadingManagers ? (
                  <div className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg text-[#666666]">
                    Carregando gestores...
                  </div>
                ) : formData.hierarchy_level === 'N1' ? (
                  <div className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg text-[#666666]">
                    N1 (Conselho de Administração) não possui gestor superior
                  </div>
                ) : (
                  <select
                    value={formData.manager_id}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                    className="w-full px-4 py-2 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:border-[#141042] transition-colors"
                    disabled={!formData.hierarchy_level || filteredManagers.length === 0}
                  >
                    <option value="">Selecione um gestor...</option>
                    {filteredManagers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.full_name} {manager.position ? `- ${manager.position}` : ''} ({manager.hierarchy_level})
                      </option>
                    ))}
                  </select>
                )}
                {!loadingManagers && formData.hierarchy_level && formData.hierarchy_level !== 'N1' && filteredManagers.length === 0 && (
                  <p className="text-xs text-[#666666] mt-1">
                    Nenhum gestor disponível para o nível hierárquico selecionado. Cadastre gestores de níveis superiores primeiro.
                  </p>
                )}
                {!formData.hierarchy_level && !loadingManagers && (
                  <p className="text-xs text-[#666666] mt-1">
                    Selecione o nível hierárquico para ver os gestores disponíveis
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E5DC]">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-[#E5E5DC] text-[#141042] rounded-lg hover:bg-[#FAFAF8] transition-colors"
              disabled={loading}
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
        </form>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Dica:</strong> Após cadastrar o funcionário, você poderá vinculá-lo a um usuário do sistema 
            para que ele possa fazer login e acessar seus próprios resultados de avaliações (TFCI, NR-1, COPC).
          </p>
        </div>
      </div>
    </div>
  );
}
