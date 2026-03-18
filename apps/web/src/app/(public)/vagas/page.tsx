'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, MapPin, Briefcase, Clock, Building2, SlidersHorizontal,
  X, Loader2, ArrowUpRight, Zap, Users, Globe2,
  Monitor, Heart, ShoppingBag, GraduationCap, BarChart2, Code2,
  Wrench, BookOpen, Home, TrendingUp, Check, Bell,
  DollarSign, Flame, AlertCircle, Calendar, ChevronDown,
  MessageCircle, Copy, ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface GlobalJob {
  id: string;
  title: string;
  location: string | null;
  employment_type: string | null;
  work_modality: string | null;
  seniority: string | null;
  salary_range: string | null;
  created_at: string;
  application_deadline: string | null;
  org_id: string;
  org_name: string;
  org_slug: string;
  org_industry: string | null;
  org_logo_url: string | null;
  description?: string | null;
  description_html?: string | null;
  benefits?: string | null;
  requirements?: string | null;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  full_time: 'CLT', part_time: 'Meio período', contract: 'PJ', internship: 'Estágio',
};
const TYPE_COLOR: Record<string, string> = {
  full_time: 'bg-violet-50 text-violet-700 border-violet-200',
  part_time: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  contract: 'bg-orange-50 text-orange-700 border-orange-200',
  internship: 'bg-rose-50 text-rose-700 border-rose-200',
};
const MODALITY_LABEL: Record<string, string> = {
  presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto',
};
const MODALITY_COLOR: Record<string, string> = {
  presencial: 'bg-blue-50 text-blue-700 border-blue-200',
  hibrido: 'bg-amber-50 text-amber-700 border-amber-200',
  remoto: 'bg-teal-50 text-teal-700 border-teal-200',
};
const SENIORITY_LABEL: Record<string, string> = {
  intern: 'Estágio', junior: 'Júnior', mid: 'Pleno',
  senior: 'Sênior', lead: 'Lead', manager: 'Gerente',
  director: 'Diretor', executive: 'Executivo',
};

// Mapa de ícones/rótulos para setores conhecidos (busca case-insensitive)
const AREA_ICON_MAP: Record<string, { label: string; icon: React.ElementType }> = {
  'tecnologia': { label: 'Tecnologia', icon: Code2 },
  'administrativo': { label: 'Administrativo', icon: Briefcase },
  'saúde': { label: 'Saúde', icon: Heart },
  'saude': { label: 'Saúde', icon: Heart },
  'marketing': { label: 'Marketing', icon: TrendingUp },
  'educação': { label: 'Educação', icon: GraduationCap },
  'educacao': { label: 'Educação', icon: GraduationCap },
  'vendas': { label: 'Vendas', icon: BarChart2 },
  'recursos humanos': { label: 'RH', icon: Users },
  'rh': { label: 'RH', icon: Users },
  'engenharia': { label: 'Engenharia', icon: Wrench },
  'varejo': { label: 'Varejo', icon: ShoppingBag },
  'ti': { label: 'TI', icon: Monitor },
  'tecnologia da informação': { label: 'TI', icon: Monitor },
  'jurídico': { label: 'Jurídico', icon: BookOpen },
  'juridico': { label: 'Jurídico', icon: BookOpen },
  'imóveis': { label: 'Imóveis', icon: Home },
  'imoveis': { label: 'Imóveis', icon: Home },
  'recrutamento': { label: 'Recrutamento', icon: Users },
  'financeiro': { label: 'Financeiro', icon: BarChart2 },
  'finanças': { label: 'Finanças', icon: BarChart2 },
  'logística': { label: 'Logística', icon: Briefcase },
  'logistica': { label: 'Logística', icon: Briefcase },
  'construção': { label: 'Construção', icon: Wrench },
  'construcao': { label: 'Construção', icon: Wrench },
};

const SALARY_BRACKETS = [
  { label: 'Até R$ 3k', value: 'ate-3k', min: 0, max: 3000 },
  { label: 'R$ 3k–5k', value: '3k-5k', min: 3000, max: 5000 },
  { label: 'R$ 5k–10k', value: '5k-10k', min: 5000, max: 10000 },
  { label: 'R$ 10k–20k', value: '10k-20k', min: 10000, max: 20000 },
  { label: 'Acima de R$ 20k', value: 'acima-20k', min: 20000, max: Infinity },
];

