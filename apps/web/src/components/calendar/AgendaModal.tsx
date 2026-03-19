'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Video,
  Phone,
  Building2,
  AlertCircle,
} from 'lucide-react';

interface Interview {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  type: 'video' | 'presencial' | 'phone';
  location: string | null;
  meet_link: string | null;
  google_event_id: string | null;
  notes: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  candidate_id: string | null;
  job_id: string | null;
  event_type?: 'interview' | 'meeting';
  candidateName?: string;
  jobTitle?: string;
}

interface CandidateOption {
  id: string;
  full_name: string;
  email: string | null;
}

interface ApplicationOption {
  id: string;      // application id
  job_id: string;
  job_title: string;
  status: string;
}

interface AgendaModalProps {
  onClose: () => void;
}

const DAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const DAYS_FULL  = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MONTHS_PT  = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 … 19

const TYPE_ICONS  = { video: Video, presencial: Building2, phone: Phone };
const TYPE_COLORS = {
  video:      'bg-blue-50 border-blue-200 text-blue-700',
  presencial: 'bg-violet-50 border-violet-200 text-violet-700',
  phone:      'bg-emerald-50 border-emerald-200 text-emerald-700',
};

// ── helpers ──────────────────────────────────────────────────────────────────

function getMonthGrid(year: number, month: number): Date[] {
  const first  = new Date(year, month, 1);
  const dow    = first.getDay();            // 0 = Sun
  const offset = dow === 0 ? 6 : dow - 1;  // shift to Mon-based
  const start  = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function padHour(h: number) {
  return `${String(h).padStart(2, '0')}:00`;
}

function startsAtHour(iv: Interview, hour: number) {
  return new Date(iv.scheduled_at).getHours() === hour;
}

function occupiesHour(iv: Interview, hour: number) {
  const s = new Date(iv.scheduled_at);
  const e = new Date(s.getTime() + iv.duration_minutes * 60_000);
  return s.getHours() < hour && e.getHours() > hour;
}

function isBusinessHour(): boolean {
  const h = new Date().getHours();
  return h >= 8 && h < 20;
}

// ── component ────────────────────────────────────────────────────────────────

export function AgendaModal({ onClose }: AgendaModalProps) {
  const { currentOrg } = useOrgStore();
  const supabase = useMemo(() => createClient(), []);

  const today = useMemo(() => new Date(), []);
  const [inBusinessHours, setInBusinessHours] = useState(isBusinessHour);
  const [viewDate,    setViewDate]    = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());
  const [interviews,  setInterviews]  = useState<Interview[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [gcConnected, setGcConnected] = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [formError,   setFormError]   = useState('');

  const [form, setForm] = useState({
    event_type:       'interview' as 'interview' | 'meeting',
    title:            '',
    date:             toDateStr(new Date()),
    time:             '',
    duration_minutes: 60,
    type:             'video' as 'video' | 'presencial' | 'phone',
    location:         '',
    notes:            '',
    candidate_id:     '' as string,
    job_id:           '' as string,
    application_id:   '' as string,
  });

  const [candidates,           setCandidates]           = useState<CandidateOption[]>([]);
  const [candidateSearch,      setCandidateSearch]      = useState('');
  const [candidateApplications, setCandidateApplications] = useState<ApplicationOption[]>([]);
  const [loadingCandidates,    setLoadingCandidates]    = useState(false);
  const [candidateFocused,     setCandidateFocused]     = useState(false);

  const grid       = useMemo(() => getMonthGrid(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);
  const monthLabel = `${MONTHS_PT[viewDate.getMonth()]} ${viewDate.getFullYear()}`;

  const selectedDayIvs = useMemo(
    () => interviews.filter(iv => isSameDay(new Date(iv.scheduled_at), selectedDay)),
    [interviews, selectedDay],
  );

  const filteredCandidates = useMemo(() => {
    if (!candidateSearch.trim()) return candidates;
    const q = candidateSearch.toLowerCase();
    return candidates.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q),
    );
  }, [candidates, candidateSearch]);

  // Re-check business hours every minute
  useEffect(() => {
    const t = setInterval(() => setInBusinessHours(isBusinessHour()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { checkGcStatus(); }, []);

  useEffect(() => {
    if (currentOrg?.id) loadInterviews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg?.id, viewDate]);

  useEffect(() => {
    setForm(f => ({ ...f, date: toDateStr(selectedDay) }));
  }, [selectedDay]);

  // Load candidates when form opens
  useEffect(() => {
    if (showForm && currentOrg?.id) loadCandidates();
    if (!showForm) setCandidateFocused(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm, currentOrg?.id]);

  // Load applications when candidate changes
  useEffect(() => {
    if (form.candidate_id) {
      void loadCandidateApplications(form.candidate_id);
    } else {
      setCandidateApplications([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.candidate_id]);

  // ── data ─────────────────────────────────────────────────────────────────

  const loadCandidates = async () => {
    if (!currentOrg?.id) return;
    setLoadingCandidates(true);
    try {
      // 1. Jobs da org
      const { data: jobs, error: e1 } = await supabase
        .from('jobs')
        .select('id')
        .eq('org_id', currentOrg.id);
      if (e1) throw e1;
      const jobIds = (jobs || []).map((j: any) => j.id);
      if (jobIds.length === 0) { setCandidates([]); return; }

      // 2. Candidatos que aplicaram nessas vagas
      const { data: apps, error: e2 } = await supabase
        .from('applications')
        .select('candidate_id')
        .in('job_id', jobIds);
      if (e2) throw e2;
      const candidateIds = [...new Set((apps || []).map((a: any) => a.candidate_id).filter(Boolean))];
      if (candidateIds.length === 0) { setCandidates([]); return; }

      // 3. Dados dos candidatos
      const { data, error: e3 } = await supabase
        .from('candidates')
        .select('id, full_name, email')
        .in('id', candidateIds)
        .order('full_name', { ascending: true });
      if (e3) throw e3;
      setCandidates(data || []);
    } catch (err) {
      console.error('loadCandidates', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const loadCandidateApplications = async (candidateId: string) => {
    if (!currentOrg?.id || !candidateId) return;
    try {
      // 1. Vagas da org (com título)
      const { data: jobs, error: e1 } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('org_id', currentOrg.id);
      if (e1) throw e1;
      const jobIds  = (jobs || []).map((j: any) => j.id);
      const jobMap  = new Map((jobs || []).map((j: any) => [j.id, j.title]));
      if (jobIds.length === 0) { setCandidateApplications([]); return; }

      // 2. Aplicações do candidato para essas vagas
      const { data, error: e2 } = await supabase
        .from('applications')
        .select('id, job_id, status')
        .eq('candidate_id', candidateId)
        .in('job_id', jobIds);
      if (e2) throw e2;
      setCandidateApplications(
        (data || []).map((a: any) => ({
          id:        a.id,
          job_id:    a.job_id,
          job_title: jobMap.get(a.job_id) ?? 'Vaga',
          status:    a.status,
        })),
      );
    } catch (err) {
      console.error('loadCandidateApplications', err);
    }
  };

  const checkGcStatus = async () => {
    try {
      const res = await fetch('/api/google-calendar/status');
      if (res.ok) { const d = await res.json(); setGcConnected(Boolean(d.connected)); }
    } catch { /* silent */ }
  };

  const loadInterviews = async () => {
    if (!currentOrg?.id) return;
    setLoading(true);
    try {
      const start = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 20);
      const end   = new Date(viewDate.getFullYear(), viewDate.getMonth() + 2, 10);
      const { data, error } = await supabase
        .from('interviews')
        .select('*, candidates(full_name), jobs(title)')
        .eq('org_id', currentOrg.id)
        .gte('scheduled_at', start.toISOString())
        .lte('scheduled_at', end.toISOString())
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      setInterviews(
        (data || []).map((r: any) => ({
          ...r,
          candidateName: r.candidates?.full_name ?? null,
          jobTitle:      r.jobs?.title ?? null,
        })),
      );
    } catch (e) {
      console.error('loadInterviews', e);
    } finally {
      setLoading(false);
    }
  };

  // ── actions ───────────────────────────────────────────────────────────────

  const openFormAt = (hour?: number) => {
    setForm(f => ({
      ...f,
      event_type:     'interview',
      date:           toDateStr(selectedDay),
      time:           hour !== undefined ? padHour(hour) : '',
      title:          '',
      candidate_id:   '',
      job_id:         '',
      application_id: '',
      location:       '',
      notes:          '',
    }));
    setCandidateSearch('');
    setCandidates([]);
    setCandidateApplications([]);
    setCandidateFocused(false);
    setFormError('');
    setShowForm(true);
  };

  const handleSelectDay = (day: Date) => {
    setSelectedDay(new Date(day));
    if (!isSameMonth(day, viewDate))
      setViewDate(new Date(day.getFullYear(), day.getMonth(), 1));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?.id) return;
    setFormError('');
    setSaving(true);
    try {
      const { data: ud } = await supabase.auth.getUser();
      const scheduledAt  = new Date(`${form.date}T${form.time}`).toISOString();
      const isVideo = form.type === 'video';

      let meetLink: string | null = null;
      let googleEventId: string | null = null;

      // Se Google Calendar conectado, criar evento via API (com Meet automático para vídeo)
      if (gcConnected) {
        try {
          const calRes = await fetch('/api/google-calendar/create-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: form.title,
              startTime: scheduledAt,
              durationMinutes: form.duration_minutes,
              description: form.notes || undefined,
              location: !isVideo ? (form.location || undefined) : undefined,
              includesMeet: isVideo,
            }),
          });
          if (calRes.ok) {
            const calData = await calRes.json();
            meetLink = calData.meetLink || null;
            googleEventId = calData.eventId || null;
          } else {
            const calErr = await calRes.json().catch(() => ({}));
            console.warn('[AgendaModal] Falha ao criar evento no Calendar:', calErr.error);
            // Continua salvando a entrevista mesmo sem Calendar
          }
        } catch (calError) {
          console.warn('[AgendaModal] Erro ao chamar API do Calendar:', calError);
        }
      }

      // Salvar entrevista no banco
      const { error } = await supabase.from('interviews').insert([{
        org_id:           currentOrg.id,
        title:            form.title,
        scheduled_at:     scheduledAt,
        duration_minutes: form.duration_minutes,
        type:             form.type,
        location:         isVideo ? null : (form.location || null),
        meet_link:        meetLink || (isVideo ? (form.location || null) : null),
        google_event_id:  googleEventId,
        notes:            form.notes          || null,
        created_by:       ud?.user?.id        || null,
        candidate_id:     form.candidate_id   || null,
        job_id:           form.job_id         || null,
        application_id:   form.application_id || null,
      }]);
      if (error) throw error;

      setShowForm(false);
      setForm(f => ({ ...f, title: '', time: '', location: '', notes: '', duration_minutes: 60, type: 'video', candidate_id: '', job_id: '', application_id: '', event_type: 'interview' }));
      setCandidateSearch('');
      setCandidateFocused(false);
      setCandidateApplications([]);
      await loadInterviews();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday   = () => { setViewDate(new Date()); setSelectedDay(new Date()); };

  // ── render ────────────────────────────────────────────────────────────────

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-[#E5E5DC] flex flex-col overflow-hidden">

        {/* ── header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5DC] shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-base font-semibold text-[#141042]">Agenda</span>

            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[#FAFAF8] text-[#666666] border border-transparent hover:border-[#E5E5DC] transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-[#141042] w-40 text-center select-none">{monthLabel}</span>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[#FAFAF8] text-[#666666] border border-transparent hover:border-[#E5E5DC] transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button onClick={goToday} className="text-xs px-2.5 py-1 rounded-lg border border-[#E5E5DC] text-[#666666] hover:text-[#141042] hover:bg-[#FAFAF8] transition-colors">
              Hoje
            </button>
          </div>

          <div className="flex items-center gap-3">
            {!gcConnected ? (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <a href="/dashboard/settings" target="_blank" className="underline">Conectar Google Calendar</a>
              </div>
            ) : (
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">✓ Google Calendar</span>
            )}
            <button onClick={onClose} className="p-2 rounded-lg text-[#666666] hover:text-[#141042] hover:bg-[#FAFAF8] transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── scrollable body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Month calendar ── */}
          <div style={{ padding: '16px', borderBottom: '1px solid #E5E5DC' }}>

            {/* weekday headers — 7 colunas forçadas via flex */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
              {DAYS_SHORT.map(d => (
                <div
                  key={d}
                  style={{ flex: '1 1 0', minWidth: 0, textAlign: 'center' }}
                  className="text-[10px] font-bold text-[#BBBBBB] uppercase tracking-widest py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* day grid — 6 linhas × 7 colunas via flex rows */}
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '144px' }}>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#141042]" />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {Array.from({ length: 6 }, (_, rowIdx) => (
                  <div key={rowIdx} style={{ display: 'flex', gap: '4px' }}>
                    {grid.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
                      const inMonth    = isSameMonth(day, viewDate);
                      const isToday    = isSameDay(day, today);
                      const isSelected = isSameDay(day, selectedDay);
                      const dotCount   = interviews.filter(iv => isSameDay(new Date(iv.scheduled_at), day)).length;

                      let bgColor     = '#ffffff';
                      let borderColor = '#E5E5DC';
                      let textColor   = '#333333';
                      let boxShadow   = 'none';

                      if (!inMonth) {
                        bgColor = 'transparent'; borderColor = 'transparent'; textColor = '#cccccc';
                      } else if (isSelected && isToday) {
                        bgColor = inBusinessHours ? '#22c55e' : '#141042';
                        borderColor = 'transparent'; textColor = '#ffffff';
                        boxShadow = inBusinessHours ? '0 0 8px 2px rgba(34,197,94,0.35)' : 'none';
                      } else if (isSelected) {
                        bgColor = '#141042'; borderColor = '#141042'; textColor = '#ffffff';
                        boxShadow = '0 2px 8px rgba(20,16,66,0.25)';
                      } else if (isToday) {
                        bgColor = inBusinessHours ? '#22c55e' : '#141042';
                        borderColor = 'transparent'; textColor = '#ffffff';
                        boxShadow = inBusinessHours ? '0 0 8px 2px rgba(34,197,94,0.35)' : 'none';
                      }

                      return (
                        <button
                          key={colIdx}
                          onClick={() => inMonth ? handleSelectDay(day) : undefined}
                          disabled={!inMonth}
                          style={{
                            flex: '1 1 0',
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            padding: '8px 4px',
                            borderRadius: '10px',
                            border: `1px solid ${borderColor}`,
                            backgroundColor: bgColor,
                            color: textColor,
                            boxShadow,
                            cursor: inMonth ? 'pointer' : 'default',
                            transition: 'all 0.15s ease',
                            outline: 'none',
                          }}
                          onMouseEnter={e => {
                            if (inMonth && !isSelected && !isToday) {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F5F4FB';
                              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(20,16,66,0.3)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (inMonth && !isSelected && !isToday) {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = bgColor;
                              (e.currentTarget as HTMLButtonElement).style.borderColor = borderColor;
                            }
                          }}
                        >
                          {/* Day number */}
                          <span style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1 }}>
                            {day.getDate()}
                          </span>

                          {/* Event dots */}
                          {dotCount > 0 && inMonth ? (
                            <div style={{ display: 'flex', gap: '2px', height: '6px', alignItems: 'center' }}>
                              {Array.from({ length: Math.min(dotCount, 3) }).map((_, i) => (
                                <div
                                  key={i}
                                  style={{
                                    width: '4px', height: '4px', borderRadius: '50%',
                                    backgroundColor: (isSelected || isToday) ? 'rgba(255,255,255,0.7)' : '#3B82F6',
                                  }}
                                />
                              ))}
                            </div>
                          ) : (
                            <div style={{ height: '6px' }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Selected day timeline ── */}
          <div>
            {/* day header */}
            <div className="flex items-center justify-between px-6 py-3 bg-[#FAFAF8] border-b border-[#E5E5DC]">
              <div>
                <p className="text-sm font-semibold text-[#141042]">
                  {DAYS_FULL[selectedDay.getDay()]}, {selectedDay.getDate()} de {MONTHS_PT[selectedDay.getMonth()]}
                </p>
                <p className="text-xs text-[#999999] mt-0.5">
                  {selectedDayIvs.length === 0
                    ? 'Sem entrevistas — clique em um horário para agendar'
                    : `${selectedDayIvs.length} entrevista${selectedDayIvs.length > 1 ? 's' : ''} agendada${selectedDayIvs.length > 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                onClick={() => openFormAt()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141042] text-white text-xs font-medium rounded-lg hover:bg-[#1a1554] transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Nova Entrevista
              </button>
            </div>

            {/* hour rows 08:00 → 19:00 */}
            <div className="divide-y divide-[#F4F4F0]">
              {HOURS.map(hour => {
                const ivs      = selectedDayIvs.filter(iv => startsAtHour(iv, hour));
                const spanning = selectedDayIvs.filter(iv => !startsAtHour(iv, hour) && occupiesHour(iv, hour));
                const isBusy   = ivs.length > 0 || spanning.length > 0;

                // Highlight current hour if viewing today
                const isCurrentHour = isSameDay(selectedDay, today) && new Date().getHours() === hour;

                return (
                  <div
                    key={hour}
                    className={`flex min-h-14 group ${isCurrentHour ? 'bg-[#FAFAF8]' : ''}`}
                  >
                    {/* hour label */}
                    <div className="w-16 shrink-0 flex items-start pt-3.5 pr-3 justify-end">
                      <span className={`text-[11px] font-semibold tabular-nums ${isCurrentHour ? 'text-[#141042]' : 'text-[#CCCCCC]'}`}>
                        {padHour(hour)}
                      </span>
                    </div>

                    {/* slot */}
                    <div className="flex-1 py-2 pr-4">
                      {ivs.length > 0 && (
                        <div className="space-y-1.5">
                          {ivs.map(iv => {
                            const Icon = TYPE_ICONS[iv.type];
                            const cardContent = (
                              <>
                                <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold truncate">{iv.title}</p>
                                  <div className="flex flex-wrap items-center gap-x-2 mt-0.5 opacity-75">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-2.5 w-2.5" />
                                      {formatTime(iv.scheduled_at)} · {iv.duration_minutes}min
                                    </span>
                                    {iv.candidateName && <span className="truncate">{iv.candidateName}</span>}
                                    {iv.meet_link && (
                                      <span className="flex items-center gap-1 truncate text-blue-600">
                                        <Video className="h-2.5 w-2.5" />
                                        Meet
                                      </span>
                                    )}
                                    {iv.location && !iv.meet_link && (
                                      <span className="flex items-center gap-1 truncate">
                                        <MapPin className="h-2.5 w-2.5" />
                                        {iv.location}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </>
                            );
                            return iv.meet_link ? (
                              <a
                                key={iv.id}
                                href={iv.meet_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-xs cursor-pointer hover:shadow-md transition-shadow ${TYPE_COLORS[iv.type]}`}
                              >
                                {cardContent}
                              </a>
                            ) : (
                              <div key={iv.id} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-xs ${TYPE_COLORS[iv.type]}`}>
                                {cardContent}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {spanning.length > 0 && ivs.length === 0 && (
                        <div className="flex items-center h-full pl-1 pt-1">
                          <div className="w-0.5 h-8 bg-[#93C5FD] rounded-full" />
                        </div>
                      )}

                      {!isBusy && (
                        <button
                          onClick={() => openFormAt(hour)}
                          className="w-full h-full min-h-[36px] rounded-lg border border-dashed border-transparent
                            group-hover:border-[#E5E5DC] flex items-center gap-2 px-3
                            text-xs text-transparent group-hover:text-[#BBBBBB]
                            hover:border-[#141042]/25! hover:text-[#141042]! hover:bg-[#FAFAF8]
                            transition-all duration-150 min-h-9"
                        >
                          <Plus className="h-3 w-3 shrink-0" />
                          Agendar às {padHour(hour)}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* 20:00 end marker */}
              <div className="flex h-8">
                <div className="w-16 shrink-0 flex items-start pt-2.5 pr-3 justify-end">
                  <span className="text-[11px] font-semibold text-[#CCCCCC]">20:00</span>
                </div>
              </div>
            </div>
          </div>

        </div>{/* end scrollable */}
      </div>

      {/* ── form sub-modal ── */}
      {showForm && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-md border border-[#E5E5DC] overflow-hidden">

            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5DC]">
              <h3 className="font-semibold text-[#141042]">
                {form.event_type === 'interview' ? 'Nova Entrevista' : 'Nova Reunião'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-[#666666] hover:text-[#141042] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
              )}

              {/* ── toggle entrevista / reunião ── */}
              <div className="flex rounded-lg border border-[#E5E5DC] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, event_type: 'interview', candidate_id: '', job_id: '', application_id: '' }))}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    form.event_type === 'interview'
                      ? 'bg-[#141042] text-white'
                      : 'bg-white text-[#666666] hover:bg-[#FAFAF8]'
                  }`}
                >
                  🎙️ Entrevista
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, event_type: 'meeting', candidate_id: '', job_id: '', application_id: '' }))}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    form.event_type === 'meeting'
                      ? 'bg-[#141042] text-white'
                      : 'bg-white text-[#666666] hover:bg-[#FAFAF8]'
                  }`}
                >
                  👥 Reunião
                </button>
              </div>

              {/* ── candidato + vaga (somente entrevista) ── */}
              {form.event_type === 'interview' && (
                <div className="space-y-3 p-3 bg-[#FAFAF8] rounded-lg border border-[#E5E5DC]">
                  <div>
                    <label className="block text-xs font-medium text-[#666666] mb-1">Candidato</label>
                    <input
                      type="text"
                      value={candidateSearch}
                      onFocus={() => setCandidateFocused(true)}
                      onBlur={() => setTimeout(() => setCandidateFocused(false), 150)}
                      onChange={e => {
                        setCandidateSearch(e.target.value);
                        if (!e.target.value) setForm(f => ({ ...f, candidate_id: '', job_id: '', application_id: '' }));
                      }}
                      placeholder={loadingCandidates ? 'Carregando candidatos…' : 'Buscar por nome ou e-mail…'}
                      disabled={loadingCandidates}
                      className="w-full px-3 py-2 border border-[#E5E5DC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#141042] text-[#141042] bg-white"
                    />
                    {/* dropdown de candidatos */}
                    {(candidateFocused || candidateSearch.trim()) && !form.candidate_id && filteredCandidates.length > 0 && (
                      <div className="mt-1 border border-[#E5E5DC] rounded-lg bg-white shadow-lg max-h-40 overflow-y-auto z-10 relative">
                        {filteredCandidates.slice(0, 8).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={e => e.preventDefault()} // evita blur antes do click
                            onClick={() => {
                              setCandidateSearch(c.full_name);
                              setCandidateFocused(false);
                              setForm(f => ({ ...f, candidate_id: c.id, job_id: '', application_id: '' }));
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-[#FAFAF8] transition-colors"
                          >
                            <span className="font-medium text-[#141042]">{c.full_name}</span>
                            {c.email && <span className="text-[#999999] ml-2 text-xs">{c.email}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                    {candidateSearch.trim() && !form.candidate_id && filteredCandidates.length === 0 && !loadingCandidates && (
                      <p className="mt-1 text-xs text-[#999999] px-1">Nenhum candidato encontrado para esta organização.</p>
                    )}
                  </div>

                  {/* vagas do candidato */}
                  {form.candidate_id && (
                    <div>
                      <label className="block text-xs font-medium text-[#666666] mb-1">Vaga *</label>
                      {candidateApplications.length === 0 ? (
                        <p className="text-xs text-[#999999]">Nenhuma aplicação encontrada para este candidato.</p>
                      ) : (
                        <select
                          required={form.event_type === 'interview' && !!form.candidate_id}
                          value={form.application_id}
                          onChange={e => {
                            const app = candidateApplications.find(a => a.id === e.target.value);
                            const newTitle = app
                              ? `Entrevista — ${candidateSearch} · ${app.job_title}`
                              : form.title;
                            setForm(f => ({
                              ...f,
                              application_id: e.target.value,
                              job_id:         app?.job_id ?? '',
                              title:          !form.title || form.title.startsWith('Entrevista —') ? newTitle : form.title,
                            }));
                          }}
                          className="w-full px-3 py-2 border border-[#E5E5DC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#141042] text-[#141042] bg-white"
                        >
                          <option value="">Selecione a vaga…</option>
                          {candidateApplications.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.job_title}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">Título *</label>
                <input
                  required value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder={form.event_type === 'interview' ? 'Entrevista técnica — João Silva' : 'Alinhamento semanal'}
                  className="w-full px-3 py-2 border border-[#E5E5DC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#141042] text-[#141042]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Data *</label>
                  <input
                    required type="date" value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5E5DC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#141042] text-[#141042]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Horário *</label>
                  <input
                    required type="time" value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5E5DC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#141042] text-[#141042]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Duração</label>
                  <select
                    value={form.duration_minutes}
                    onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#E5E5DC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#141042] text-[#141042]"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1h30</option>
                    <option value={120}>2 horas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#666666] mb-1">Tipo</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as 'video' | 'presencial' | 'phone' })}
                    className="w-full px-3 py-2 border border-[#E5E5DC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#141042] text-[#141042]"
                  >
                    <option value="video">Vídeo</option>
                    <option value="presencial">Presencial</option>
                    <option value="phone">Telefone</option>
                  </select>
                </div>
              </div>

              {/* Link field — hidden for video when Google Calendar is connected (auto-generated) */}
              {!(gcConnected && form.type === 'video') && (
              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">
                  {form.type === 'video' ? 'Link (Meet, Zoom…)' : form.type === 'phone' ? 'Telefone' : 'Endereço'}
                </label>
                <input
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder={form.type === 'video' ? 'https://meet.google.com/…' : ''}
                  className="w-full px-3 py-2 border border-[#E5E5DC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#141042] text-[#141042]"
                />
              </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#666666] mb-1">Notas</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Informações adicionais…"
                  className="w-full px-3 py-2 border border-[#E5E5DC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#141042] text-[#141042] resize-none"
                />
              </div>

              {gcConnected && form.type === 'video' && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  ✅ Link do Google Meet será gerado automaticamente.
                </p>
              )}
              {gcConnected && form.type !== 'video' && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  ✓ Evento será criado no Google Calendar automaticamente.
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-[#E5E5DC] text-[#141042] text-sm font-medium rounded-lg hover:bg-[#FAFAF8] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 bg-[#141042] text-white text-sm font-medium rounded-lg hover:bg-[#1a1554] disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Salvando…' : 'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modal, document.body);
}
