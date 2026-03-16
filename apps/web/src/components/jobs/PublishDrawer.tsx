'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Globe,
  Send,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChannelSelector, useChannelSelection, type Channel } from '@/components/publisher/ChannelSelector';
import { PublicationStatusList } from '@/components/publisher/PublicationStatus';
import { PublicationTimeline, type PublicationLog } from '@/components/publisher/PublicationTimeline';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Publication {
  id: string;
  channel_id?: string;
  status: string;
  external_url?: string;
  error_message?: string;
  published_at?: string;
  job_publication_channels: {
    channel_code: string;
    display_name: string;
  };
}

interface PublishDrawerProps {
  jobId: string | null;
  orgId: string | null;
  jobTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PublishDrawer({ jobId, orgId, jobTitle, isOpen, onClose }: PublishDrawerProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [logs, setLogs] = useState<PublicationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{
    summary: { published: number; failed: number; total: number };
    results: any[];
  } | null>(null);

  const { selected, toggle, clearAll } = useChannelSelection();

  const supabase = createClient();

  const loadData = useCallback(async () => {
    if (!jobId || !orgId) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers = {
        Authorization: `Bearer ${session.access_token}`,
        'x-org-id': orgId,
      };

      const [channelsRes, pubsRes] = await Promise.all([
        fetch(`/api/v1/organizations/${orgId}/channels`, { headers }),
        fetch(`/api/v1/jobs/${jobId}/channels`, { headers }),
      ]);

      if (channelsRes.ok) setChannels(await channelsRes.json());
      if (pubsRes.ok) setPublications(await pubsRes.json());

      const { data: pubIds } = await supabase
        .from('job_publications')
        .select('id')
        .eq('job_id', jobId);

      if (pubIds && pubIds.length > 0) {
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
          .in('publication_id', pubIds.map((p: any) => p.id))
          .order('created_at', { ascending: false })
          .limit(30);

        setLogs((logsData as unknown as PublicationLog[]) || []);
      }
    } finally {
      setLoading(false);
    }
  }, [jobId, orgId]);

  useEffect(() => {
    if (isOpen && jobId && orgId) {
      setResult(null);
      clearAll();
      void loadData();
    }
  }, [isOpen, jobId, orgId]);

  async function handlePublish() {
    if (!selected.length || !jobId || !orgId) return;
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
          'x-org-id': orgId,
        },
        body: JSON.stringify({ channels: selected }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
        clearAll();
        await loadData();
      } else {
        toast.error(data.error || 'Erro ao publicar');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setPublishing(false);
    }
  }

  async function handleUnpublish(channelIds: string[]) {
    if (!jobId || !orgId) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`/api/v1/jobs/${jobId}/publish`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        'x-org-id': orgId,
      },
      body: JSON.stringify({ channels: channelIds }),
    });

    if (res.ok) await loadData();
    else alert('Erro ao despublicar');
  }

  const publishedChannelIds = publications
    .filter((p) => p.status === 'published')
    .map((p) => p.channel_id)
    .filter(Boolean) as string[];

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[60] bg-[#141042]/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-[61] w-full max-w-[600px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-[#141042] rounded-lg shrink-0">
              <Globe className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-[#141042]">Publicar Vaga</h2>
              {jobTitle && (
                <p className="text-xs text-gray-400 truncate">{jobTitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Atualizar"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Resultado do publish */}
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
                  className={`h-4 w-4 ${
                    result.summary.failed === 0 ? 'text-green-600' : 'text-amber-600'
                  }`}
                />
                <p className="text-sm font-semibold text-gray-800">
                  {result.summary.published} de {result.summary.total} canal(is) publicado(s)
                </p>
              </div>
              <ul className="space-y-1">
                {result.results.map((r: any) => (
                  <li key={r.channelId} className="text-xs text-gray-600 flex items-center gap-1.5">
                    <span>{r.status === 'published' ? '✅' : '❌'}</span>
                    {r.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Seletor de canais */}
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Send className="h-4 w-4 text-[#141042]" />
              <h3 className="text-sm font-semibold text-[#141042]">Canais de Publicação</h3>
            </div>

            {loading && channels.length === 0 ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : channels.length === 0 ? (
              <div className="text-center py-6">
                <Globe className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhum canal configurado.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Configure nas configurações da organização.
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
                  <span className="text-xs text-gray-500">
                    {selected.length} canal(is) selecionado(s)
                  </span>
                  <Button
                    onClick={() => void handlePublish()}
                    disabled={!selected.length || publishing}
                    size="sm"
                    className="bg-[#141042] hover:bg-[#1a1554]"
                  >
                    {publishing ? (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {publishing ? 'Publicando…' : 'Publicar agora'}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Status por canal */}
          <div className="border border-gray-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#141042] mb-3">Status por Canal</h3>
            <PublicationStatusList publications={publications as any} loading={loading} />

            {publishedChannelIds.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => void handleUnpublish(publishedChannelIds)}
                >
                  Despublicar todos os canais
                </Button>
              </div>
            )}
          </div>

          {/* Histórico */}
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="h-3.5 w-3.5 text-gray-400" />
              <h3 className="text-sm font-semibold text-[#141042]">Histórico</h3>
            </div>
            <PublicationTimeline logs={logs} loading={loading} />
          </div>
        </div>
      </div>
    </>
  );
}
