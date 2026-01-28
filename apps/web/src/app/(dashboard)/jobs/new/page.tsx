'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, CardContent, Button, Input, Textarea, Select } from '@/components/ui';
import { useOrgStore } from '@/lib/store';
import { jobsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewJobPage() {
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    employmentType: 'full_time',
    seniorityLevel: 'mid',
    minSalary: '',
    maxSalary: '',
    isRemote: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'open') => {
    e.preventDefault();
    if (!session?.access_token || !currentOrg?.id) return;

    try {
      setLoading(true);
      setError('');

      const data = {
        ...form,
        status,
        minSalary: form.minSalary ? Number(form.minSalary) : undefined,
        maxSalary: form.maxSalary ? Number(form.maxSalary) : undefined,
      };

      await jobsApi.create(data, session.access_token, currentOrg.id);
      router.push('/jobs');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar vaga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Nova Vaga"
        subtitle="Preencha os detalhes da vaga"
        actions={
          <Link href="/jobs">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        }
      />

      <div className="p-6 max-w-3xl">
        <form onSubmit={(e) => handleSubmit(e, 'open')}>
          <Card>
            <CardContent className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Informações Básicas</h3>
                
                <Input
                  label="Título da Vaga *"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Ex: Desenvolvedor Full Stack Senior"
                  required
                />

                <Textarea
                  label="Descrição *"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Descreva as responsabilidades e o dia-a-dia da posição..."
                  rows={5}
                  required
                />

                <Textarea
                  label="Requisitos"
                  name="requirements"
                  value={form.requirements}
                  onChange={handleChange}
                  placeholder="Liste os requisitos técnicos e experiências necessárias..."
                  rows={4}
                />
              </div>

              {/* Location & Type */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Localização e Tipo</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Localização *"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Ex: São Paulo, SP"
                    required
                  />

                  <Select
                    label="Tipo de Contrato *"
                    name="employmentType"
                    value={form.employmentType}
                    onChange={handleChange}
                    options={[
                      { value: 'full_time', label: 'CLT' },
                      { value: 'part_time', label: 'Meio Período' },
                      { value: 'contract', label: 'PJ' },
                      { value: 'internship', label: 'Estágio' },
                      { value: 'temporary', label: 'Temporário' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Senioridade *"
                    name="seniorityLevel"
                    value={form.seniorityLevel}
                    onChange={handleChange}
                    options={[
                      { value: 'intern', label: 'Estágio' },
                      { value: 'junior', label: 'Júnior' },
                      { value: 'mid', label: 'Pleno' },
                      { value: 'senior', label: 'Sênior' },
                      { value: 'lead', label: 'Lead' },
                      { value: 'manager', label: 'Gerente' },
                    ]}
                  />

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="isRemote"
                      name="isRemote"
                      checked={form.isRemote}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isRemote" className="text-sm text-gray-700">
                      Permite trabalho remoto
                    </label>
                  </div>
                </div>
              </div>

              {/* Salary */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Faixa Salarial (opcional)</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Salário Mínimo"
                    name="minSalary"
                    type="number"
                    value={form.minSalary}
                    onChange={handleChange}
                    placeholder="5000"
                  />

                  <Input
                    label="Salário Máximo"
                    name="maxSalary"
                    type="number"
                    value={form.maxSalary}
                    onChange={handleChange}
                    placeholder="8000"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => handleSubmit(e as any, 'draft')}
                  disabled={loading}
                >
                  Salvar como Rascunho
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Publicando...' : 'Publicar Vaga'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
