'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CboSelector } from '@/components/CboSelector';
import { createClient } from '@/lib/supabase/client';

interface EditJobDrawerProps {
  jobId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

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

export function EditJobDrawer({ jobId, isOpen, onClose, onSaved }: EditJobDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [marketSalary, setMarketSalary] = useState<{ min: number; max: number } | null>(null);
  const [formData, setFormData] = useState<JobFormData>({
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
  });

  const supabase = createClient();

  useEffect(() => {
    if (isOpen && jobId) {
      void loadJob(jobId);
    }
  }, [isOpen, jobId]);

  async function loadJob(id: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        title: data.title || '',
        cbo_code: data.cbo_code || '',
        department: data.department || '',
        location: data.location || '',
        type: data.type || 'full-time',
        salary_min: data.salary_min?.toString() || '',
        salary_max: data.salary_max?.toString() || '',
        description: data.description || '',
        requirements: data.requirements || '',
        benefits: data.benefits || '',
        status: data.status || 'on_hold',
      });
    } catch (error) {
      console.error('Erro ao carregar vaga:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (field: keyof JobFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('jobs')
        .update({
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
        })
        .eq('id', jobId);

      if (error) throw error;

      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar vaga:', error);
      alert(error.message || 'Erro ao atualizar vaga');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-[60]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-[640px] bg-white z-[61] flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Editar Vaga</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[460px]">{formData.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-[#141042] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <form id="edit-job-form" onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Informações Básicas */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Informações Básicas</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-title">Título da Vaga *</Label>
                    <Input
                      id="edit-title"
                      required
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="Ex: Desenvolvedor Full Stack Sênior"
                    />
                  </div>

                  <div>
                    <Label>Ocupação (CBO)</Label>
                    <CboSelector
                      value={formData.cbo_code}
                      onChange={(code, salaryMin, salaryMax) => {
                        handleChange('cbo_code', code);
                        if (salaryMin && salaryMax) {
                          setMarketSalary({ min: Number(salaryMin), max: Number(salaryMax) });
                        }
                      }}
                    />
                    {marketSalary && (
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Salário de mercado sugerido: R$ {marketSalary.min.toLocaleString()} – R$ {marketSalary.max.toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-department">Departamento</Label>
                      <Input
                        id="edit-department"
                        value={formData.department}
                        onChange={(e) => handleChange('department', e.target.value)}
                        placeholder="Ex: Tecnologia"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-location">Localização</Label>
                      <Input
                        id="edit-location"
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        placeholder="Ex: São Paulo, SP"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Tipo de Contrato</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => handleChange('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">CLT</SelectItem>
                          <SelectItem value="part-time">Meio Período</SelectItem>
                          <SelectItem value="contract">PJ</SelectItem>
                          <SelectItem value="internship">Estágio</SelectItem>
                          <SelectItem value="temporary">Temporário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-salary-min">Salário Mínimo</Label>
                      <Input
                        id="edit-salary-min"
                        type="number"
                        value={formData.salary_min}
                        onChange={(e) => handleChange('salary_min', e.target.value)}
                        placeholder="Ex: 5000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-salary-max">Salário Máximo</Label>
                      <Input
                        id="edit-salary-max"
                        type="number"
                        value={formData.salary_max}
                        onChange={(e) => handleChange('salary_max', e.target.value)}
                        placeholder="Ex: 8000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Descrição da Vaga</h3>
                <Textarea
                  className="min-h-[120px]"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descreva as responsabilidades e atividades da vaga..."
                />
              </div>

              {/* Requisitos */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Requisitos</h3>
                <Textarea
                  className="min-h-[120px]"
                  value={formData.requirements}
                  onChange={(e) => handleChange('requirements', e.target.value)}
                  placeholder="Liste os requisitos necessários para a vaga..."
                />
              </div>

              {/* Benefícios */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Benefícios</h3>
                <Textarea
                  className="min-h-[100px]"
                  value={formData.benefits}
                  onChange={(e) => handleChange('benefits', e.target.value)}
                  placeholder="Liste os benefícios oferecidos..."
                />
              </div>

              {/* Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Status da Vaga</h3>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value as 'open' | 'on_hold' | 'closed')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_hold">Rascunho</SelectItem>
                    <SelectItem value="open">Publicada</SelectItem>
                    <SelectItem value="closed">Encerrada</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1.5">
                  Vagas em rascunho não são visíveis para candidatos
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="edit-job-form"
            disabled={saving || loading}
            className="bg-[#141042] hover:bg-[#1a1554]"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
