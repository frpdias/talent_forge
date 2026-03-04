'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { CboSelector } from '@/components/CboSelector';
import { createBrowserClient } from '@supabase/ssr';
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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleChange = (field: keyof JobFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM);
    setMarketSalary(null);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      const member = await getUserOrganization(supabase);

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
              <Label htmlFor="modal-description" className="text-sm font-medium text-[#141042]">
                Descrição *
              </Label>
              <Textarea
                id="modal-description"
                required
                rows={5}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descreva as responsabilidades e atividades do cargo..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="modal-requirements" className="text-sm font-medium text-[#141042]">
                Requisitos *
              </Label>
              <Textarea
                id="modal-requirements"
                required
                rows={5}
                value={formData.requirements}
                onChange={(e) => handleChange('requirements', e.target.value)}
                placeholder="Liste os requisitos necessários (um por linha)..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="modal-benefits" className="text-sm font-medium text-[#141042]">
                Benefícios
              </Label>
              <Textarea
                id="modal-benefits"
                rows={3}
                value={formData.benefits}
                onChange={(e) => handleChange('benefits', e.target.value)}
                placeholder="Liste os benefícios oferecidos (um por linha)..."
                className="mt-1"
              />
            </div>
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
                onValueChange={(value) => handleChange('status', value as 'open' | 'on_hold' | 'closed')}
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
