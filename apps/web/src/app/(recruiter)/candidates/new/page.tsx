'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, CardContent, Button, Input } from '@/components/ui';
import { useOrgStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, X, Upload, FileText } from 'lucide-react';
import Link from 'next/link';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function NewCandidatePage() {
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [resolvedOrgId, setResolvedOrgId] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    let ignore = false;

    async function resolveOrg() {
      if (currentOrg?.id) {
        setResolvedOrgId(currentOrg.id);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      const { data: orgMembership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (!ignore) {
        setResolvedOrgId(orgMembership?.org_id || null);
      }
    }

    resolveOrg();
    return () => {
      ignore = true;
    };
  }, [currentOrg?.id, supabase]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError('Arquivo muito grande. O limite é 10MB.');
      return;
    }
    setError('');
    setResumeFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const orgId = currentOrg?.id || resolvedOrgId;
    if (!orgId) {
      setError('Organização não encontrada. Recarregue a página e tente novamente.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      // 1. Criar o candidato
      const { data: inserted, error: insertError } = await supabase
        .from('candidates')
        .insert([{
          owner_org_id: orgId,
          full_name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          location: form.location || null,
          current_title: form.headline || null,
          linkedin_url: form.linkedinUrl || null,
          source: form.source || null,
          tags: form.tags.length > 0 ? form.tags : null,
          created_by: userId || null,
        }])
        .select('id')
        .single();

      if (insertError) throw insertError;

      const candidateId = inserted.id;

      // 2. Auto-atribuição: Teste Junior para todo candidato criado manualmente
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await fetch(`/api/recruiter/candidates/${candidateId}/it-test`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
              'x-org-id': orgId,
            },
            body: JSON.stringify({ nivel: 'junior' }),
          });
        }
      } catch (itErr) {
        console.warn('Auto-atribuição IT Test falhou:', itErr);
        // Não bloqueia o cadastro
      }

      // 3. Upload do currículo (se houver)
      if (resumeFile && candidateId) {
        const ext = resumeFile.name.split('.').pop();
        const path = `candidates/${candidateId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(path, resumeFile, { upsert: true });

        if (uploadError) {
          console.warn('Upload do currículo falhou:', uploadError.message);
          // Não bloqueia o cadastro — candidato criado mesmo sem currículo
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('resumes')
            .getPublicUrl(path);

          await supabase
            .from('candidates')
            .update({ resume_url: publicUrl, resume_filename: resumeFile.name })
            .eq('id', candidateId);
        }
      }

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

                <Input
                  label="Origem do Candidato"
                  name="source"
                  value={form.source}
                  onChange={handleChange}
                  placeholder="LinkedIn, Indicação, Site..."
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
              </div>

              {/* Currículo */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Currículo</h3>

                {resumeFile ? (
                  <div className="flex items-center gap-3 p-3 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg">
                    <FileText className="h-5 w-5 text-[#141042] shrink-0" />
                    <span className="text-sm text-[#141042] truncate flex-1">{resumeFile.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setResumeFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-[#666666] hover:text-[#141042] transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-[#E5E5DC] rounded-lg text-sm text-[#666666] hover:border-[#141042] hover:text-[#141042] transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Clique para anexar currículo (PDF, DOC — máx. 10MB)
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleFileChange}
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
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
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
