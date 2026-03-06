'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Settings, AlertTriangle } from 'lucide-react';

export interface Channel {
  id: string;
  channel_code: string;
  display_name: string;
  is_active: boolean;
  config?: Record<string, any>;
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

const CHANNEL_DESCRIPTIONS: Record<string, string> = {
  gupy: 'Publicação via API REST com autenticação OAuth',
  vagas: 'Vagas.com for Business via API Key',
  linkedin: 'LinkedIn Job Posting API (parceiro)',
  indeed: 'Indeed via XML Feed ou GraphQL',
  catho: 'Catho Empresas API',
  infojobs: 'InfoJobs API',
  custom: 'Integração personalizada',
};

interface ChannelSelectorProps {
  channels: Channel[];
  selected: string[];
  onToggle: (channelId: string) => void;
  disabled?: boolean;
}

export function ChannelSelector({ channels, selected, onToggle, disabled }: ChannelSelectorProps) {
  if (!channels.length) {
    return (
      <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center">
        <Settings className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-600">Nenhum canal configurado</p>
        <p className="text-xs text-gray-400 mt-1">
          Configure os canais de publicação nas configurações da organização.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {channels.map((ch) => {
        const isSelected = selected.includes(ch.id);
        const icon = CHANNEL_ICONS[ch.channel_code] ?? '🌐';
        const desc = CHANNEL_DESCRIPTIONS[ch.channel_code] ?? '';
        const inactive = !ch.is_active;

        return (
          <button
            key={ch.id}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onToggle(ch.id)}
            className={`
              w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all
              ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
              ${isSelected
                ? 'border-[#141042] bg-[#141042]/5'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
            aria-pressed={isSelected}
          >
            {/* Checkbox visual */}
            <span className="shrink-0">
              {isSelected ? (
                <CheckCircle2 className="h-5 w-5 text-[#141042]" />
              ) : (
                <Circle className="h-5 w-5 text-gray-300" />
              )}
            </span>

            {/* Ícone + nome */}
            <span className="text-xl shrink-0">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${isSelected ? 'text-[#141042]' : 'text-gray-800'}`}>
                {ch.display_name}
              </p>
              {desc && <p className="text-xs text-gray-500 truncate">{desc}</p>}
            </div>

            {/* Status do canal */}
            {inactive && (
              <span className="shrink-0 flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                Inativo
              </span>
            )}
            {!inactive && (
              <span className="shrink-0 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                Ativo
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Hook de apoio para gerenciar seleção múltipla */
export function useChannelSelection(initial: string[] = []) {
  const [selected, setSelected] = useState<string[]>(initial);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = (ids: string[]) => setSelected(ids);
  const clearAll = () => setSelected([]);

  return { selected, toggle, selectAll, clearAll };
}
