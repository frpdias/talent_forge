'use client';

import { Briefcase, Wifi, WifiOff, Clock, AlertCircle, ExternalLink } from 'lucide-react';

export type PublicationStatus =
  | 'pending'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'expired'
  | 'unpublished';

interface Publication {
  id: string;
  status: PublicationStatus;
  external_url?: string;
  error_message?: string;
  published_at?: string;
  job_publication_channels: {
    channel_code: string;
    display_name: string;
  };
}

interface PublicationStatusBadgeProps {
  publication: Publication;
  compact?: boolean;
}

const CHANNEL_ICONS: Record<string, string> = {
  gupy: '🟣',
  vagas: '🔵',
  linkedin: '💼',
  indeed: '🔷',
  catho: '🟠',
  infojobs: '🔶',
  custom: '🌐',
};

const STATUS_CONFIG: Record<
  PublicationStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  published: {
    label: 'Publicada',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  publishing: {
    label: 'Publicando...',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500 animate-pulse',
  },
  pending: {
    label: 'Pendente',
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  },
  failed: {
    label: 'Erro',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  expired: {
    label: 'Expirada',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  unpublished: {
    label: 'Despublicada',
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    dot: 'bg-gray-300',
  },
};

export function PublicationStatusBadge({ publication, compact = false }: PublicationStatusBadgeProps) {
  const cfg = STATUS_CONFIG[publication.status] ?? STATUS_CONFIG.pending;
  const icon = CHANNEL_ICONS[publication.job_publication_channels.channel_code] ?? '🌐';

  if (compact) {
    return (
      <span
        title={`${publication.job_publication_channels.display_name}: ${cfg.label}`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {icon} {publication.job_publication_channels.display_name}
      </span>
    );
  }

  return (
    <div className={`flex items-start justify-between p-3 rounded-lg ${cfg.bg} border border-black/5`}>
      <div className="flex items-center gap-2.5">
        <span className="text-lg">{icon}</span>
        <div>
          <p className={`text-sm font-semibold ${cfg.text}`}>
            {publication.job_publication_channels.display_name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            <span className={`text-xs ${cfg.text}`}>{cfg.label}</span>
            {publication.published_at && (
              <span className="text-xs text-gray-400">
                · {new Date(publication.published_at).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
          {publication.status === 'failed' && publication.error_message && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {publication.error_message}
            </p>
          )}
        </div>
      </div>
      {publication.status === 'published' && publication.external_url && (
        <a
          href={publication.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 shrink-0 mt-0.5"
        >
          Ver <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

interface PublicationStatusListProps {
  publications: Publication[];
  loading?: boolean;
}

export function PublicationStatusList({ publications, loading }: PublicationStatusListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!publications.length) {
    return (
      <div className="text-center py-6">
        <WifiOff className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Não publicada em nenhum canal ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {publications.map((pub) => (
        <PublicationStatusBadge key={pub.id} publication={pub} />
      ))}
    </div>
  );
}

/** Inline badges para lista de vagas */
export function PublicationBadges({ publications }: { publications: Publication[] }) {
  const active = publications.filter((p) => p.status === 'published');
  if (!active.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {active.map((pub) => (
        <PublicationStatusBadge key={pub.id} publication={pub} compact />
      ))}
    </div>
  );
}
