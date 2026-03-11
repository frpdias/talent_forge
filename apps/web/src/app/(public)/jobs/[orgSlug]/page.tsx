'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MapPin, Clock, Briefcase, Building2, Search, Instagram, Linkedin,
  MessageCircle, X, CheckCircle, Share2, DollarSign, Check, ArrowUpRight,
  ChevronDown, Sparkles, FileText, Users, Star, Lightbulb,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PublicJob {
  id: string;
  org_id: string;
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
  type Testimonial = { id: string; author_name: string; author_role: string; text: string; avatar_color: string; rating: number; };
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  type Tip = { id: string; title: string; summary: string; content: string; };
  const [tips, setTips] = useState<Tip[]>([]);
  const [activeTip, setActiveTip] = useState<Tip | null>(null);
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

      // Buscar depoimentos da org
      if (first.org_id) {
        const { data: tData } = await supabase
          .from('org_testimonials')
          .select('id, author_name, author_role, text, avatar_color, rating')
          .eq('org_id', first.org_id)
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        if (tData && tData.length > 0) setTestimonials(tData);

        // Buscar dicas para candidatos
        const { data: tipData } = await supabase
          .from('org_career_tips')
          .select('id, title, summary, content')
          .eq('org_id', first.org_id)
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        if (tipData && tipData.length > 0) setTips(tipData);
      }
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
            {/* Social links */}
            {(org?.career_page_whatsapp_url || org?.career_page_instagram_url || org?.career_page_linkedin_url) && (
              <div className="flex items-center gap-2 mt-3">
                {org.career_page_whatsapp_url && (
                  <a href={org.career_page_whatsapp_url} target="_blank" rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
                    style={{ background: '#25D366' }}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </a>
                )}
                {org.career_page_instagram_url && (
                  <a href={org.career_page_instagram_url} target="_blank" rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
                    style={{ background: 'linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' }}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12c0 3.259.014 3.668.072 4.948.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24c3.259 0 3.668-.014 4.948-.072 1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.689.072-4.948 0-3.259-.014-3.667-.072-4.947-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 01-2.88 0 1.44 1.44 0 012.88 0z"/>
                    </svg>
                  </a>
                )}
                {org.career_page_linkedin_url && (
                  <a href={org.career_page_linkedin_url} target="_blank" rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm"
                    style={{ background: '#0A66C2' }}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
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

      {/* DEPOIMENTOS */}
      {(testimonials.length > 0) && (
      <div className="bg-gray-50 py-14 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10" style={{ color: primary }}>
            O que dizem sobre nossa empresa
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
                    style={{ background: t.avatar_color }}>
                    {t.author_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: primary }}>{t.author_name}</p>
                    {t.author_role && <p className="text-xs text-gray-400">{t.author_role}</p>}
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-0.5 mt-auto">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} viewBox="0 0 20 20" className={`w-4 h-4 ${i <= t.rating ? 'fill-amber-400' : 'fill-gray-200'}`}>
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* DIVULGAÇÃO + DICAS */}
      <div className="bg-gray-50 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* — Coluna PROCESSO SELETIVO — */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: secondary }}>
                Como funciona
              </p>
              <h2 className="text-2xl font-extrabold mb-2" style={{ color: primary }}>
                Nosso processo seletivo
              </h2>
              <p className="text-gray-400 text-sm mb-8">Transparência em cada etapa — do cadastro à proposta.</p>

              {/* Steps */}
              <div className="relative">
                {/* linha vertical */}
                <div className="absolute left-[18px] top-6 bottom-6 w-px bg-gray-200" />
                <div className="space-y-5">
                  {[
                    { step: '01', title: 'Candidatura', desc: 'Você se inscreve pela vaga e preenche o cadastro com seus dados e experiências.' },
                    { step: '02', title: 'Triagem de currículo', desc: 'Nossa equipe analisa o perfil e entra em contato em até 5 dias úteis.' },
                    { step: '03', title: 'Entrevista inicial', desc: 'Conversa com RH para entender sua trajetória, expectativas e fit cultural.' },
                    { step: '04', title: 'Entrevista técnica', desc: 'Bate-papo com o time da área sobre habilidades e cenários práticos.' },
                    { step: '05', title: 'Proposta e integração', desc: 'Apresentação da oferta, datas e tudo que você precisa saber para começar.' },
                  ].map(({ step, title, desc }, i, arr) => (
                    <div key={step} className="flex gap-4 items-start relative">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 text-white text-xs font-bold"
                        style={{ background: primary }}>
                        {step}
                      </div>
                      <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex-1 ${i < arr.length - 1 ? 'mb-1' : ''}`}>
                        <p className="font-semibold text-sm mb-0.5" style={{ color: primary }}>{title}</p>
                        <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Links sociais */}
              {org?.career_page_show_contact && (
                org?.career_page_whatsapp_url || org?.career_page_instagram_url || org?.career_page_linkedin_url
              ) && (
                <div className="mt-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Dúvidas? Fale conosco</p>
                  <div className="flex gap-3 flex-wrap">
                    {org.career_page_whatsapp_url && (
                      <a href={org.career_page_whatsapp_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 border bg-white"
                        style={{ color: '#16a34a', borderColor: '#bbf7d0' }}>
                        <MessageCircle className="w-4 h-4" />WhatsApp
                      </a>
                    )}
                    {org.career_page_instagram_url && (
                      <a href={org.career_page_instagram_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 border bg-white"
                        style={{ color: '#be185d', borderColor: '#fbcfe8' }}>
                        <Instagram className="w-4 h-4" />Instagram
                      </a>
                    )}
                    {org.career_page_linkedin_url && (
                      <a href={org.career_page_linkedin_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 border bg-white"
                        style={{ color: '#0369a1', borderColor: '#bae6fd' }}>
                        <Linkedin className="w-4 h-4" />LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* — Coluna DICAS — */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: secondary }}>
                Prepare-se
              </p>
              <h2 className="text-2xl font-extrabold mb-6" style={{ color: primary }}>
                Dicas para se destacar
              </h2>
              <div className="space-y-3">
                {tips.length > 0 ? tips.map((tip) => (
                  <button key={tip.id} onClick={() => setActiveTip(tip)}
                    className="w-full flex gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all text-left cursor-pointer group">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${secondary}15` }}>
                      <Lightbulb className="w-4 h-4" style={{ color: secondary }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm mb-0.5" style={{ color: primary }}>{tip.title}</p>
                      <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{tip.summary}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 mt-0.5" />
                  </button>
                )) : [
                  { icon: FileText, title: 'Personalize seu currículo', desc: 'Destaque experiências relevantes para a vaga e use as palavras-chave do anúncio.' },
                  { icon: Search, title: 'Pesquise a empresa', desc: 'Conheça nossos produtos, valores e missão antes de ir para a entrevista.' },
                  { icon: Lightbulb, title: 'Seja direto e objetivo', desc: 'Respostas claras com exemplos concretos da sua trajetória fazem toda a diferença.' },
                  { icon: CheckCircle, title: 'Demonstre interesse real', desc: 'Faça perguntas sobre o time, os projetos e possibilidades de crescimento.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${secondary}15` }}>
                      <Icon className="w-4 h-4" style={{ color: secondary }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-0.5" style={{ color: primary }}>{title}</p>
                      <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* FOOTER */}

      {/* MODAL DICA */}
      {activeTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(20,16,66,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setActiveTip(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${secondary}15` }}>
                  <Lightbulb className="w-5 h-5" style={{ color: secondary }} />
                </div>
                <h3 className="font-extrabold text-lg leading-tight" style={{ color: primary }}>{activeTip.title}</h3>
              </div>
              <button onClick={() => setActiveTip(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{activeTip.content}</p>
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