const SORT_OPTIONS = [
  { label: 'Mais recente', value: 'recent' },
  { label: 'Maior salário', value: 'salary-high' },
  { label: 'Menor salário', value: 'salary-low' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(date: string) {
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (d === 0) return 'Hoje';
  if (d === 1) return 'Ontem';
  if (d < 7) return `${d}d atrás`;
  if (d < 30) return `${Math.floor(d / 7)}sem`;
  return `${Math.floor(d / 30)}m atrás`;
}

function isHot(date: string) {
  return (Date.now() - new Date(date).getTime()) / 86400000 < 1;
}

function isNew(date: string) {
  return (Date.now() - new Date(date).getTime()) / 86400000 < 3;
}

function daysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

function parseSalaryMid(salaryRange: string | null): number | null {
  if (!salaryRange) return null;
  const nums = salaryRange.replace(/\./g, '').match(/\d+/g);
  if (!nums || nums.length === 0) return null;
  const values = nums.map(Number).filter(n => n > 100);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(text: string | null | undefined, len: number): string {
  const clean = stripHtml(text);
  return clean.length > len ? clean.slice(0, len) + '…' : clean;
}

// ─── useDebounce ───────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── SkeletonCard ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="h-3 bg-gray-200 rounded w-1/3" />
          <div className="h-5 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="flex gap-2 pt-1">
            <div className="h-6 bg-gray-200 rounded-full w-14" />
            <div className="h-6 bg-gray-200 rounded-full w-20" />
            <div className="h-6 bg-gray-200 rounded-full w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── OrgAvatar ─────────────────────────────────────────────────────────────────

function OrgAvatar({ name, logoUrl, size = 'md' }: {
  name: string; logoUrl: string | null; size?: 'sm' | 'md' | 'lg';
}) {
  const sz = size === 'sm' ? 'w-8 h-8 text-sm' : size === 'lg' ? 'w-14 h-14 text-xl' : 'w-11 h-11 text-base';
  if (logoUrl) {
    return (
      <div className={`${sz} rounded-xl overflow-hidden shrink-0 bg-white border border-gray-100 flex items-center justify-center shadow-sm`}>
        <img src={logoUrl} alt={name} loading="lazy" className="w-full h-full object-contain p-1.5" />
      </div>
    );
  }
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const palette = [
    'bg-[#141042] text-white', 'bg-[#1F4ED8] text-white',
    'bg-[#10B981] text-white', 'bg-[#F97316] text-white',
    'bg-violet-600 text-white', 'bg-rose-600 text-white',
  ];
  const color = palette[name.charCodeAt(0) % palette.length];
  return (
    <div className={`${sz} ${color} rounded-xl flex items-center justify-center font-bold shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

// ─── FilterCheckbox ────────────────────────────────────────────────────────────

function FilterCheckbox({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-base transition-all ${
        active ? 'bg-[#141042] text-white font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <span>{label}</span>
      {active && <Check className="h-3.5 w-3.5 shrink-0" />}
    </button>
  );
}

// ─── ShareButtons ──────────────────────────────────────────────────────────────

function ShareButtons({ job, stopPropagation = false }: { job: GlobalJob; stopPropagation?: boolean }) {
  const [copied, setCopied] = useState(false);
  const jobUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/jobs/${job.org_slug}/${job.id}`
    : `/jobs/${job.org_slug}/${job.id}`;

  function copyLink(e: React.MouseEvent) {
    if (stopPropagation) e.stopPropagation();
    navigator.clipboard.writeText(jobUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp(e: React.MouseEvent) {
    if (stopPropagation) e.stopPropagation();
    const text = `Vaga: ${job.title} — ${job.org_name}\n${jobUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={shareWhatsApp}
        title="Compartilhar no WhatsApp"
        className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
      >
        <MessageCircle className="h-3.5 w-3.5 text-green-600" />
      </button>
      <button
        onClick={copyLink}
        title="Copiar link"
        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
      >
        {copied
          ? <Check className="h-3.5 w-3.5 text-green-600" />
          : <Copy className="h-3.5 w-3.5 text-gray-500" />
        }
      </button>
    </div>
  );
}

// ─── AlertModal ────────────────────────────────────────────────────────────────

function AlertModal({
  searchLabel, onClose, onSave,
}: { searchLabel: string; onClose: () => void; onSave: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) return;
    onSave(email);
    setSaved(true);
    setTimeout(onClose, 2200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>

        {saved ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-bold text-gray-900">Alerta criado!</p>
            <p className="text-base text-gray-500 mt-1">Você será avisado sobre novas vagas.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#141042]/10 flex items-center justify-center shrink-0">
                <Bell className="h-5 w-5 text-[#141042]" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-base">Criar alerta de vagas</p>
                <p className="text-sm text-gray-400 mt-0.5 truncate">"{searchLabel}"</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[#141042] transition-colors"
              />
              <button
                type="submit"
                disabled={!email.includes('@')}
                className="w-full bg-[#141042] hover:bg-[#1a1565] disabled:opacity-40 text-white font-semibold py-3 rounded-xl text-base transition-colors flex items-center justify-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Criar alerta
              </button>
            </form>
            <p className="text-xs text-gray-400 text-center mt-3">
              Receberá um e-mail quando surgirem novas vagas para esta busca.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── JobModal ─────────────────────────────────────────────────────────────────

type ApplyStatus = 'idle' | 'loading' | 'success' | 'already_applied' | 'error';

function JobModal({
  job,
  onClose,
  authUser,
  autoApply = false,
}: {
  job: GlobalJob;
  onClose: () => void;
  authUser: { id: string; email?: string } | null;
  autoApply?: boolean;
}) {
  const supabase = createClient();
  const daysLeft = daysUntilDeadline(job.application_deadline);
  const [applyStatus, setApplyStatus] = useState<ApplyStatus>('idle');
  const [applyError, setApplyError] = useState('');

  // Fecha com ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Verificar se já se candidatou a esta vaga
  useEffect(() => {
    if (!authUser) return;
    supabase.rpc('get_my_applications').then(({ data }) => {
      if (data?.some((a: any) => a.job_id === job.id)) {
        setApplyStatus('already_applied');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, job.id]);

  // Auto-apply quando vem do redirect de login
  useEffect(() => {
    if (autoApply && authUser && applyStatus === 'idle') {
      handleApply();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoApply, authUser]);

  async function handleApply() {
    if (!authUser || applyStatus === 'already_applied') return;
    setApplyStatus('loading');
    setApplyError('');
    try {
      const { error } = await supabase.rpc('apply_to_job', { p_job_id: job.id });
      if (error) throw error;
      setApplyStatus('success');
    } catch (err: any) {
      setApplyError(err?.message || 'Erro ao candidatar-se. Tente novamente.');
      setApplyStatus('error');
    }
  }

  // URL de login com redirect de volta para /vagas?apply=<job_id>
  const loginUrl = `/login?redirect=${encodeURIComponent(`/vagas?apply=${job.id}`)}`;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={[
        'fixed z-50 bg-white shadow-2xl flex flex-col overflow-hidden',
        'bottom-0 left-0 right-0 rounded-t-3xl h-[92vh]',
        'sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
        'sm:w-full sm:max-w-4xl sm:h-auto sm:max-h-[90vh]',
        'sm:rounded-2xl sm:border sm:border-gray-200',
      ].join(' ')}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <OrgAvatar name={job.org_name} logoUrl={job.org_logo_url} size="sm" />
            <p className="text-sm font-medium text-gray-500 truncate">{job.org_name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ShareButtons job={job} />
            <Link
              href={`/jobs/${job.org_slug}/${job.id}`}
              target="_blank"
              title="Abrir página completa"
              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-gray-500" />
            </Link>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pt-5 pb-3">

            {/* Title */}
            <h2 className="text-xl font-bold text-[#141042] leading-snug mb-3">{job.title}</h2>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {job.employment_type && (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${TYPE_COLOR[job.employment_type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {TYPE_LABEL[job.employment_type] || job.employment_type}
                </span>
              )}
              {job.work_modality && (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${MODALITY_COLOR[job.work_modality] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {MODALITY_LABEL[job.work_modality] || job.work_modality}
                </span>
              )}
              {job.seniority && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  {SENIORITY_LABEL[job.seniority] || job.seniority}
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="space-y-2 mb-5 bg-gray-50 rounded-xl p-4">
              {job.location && (
                <div className="flex items-center gap-2 text-base text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{job.location}</span>
                </div>
              )}
              {job.salary_range ? (
                <div className="flex items-center gap-2 text-base font-semibold text-[#10B981]">
                  <DollarSign className="h-4 w-4 shrink-0" />
                  <span>{job.salary_range}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-base text-gray-400">
                  <DollarSign className="h-4 w-4 shrink-0" />
                  <span>Salário a combinar</span>
                </div>
              )}
              {job.org_industry && (
                <div className="flex items-center gap-2 text-base text-gray-500">
                  <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{job.org_industry}</span>
                </div>
              )}
              {job.application_deadline && (
                <div className={`flex items-center gap-2 text-base ${daysLeft !== null && daysLeft <= 7 ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}>
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>
                    Inscrições até {new Date(job.application_deadline).toLocaleDateString('pt-BR')}
                    {daysLeft !== null && daysLeft <= 7 && daysLeft >= 0 && ` · ${daysLeft}d restantes`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-base text-gray-400">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Publicada {daysAgo(job.created_at)}</span>
              </div>
            </div>

            {/* Description */}
            {(job.description_html || job.description) && (
              <div className="mb-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Sobre a vaga</h3>
                {job.description_html ? (
                  <div
                    className="text-base text-gray-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_p]:mb-2 [&_strong]:font-semibold [&_h1]:font-bold [&_h1]:text-gray-900 [&_h2]:font-bold [&_h2]:text-gray-900 [&_h3]:font-semibold [&_h3]:text-gray-800"
                    dangerouslySetInnerHTML={{ __html: job.description_html }}
                  />
                ) : (
                  <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">{job.description}</p>
                )}
              </div>
            )}

            {/* Requirements */}
            {job.requirements && (
              <div className="mb-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Requisitos</h3>
                <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">{job.requirements}</p>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && (
              <div className="mb-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Benefícios</h3>
                <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">{job.benefits}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0 space-y-2">
          {/* Candidato logado — candidatura rápida */}
          {authUser ? (
            <>
              {applyStatus === 'already_applied' ? (
                <div className="flex items-center justify-center gap-2.5 w-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-base py-3.5 rounded-xl">
                  <Check className="h-5 w-5 shrink-0" />
                  Você já se candidatou a esta vaga
                </div>
              ) : applyStatus === 'success' ? (
                <div className="flex items-center justify-center gap-2.5 w-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-base py-3.5 rounded-xl">
                  <Check className="h-5 w-5 shrink-0" />
                  Candidatura enviada com sucesso!
                </div>
              ) : (
                <button
                  onClick={handleApply}
                  disabled={applyStatus === 'loading'}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#141042] to-[#1F4ED8] hover:from-[#1a1565] hover:to-[#1e40af] disabled:opacity-60 text-white font-semibold text-base py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  {applyStatus === 'loading' ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Enviando candidatura…</>
                  ) : (
                    <><Zap className="h-4 w-4" /> Candidatar-me agora</>
                  )}
                </button>
              )}
              {applyStatus === 'error' && (
                <p className="text-xs text-red-600 text-center">{applyError}</p>
              )}
              <Link
                href="/candidate/applications"
                className="block w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Ver minhas candidaturas
              </Link>
            </>
          ) : (
            /* Visitante não logado — redireciona para login */
            <>
              <Link
                href={loginUrl}
                className="block w-full text-center bg-gradient-to-r from-[#141042] to-[#1F4ED8] hover:from-[#1a1565] hover:to-[#1e40af] text-white font-semibold text-base py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                Candidatar-se a esta vaga
              </Link>
              <p className="text-xs text-gray-400 text-center">
                Você será redirecionado para o login. Após entrar, sua candidatura é enviada automaticamente.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── FilterSidebar ─────────────────────────────────────────────────────────────

function FilterSidebar({
  filterType, setFilterType,
  filterModality, setFilterModality,
  filterSeniority, setFilterSeniority,
  filterIndustry, setFilterIndustry,
  filterSalary, setFilterSalary,
  industries, activeFilters, clearFilters,
}: {
  filterType: string | null; setFilterType: (v: string | null) => void;
  filterModality: string | null; setFilterModality: (v: string | null) => void;
  filterSeniority: string | null; setFilterSeniority: (v: string | null) => void;
  filterIndustry: string | null; setFilterIndustry: (v: string | null) => void;
  filterSalary: string | null; setFilterSalary: (v: string | null) => void;
  industries: string[]; activeFilters: number; clearFilters: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#141042]" />
          <span className="font-semibold text-gray-900 text-base">Filtros</span>
        </div>
        {activeFilters > 0 && (
          <button onClick={clearFilters} className="text-sm text-[#F97316] hover:text-orange-700 font-medium transition-colors">
            Limpar ({activeFilters})
          </button>
        )}
      </div>

      <div className="p-4 space-y-5">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Tipo de contrato</p>
          <div className="space-y-0.5">
            {(['full_time', 'part_time', 'contract', 'internship'] as const).map(t => (
              <FilterCheckbox key={t} label={TYPE_LABEL[t]} active={filterType === t}
                onClick={() => setFilterType(filterType === t ? null : t)} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Modalidade</p>
          <div className="space-y-0.5">
            {(['presencial', 'hibrido', 'remoto'] as const).map(m => (
              <FilterCheckbox key={m} label={MODALITY_LABEL[m]} active={filterModality === m}
                onClick={() => setFilterModality(filterModality === m ? null : m)} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Nível</p>
          <div className="space-y-0.5">
            {(['intern', 'junior', 'mid', 'senior', 'lead', 'manager'] as const).map(s => (
              <FilterCheckbox key={s} label={SENIORITY_LABEL[s]} active={filterSeniority === s}
                onClick={() => setFilterSeniority(filterSeniority === s ? null : s)} />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Faixa salarial</p>
          <div className="space-y-0.5">
            {SALARY_BRACKETS.map(b => (
              <FilterCheckbox key={b.value} label={b.label} active={filterSalary === b.value}
                onClick={() => setFilterSalary(filterSalary === b.value ? null : b.value)} />
            ))}
          </div>
        </div>

        {industries.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Setor</p>
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {industries.map(ind => (
                <FilterCheckbox key={ind} label={ind} active={filterIndustry === ind}
                  onClick={() => setFilterIndustry(filterIndustry === ind ? null : ind)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VagasContent (main) ───────────────────────────────────────────────────────

function VagasContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [jobs, setJobs] = useState<GlobalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Auth state
  const [authUser, setAuthUser] = useState<{ id: string; email?: string } | null>(null);

  // State initialized from URL params
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [locationSearch, setLocationSearch] = useState(() => searchParams.get('loc') || '');
  const [filterType, setFilterType] = useState<string | null>(() => searchParams.get('type'));
  const [filterModality, setFilterModality] = useState<string | null>(() => searchParams.get('modality'));
  const [filterIndustry, setFilterIndustry] = useState<string | null>(() => searchParams.get('industry'));
  const [filterSeniority, setFilterSeniority] = useState<string | null>(() => searchParams.get('seniority'));
  const [filterSalary, setFilterSalary] = useState<string | null>(() => searchParams.get('salary'));
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'recent');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(() => searchParams.get('job'));

  // ?apply=<job_id> — vem do redirect pós-login
  const applyJobId = searchParams.get('apply');
  const [autoApply, setAutoApply] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedLocation = useDebounce(locationSearch, 300);

  // Carregar auth + vagas em paralelo
  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true);

        // Checar sessão do usuário
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAuthUser({ id: user.id, email: user.email });
        }

        // Carregar vagas
        const { data, error } = await supabase.rpc('get_all_public_jobs');
        if (error) throw error;
        const mapped: GlobalJob[] = (data || []).map((j: any) => ({
          id: j.id,
          title: j.title,
          location: j.location ?? null,
          employment_type: j.employment_type ?? null,
          work_modality: j.work_modality ?? null,
          seniority: j.seniority ?? null,
          salary_range: j.salary_range ?? null,
          created_at: j.created_at,
          application_deadline: j.application_deadline ?? null,
          org_id: j.org_id,
          org_name: j.org_name ?? 'Empresa',
          org_slug: j.org_slug ?? '',
          org_industry: j.org_industry ?? null,
          org_logo_url: j.org_logo_url ?? null,
          description: j.description ?? null,
          description_html: j.description_html ?? null,
          benefits: j.benefits ?? null,
          requirements: j.requirements ?? null,
        }));
        setJobs(mapped);

        // Se veio de ?apply=<id> pós-login: abrir modal + auto-apply
        if (applyJobId) {
          setSelectedJobId(applyJobId);
          if (user) setAutoApply(true);
        }
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync filters → URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (debouncedLocation) params.set('loc', debouncedLocation);
    if (filterType) params.set('type', filterType);
    if (filterModality) params.set('modality', filterModality);
    if (filterIndustry) params.set('industry', filterIndustry);
    if (filterSeniority) params.set('seniority', filterSeniority);
    if (filterSalary) params.set('salary', filterSalary);
    if (sortBy !== 'recent') params.set('sort', sortBy);
    if (selectedJobId) params.set('job', selectedJobId);
    const qs = params.toString();
    router.replace(`/vagas${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [debouncedSearch, debouncedLocation, filterType, filterModality, filterIndustry, filterSeniority, filterSalary, sortBy, selectedJobId, router]);

  // Derived state
  const industries = useMemo(() =>
    Array.from(new Set(jobs.map(j => j.org_industry).filter(Boolean))).sort() as string[],
    [jobs]
  );
  const orgCount = useMemo(() => new Set(jobs.map(j => j.org_id)).size, [jobs]);
  const remoteCount = useMemo(() => jobs.filter(j => j.work_modality === 'remoto').length, [jobs]);

  const filtered = useMemo(() => jobs.filter(j => {
    const q = debouncedSearch.toLowerCase().trim();
    const loc = debouncedLocation.toLowerCase().trim();

    const matchSearch = !q
      || j.title.toLowerCase().includes(q)
      || j.org_name.toLowerCase().includes(q)
      || (j.org_industry || '').toLowerCase().includes(q)
      || stripHtml(j.description).toLowerCase().includes(q);

    const matchLocation = !loc || (j.location || '').toLowerCase().includes(loc);
    const matchType = !filterType || j.employment_type === filterType;
    const matchModality = !filterModality || j.work_modality === filterModality;
    const matchIndustry = !filterIndustry || j.org_industry === filterIndustry;
    const matchSeniority = !filterSeniority || j.seniority === filterSeniority;

    const matchSalary = !filterSalary || (() => {
      const bracket = SALARY_BRACKETS.find(b => b.value === filterSalary);
      if (!bracket) return true;
      const mid = parseSalaryMid(j.salary_range);
      if (mid === null) return false;
      return mid >= bracket.min && (bracket.max === Infinity ? true : mid < bracket.max);
    })();

    return matchSearch && matchLocation && matchType && matchModality && matchIndustry && matchSeniority && matchSalary;
  }), [jobs, debouncedSearch, debouncedLocation, filterType, filterModality, filterIndustry, filterSeniority, filterSalary]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (sortBy === 'salary-high') {
      return list.sort((a, b) => (parseSalaryMid(b.salary_range) || 0) - (parseSalaryMid(a.salary_range) || 0));
    }
    if (sortBy === 'salary-low') {
      return list.sort((a, b) => {
        const av = parseSalaryMid(a.salary_range);
        const bv = parseSalaryMid(b.salary_range);
        if (av === null && bv === null) return 0;
        if (av === null) return 1;
        if (bv === null) return -1;
        return av - bv;
      });
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [filtered, sortBy]);

  const activeFilters = [filterType, filterModality, filterIndustry, filterSeniority, filterSalary].filter(Boolean).length;

  function clearFilters() {
    setFilterType(null);
    setFilterModality(null);
    setFilterIndustry(null);
    setFilterSeniority(null);
    setFilterSalary(null);
  }

  const selectedJob = useMemo(() =>
    selectedJobId ? jobs.find(j => j.id === selectedJobId) || null : null,
    [selectedJobId, jobs]
  );

  const searchLabel = [
    debouncedSearch,
    debouncedLocation,
    filterType && TYPE_LABEL[filterType],
    filterModality && MODALITY_LABEL[filterModality],
    filterIndustry,
    filterSeniority && SENIORITY_LABEL[filterSeniority],
    filterSalary && SALARY_BRACKETS.find(b => b.value === filterSalary)?.label,
  ].filter(Boolean).join(', ') || 'todas as vagas';

  async function handleSaveAlert(email: string) {
    const params = {
      q: debouncedSearch || undefined,
      loc: debouncedLocation || undefined,
      type: filterType || undefined,
      modality: filterModality || undefined,
      industry: filterIndustry || undefined,
      seniority: filterSeniority || undefined,
      salary: filterSalary || undefined,
    };

    // Persiste no banco via API
    try {
      await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, params }),
      });
    } catch { /* silent fail — fallback abaixo */ }

    // Fallback local para UX offline
    try {
      const saved = JSON.parse(localStorage.getItem('tf_alerts') || '[]');
      saved.push({ email, params, createdAt: new Date().toISOString() });
      localStorage.setItem('tf_alerts', JSON.stringify(saved));
    } catch { /* localStorage may be unavailable */ }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F4F6FA] font-sans">

      {/* ── HEADER ── */}
      <header className="bg-[#141042] sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex items-baseline gap-0.5">
              <span className="text-white font-semibold text-lg sm:text-xl tracking-tight">TALENT</span>
              <span className="text-[#F97316] font-bold text-lg sm:text-xl tracking-wider">FORGE</span>
            </div>
            <span className="text-white/40 text-base hidden md:block">·</span>
            <span className="text-white/60 text-sm font-medium uppercase tracking-wider hidden md:block">Vagas</span>
          </Link>

          {/* Badge — vagas abertas */}
          <div className="hidden sm:inline-flex items-center gap-2 bg-[#1F4ED8]/20 border border-[#1F4ED8]/30 rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#93B8FC] backdrop-blur-sm shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse shrink-0" />
            {loading ? '…' : `${jobs.length} vagas abertas agora`}
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            <Link href="/register?type=recruiter"
              className="text-base text-white/60 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all">
              Para Recrutadores
            </Link>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {authUser ? (
              <>
                <Link
                  href="/candidate"
                  className="flex items-center gap-2 text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-[#10B981] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(authUser.email?.[0] ?? 'C').toUpperCase()}
                  </div>
                  <span className="hidden sm:block max-w-[140px] truncate">{authUser.email}</span>
                </Link>
                <button
                  onClick={async () => { await supabase.auth.signOut(); setAuthUser(null); }}
                  className="text-xs text-white/50 hover:text-white/80 transition-colors px-2 py-1 rounded-md hover:bg-white/10"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link href="/login"
                  className="text-base text-white/70 hover:text-white transition-colors hidden sm:block px-3 py-2 rounded-lg hover:bg-white/10">
                  Entrar
                </Link>
                <Link href="/register"
                  className="text-sm sm:text-base font-semibold bg-[#10B981] hover:bg-[#059669] text-white px-3.5 sm:px-5 py-2 rounded-lg transition-all shadow-md">
                  Cadastrar-se
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="bg-[#141042] pt-10 pb-14 sm:pt-14 sm:pb-16 relative overflow-hidden">
        {/* Glow decorativo */}
        <div className="absolute -top-16 -left-16 w-[480px] h-[480px] bg-[#1F4ED8]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-10 w-[360px] h-[360px] bg-[#F97316]/15 rounded-full blur-3xl pointer-events-none" />
        {/* Grade sutil */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width%3D%2240%22 height%3D%2240%22 viewBox%3D%220 0 40 40%22 xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg fill%3D%22none%22 fill-rule%3D%22evenodd%22%3E%3Cg fill%3D%22%23ffffff%22 fill-opacity%3D%220.03%22%3E%3Cpath d%3D%22M0 40L40 0H20L0 20M40 40V20L20 40%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          {/* Heading — dois layouts: mobile centralizado, desktop two-col */}
          <div className="lg:flex lg:items-center lg:gap-16 lg:mb-10">
            {/* Texto */}
            <div className="text-center lg:text-left lg:flex-1 mb-8 lg:mb-0">
              <h1 className="text-[2.9rem] sm:text-[3.9rem] lg:text-[4.875rem] xl:text-[5.85rem] font-extrabold text-white leading-[1.1] mb-3 sm:mb-4 tracking-tight">
                <span className="text-white">Encontre a vaga ideal</span>
                <br />
                <span className="text-[#F97316]">para o seu perfil</span>
              </h1>
              <p className="text-white/50 text-base sm:text-lg lg:text-xl max-w-sm sm:max-w-md mx-auto lg:mx-0 leading-relaxed">
                Conectamos candidatos às melhores oportunidades de{' '}
                <span className="text-white/80 font-semibold">{loading ? '…' : orgCount} empresas</span> em todo o Brasil.
              </p>

              {/* Stats — desktop: abaixo do texto */}
              <div className="hidden lg:flex items-center gap-8 mt-8 flex-wrap">
                {[
                  { label: 'vagas abertas', value: `${jobs.length}`, icon: Briefcase },
                  { label: 'empresas', value: `${orgCount}`, icon: Building2 },
                  { label: 'vagas remotas', value: `${remoteCount}`, icon: Globe2 },
                ].map((s, i) => (
                  <div key={s.label} className="flex items-center gap-2.5 text-white/60">
                    {i > 0 && <span className="w-px h-4 bg-white/15 mr-1" />}
                    <s.icon className="h-4 w-4 text-[#F97316]" />
                    <span className="text-base">
                      <span className="font-bold text-white text-lg">{loading ? '—' : s.value}</span>{' '}
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Search box — desktop: coluna direita */}
            <div className="lg:flex-1 lg:max-w-xl">
              <div className="bg-white rounded-2xl shadow-2xl p-2.5 flex flex-col gap-2 border border-white/10">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus-within:border-[#1F4ED8]/40 focus-within:bg-white transition-all">
                  <Search className="h-4 w-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Cargo, empresa ou área..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-base text-gray-800 placeholder:text-gray-400 outline-none min-w-0"
                  />
                  {search && (
                    <button onClick={() => setSearch('')}>
                      <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-transparent focus-within:border-[#1F4ED8]/40 focus-within:bg-white transition-all">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Cidade ou estado..."
                    value={locationSearch}
                    onChange={e => setLocationSearch(e.target.value)}
                    className="flex-1 bg-transparent text-base text-gray-800 placeholder:text-gray-400 outline-none min-w-0"
                  />
                  {locationSearch && (
                    <button onClick={() => setLocationSearch('')}>
                      <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                <button className="w-full bg-[#F97316] hover:bg-[#ea6c0a] active:bg-[#d96209] text-white font-bold text-base px-7 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg tracking-wide">
                  Buscar vagas
                </button>
              </div>

              {/* Quick tags mobile */}
              <div className="flex items-center gap-2 mt-3 flex-wrap lg:hidden justify-center">
                {['Tecnologia', 'RH', 'Vendas', 'Remoto'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => tag === 'Remoto' ? setFilterModality('remoto') : setFilterIndustry(tag === 'RH' ? 'Recursos Humanos' : tag)}
                    className="text-xs font-medium text-white/60 border border-white/15 rounded-full px-3 py-1 hover:border-white/40 hover:text-white/90 transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats — mobile: abaixo do search */}
          <div className="flex items-center justify-center gap-5 mt-7 flex-wrap lg:hidden">
            {[
              { label: 'vagas', value: `${jobs.length}`, icon: Briefcase },
              { label: 'empresas', value: `${orgCount}`, icon: Building2 },
              { label: 'remotas', value: `${remoteCount}`, icon: Globe2 },
            ].map((s, i) => (
              <div key={s.label} className="flex items-center gap-1.5 text-white/60">
                {i > 0 && <span className="w-px h-3 bg-white/15 mr-1" />}
                <s.icon className="h-3.5 w-3.5 text-[#F97316]" />
                <span className="text-sm">
                  <span className="font-bold text-white">{loading ? '—' : s.value}</span>{' '}
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY SHORTCUTS — dinâmico a partir dos setores reais dos jobs ── */}
      <section className="bg-white border-b border-gray-100 sticky top-14 sm:top-16 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1.5 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={clearFilters}
              className={`flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-full text-base font-medium transition-all border ${
                !filterIndustry
                  ? 'bg-[#141042] text-white border-[#141042]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              Todas
            </button>
            {industries.map(ind => {
              const meta = AREA_ICON_MAP[ind.toLowerCase()] ?? { label: ind, icon: Briefcase };
              const Icon = meta.icon;
              const active = filterIndustry === ind;
              return (
                <button
                  key={ind}
                  onClick={() => setFilterIndustry(active ? null : ind)}
                  className={`flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-full text-base font-medium transition-all border ${
                    active
                      ? 'bg-[#141042] text-white border-[#141042]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-gray-500'}`} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── MAIN ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7">
        <div className="flex gap-6 items-start">

          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-[112px] sm:top-[128px]">
              <FilterSidebar
                filterType={filterType} setFilterType={setFilterType}
                filterModality={filterModality} setFilterModality={setFilterModality}
                filterSeniority={filterSeniority} setFilterSeniority={setFilterSeniority}
                filterIndustry={filterIndustry} setFilterIndustry={setFilterIndustry}
                filterSalary={filterSalary} setFilterSalary={setFilterSalary}
                industries={industries}
                activeFilters={activeFilters}
                clearFilters={clearFilters}
              />

              {/* Recruiter CTA */}
              <div className="mt-4 bg-gradient-to-br from-[#141042] to-[#1a1565] rounded-2xl p-5 text-white">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                  <Zap className="h-5 w-5 text-[#10B981]" />
                </div>
                <p className="font-bold text-base mb-1">Você é recrutador?</p>
                <p className="text-white/60 text-sm leading-relaxed mb-4">
                  Publique vagas e encontre os melhores candidatos com IA.
                </p>
                <Link href="/register?type=recruiter"
                  className="block text-center bg-[#10B981] hover:bg-[#059669] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                  Publicar vagas grátis
                </Link>
              </div>
            </aside>

          {/* Job list */}
          <div className="flex-1 min-w-0">

            {/* List header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-semibold text-gray-900">
                  {loading ? (
                    <span className="text-gray-400">Carregando...</span>
                  ) : (
                    <>
                      <span className="text-[#141042]">{sorted.length}</span>{' '}
                      {sorted.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
                    </>
                  )}
                </h2>
                {/* Active filter chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {filterType && (
                    <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 border border-violet-200 text-sm font-medium px-2.5 py-1 rounded-full">
                      {TYPE_LABEL[filterType]}
                      <button onClick={() => setFilterType(null)}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                  {filterModality && (
                    <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 border border-teal-200 text-sm font-medium px-2.5 py-1 rounded-full">
                      {MODALITY_LABEL[filterModality]}
                      <button onClick={() => setFilterModality(null)}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                  {filterIndustry && (
                    <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 border border-orange-200 text-sm font-medium px-2.5 py-1 rounded-full">
                      {filterIndustry}
                      <button onClick={() => setFilterIndustry(null)}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                  {filterSeniority && (
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 border border-blue-200 text-sm font-medium px-2.5 py-1 rounded-full">
                      {SENIORITY_LABEL[filterSeniority]}
                      <button onClick={() => setFilterSeniority(null)}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                  {filterSalary && (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 border border-green-200 text-sm font-medium px-2.5 py-1 rounded-full">
                      {SALARY_BRACKETS.find(b => b.value === filterSalary)?.label}
                      <button onClick={() => setFilterSalary(null)}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Alert button */}
                {!loading && (
                  <button
                    onClick={() => setShowAlertModal(true)}
                    className="flex items-center gap-1.5 text-base font-medium text-[#141042] border border-[#141042]/25 hover:border-[#141042] px-3.5 py-2 rounded-xl bg-white hover:bg-[#141042]/5 transition-all"
                    title="Criar alerta para esta busca"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="hidden sm:inline">Alerta</span>
                  </button>
                )}

                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 hover:border-gray-400 text-gray-700 text-base font-medium px-3.5 py-2 rounded-xl pr-8 cursor-pointer outline-none transition-all"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Mobile filter toggle */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-2 text-base font-medium text-gray-700 border border-gray-200 px-3.5 py-2 rounded-xl bg-white hover:border-gray-400 transition-all"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                  {activeFilters > 0 && (
                    <span className="bg-[#141042] text-white text-xs font-bold rounded-full flex items-center justify-center" style={{ width: 18, height: 18 }}>
                      {activeFilters}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Empty state */}
            {!loading && sorted.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Briefcase className="h-8 w-8 text-gray-300" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-800 mb-1">Nenhuma vaga encontrada</p>
                  <p className="text-base text-gray-500">Tente outros termos ou remova os filtros aplicados</p>
                </div>
                {activeFilters > 0 && (
                  <button onClick={clearFilters} className="text-base font-medium text-[#F97316] hover:text-orange-700 transition-colors">
                    Limpar filtros
                  </button>
                )}
              </div>
            )}

            {/* Job cards */}
            {!loading && sorted.length > 0 && (
              <div className="space-y-3">
                {sorted.map(job => {
                  const daysLeft = daysUntilDeadline(job.application_deadline);
                  const hot = isHot(job.created_at);
                  const nova = !hot && isNew(job.created_at);
                  const expiring = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
                  const isSelected = selectedJobId === job.id;
                  const preview = truncate(job.description_html || job.description, 110);

                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(isSelected ? null : job.id)}
                      className={`group cursor-pointer bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isSelected
                          ? 'border-[#141042] shadow-lg ring-2 ring-[#141042]/10'
                          : 'border-gray-100 hover:border-[#141042]/25 hover:shadow-lg'
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          <OrgAvatar name={job.org_name} logoUrl={job.org_logo_url} size="lg" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                  <p className="text-sm font-medium text-gray-400 truncate">{job.org_name}</p>
                                  {hot && (
                                    <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full border border-orange-200 shrink-0">
                                      <Flame className="h-2.5 w-2.5" /> QUENTE
                                    </span>
                                  )}
                                  {nova && (
                                    <span className="inline-flex items-center gap-1 bg-[#10B981]/10 text-[#059669] text-xs font-bold px-2 py-0.5 rounded-full border border-[#10B981]/20 shrink-0">
                                      <span className="w-1 h-1 rounded-full bg-[#10B981]" /> NOVA
                                    </span>
                                  )}
                                  {expiring && (
                                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                                      <AlertCircle className="h-2.5 w-2.5" /> {daysLeft}d restantes
                                    </span>
                                  )}
                                </div>
                                <h3 className={`font-bold text-lg leading-snug transition-colors line-clamp-2 ${
                                  isSelected ? 'text-[#1F4ED8]' : 'text-[#141042] group-hover:text-[#1F4ED8]'
                                }`}>
                                  {job.title}
                                </h3>
                              </div>
                              <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-xl transition-colors ${
                                isSelected ? 'bg-[#141042]' : 'bg-gray-50 group-hover:bg-[#141042]'
                              }`}>
                                <ArrowUpRight className={`h-4 w-4 transition-colors ${
                                  isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'
                                }`} />
                              </div>
                            </div>

                            {/* Description preview */}
                            {preview && (
                              <p className="text-sm text-gray-400 mt-1.5 mb-2 line-clamp-2 leading-relaxed">
                                {preview}
                              </p>
                            )}

                            <div className="flex items-center gap-3 mt-2 mb-3 flex-wrap">
                              {job.location && (
                                <span className="flex items-center gap-1 text-sm text-gray-500">
                                  <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                                  {job.location}
                                </span>
                              )}
                              {job.salary_range ? (
                                <span className="text-sm font-semibold text-[#10B981]">{job.salary_range}</span>
                              ) : (
                                <span className="text-sm text-gray-300 italic">A combinar</span>
                              )}
                              {job.org_industry && (
                                <span className="text-sm text-gray-400 hidden sm:inline">{job.org_industry}</span>
                              )}
                            </div>

                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex flex-wrap gap-1.5">
                                {job.employment_type && (
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${TYPE_COLOR[job.employment_type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                    {TYPE_LABEL[job.employment_type] || job.employment_type}
                                  </span>
                                )}
                                {job.work_modality && (
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${MODALITY_COLOR[job.work_modality] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                    {MODALITY_LABEL[job.work_modality] || job.work_modality}
                                  </span>
                                )}
                                {job.seniority && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                    {SENIORITY_LABEL[job.seniority] || job.seniority}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div onClick={e => e.stopPropagation()}>
                                  <ShareButtons job={job} stopPropagation />
                                </div>
                                <span className="flex items-center gap-1 text-sm text-gray-400 font-medium">
                                  <Clock className="h-3 w-3" />
                                  {daysAgo(job.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Accent bar */}
                      <div className={`h-[3px] bg-gradient-to-r from-[#141042] via-[#3B82F6] to-[#10B981] transition-transform duration-300 origin-left ${
                        isSelected ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`} />
                    </div>
                  );
                })}

                <div className="pt-4 pb-8 text-center">
                  <p className="text-sm text-gray-400">
                    Mostrando <span className="font-semibold text-gray-600">{sorted.length}</span> de{' '}
                    <span className="font-semibold text-gray-600">{jobs.length}</span> vagas disponíveis
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modal de detalhe da vaga */}
      {selectedJob && (
        <JobModal
          job={selectedJob}
          onClose={() => { setSelectedJobId(null); setAutoApply(false); }}
          authUser={authUser}
          autoApply={autoApply}
        />
      )}

      {/* ── MOBILE FILTER DRAWER ── */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#141042]" />
                <span className="font-bold text-gray-900">Filtros</span>
              </div>
              <div className="flex items-center gap-3">
                {activeFilters > 0 && (
                  <button onClick={clearFilters} className="text-base text-[#F97316] font-medium">Limpar</button>
                )}
                <button onClick={() => setShowMobileFilters(false)}
                  className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {[
                {
                  title: 'Tipo de contrato',
                  items: (['full_time', 'part_time', 'contract', 'internship'] as const).map(t => ({
                    key: t, label: TYPE_LABEL[t], active: filterType === t,
                    toggle: () => setFilterType(filterType === t ? null : t),
                  })),
                },
                {
                  title: 'Modalidade',
                  items: (['presencial', 'hibrido', 'remoto'] as const).map(m => ({
                    key: m, label: MODALITY_LABEL[m], active: filterModality === m,
                    toggle: () => setFilterModality(filterModality === m ? null : m),
                  })),
                },
                {
                  title: 'Nível',
                  items: (['intern', 'junior', 'mid', 'senior', 'lead', 'manager'] as const).map(s => ({
                    key: s, label: SENIORITY_LABEL[s], active: filterSeniority === s,
                    toggle: () => setFilterSeniority(filterSeniority === s ? null : s),
                  })),
                },
                {
                  title: 'Faixa salarial',
                  items: SALARY_BRACKETS.map(b => ({
                    key: b.value, label: b.label, active: filterSalary === b.value,
                    toggle: () => setFilterSalary(filterSalary === b.value ? null : b.value),
                  })),
                },
              ].map(group => (
                <div key={group.title}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{group.title}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map(item => (
                      <button key={item.key} onClick={item.toggle}
                        className={`px-4 py-2 rounded-full border text-base font-medium transition-all ${
                          item.active ? 'bg-[#141042] text-white border-[#141042]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {industries.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Setor</p>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {industries.map(ind => (
                      <button key={ind} onClick={() => setFilterIndustry(filterIndustry === ind ? null : ind)}
                        className={`px-4 py-2 rounded-full border text-base font-medium transition-all ${
                          filterIndustry === ind ? 'bg-[#141042] text-white border-[#141042]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}>
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setShowMobileFilters(false)}
                className="w-full bg-[#141042] text-white font-semibold py-4 rounded-2xl text-base transition-colors hover:bg-[#1a1565] mt-2">
                Ver {sorted.length} {sorted.length === 1 ? 'vaga' : 'vagas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlertModal && (
        <AlertModal
          searchLabel={searchLabel}
          onClose={() => setShowAlertModal(false)}
          onSave={handleSaveAlert}
        />
      )}

      {/* ── FOOTER ── */}
      <footer className="bg-[#141042] mt-10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-white font-semibold text-lg tracking-tight">TALENT</span>
              <span className="text-[#F97316] font-bold text-lg tracking-wider">FORGE</span>
            </div>
          </div>
          <p className="text-white/40 text-base text-center">
            © {new Date().getFullYear()} TalentForge · Conectando talentos às melhores oportunidades
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-white/50 hover:text-white/80 text-base transition-colors">Entrar</Link>
            <Link href="/register" className="text-white/50 hover:text-white/80 text-base transition-colors">Cadastrar</Link>
            <Link href="/register?type=recruiter" className="text-[#10B981] hover:text-[#34D399] text-base font-medium transition-colors">
              Para empresas
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Page export (Suspense required for useSearchParams) ───────────────────────

export default function VagasPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#141042] animate-spin" />
      </div>
    }>
      <VagasContent />
    </Suspense>
  );
}
