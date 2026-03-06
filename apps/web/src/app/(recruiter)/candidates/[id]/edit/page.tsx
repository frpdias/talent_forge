'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Card, CardContent, Button, Input } from '@/components/ui';
import { useOrgStore } from '@/lib/store';
import { candidatesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, Save, X } from 'lucide-react';

export default function EditCandidatePage() {
  const router = useRouter();
  const { id } = useParams();
  const { currentOrg } = useOrgStore();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    headline: '',
    source: '',
    linkedinUrl: '',
    tags: [] as string[],
  });

  useEffect(() => {
    if (currentOrg?.id && session?.access_token && id) {
      loadCandidate();
    }
  }, [currentOrg?.id, session?.access_token, id]);

  const loadCandidate = async () => {
    try {
      setPageLoading(true);
      const data = await candidatesApi.get(id as string, session!.access_token, currentOrg!.id);
      const candidate = (data as any)?.data ?? data;

      setForm({
        name: candidate.fullName || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        location: candidate.location || '',
        headline: candidate.currentTitle || '',
        source: candidate.source || '',
        linkedinUrl: candidate.linkedinUrl || '',
        tags: candidate.tags || [],
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar candidato');
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (!session?.access_token || !currentOrg?.id || !id) return;

    try {
      setLoading(true);
      setError('');

      const payload = {
        fullName: form.name,
        email: form.email,
        phone: form.phone,
        location: form.location,
        currentTitle: form.headline,
        linkedinUrl: form.linkedinUrl,
        source: form.source,
        tags: form.tags,
      };

      await candidatesApi.update(id as string, payload, session.access_token, currentOrg.id);
      router.push(`/candidates/${id}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar candidato');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Editar Candidato"
        subtitle="Atualize as informações do candidato"
        actions={
          <Link href={`/candidates/${id}`}>
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

                <Input
                  label="Origem do Candidato"
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                  placeholder="LinkedIn, Indicação, Site..."
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Links</h3>

                <Input
                  label="LinkedIn"
                  name="linkedinUrl"
                  value={form.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/joaosilva"
                />
              </div>

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

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Link href={`/candidates/${id}`}>
                  <Button variant="outline">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
