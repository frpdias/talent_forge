'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, CardContent, Button, Input, Textarea } from '@/components/ui';
import { useOrgStore } from '@/lib/store';
import { candidatesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, Save, X } from 'lucide-react';
import Link from 'next/link';

export default function NewCandidatePage() {
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    headline: '',
    resumeUrl: '',
    linkedinUrl: '',
    tags: [] as string[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token || !currentOrg?.id) return;

    try {
      setLoading(true);
      setError('');

      await candidatesApi.create(form, session.access_token, currentOrg.id);
      router.push('/candidates');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar candidato');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Novo Candidato"
        subtitle="Cadastre um novo candidato"
        actions={
          <Link href="/candidates">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        }
      />

      <div className="p-6 max-w-3xl">
        <form onSubmit={handleSubmit}>
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
                  label="Nome Completo *"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="João da Silva"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Email *"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="joao@email.com"
                    required
                  />
                  <Input
                    label="Telefone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <Input
                  label="Localização"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="São Paulo, SP"
                />

                <Input
                  label="Headline / Cargo Atual"
                  name="headline"
                  value={form.headline}
                  onChange={handleChange}
                  placeholder="Desenvolvedor Full Stack na Empresa XYZ"
                />
              </div>

              {/* Links */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Links</h3>
                
                <Input
                  label="LinkedIn"
                  name="linkedinUrl"
                  value={form.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/joaosilva"
                />

                <Input
                  label="URL do Currículo"
                  name="resumeUrl"
                  value={form.resumeUrl}
                  onChange={handleChange}
                  placeholder="https://drive.google.com/..."
                />
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Tags</h3>
                
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Adicionar tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Adicionar
                  </Button>
                </div>

                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                      >
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Link href="/candidates">
                  <Button variant="outline">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Candidato'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
