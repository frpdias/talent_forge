'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Clock, MapPin, Video, Phone, Building2, ChevronRight, Loader2 } from 'lucide-react';

interface Interview {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  type: 'video' | 'presencial' | 'phone';
  location: string | null;
  meet_link: string | null;
  notes: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  jobs: { title: string }[] | null;
}

function getVideoUrl(iv: Interview): string | null {
  if (iv.meet_link) return iv.meet_link;
  if (iv.type === 'video' && iv.location?.startsWith('http')) return iv.location;
  return null;
}

const TYPE_LABELS: Record<string, string> = {
  video: 'Vídeo',
  presencial: 'Presencial',
  phone: 'Telefone',
};

const TYPE_ICON = {
  video: Video,
  presencial: Building2,
  phone: Phone,
};

const STATUS_STYLES: Record<string, string> = {
  scheduled:  'bg-blue-50 text-blue-700 border border-blue-200',
  completed:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled:  'bg-red-50 text-red-700 border border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendada',
  completed: 'Realizada',
  cancelled: 'Cancelada',
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS   = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function isPast(iso: string) {
  return new Date(iso) < new Date();
}

export default function CandidateAgendaPage() {
  const supabase   = useMemo(() => createClient(), []);
  const [upcoming, setUpcoming] = useState<Interview[]>([]);
  const [past,     setPast]     = useState<Interview[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [tab,      setTab]      = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Resolve candidate_id via candidates.user_id
      const { data: candRows, error: e1 } = await supabase
        .from('candidates')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      if (e1) throw e1;
      const cand = candRows?.[0] ?? null;
      if (!cand) { setLoading(false); return; }  // candidato sem registro

      // Busca entrevistas
      const { data, error: e2 } = await supabase
        .from('interviews')
        .select('id, title, scheduled_at, duration_minutes, type, location, meet_link, notes, status, jobs(title)')
        .eq('candidate_id', cand.id)
        .neq('status', 'cancelled')
        .order('scheduled_at', { ascending: true });
      if (e2) throw e2;

      const all = (data || []) as unknown as Interview[];
      setUpcoming(all.filter(iv => !isPast(iv.scheduled_at) || iv.status === 'scheduled'));
      setPast(all.filter(iv => isPast(iv.scheduled_at) && iv.status !== 'scheduled'));
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar entrevistas');
    } finally {
      setLoading(false);
    }
  };

  const displayed = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#141042] flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#141042]">Minhas Entrevistas</h1>
          <p className="text-sm text-[#666666]">Entrevistas agendadas pelo recrutador</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-[#E5E5DC] overflow-hidden mb-6">
        {(['upcoming', 'past'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? 'bg-[#141042] text-white' : 'bg-white text-[#666666] hover:bg-[#FAFAF8]'
            }`}
          >
            {t === 'upcoming' ? `Próximas (${upcoming.length})` : `Realizadas (${past.length})`}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#141042]" />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-red-600 py-8">{error}</p>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-[#E5E5DC] mx-auto mb-3" />
          <p className="text-[#666666] font-medium">
            {tab === 'upcoming' ? 'Nenhuma entrevista agendada' : 'Nenhuma entrevista realizada'}
          </p>
          <p className="text-sm text-[#999999] mt-1">
            {tab === 'upcoming' ? 'Quando o recrutador agendar, aparecerá aqui.' : ''}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(iv => {
            const Icon = TYPE_ICON[iv.type] ?? Video;
            return (
              <div
                key={iv.id}
                className="bg-white border border-[#E5E5DC] rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-[#141042] text-sm leading-snug">{iv.title}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[iv.status]}`}>
                    {STATUS_LABELS[iv.status]}
                  </span>
                </div>

                {iv.jobs?.[0]?.title && (
                  <p className="text-xs text-[#10B981] font-medium mb-2 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    {iv.jobs[0].title}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-[#666666]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(iv.scheduled_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(iv.scheduled_at)} · {iv.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5" />
                    {TYPE_LABELS[iv.type]}
                  </span>
                  {iv.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {iv.location}
                    </span>
                  )}
                </div>

                {getVideoUrl(iv) && (
                  <a
                    href={getVideoUrl(iv)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-[#141042] text-white text-sm font-medium rounded-lg hover:bg-[#1e1870] transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    Entrar na reunião
                  </a>
                )}

                {iv.notes && (
                  <p className="mt-2 text-xs text-[#888888] bg-[#FAFAF8] rounded-lg p-2 border border-[#E5E5DC]">
                    📝 {iv.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
