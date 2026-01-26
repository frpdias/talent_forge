'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye } from 'lucide-react';
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

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's organization
      const { data: member } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (!member?.org_id) {
        throw new Error('Organization not found');
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
        org_id: member.org_id,
      };

      const { error } = await supabase
        .from('jobs')
        .insert([jobData]);

      if (error) throw error;

      router.push('/dashboard/jobs');
    } catch (error: any) {
      console.error('Error creating job:', error);
      alert(error.message || 'Erro ao criar vaga');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    field: keyof JobFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <DashboardHeader
        title="Nova Vaga"
        subtitle="Crie uma nova oportunidade de trabalho"
        actions={
          <Link href="/dashboard/jobs">
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
                <Label className="text-black">Ocupação Oficial (CBO)</Label>
                <CboSelector 
                  value={formData.cbo_code}
                  onChange={(code, title, salary) => {
                      handleChange('cbo_code', code);
                      if (salary) {
                        setMarketSalary(salary);
                        // Opcional: pré-preencher
                        if (!formData.salary_min) handleChange('salary_min', salary.min.toString());
                        if (!formData.salary_max) handleChange('salary_max', salary.max.toString());
                      } else {
                        setMarketSalary(null);
                      }
                  }}
                  placeholder="Busque por cargo (ex: 'Desenvolvedor')"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A ocupação define a média salarial de mercado e facilita o match.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department" className="text-black">Departamento *</Label>
                  <Input
                    id="department"
                    className="text-black"
                    required
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    placeholder="Ex: Tecnologia"
                  />
                </div>

                <div>
                  <Label htmlFor="location" className="text-black">Localização *</Label>
                  <Input
                    id="location"
                    className="text-black"
                    required
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Ex: São Paulo - SP (Remoto)"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="type" className="text-black">Tipo de Contratação *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange('type', value)}
                  className="text-black"
                  options={[
                    { value: 'full-time', label: 'Tempo Integral' },
                    { value: 'part-time', label: 'Meio Período' },
                    { value: 'contract', label: 'Contrato' },
                    { value: 'temporary', label: 'Temporário' },
                    { value: 'internship', label: 'Estágio' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="salary_min" className="text-black">Salário Mínimo Ofertado (R$)</Label>
                    {marketSalary && (
                      <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                         Ref. CBO: R$ {marketSalary.min.toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
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
                   <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="salary_max" className="text-black">Salário Máximo Ofertado (R$)</Label>
                    {marketSalary && (
                      <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                         Ref. CBO: R$ {marketSalary.max.toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
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
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description" className="text-black">Descrição *</Label>
                <Textarea
                  id="description"
                  required
                  rows={6}
                  className="text-black"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Descreva as responsabilidades e atividades do cargo..."
                />
              </div>

              <div>
                <Label htmlFor="requirements" className="text-black">Requisitos *</Label>
                <Textarea
                  id="requirements"
                  required
                  rows={6}
                  className="text-black"
                  value={formData.requirements}
                  onChange={(e) => handleChange('requirements', e.target.value)}
                  placeholder="Liste os requisitos necessários (um por linha)..."
                />
              </div>

              <div>
                <Label htmlFor="benefits" className="text-black">Benefícios</Label>
                <Textarea
                  id="benefits"
                  rows={4}
                  className="text-black"
                  value={formData.benefits}
                  onChange={(e) => handleChange('benefits', e.target.value)}
                  placeholder="Liste os benefícios oferecidos (um por linha)..."
                />
              </div>
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
                    <SelectItem value="open">Publicar Vaga</SelectItem>
                    <SelectItem value="closed">Encerrada</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-black mt-2">
                  Vagas rascunho não são visíveis para candidatos
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/dashboard/jobs">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Vaga
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
