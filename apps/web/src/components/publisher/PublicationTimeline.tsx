'use client';

import { CheckCircle2, XCircle, Clock, RefreshCw, Globe, ArrowUpCircle, Archive, Webhook } from 'lucide-react';

export interface PublicationLog {
  id: string;
  action: 'create' | 'publish' | 'update' | 'unpublish' | 'expire' | 'retry' | 'webhook';
  status: 'success' | 'error' | 'info';
  error_detail?: string;
  duration_ms?: number;
  created_at: string;
  job_publications?: {
    job_publication_channels?: {
      channel_code: string;
      display_name: string;
    };
  };
}

const ACTION_CONFIG: Record<
  PublicationLog['action'],
  { label: string; icon: React.ElementType; color: string }
> = {
  create: { label: 'Criada', icon: Globe, color: 'text-blue-600' },
  publish: { label: 'Publicada', icon: ArrowUpCircle, color: 'text-green-600' },
  update: { label: 'Atualizada', icon: RefreshCw, color: 'text-purple-600' },
  unpublish: { label: 'Despublicada', icon: Archive, color: 'text-gray-500' },
  expire: { label: 'Expirada', icon: Clock, color: 'text-amber-500' },
  retry: { label: 'Tentativa', icon: RefreshCw, color: 'text-orange-500' },
  webhook: { label: 'Webhook', icon: Webhook, color: 'text-indigo-500' },
};

const STATUS_ICON: Record<PublicationLog['status'], React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  info: Clock,
};

const STATUS_COLOR: Record<PublicationLog['status'], string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-400',
};

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

interface PublicationTimelineProps {
  logs: PublicationLog[];
  loading?: boolean;
  className?: string;
}

export function PublicationTimeline({ logs, loading, className = '' }: PublicationTimelineProps) {
  if (loading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!logs.length) {
    return (
      <p className={`text-sm text-gray-400 ${className}`}>
        Nenhuma atividade registrada.
      </p>
    );
  }

  return (
    <ol className={`relative space-y-0 ${className}`}>
      {logs.map((log, index) => {
        const actionCfg = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.create;
        const StatusIcon = STATUS_ICON[log.status];
        const statusColor = STATUS_COLOR[log.status];
        const ActionIcon = actionCfg.icon;
        const isLast = index === logs.length - 1;
        const channelName =
          log.job_publications?.job_publication_channels?.display_name ?? '';

        return (
          <li key={log.id} className="flex gap-3 pb-4 relative">
            {/* Linha vertical */}
            {!isLast && (
              <span className="absolute left-3 top-6 bottom-0 w-px bg-gray-200" />
            )}

            {/* Ícone */}
            <div className="shrink-0 z-10">
              <div className="w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                <StatusIcon className={`h-3.5 w-3.5 ${statusColor}`} />
              </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <ActionIcon className={`h-3.5 w-3.5 ${actionCfg.color} shrink-0`} />
                <span className="text-sm font-medium text-gray-800">
                  {actionCfg.label}
                </span>
                {channelName && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {channelName}
                  </span>
                )}
                {log.duration_ms !== undefined && log.duration_ms !== null && (
                  <span className="text-xs text-gray-400">{log.duration_ms}ms</span>
                )}
              </div>
              {log.error_detail && (
                <p className="text-xs text-red-600 mt-0.5">{log.error_detail}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(log.created_at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
