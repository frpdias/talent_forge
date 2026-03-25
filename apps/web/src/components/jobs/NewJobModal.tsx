'use client';

import { useRef, useState } from 'react';
import { Building2, Save, Upload, X } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { CboSelector } from '@/components/CboSelector';
import { createClient } from '@/lib/supabase/client';
import { getUserOrganization } from '@/lib/get-user-org';

interface JobFormData {
  title: string;
  cbo_code: string;
  department: string;
  location: string;
  type: string;
  salary_min: string;
  salary_max: string;
  description: string;
  requirements: string;
  benefits: string;
  status: 'open' | 'on_hold' | 'closed';
  is_public: boolean;
  application_deadline: string;
  company_disclosed: boolean;
  company_name: string;
  company_logo_url: string;
}

const INITIAL_FORM: JobFormData = {
  title: '',
  cbo_code: '',
  department: '',
  location: '',
  type: 'full-time',
  salary_min: '',
  salary_max: '',
  description: '',
  requirements: '',
  benefits: '',
  status: 'on_hold',
  is_public: false,
  application_deadline: '',
  company_disclosed: false,
  company_name: '',
  company_logo_url: '',
};

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewJobModal({ isOpen, onClose, onSuccess }: NewJobModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketSalary, setMarketSalary] = useState<{ min: number; max: number } | null>(null);
  const [formData, setFormData] = useState<JobFormData>(INITIAL_FORM);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const handleChange = (field: keyof JobFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_SIZE) {
      setError(`A logo deve ter no máximo 2MB. O arquivo selecionado tem ${(file.size / 1024 / 1024).toFixed(1)}MB.`);
      if (logoInputRef.current) logoInputRef.current.value = '';
      return;
    }
    setError(null);
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData((prev) => ({ ...prev, company_logo_url: '' }));
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM);
    setMarketSalary(null);
    setError(null);
    setLogoFile(null);
    setLogoPreview(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      const member = await getUserOrganization(supabase);

      // Upload logo se houver arquivo selecionado
      let logoUrl = formData.company_logo_url;
      if (formData.company_disclosed && logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `${member.org_id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('job-logos')
          .upload(path, logoFile, { upsert: true });
        if (uploadError) throw new Error(`Erro ao enviar logo: ${uploadError.message}`);
        const { data: urlData } = supabase.storage.from('job-logos').getPublicUrl(path);
        logoUrl = urlData.publicUrl;
      }

      const jobData = {
        title: formData.title,
        cbo_code: formData.cbo_code || null,
        department: formData.department,
        location: formData.location,
        type: formData.type,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        description: formData.description,
        requirements: formData.requirements,
        benefits: formData.benefits,
        status: formData.status,
        is_public: formData.is_public,
        application_deadline: formData.application_deadline || null,
        company_disclosed: formData.company_disclosed,
        company_name: formData.company_disclosed ? formData.company_name || null : null,
        company_logo_url: formData.company_disclosed ? logoUrl || null : null,
        org_id: member.org_id,
      };

      const { error: insertError } = await supabase.from('jobs').insert([jobData]);

      if (insertError) throw insertError;

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar vaga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nova Vaga" size="xl">
      <div className="overflow-y-auto max-h-[75vh] -mx-6 px-6">
        <form onSubmit={handleSubmit} className="space-y-6 py-2">

          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#141042] uppercase tracking-wider">
              Informações Básicas
            </h3>

            <div>
              <Label htmlFor="modal-title" className="text-sm font-medium text-[#141042]">
                Título da Vaga *
              </Label>
              <Input
                id="modal-title"
                required
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Ex: Desenvolvedor Full Stack Sênior"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-[#141042]">
                Ocupação Oficial (CBO)
              </Label>
              <div className="mt-1">
                <CboSelector
                  value={formData.cbo_code}
                  onChange={(code, _title, salary) => {
                    handleChange('cbo_code', code);
                    if (salary) {
                      setMarketSalary(salary);
                      if (!formData.salary_min) handleChange('salary_min', salary.min.toString());
                      if (!formData.salary_max) handleChange('salary_max', salary.max.toString());
                    } else {
                      setMarketSalary(null);
                    }
                  }}
                  placeholder="Busque por cargo (ex: 'Desenvolvedor')"
                />
              </div>
              <p className="text-xs text-[#666666] mt-1">
                A ocupação define a média salarial de mercado e facilita o match.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modal-department" className="text-sm font-medium text-[#141042]">
                  Departamento *
                </Label>
                <Input
                  id="modal-department"
                  required
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  placeholder="Ex: Tecnologia"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="modal-location" className="text-sm font-medium text-[#141042]">
                  Localização *
                </Label>
                <Input
                  id="modal-location"
                  required
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Ex: São Paulo - SP (Remoto)"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="modal-type" className="text-sm font-medium text-[#141042]">
                Tipo de Contratação *
              </Label>
              <div className="mt-1">
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange('type', value)}
                  options={[
                    { value: 'full-time', label: 'Tempo Integral' },
                    { value: 'part-time', label: 'Meio Período' },
                    { value: 'contract', label: 'Contrato' },
                    { value: 'temporary', label: 'Temporário' },
                    { value: 'internship', label: 'Estágio' },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="modal-salary-min" className="text-sm font-medium text-[#141042]">
                    Salário Mínimo (R$)
                  </Label>
                  {marketSalary && (
                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Ref. CBO: R$ {marketSalary.min.toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>
                <Input
                  id="modal-salary-min"
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => handleChange('salary_min', e.target.value)}
                  placeholder="Ex: 5000"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="modal-salary-max" className="text-sm font-medium text-[#141042]">
                    Salário Máximo (R$)
                  </Label>
                  {marketSalary && (
                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Ref. CBO: R$ {marketSalary.max.toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>
                <Input
                  id="modal-salary-max"
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) => handleChange('salary_max', e.target.value)}
                  placeholder="Ex: 8000"
                />
              </div>
            </div>
          </div>

          <hr className="border-[#E5E5DC]" />

          {/* Descrição */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#141042] uppercase tracking-wider">
              Descrição da Vaga
            </h3>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="modal-description" className="text-sm font-medium text-[#141042]">
                  Descrição *
                </Label>
                <span className={`text-xs ${(formData.description?.length ?? 0) > 650 ? 'text-red-500 font-semibold' : 'text-[#999]'}`}>
                  {formData.description?.length ?? 0}/700
                </span>
              </div>
              <Textarea
                id="modal-description"
                required
                rows={5}
                maxLength={700}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descreva as responsabilidades e atividades do cargo..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="modal-requirements" className="text-sm font-medium text-[#141042]">
                  Requisitos *
                </Label>
                <span className={`text-xs ${(formData.requirements?.length ?? 0) > 650 ? 'text-red-500 font-semibold' : 'text-[#999]'}`}>
                  {formData.requirements?.length ?? 0}/700
                </span>
              </div>
              <Textarea
                id="modal-requirements"
                required
                rows={5}
                maxLength={700}
                onChange={(e) => handleChange('requirements', e.target.value)}
                placeholder="Liste os requisitos necessários (um por linha)..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="modal-benefits" className="text-sm font-medium text-[#141042]">
                  Benefícios
                </Label>
                <span className={`text-xs ${(formData.benefits?.length ?? 0) > 650 ? 'text-red-500 font-semibold' : 'text-[#999]'}`}>
                  {formData.benefits?.length ?? 0}/700
                </span>
              </div>
              <Textarea
                id="modal-benefits"
                rows={3}
                maxLength={700}
                onChange={(e) => handleChange('benefits', e.target.value)}
                placeholder="Liste os benefícios oferecidos (um por linha)..."
              />
            </div>
          </div>

          <hr className="border-[#E5E5DC]" />

          {/* Career Page */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#141042] uppercase tracking-wider">
              Página de Carreiras
            </h3>

            <div className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-lg border border-[#E5E5DC]">
              <div>
                <p className="text-sm font-medium text-[#141042]">Exibir na career page pública</p>
                <p className="text-xs text-[#666666] mt-0.5">Candidatos externos poderão ver e se candidatar</p>
              </div>
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData((p) => ({ ...p, is_public: e.target.checked }))}
                className="h-5 w-5 rounded border-[#E5E5DC] text-[#141042] focus:ring-[#141042] cursor-pointer"
              />
            </div>

            <div>
              <Label htmlFor="modal-deadline" className="text-sm font-medium text-[#141042]">
                Prazo para candidatura
              </Label>
              <input
                id="modal-deadline"
                type="date"
                value={formData.application_deadline}
                onChange={(e) => handleChange('application_deadline', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042] text-sm text-[#141042]"
              />
            </div>
          </div>

          <hr className="border-[#E5E5DC]" />

          {/* Identidade da Empresa */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#141042] uppercase tracking-wider">
              Identidade da Empresa
            </h3>

            <div className="flex items-center justify-between p-4 bg-[#FAFAF8] rounded-lg border border-[#E5E5DC]">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-[#141042]" />
                <div>
                  <p className="text-sm font-medium text-[#141042]">Revelar empresa na vaga</p>
                  <p className="text-xs text-[#666666] mt-0.5">
                    {formData.company_disclosed
                      ? 'A empresa será identificada publicamente'
                      : 'Empresa em sigilo — identidade não será divulgada'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.company_disclosed}
                onChange={(e) => setFormData((p) => ({ ...p, company_disclosed: e.target.checked }))}
                className="h-5 w-5 rounded border-[#E5E5DC] text-[#141042] focus:ring-[#141042] cursor-pointer"
              />
            </div>

            {formData.company_disclosed && (
              <div className="space-y-4 pl-2 border-l-2 border-[#141042]/20">
                <div>
                  <Label className="text-sm font-medium text-[#141042]">Nome da Empresa</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    placeholder="Ex: TechCorp Soluções"
                    className="mt-1"
                    maxLength={120}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-[#141042]">Logo da Empresa</Label>
                  <div className="mt-1">
                    {logoPreview ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={logoPreview}
                          alt="Preview logo"
                          className="h-16 w-16 object-contain rounded-lg border border-[#E5E5DC] bg-white p-1"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                          Remover logo
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-[#E5E5DC] rounded-lg text-sm text-[#666] hover:border-[#141042] hover:text-[#141042] transition-colors w-full justify-center"
                      >
                        <Upload className="h-4 w-4" />
                        Importar logo (PNG, JPG, SVG)
                      </button>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                    <p className="text-xs text-[#999] mt-1.5">Tamanho máximo: 2MB. Recomendado: fundo transparente.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <hr className="border-[#E5E5DC]" />

          {/* Status */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#141042] uppercase tracking-wider">
              Status
            </h3>

            <div>
              <Select
                value={formData.status}
                onValueChange={(value) => {
                  const status = value as 'open' | 'on_hold' | 'closed';
                  setFormData((prev) => ({
                    ...prev,
                    status,
                    // Ao publicar, tornar pública automaticamente
                    is_public: status === 'open' ? true : prev.is_public,
                  }));
                }}
                options={[
                  { value: 'on_hold', label: 'Rascunho — não visível para candidatos' },
                  { value: 'open', label: 'Publicar Vaga — visível imediatamente' },
                  { value: 'closed', label: 'Encerrada' },
                ]}
              />
            </div>
          </div>

          {/* Erro inline */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-2 border-t border-[#E5E5DC]">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm border border-[#E5E5DC] text-[#141042] rounded-lg hover:bg-[#FAFAF8] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-[#141042] text-white rounded-lg hover:bg-[#1a1554] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar Vaga
            </button>
          </div>

        </form>
      </div>
    </Modal>
  );
}
