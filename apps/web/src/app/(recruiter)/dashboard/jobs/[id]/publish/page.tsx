'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Globe, Send, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardHeader } from '@/components/DashboardHeader';
import { ChannelSelector, useChannelSelection, type Channel } from '@/components/publisher/ChannelSelector';
import { PublicationStatusList } from '@/components/publisher/PublicationStatus';
import { PublicationTimeline, type PublicationLog } from '@/components/publisher/PublicationTimeline';
import { createBrowserClient } from '@supabase/ssr';

interface Job {
  id: string;
  title: string;
  department: string;
  status: string;
  org_id: string;
}

interface Publication {
  id: string;
  status: string;
  external_url?: string;
  error_message?: string;
  published_at?: string;
  job_publication_channels: {
    channel_code: string;
    display_name: string;
  };
}

export default function PublishJobPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [job, setJob] = useState<Job | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [logs, setLogs] = useState<PublicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{
    summary: { published: number; failed: number; total: number };
    results: any[];
  } | null>(null);

  const { selected, toggle, clearAll } = useChannelSelection();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Carregar vaga
      const { data: jobData } = await supabase
        .from('jobs')
        .select('id, title, department, status, org_id')
        .eq('id', jobId)
        .single();

      if (!jobData) {
        router.push('/dashboard/jobs');
        return;
      }
      setJob(jobData);

      // Carregar canais e publicações em paralelo
      const [channelsRes, pubsRes] = await Promise.all([
        fetch(`/api/v1/organizations/${jobData.org_id}/channels`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'x-org-id': jobData.org_id,
          },
        }),
        fetch(`/api/v1/jobs/${jobId}/channels`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'x-org-id': jobData.org_id,
          },
        }),
      ]);

      if (channelsRes.ok) setChannels(await channelsRes.json());
      if (pubsRes.ok) setPublications(await pubsRes.json());

      // Carregar logs
      const { data: logsData } = await supabase
        .from('job_publication_logs')
        .select(`
          id, action, status, error_detail, duration_ms, created_at,
          job_publications (
            job_publication_channels (
              channel_code,
              display_name
            )
          )
        `)
        .in(
          'publication_id',
          (await supabase
            .from('job_publications')
            .select('id')
            .eq('job_id', jobId)).data?.map((p: any) => p.id) ?? []
        )
        .order('created_at', { ascending: false })
        .limit(50);

      setLogs((logsData as unknown as PublicationLog[]) || []);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePublish = async () => {
    if (!selected.length || !job) return;
    setPublishing(true);
    setResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/v1/jobs/${jobId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'x-org-id': job.org_id,
        },
        body: JSON.stringify({ channels: selected }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
        clearAll();
        await loadData();
      } else {
        alert(data.error || 'Erro ao publicar');
      }
    } catch {
      alert('Erro de conexão');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async (channelIds: string[]) => {
    if (!job) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/v1/jobs/${jobId}/publish`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        'x-org-id': job.org_id,
      },
      body: JSON.stringify({ channels: channelIds }),
    });

    if (res.ok) await loadData();
    else alert('Erro ao despublicar');
  };

  const publishedChannelIds = publications
    .filter((p) => p.status === 'published')
    .map((p) => (p as any).channel_id)
    .filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <DashboardHeader title="Publicar Vaga" />
        <div className="p-6 max-w-4xl mx-auto">
          <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <DashboardHeader
        title="Publicar Vaga"
        subtitle={job?.title}
        actions={
          <div className="flex gap-2">
            <Link href={`/dashboard/jobs/${jobId}`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar à Vaga
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
        {/* Resultado */}
        {result && (
          <div
            className={`rounded-xl border p-4 ${
              result.summary.failed === 0
                ? 'bg-green-50 border-green-200'
                : result.summary.published === 0
                ? 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2
                className={`h-5 w-5 ${
                  result.summary.failed === 0 ? 'text-green-600' : 'text-amber-600'
                }`}
              />
              <p className="font-semibold text-gray-800">
                {result.summary.published} de {result.summary.total} canal(is) publicado(s)
              </p>
            </div>
            <ul className="space-y-1">
              {result.results.map((r: any) => (
                <li key={r.channelId} className="text-sm text-gray-700 flex items-center gap-2">
                  <span>{r.status === 'published' ? '✅' : '❌'}</span>
                  {r.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selecionar canais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-black flex items-center gap-2">
                  <Send className="h-5 w-5 text-[#141042]" />
                  Selecionar Canais de Publicação
                </CardTitle>
              </CardHeader>
              <CardContent>
                {channels.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <Globe className="h-10 w-10 text-gray-300 mx-auto" />
                    <p className="text-gray-500 text-sm">
                      Nenhum canal configurado para esta organização.
                    </p>
                    <p className="text-xs text-gray-400">
                      Configure os canais de publicação nas configurações da organização.
                    </p>
                  </div>
                ) : (
                  <>
                    <ChannelSelector
                      channels={channels}
                      selected={selected}
                      onToggle={toggle}
                      disabled={publishing}
                    />
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {selected.length} canal(is) selecionado(s)
                      </span>
                      <Button
                        onClick={handlePublish}
                        disabled={!selected.length || publishing}
                        className="bg-[#141042] hover:bg-[#0e0c31]"
                      >
                        {publishing ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        {publishing ? 'Publicando...' : 'Publicar agora'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Timeline de logs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-black flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-gray-500" />
                  Histórico de Publicações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PublicationTimeline logs={logs} loading={loading} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar — Status atual */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-black text-sm">Status por Canal</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadData}
                    disabled={loading}
                    className="h-7 w-7 p-0"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <PublicationStatusList publications={publications as any} loading={loading} />
              </CardContent>
            </Card>

            {/* Ação de despublicar */}
            {publishedChannelIds.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleUnpublish(publishedChannelIds)}
                  >
                    Despublicar todos os canais
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Info da vaga */}
            {job && (
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Vaga</p>
                  <p className="text-sm font-semibold text-gray-900">{job.title}</p>
                  {job.department && (
                    <p className="text-xs text-gray-500">{job.department}</p>
                  )}
                  <Badge
                    variant={job.status === 'open' ? 'default' : 'secondary'}
                    className={job.status === 'open' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}
                  >
                    {job.status === 'open' ? 'Aberta' : job.status === 'on_hold' ? 'Em espera' : 'Encerrada'}
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
