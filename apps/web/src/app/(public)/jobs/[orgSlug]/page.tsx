'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MapPin, Clock, Briefcase, Building2, Search, Instagram, Linkedin,
  MessageCircle, X, CheckCircle, Share2, DollarSign, Check, ArrowUpRight,
  ChevronDown, Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PublicJob {
  id: string;
  title: string;
  description: string;
  description_html: string | null;
  location: string | null;
  employment_type: string | null;
  benefits: string | null;
  requirements: string | null;
  application_deadline: string | null;
  salary_range: string | null;
  work_modality: string | null;
  seniority: string | null;
  created_at: string;
  org_name: string;
  org_slug: string;
  org_industry: string | null;
  org_logo_url: string | null;
  career_page_headline: string | null;
  career_page_logo_url: string | null;
  career_page_color: string | null;
  career_page_secondary_color: string | null;
  career_page_banner_url: string | null;
  career_page_about: string | null;
  career_page_whatsapp_url: string | null;
  career_page_instagram_url: string | null;
  career_page_linkedin_url: string | null;
  career_page_show_contact: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  full_time: 'CLT',
  part_time: 'Meio período',
  contract: 'PJ',
  internship: 'Estágio',
};

const TYPE_STYLE: Record<string, string> = {
  full_time: 'bg-violet-50 text-violet-700',
  part_time: 'bg-emerald-50 text-emerald-700',
  contract: 'bg-orange-50 text-orange-700',
  internship: 'bg-rose-50 text-rose-700',
};

function TypeBadge({ type }: { type: string }) {
  const style = TYPE_STYLE[type] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${style}`}>
      {TYPE_LABEL[type] || type}
    </span>
  );
}

const MODALITY_STYLE: Record<string, string> = {
  presencial: 'bg-blue-50 text-blue-700',
  hibrido: 'bg-amber-50 text-amber-700',
  remoto: 'bg-emerald-50 text-emerald-700',
};

const MODALITY_LABEL: Record<string, string> = {
  presencial: 'Presencial',
  hibrido: 'Híbrido',
  remoto: 'Remoto',
};

function ModalityBadge({ modality }: { modality: string }) {
  const style = MODALITY_STYLE[modality] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${style}`}>
      {MODALITY_LABEL[modality] || modality}
    </span>
  );
}

const SENIORITY_LABEL: Record<string, string> = {
  intern: 'Estágio', junior: 'Júnior', mid: 'Pleno',
  senior: 'Sênior', lead: 'Lead', manager: 'Gerente',
  director: 'Diretor', executive: 'Executivo',
};

function SeniorityBadge({ seniority }: { seniority: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-gray-100 text-gray-700">
      {SENIORITY_LABEL[seniority] || seniority}
    </span>
  );
}

function daysAgo(date: string) {
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (d === 0) return 'Hoje';
  if (d === 1) return 'Ontem';
  return `${d}d atrás`;
}

