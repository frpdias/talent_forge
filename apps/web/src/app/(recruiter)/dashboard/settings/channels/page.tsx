'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  XCircle,
  Settings,
  Loader2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/DashboardHeader';
import { ChannelConfigModal } from '@/components/publisher/ChannelConfigModal';
import { ChannelGuideModal } from '@/components/publisher/ChannelGuideModal';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';
import { toast } from 'sonner';

import type { ChannelCode } from '@/lib/publisher/types';

interface Channel {
  id: string;
  channel_code: ChannelCode;
  display_name: string;
  is_active: boolean;
  config: Record<string, unknown>;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

// Canais disponíveis para configurar
const AVAILABLE_CHANNELS: Array<{
  code: ChannelCode;
  name: string;
  description: string;
  icon: string;
  status: 'available' | 'partner_required' | 'coming_soon';
}> = [
  {
    code: 'gupy',
    name: 'Gupy',
    description: 'Plataforma líder de recrutamento no Brasil. Requer conta Enterprise.',
    icon: '🟣',
    status: 'available',
  },
  {
    code: 'vagas',
    name: 'Vagas.com',
    description: 'Maior portal de vagas do Brasil. Requer conta Business.',
    icon: '🔵',
    status: 'available',
  },
  {
    code: 'facebook',
    name: 'Facebook',
    description: 'Publique vagas na sua Página do Facebook via Meta Graph API. Requer Meta App aprovado.',
    icon: '🔹',
    status: 'partner_required',
  },
  {
    code: 'instagram',
    name: 'Instagram',
    description: 'Publique vagas no Instagram Business. Requer conta Business vinculada ao Facebook.',
    icon: '📸',
    status: 'partner_required',
  },
  {
    code: 'linkedin',
    name: 'LinkedIn Jobs',
    description: 'Publicação de vagas no LinkedIn. Requer LinkedIn Talent Solutions Partner Program.',
    icon: '💼',
    status: 'partner_required',
  },
  {
    code: 'indeed',
    name: 'Indeed',
    description: 'Portal global de vagas. Em breve.',
    icon: '🔷',
    status: 'coming_soon',
  },
  {
    code: 'catho',
    name: 'Catho',
    description: 'Portal de empregos brasileiro. Em breve.',
    icon: '🟠',
    status: 'coming_soon',
  },
];

export default function ChannelsSettingsPage() {
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const activeOrg = currentOrg?.id ?? null;
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [modal, setModal] = useState<{ code: ChannelCode; name: string } | null>(null);
  const [guide, setGuide] = useState<ChannelCode | null>(null);

  const supabase = createClient();

  const loadChannels = useCallback(async () => {
    if (!activeOrg) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/v1/organizations/${activeOrg}/channels`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        setChannels(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [activeOrg]);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  async function handleToggle(channel: Channel) {
    if (!activeOrg) return;
    setToggling(channel.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/v1/organizations/${activeOrg}/channels`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ channel_id: channel.id, is_active: !channel.is_active }),
      });

      if (res.ok) {
        await loadChannels();
        toast.success(channel.is_active ? 'Canal desativado' : 'Canal ativado');
      }
    } finally {
      setToggling(null);
    }
  }

  const configuredCodes = new Set(channels.map((c) => c.channel_code));

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <DashboardHeader title="Configurações" />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#141042] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Configurações
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-[#141042]">Canais de Publicação</span>
        </div>

        {/* Título */}
        <div>
          <h1 className="text-xl font-bold text-[#141042]">Canais de Publicação</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure as integrações para publicar vagas automaticamente em plataformas externas.
          </p>
        </div>

        {/* Canais configurados */}
        {channels.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Canais Configurados</h2>
              <button
                onClick={() => void loadChannels()}
                disabled={loading}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {channels.map((channel) => {
              const meta = AVAILABLE_CHANNELS.find((c) => c.code === channel.channel_code);
              return (
                <div
                  key={channel.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
                >
                  <span className="text-2xl shrink-0">{meta?.icon || '🔧'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#141042]">{channel.display_name}</span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                          channel.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {channel.is_active ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {channel.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    {channel.last_sync_at && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Última sincronização: {new Date(channel.last_sync_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setGuide(channel.channel_code)}
                      className="p-1.5 text-gray-400 hover:text-[#3B82F6] hover:bg-blue-50 rounded-lg transition-colors"
                      title="Como obter as credenciais"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => void handleToggle(channel)}
                      disabled={toggling === channel.id}
                      className="text-gray-400 hover:text-[#141042] transition-colors"
                      title={channel.is_active ? 'Desativar' : 'Ativar'}
                    >
                      {toggling === channel.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : channel.is_active ? (
                        <ToggleRight className="h-5 w-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => setModal({ code: channel.channel_code, name: channel.display_name })}
                      className="p-1.5 text-gray-400 hover:text-[#141042] hover:bg-gray-100 rounded-lg transition-colors"
                      title="Editar credenciais"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Adicionar novo canal */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">
            {channels.length > 0 ? 'Adicionar Canal' : 'Canais Disponíveis'}
          </h2>

          {loading && channels.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            AVAILABLE_CHANNELS.filter((c) => !configuredCodes.has(c.code)).map((channel) => (
              <div
                key={channel.code}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
              >
                <span className="text-2xl shrink-0">{channel.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#141042]">{channel.name}</span>
                    {channel.status === 'partner_required' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Parceria necessária
                      </span>
                    )}
                    {channel.status === 'coming_soon' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        Em breve
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{channel.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setGuide(channel.code)}
                    className="p-1.5 text-gray-400 hover:text-[#3B82F6] hover:bg-blue-50 rounded-lg transition-colors"
                    title="Como obter as credenciais"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                  {channel.status === 'available' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setModal({ code: channel.code, name: channel.name })}
                      className="text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Configurar
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal de configuração */}
      {modal && activeOrg && (
        <ChannelConfigModal
          orgId={activeOrg}
          channelCode={modal.code}
          channelName={modal.name}
          isOpen={true}
          onClose={() => setModal(null)}
          onSaved={() => void loadChannels()}
        />
      )}

      {/* Modal de guia de credenciais */}
      {guide && (
        <ChannelGuideModal
          channelCode={guide}
          isOpen={true}
          onClose={() => setGuide(null)}
        />
      )}
    </div>
  );
}
