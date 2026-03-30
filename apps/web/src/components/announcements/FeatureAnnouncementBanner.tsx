'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Announcement {
  id: string;
  title: string;
  message: string;
  ctaLabel: string;
  ctaHref: string;
  color: string; // classe Tailwind de cor de fundo
}

// Adicione novos anúncios aqui. Serão exibidos até o usuário fechar.
// A key do localStorage é `tf_announcement_dismissed_{id}`.
const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'publisher-channels-2026-03-30',
    title: '🚀 Novidade: Publicação de Vagas em Múltiplos Canais',
    message:
      'Agora você pode publicar suas vagas diretamente no Gupy e Vagas.com sem sair do TalentForge. Configure suas credenciais em Configurações → Canais de Publicação.',
    ctaLabel: 'Configurar canais',
    ctaHref: '/dashboard/settings/channels',
    color: 'bg-[#141042]',
  },
];

export function FeatureAnnouncementBanner() {
  const [visible, setVisible] = useState<Announcement | null>(null);

  useEffect(() => {
    const toShow = ANNOUNCEMENTS.find(
      (a) => !localStorage.getItem(`tf_announcement_dismissed_${a.id}`)
    );
    setVisible(toShow ?? null);
  }, []);

  function dismiss() {
    if (!visible) return;
    localStorage.setItem(`tf_announcement_dismissed_${visible.id}`, '1');
    setVisible(null);
  }

  if (!visible) return null;

  return (
    <div className={`${visible.color} text-white px-4 py-3 flex items-center gap-3`}>
      <Sparkles className="h-4 w-4 shrink-0 text-[#10B981]" />
      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
        <span className="text-sm font-semibold">{visible.title}</span>
        <span className="text-sm text-white/70 hidden sm:inline">— {visible.message}</span>
        <Link
          href={visible.ctaHref}
          onClick={dismiss}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#10B981] hover:text-green-300 transition-colors whitespace-nowrap"
        >
          {visible.ctaLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <button
        onClick={dismiss}
        className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        aria-label="Fechar aviso"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
