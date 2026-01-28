'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { DashboardHeader } from '@/components/DashboardHeader';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

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

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [loading, setLoading] = useState(true);
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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (jobId) {
      loadJob();
    }
  }, [jobId]);

  async function loadJob() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
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
      console.error('Error loading job:', error);
      router.push('/dashboard/jobs');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

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
      };

      const { error } = await supabase
        .from('jobs')
        .update(jobData)
        .eq('id', jobId);

      if (error) throw error;

      router.push(`/dashboard/jobs/${jobId}`);
    } catch (error: any) {
      console.error('Error updating job:', error);
      alert(error.message || 'Erro ao atualizar vaga');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof JobFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#141042]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <DashboardHeader
        title="Editar Vaga"
        subtitle={formData.title}
        actions={
          <Link href={`/dashboard/jobs/${jobId}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-black">Título da Vaga *</Label>
                <Input
                  id="title"
                  className="text-black"
                  required
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Ex: Desenvolvedor Full Stack Sênior"
                />
              </div>

              <div>
                <Label className="text-black">Ocupação (CBO)</Label>
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
                    💡 Salário de mercado sugerido: R$ {marketSalary.min.toLocaleString()} - R$ {marketSalary.max.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department" className="text-black">Departamento</Label>
                  <Input
                    id="department"
                    className="text-black"
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    placeholder="Ex: Tecnologia"
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-black">Localização</Label>
                  <Input
                    id="location"
                    className="text-black"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Ex: São Paulo, SP"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type" className="text-black">Tipo de Contrato</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange('type', value)}
                  >
                    <SelectTrigger className="text-black">
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
                  <Label htmlFor="salary_min" className="text-black">Salário Mínimo</Label>
                  <Input
                    id="salary_min"
                    type="number"
                    className="text-black"
                    value={formData.salary_min}
                    onChange={(e) => handleChange('salary_min', e.target.value)}
                    placeholder="Ex: 5000"
                  />
                </div>
                <div>
                  <Label htmlFor="salary_max" className="text-black">Salário Máximo</Label>
                  <Input
                    id="salary_max"
                    type="number"
                    className="text-black"
                    value={formData.salary_max}
                    onChange={(e) => handleChange('salary_max', e.target.value)}
                    placeholder="Ex: 8000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black">Descrição da Vaga</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[150px] text-black"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descreva as responsabilidades e atividades da vaga..."
              />
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black">Requisitos</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[150px] text-black"
                value={formData.requirements}
                onChange={(e) => handleChange('requirements', e.target.value)}
                placeholder="Liste os requisitos necessários para a vaga..."
              />
            </CardContent>
          </Card>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black">Benefícios</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                className="min-h-[100px] text-black"
                value={formData.benefits}
                onChange={(e) => handleChange('benefits', e.target.value)}
                placeholder="Liste os benefícios oferecidos..."
              />
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-black">Status da Vaga</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="status" className="text-black">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value as 'open' | 'on_hold' | 'closed')}
                >
                  <SelectTrigger className="text-black">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_hold">Rascunho</SelectItem>
                    <SelectItem value="open">Publicada</SelectItem>
                    <SelectItem value="closed">Encerrada</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-2">
                  Vagas rascunho não são visíveis para candidatos
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href={`/dashboard/jobs/${jobId}`}>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