export default function CareerPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const supabase = createClient();

  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<PublicJob | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [org, setOrg] = useState<Pick<PublicJob,
    'org_name' | 'career_page_headline' | 'career_page_logo_url' | 'org_logo_url' |
    'career_page_color' | 'career_page_secondary_color' | 'career_page_banner_url' |
    'career_page_about' | 'career_page_whatsapp_url' | 'career_page_instagram_url' |
    'career_page_linkedin_url' | 'career_page_show_contact' | 'org_industry'
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterModality, setFilterModality] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [navVisible, setNavVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadJobs(); }, [orgSlug]);

  useEffect(() => {
    const onScroll = () => {
      const heroH = heroRef.current?.offsetHeight || 400;
      setNavVisible(window.scrollY > heroH - 80);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_public_jobs_by_org', { p_org_slug: orgSlug });
      if (error) throw error;
      if (!data || data.length === 0) { setNotFound(true); return; }
      setJobs(data as PublicJob[]);
      const first = data[0] as PublicJob;
      setOrg({
        org_name: first.org_name,
        career_page_headline: first.career_page_headline,
        career_page_logo_url: first.career_page_logo_url,
        org_logo_url: first.org_logo_url,
        career_page_color: first.career_page_color,
        career_page_secondary_color: first.career_page_secondary_color,
        career_page_banner_url: first.career_page_banner_url,
        career_page_about: first.career_page_about,
        career_page_whatsapp_url: first.career_page_whatsapp_url,
        career_page_instagram_url: first.career_page_instagram_url,
        career_page_linkedin_url: first.career_page_linkedin_url,
        career_page_show_contact: first.career_page_show_contact,
        org_industry: first.org_industry,
      });
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!selectedJob) return;
    setApplying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push(`/register?redirect=/jobs/${orgSlug}/${selectedJob.id}`); return; }
      router.push(`/candidate/jobs?apply=${selectedJob.id}`);
    } finally {
      setApplying(false);
    }
  };

  const handleShare = async (job: PublicJob) => {
    const url = `${window.location.origin}/jobs/${orgSlug}?vaga=${job.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: job.title, text: `Vaga: ${job.title} — ${job.org_name}`, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const primary = org?.career_page_color || '#141042';
  const secondary = org?.career_page_secondary_color || '#10B981';
  const logoUrl = org?.career_page_logo_url || org?.org_logo_url || null;
  const bannerUrl = org?.career_page_banner_url || null;

  const availableTypes = Array.from(new Set(jobs.map(j => j.employment_type).filter(Boolean))) as string[];
  const availableModalities = Array.from(new Set(jobs.map(j => j.work_modality).filter(Boolean))) as string[];
  const filtered = jobs.filter(j => {
    const matchSearch = !search.trim() ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      (j.location || '').toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || j.employment_type === filterType;
    const matchModality = !filterModality || j.work_modality === filterModality;
    return matchSearch && matchType && matchModality;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-[3px] border-gray-200 animate-spin"
          style={{ borderTopColor: primary }} />
        <p className="text-sm text-gray-400">Carregando vagas...</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
      <div className="text-center max-w-sm px-6">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-10 h-10 text-gray-300" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Página não encontrada</h1>
        <p className="text-gray-500 leading-relaxed">
          Esta empresa não possui página de carreiras pública ou não há vagas abertas no momento.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F5]">

      {/* STICKY NAV */}
      <nav
        className="fixed top-0 inset-x-0 z-30 transition-all duration-300"
        style={{
          transform: navVisible ? 'translateY(0)' : 'translateY(-100%)',
          background: 'rgba(255,255,255,0.93)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl
              ? <img src={logoUrl} alt={org?.org_name} className="h-8 object-contain" />
              : <span className="font-bold text-gray-900">{org?.org_name}</span>
            }
          </div>
          <span className="text-sm font-semibold" style={{ color: primary }}>
            {filtered.length} {filtered.length === 1 ? 'vaga aberta' : 'vagas abertas'}
          </span>
        </div>
      </nav>

      {/* HERO */}
      <div ref={heroRef} className="relative overflow-hidden" style={{ minHeight: bannerUrl ? '320px' : '280px' }}>

        {bannerUrl ? (
          <>
            <img
              src={bannerUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: 'center 30%' }}
            />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(160deg, ${primary}D9 0%, ${primary}88 55%, transparent 100%)` }}
            />
          </>
        ) : (
          <>
            <div className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}ee 55%, ${secondary}66 100%)` }} />
            <div className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
              style={{ background: secondary }} />
            <div className="absolute -bottom-16 -left-16 w-[300px] h-[300px] rounded-full opacity-10 blur-2xl"
              style={{ background: secondary }} />
          </>
        )}

        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-14 flex flex-row items-start justify-between gap-8 h-full"
          style={{ minHeight: 'inherit' }}>

          {/* Logo flutuante sem fundo — lado esquerdo */}
          <div className="shrink-0 pt-1">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={org?.org_name}
                className="h-14 max-w-[220px] object-contain"
                style={{ filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.3))' }}
              />
            ) : (
              <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}>
                <Building2 className="w-6 h-6 text-white" />
                <span className="text-white font-bold text-lg">{org?.org_name}</span>
              </div>
            )}
          </div>

          {/* Texto — lado direito */}
          <div className="text-right">
            {org?.org_industry && (
              <p className="text-xs font-extrabold uppercase tracking-[0.25em] mb-3" style={{ color: secondary }}>
                {org.org_industry}
              </p>
            )}
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-white leading-[1.1] tracking-tight mb-5">
              {org?.career_page_headline || 'Faça parte do time'}
              <br />
              <span style={{ color: secondary }}>{org?.org_name}</span>
            </h1>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
                style={{ background: `${secondary}22`, color: 'white', border: `1.5px solid ${secondary}55` }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: secondary }} />
                {filtered.length} {filtered.length === 1 ? 'vaga aberta' : 'vagas abertas'}
              </span>
              <a href="#vagas"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white transition-colors">
                Ver oportunidades
                <ChevronDown className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Curva de separação */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-[0]">
          <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="w-full h-12" fill="#F7F7F5">
            <path d="M0,48 C480,0 960,0 1440,48 L1440,48 L0,48 Z" />
          </svg>
        </div>
      </div>

      {/* SOBRE A EMPRESA */}
      {org?.career_page_about && (
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-2">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-start gap-5">
              {logoUrl && (
                <img src={logoUrl} alt={org.org_name}
                  className="h-12 w-12 object-contain rounded-xl shrink-0 hidden sm:block"
                  style={{ background: `${primary}08`, padding: '6px' }} />
              )}
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest mb-1" style={{ color: secondary }}>
                  Sobre a empresa
                </p>
                <h2 className="text-xl font-extrabold mb-3" style={{ color: primary }}>{org.org_name}</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-[15px]">
                  {org.career_page_about}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VAGAS */}
      <div id="vagas" className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest mb-1" style={{ color: secondary }}>
              Oportunidades
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: primary }}>
              Vagas abertas
            </h2>
          </div>
          <div className="relative sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cargo, cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 shadow-sm"
              style={{ '--tw-ring-color': `${primary}30` } as React.CSSProperties}
            />
          </div>
        </div>

        {(availableTypes.length > 1 || availableModalities.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => { setFilterType(null); setFilterModality(null); }}
              className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={filterType === null && filterModality === null
                ? { background: primary, color: 'white', boxShadow: `0 2px 10px ${primary}40` }
                : { background: 'white', color: '#6b7280', border: '1px solid #e5e7eb' }}
            >
              Todos ({jobs.length})
            </button>
            {availableTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? null : type)}
                className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                style={filterType === type
                  ? { background: primary, color: 'white', boxShadow: `0 2px 10px ${primary}40` }
                  : { background: 'white', color: '#6b7280', border: '1px solid #e5e7eb' }}
              >
                {TYPE_LABEL[type] || type} ({jobs.filter(j => j.employment_type === type).length})
              </button>
            ))}
            {availableModalities.map(mod => (
              <button
                key={mod}
                onClick={() => setFilterModality(filterModality === mod ? null : mod)}
                className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                style={filterModality === mod
                  ? { background: secondary, color: 'white', boxShadow: `0 2px 10px ${secondary}40` }
                  : { background: 'white', color: '#6b7280', border: '1px solid #e5e7eb' }}
              >
                {MODALITY_LABEL[mod] || mod} ({jobs.filter(j => j.work_modality === mod).length})
              </button>
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <p className="text-xs text-gray-400 mb-4">
            Mostrando{' '}
            <span className="font-semibold text-gray-600">{filtered.length}</span>
            {' '}de{' '}
            <span className="font-semibold text-gray-600">{jobs.length}</span>{' '}
            {jobs.length === 1 ? 'vaga' : 'vagas'}
          </p>
        )}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-4" />
            <p className="font-semibold text-gray-600 mb-1">Nenhuma vaga encontrada</p>
            <p className="text-sm text-gray-400">Tente outro termo ou remova os filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((job, index) => {
              const isNew = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86400000) < 7;
              const isLastOdd = filtered.length % 2 !== 0 && index === filtered.length - 1;
              return (
                <button
                  key={job.id}
                  onClick={() => { setSelectedJob(job); setApplied(false); }}
                  className={`group w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 overflow-hidden${isLastOdd ? ' sm:col-span-2' : ''}`}
                >
                  <div
                    className="h-[2px] w-0 group-hover:w-full transition-all duration-500"
                    style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }}
                  />
                  <div className="px-6 py-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl shrink-0 hidden sm:flex items-center justify-center"
                      style={{ background: `${primary}0D` }}>
                      <Briefcase className="w-5 h-5" style={{ color: primary }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="text-base font-bold text-gray-900">{job.title}</h3>
                        {isNew && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white"
                            style={{ background: secondary }}
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            Nova
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {job.employment_type && <TypeBadge type={job.employment_type} />}
                        {job.work_modality && <ModalityBadge modality={job.work_modality} />}
                        {job.seniority && <SeniorityBadge seniority={job.seniority} />}
                        {job.location && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3.5 h-3.5" />{job.location}
                          </span>
                        )}
                        {job.salary_range && (
                          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: primary }}>
                            <DollarSign className="w-3.5 h-3.5" />{job.salary_range}
                          </span>
                        )}
                        {job.application_deadline && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            Até {new Date(job.application_deadline).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                      {job.description && (
                        <p className="mt-2 text-xs text-gray-400 line-clamp-1 leading-relaxed hidden sm:block">
                          {(job.description_html
                            ? job.description_html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
                            : job.description).substring(0, 130)}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <span className="text-[11px] font-medium text-gray-300">{daysAgo(job.created_at)}</span>
                      <span
                        className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all duration-200"
                        style={{ background: primary }}
                      >
                        Ver vaga
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* BANCO DE TALENTOS */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest mb-1" style={{ color: secondary }}>
              Banco de Talentos
            </p>
            <h3 className="text-xl font-extrabold mb-1" style={{ color: primary }}>
              Não encontrou a vaga ideal?
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Cadastre seu currículo e fique no nosso radar para futuras oportunidades.
            </p>
          </div>
          <div className="flex gap-3 shrink-0 flex-wrap justify-center">
            {org?.career_page_whatsapp_url ? (
              <a
                href={org.career_page_whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-md"
                style={{ background: '#25D366', boxShadow: '0 4px 16px rgba(37,211,102,0.25)' }}
              >
                <MessageCircle className="w-4 h-4" /> Enviar currículo
              </a>
            ) : org?.career_page_linkedin_url ? (
              <a
                href={org.career_page_linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-md"
                style={{ background: '#0077B5', boxShadow: '0 4px 16px rgba(0,119,181,0.25)' }}
              >
                <Linkedin className="w-4 h-4" /> Conectar no LinkedIn
              </a>
            ) : (
              <span
                className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ color: primary, borderColor: `${primary}30`, background: `${primary}08` }}
              >
                Em breve
              </span>
            )}
          </div>
        </div>
      </div>

      {/* FALE CONOSCO */}
      {org?.career_page_show_contact && (
        org?.career_page_whatsapp_url || org?.career_page_instagram_url || org?.career_page_linkedin_url
      ) && (
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <div className="rounded-2xl overflow-hidden relative"
            style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}ee 55%, ${secondary}66 100%)` }}>
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10 blur-2xl"
              style={{ background: secondary }} />
            <div className="relative px-8 py-10 text-center">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] mb-2" style={{ color: secondary }}>
                Conecte-se
              </p>
              <h2 className="text-2xl font-extrabold text-white mb-1">Fale com recrutamento</h2>
              <p className="text-white/60 text-sm mb-8">Tem dúvidas sobre as vagas? Entre em contato.</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {org.career_page_whatsapp_url && (
                  <a href={org.career_page_whatsapp_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
                    style={{ background: '#25D366', boxShadow: '0 4px 16px rgba(37,211,102,0.35)' }}>
                    <MessageCircle className="w-4 h-4" />WhatsApp
                  </a>
                )}
                {org.career_page_instagram_url && (
                  <a href={org.career_page_instagram_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', boxShadow: '0 4px 16px rgba(220,39,67,0.3)' }}>
                    <Instagram className="w-4 h-4" />Instagram
                  </a>
                )}
                {org.career_page_linkedin_url && (
                  <a href={org.career_page_linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
                    style={{ background: '#0077B5', boxShadow: '0 4px 16px rgba(0,119,181,0.35)' }}>
                    <Linkedin className="w-4 h-4" />LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {logoUrl
              ? <img src={logoUrl} alt={org?.org_name} className="h-7 object-contain opacity-50" />
              : <span className="text-sm font-semibold text-gray-400">{org?.org_name}</span>
            }
          </div>
          {org?.career_page_show_contact && (
            <div className="flex items-center gap-2">
              {org.career_page_whatsapp_url && (
                <a href={org.career_page_whatsapp_url} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"
                  aria-label="WhatsApp">
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              )}
              {org.career_page_instagram_url && (
                <a href={org.career_page_instagram_url} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                  aria-label="Instagram">
                  <Instagram className="w-3.5 h-3.5" />
                </a>
              )}
              {org.career_page_linkedin_url && (
                <a href={org.career_page_linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                  aria-label="LinkedIn">
                  <Linkedin className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400">
            Powered by <span className="font-extrabold" style={{ color: primary }}>TALENT</span><span className="font-extrabold text-[#F97316]">FORGE</span>
          </p>
        </div>
      </footer>

      {/* MODAL */}
      {selectedJob && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setSelectedJob(null)} />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="bg-white w-full sm:rounded-2xl shadow-2xl sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden">

              <div className="relative px-6 pt-6 pb-5 shrink-0" style={{ background: primary }}>
                <div
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage: `radial-gradient(circle, ${secondary} 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                  }}
                />
                <div className="relative">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: secondary }}>
                      {selectedJob.org_name}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleShare(selectedJob)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title="Compartilhar"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setSelectedJob(null)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight mb-3">
                    {selectedJob.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedJob.employment_type && <TypeBadge type={selectedJob.employment_type} />}
                    {selectedJob.work_modality && <ModalityBadge modality={selectedJob.work_modality} />}
                    {selectedJob.seniority && <SeniorityBadge seniority={selectedJob.seniority} />}
                    {selectedJob.location && (
                      <span className="flex items-center gap-1 text-xs text-white/70">
                        <MapPin className="w-3 h-3" />{selectedJob.location}
                      </span>
                    )}
                    {selectedJob.application_deadline && (
                      <span className="flex items-center gap-1 text-xs text-white/60">
                        <Clock className="w-3 h-3" />
                        Até {new Date(selectedJob.application_deadline).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {(selectedJob.salary_range || selectedJob.location) && (
                  <div className="flex flex-wrap gap-3 px-6 pt-6">
                    {selectedJob.salary_range && (
                      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                        <DollarSign className="w-4 h-4 shrink-0" style={{ color: primary }} />
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Remuneração</p>
                          <p className="text-sm font-bold text-gray-800">{selectedJob.salary_range}</p>
                        </div>
                      </div>
                    )}
                    {selectedJob.location && (
                      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                        <MapPin className="w-4 h-4 shrink-0" style={{ color: primary }} />
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Localização</p>
                          <p className="text-sm font-bold text-gray-800">{selectedJob.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="px-6 py-6 space-y-8">
                  {(selectedJob.description_html || selectedJob.description) && (
                    <section>
                      <h3 className="text-xs font-extrabold uppercase tracking-widest mb-4" style={{ color: secondary }}>
                        Sobre a vaga
                      </h3>
                      {selectedJob.description_html ? (
                        <div
                          className="prose prose-sm max-w-none text-gray-600 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: selectedJob.description_html }}
                        />
                      ) : (
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm">
                          {selectedJob.description}
                        </p>
                      )}
                    </section>
                  )}
                  {selectedJob.requirements && (
                    <section>
                      <h3 className="text-xs font-extrabold uppercase tracking-widest mb-4" style={{ color: secondary }}>
                        Requisitos
                      </h3>
                      <div className="space-y-2">
                        {selectedJob.requirements.split('\n').filter(Boolean).map((req, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0" style={{ background: primary }} />
                            <p className="text-sm text-gray-600 leading-relaxed">{req.replace(/^[-•*]\s*/, '')}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                  {selectedJob.benefits && (
                    <section>
                      <h3 className="text-xs font-extrabold uppercase tracking-widest mb-4" style={{ color: secondary }}>
                        Benefícios
                      </h3>
                      <div className="space-y-2">
                        {selectedJob.benefits.split('\n').filter(Boolean).map((ben, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: secondary }} />
                            <p className="text-sm text-gray-600 leading-relaxed">{ben.replace(/^[-•*]\s*/, '')}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 bg-white shrink-0">
                {applied ? (
                  <div className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-emerald-600">
                    <CheckCircle className="w-5 h-5" />
                    Candidatura enviada com sucesso!
                  </div>
                ) : (
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                      boxShadow: `0 4px 20px ${primary}35`,
                    }}
                  >
                    {applying ? 'Redirecionando...' : (
                      <>Candidatar-se a esta vaga <ArrowUpRight className="w-4 h-4" /></>
                    )}
                  </button>
                )}
              </div>

            </div>
          </div>
        </>
      )}

    </div>
  );
}
