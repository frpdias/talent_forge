'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, MapPin, Briefcase, Clock, Building2, SlidersHorizontal,
  X, Loader2, ArrowUpRight, Zap, Users, Globe2,
  Monitor, Heart, ShoppingBag, GraduationCap, BarChart2, Code2,
  Wrench, BookOpen, Home, TrendingUp, Check,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GlobalJob {
  id: string;
  title: string;
  location: string | null;
  employment_type: string | null;
  work_modality: string | null;
  seniority: string | null;
  salary_range: string | null;
  created_at: string;
  org_id: string;
  org_name: string;
  org_slug: string;
  org_industry: string | null;
  org_logo_url: string | null;
  description?: string | null;
}

// ─── Lookup maps ──────────────────────────────────────────────────────────────

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

// Áreas com ícone e cor
const AREA_SHORTCUTS = [
  { label: 'Tecnologia', value: 'Tecnologia', icon: Code2 },
  { label: 'Administrativo', value: 'Administrativo', icon: Briefcase },
  { label: 'Saúde', value: 'Saúde', icon: Heart },
  { label: 'Marketing', value: 'Marketing', icon: TrendingUp },
  { label: 'Educação', value: 'Educação', icon: GraduationCap },
  { label: 'Vendas', value: 'Vendas', icon: BarChart2 },
  { label: 'RH', value: 'Recursos Humanos', icon: Users },
  { label: 'Engenharia', value: 'Engenharia', icon: Wrench },
  { label: 'Varejo', value: 'Varejo', icon: ShoppingBag },
  { label: 'TI', value: 'TI', icon: Monitor },
  { label: 'Jurídico', value: 'Jurídico', icon: BookOpen },
  { label: 'Imóveis', value: 'Imóveis', icon: Home },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(date: string) {
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (d === 0) return 'Hoje';
  if (d === 1) return 'Ontem';
  if (d < 7) return `${d}d atrás`;
  if (d < 30) return `${Math.floor(d / 7)}sem`;
  return `${Math.floor(d / 30)}m atrás`;
}

function isNew(date: string) {
  return (Date.now() - new Date(date).getTime()) / 86400000 < 3;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OrgAvatar({ name, logoUrl, size = 'md' }: { name: string; logoUrl: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-11 h-11 text-sm';
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

function FilterCheckbox({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
        active
          ? 'bg-[#141042] text-white font-medium'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <span>{label}</span>
      {active && <Check className="h-3.5 w-3.5 shrink-0" />}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VagasPage() {
  const supabase = createClient();
  const [jobs, setJobs] = useState<GlobalJob[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterModality, setFilterModality] = useState<string | null>(null);
  const [filterIndustry, setFilterIndustry] = useState<string | null>(null);
  const [filterSeniority, setFilterSeniority] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => { loadJobs(); }, []);

  async function loadJobs() {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_all_public_jobs');
      if (error) throw error;
      const mapped: GlobalJob[] = (data || []).map((j: any) => ({
        id: j.id,
        title: j.title,
        location: j.location,
        employment_type: j.employment_type,
        work_modality: j.work_modality,
        seniority: j.seniority,
        salary_range: j.salary_range,
        created_at: j.created_at,
        org_id: j.org_id,
        org_name: j.org_name ?? 'Empresa',
        org_slug: j.org_slug ?? '',
        org_industry: j.org_industry ?? null,
        org_logo_url: j.org_logo_url ?? null,
        description: j.description ?? null,
      }));
      setJobs(mapped);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  const industries = useMemo(() =>
    Array.from(new Set(jobs.map(j => j.org_industry).filter(Boolean))).sort() as string[],
    [jobs]
  );
  const orgCount = useMemo(() => new Set(jobs.map(j => j.org_id)).size, [jobs]);
  const remoteCount = useMemo(() => jobs.filter(j => j.work_modality === 'remoto').length, [jobs]);

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      const q = search.toLowerCase().trim();
      const loc = locationSearch.toLowerCase().trim();
      const matchSearch = !q ||
        j.title.toLowerCase().includes(q) ||
        j.org_name.toLowerCase().includes(q) ||
        (j.org_industry || '').toLowerCase().includes(q);
      const matchLocation = !loc || (j.location || '').toLowerCase().includes(loc);
      const matchType = !filterType || j.employment_type === filterType;
      const matchModality = !filterModality || j.work_modality === filterModality;
      const matchIndustry = !filterIndustry || j.org_industry === filterIndustry;
      const matchSeniority = !filterSeniority || j.seniority === filterSeniority;
      return matchSearch && matchLocation && matchType && matchModality && matchIndustry && matchSeniority;
    });
  }, [jobs, search, locationSearch, filterType, filterModality, filterIndustry, filterSeniority]);

  const activeFilters = [filterType, filterModality, filterIndustry, filterSeniority].filter(Boolean).length;

  function clearFilters() {
    setFilterType(null); setFilterModality(null);
    setFilterIndustry(null); setFilterSeniority(null);
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] font-sans">

      {/* ── HEADER ── */}
      <header className="bg-[#141042] sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-md">
              <Zap className="h-[18px] w-[18px] text-white" />
            </div>
            <div className="hidden sm:flex items-baseline gap-0.5">
              <span className="text-white font-semibold text-lg tracking-tight">TALENT</span>
              <span className="text-[#F97316] font-bold text-lg tracking-wider">FORGE</span>
            </div>
            <span className="text-white/40 text-sm hidden md:block">·</span>
            <span className="text-white/60 text-xs font-medium uppercase tracking-wider hidden md:block">Vagas</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            <Link href="/register?type=recruiter"
              className="text-sm text-white/60 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all">
              Para Recrutadores
            </Link>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/login"
              className="text-sm text-white/70 hover:text-white transition-colors hidden sm:block px-3 py-2 rounded-lg hover:bg-white/10">
              Entrar
            </Link>
            <Link href="/register"
              className="text-sm font-semibold bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white px-5 py-2 rounded-lg transition-all shadow-md hover:shadow-lg">
              Cadastrar-se
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-[#141042] via-[#1a1565] to-[#0d0b2e] pt-12 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-xs font-medium text-white/80 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              {loading ? 'Carregando...' : `${jobs.length} vagas abertas agora`}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3">
              Encontre a vaga ideal
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-[#3B82F6]">
                para o seu perfil
              </span>
            </h1>
            <p className="text-white/60 text-base sm:text-lg max-w-xl mx-auto">
              Conectamos candidatos às melhores oportunidades de{' '}
              <span className="text-white/80 font-medium">{loading ? '...' : orgCount} empresas</span> em todo o Brasil.
            </p>
          </div>

          {/* Search box */}
          <div className="bg-white rounded-2xl shadow-2xl p-3 flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto">
            <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 focus-within:border-[#141042]/30 focus-within:bg-white transition-all">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Cargo, empresa ou área..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 focus-within:border-[#141042]/30 focus-within:bg-white transition-all sm:w-52">
              <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Cidade ou estado..."
                value={locationSearch}
                onChange={e => setLocationSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
              />
              {locationSearch && (
                <button onClick={() => setLocationSearch('')}>
                  <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <button className="bg-gradient-to-r from-[#141042] to-[#1F4ED8] hover:from-[#1a1565] hover:to-[#1e40af] text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg whitespace-nowrap">
              Buscar vagas
            </button>
          </div>

          {/* Stats strip */}
          <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
            {[
              { label: 'vagas abertas', value: `${jobs.length}`, icon: Briefcase },
              { label: 'empresas', value: `${orgCount}`, icon: Building2 },
              { label: 'vagas remotas', value: `${remoteCount}`, icon: Globe2 },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 text-white/70">
                <s.icon className="h-4 w-4 text-[#10B981]" />
                <span>
                  <span className="font-bold text-white">{loading ? '—' : s.value}</span>{' '}
                  <span className="text-sm">{s.label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY SHORTCUTS ── */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1.5 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={clearFilters}
              className={`flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                !filterIndustry
                  ? 'bg-[#141042] text-white border-[#141042]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              Todas
            </button>
            {AREA_SHORTCUTS.map(area => {
              const active = filterIndustry === area.value;
              return (
                <button
                  key={area.value}
                  onClick={() => setFilterIndustry(active ? null : area.value)}
                  className={`flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    active
                      ? 'bg-[#141042] text-white border-[#141042]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <area.icon className={`h-3.5 w-3.5 ${active ? 'text-white' : 'text-gray-500'}`} />
                  {area.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT: SIDEBAR + JOBS ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7">
        <div className="flex gap-6 items-start">

          {/* ── SIDEBAR FILTERS (desktop) ── */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-[112px]">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-[#141042]" />
                  <span className="font-semibold text-gray-900 text-sm">Filtros</span>
                </div>
                {activeFilters > 0 && (
                  <button onClick={clearFilters} className="text-xs text-[#F97316] hover:text-orange-700 font-medium transition-colors">
                    Limpar ({activeFilters})
                  </button>
                )}
              </div>

              <div className="p-4 space-y-5">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Tipo de contrato</p>
                  <div className="space-y-0.5">
                    {(['full_time', 'part_time', 'contract', 'internship'] as const).map(t => (
                      <FilterCheckbox key={t} label={TYPE_LABEL[t]} active={filterType === t}
                        onClick={() => setFilterType(filterType === t ? null : t)} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Modalidade</p>
                  <div className="space-y-0.5">
                    {(['presencial', 'hibrido', 'remoto'] as const).map(m => (
                      <FilterCheckbox key={m} label={MODALITY_LABEL[m]} active={filterModality === m}
                        onClick={() => setFilterModality(filterModality === m ? null : m)} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Nível</p>
                  <div className="space-y-0.5">
                    {(['intern', 'junior', 'mid', 'senior', 'lead', 'manager'] as const).map(s => (
                      <FilterCheckbox key={s} label={SENIORITY_LABEL[s]} active={filterSeniority === s}
                        onClick={() => setFilterSeniority(filterSeniority === s ? null : s)} />
                    ))}
                  </div>
                </div>
                {industries.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Setor</p>
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

            {/* Recruiter CTA */}
            <div className="mt-4 bg-gradient-to-br from-[#141042] to-[#1a1565] rounded-2xl p-5 text-white">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                <Zap className="h-5 w-5 text-[#10B981]" />
              </div>
              <p className="font-bold text-sm mb-1">Você é recrutador?</p>
              <p className="text-white/60 text-xs leading-relaxed mb-4">
                Publique vagas e encontre os melhores candidatos com IA.
              </p>
              <Link href="/register?type=recruiter"
                className="block text-center bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold py-2.5 rounded-xl transition-colors">
                Publicar vagas grátis
              </Link>
            </div>
          </aside>

          {/* ── JOB LIST ── */}
          <div className="flex-1 min-w-0">
            {/* List header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-base font-semibold text-gray-900">
                  {loading ? (
                    <span className="text-gray-400">Carregando...</span>
                  ) : (
                    <>
                      <span className="text-[#141042]">{filtered.length}</span>{' '}
                      {filtered.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
                    </>
                  )}
                </h2>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {filterType && (
                    <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 border border-violet-200 text-xs font-medium px-2.5 py-1 rounded-full">
                      {TYPE_LABEL[filterType]}<button onClick={() => setFilterType(null)}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                  {filterModality && (
                    <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-700 border border-teal-200 text-xs font-medium px-2.5 py-1 rounded-full">
                      {MODALITY_LABEL[filterModality]}<button onClick={() => setFilterModality(null)}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                  {filterIndustry && (
                    <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 border border-orange-200 text-xs font-medium px-2.5 py-1 rounded-full">
                      {filterIndustry}<button onClick={() => setFilterIndustry(null)}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                  {filterSeniority && (
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-1 rounded-full">
                      {SENIORITY_LABEL[filterSeniority]}<button onClick={() => setFilterSeniority(null)}><X className="h-3 w-3" /></button>
                    </span>
                  )}
                </div>
              </div>

              {/* Mobile filter toggle */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-200 px-3.5 py-2 rounded-xl bg-white hover:border-gray-400 transition-all"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {activeFilters > 0 && (
                  <span className="bg-[#141042] text-white text-[10px] font-bold rounded-full flex items-center justify-center" style={{ width: 18, height: 18 }}>
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#141042]/5 flex items-center justify-center">
                  <Loader2 className="h-7 w-7 text-[#141042] animate-spin" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Buscando as melhores oportunidades...</p>
              </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <Briefcase className="h-8 w-8 text-gray-300" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-gray-800 mb-1">Nenhuma vaga encontrada</p>
                  <p className="text-sm text-gray-500">Tente outros termos ou remova os filtros aplicados</p>
                </div>
                {activeFilters > 0 && (
                  <button onClick={clearFilters} className="text-sm font-medium text-[#F97316] hover:text-orange-700 transition-colors">
                    Limpar filtros
                  </button>
                )}
              </div>
            )}

            {/* Job cards */}
            {!loading && filtered.length > 0 && (
              <div className="space-y-3">
                {filtered.map(job => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.org_slug}/${job.id}`}
                    className="group block bg-white rounded-2xl border border-gray-100 hover:border-[#141042]/25 hover:shadow-lg transition-all duration-200 overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <OrgAvatar name={job.org_name} logoUrl={job.org_logo_url} size="lg" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-xs font-medium text-gray-400 truncate">{job.org_name}</p>
                                {isNew(job.created_at) && (
                                  <span className="inline-flex items-center gap-1 bg-[#10B981]/10 text-[#059669] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#10B981]/20 shrink-0">
                                    <span className="w-1 h-1 rounded-full bg-[#10B981]" />
                                    NOVA
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-[#141042] text-base leading-snug group-hover:text-[#1F4ED8] transition-colors line-clamp-2">
                                {job.title}
                              </h3>
                            </div>
                            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-gray-50 group-hover:bg-[#141042] transition-colors">
                              <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mt-2 mb-3 flex-wrap">
                            {job.location && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                                {job.location}
                              </span>
                            )}
                            {job.salary_range && (
                              <span className="text-xs font-semibold text-[#10B981]">{job.salary_range}</span>
                            )}
                            {job.org_industry && (
                              <span className="text-xs text-gray-400">{job.org_industry}</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex flex-wrap gap-1.5">
                              {job.employment_type && (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${TYPE_COLOR[job.employment_type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                  {TYPE_LABEL[job.employment_type] || job.employment_type}
                                </span>
                              )}
                              {job.work_modality && (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${MODALITY_COLOR[job.work_modality] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                  {MODALITY_LABEL[job.work_modality] || job.work_modality}
                                </span>
                              )}
                              {job.seniority && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                  {SENIORITY_LABEL[job.seniority] || job.seniority}
                                </span>
                              )}
                            </div>
                            <span className="flex items-center gap-1 text-xs text-gray-400 font-medium shrink-0">
                              <Clock className="h-3 w-3" />
                              {daysAgo(job.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Accent bar on hover */}
                    <div className="h-[3px] bg-gradient-to-r from-[#141042] via-[#3B82F6] to-[#10B981] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </Link>
                ))}

                <div className="pt-4 pb-8 text-center">
                  <p className="text-xs text-gray-400">
                    Mostrando <span className="font-semibold text-gray-600">{filtered.length}</span> de{' '}
                    <span className="font-semibold text-gray-600">{jobs.length}</span> vagas disponíveis
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
                  <button onClick={clearFilters} className="text-sm text-[#F97316] font-medium">Limpar</button>
                )}
                <button onClick={() => setShowMobileFilters(false)}
                  className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {[
                { title: 'Tipo de contrato', items: (['full_time', 'part_time', 'contract', 'internship'] as const).map(t => ({ key: t, label: TYPE_LABEL[t], active: filterType === t, toggle: () => setFilterType(filterType === t ? null : t) })) },
                { title: 'Modalidade', items: (['presencial', 'hibrido', 'remoto'] as const).map(m => ({ key: m, label: MODALITY_LABEL[m], active: filterModality === m, toggle: () => setFilterModality(filterModality === m ? null : m) })) },
                { title: 'Nível', items: (['intern', 'junior', 'mid', 'senior', 'lead', 'manager'] as const).map(s => ({ key: s, label: SENIORITY_LABEL[s], active: filterSeniority === s, toggle: () => setFilterSeniority(filterSeniority === s ? null : s) })) },
              ].map(group => (
                <div key={group.title}>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{group.title}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map(item => (
                      <button key={item.key} onClick={item.toggle}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
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
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Setor</p>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {industries.map(ind => (
                      <button key={ind} onClick={() => setFilterIndustry(filterIndustry === ind ? null : ind)}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                          filterIndustry === ind ? 'bg-[#141042] text-white border-[#141042]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}>
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setShowMobileFilters(false)}
                className="w-full bg-[#141042] text-white font-semibold py-4 rounded-2xl text-sm transition-colors hover:bg-[#1a1565] mt-2">
                Ver {filtered.length} {filtered.length === 1 ? 'vaga' : 'vagas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="bg-[#141042] mt-10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-white font-semibold text-base tracking-tight">TALENT</span>
              <span className="text-[#F97316] font-bold text-base tracking-wider">FORGE</span>
            </div>
          </div>
          <p className="text-white/40 text-sm text-center">
            © {new Date().getFullYear()} TalentForge · Conectando talentos às melhores oportunidades
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-white/50 hover:text-white/80 text-sm transition-colors">Entrar</Link>
            <Link href="/register" className="text-white/50 hover:text-white/80 text-sm transition-colors">Cadastrar</Link>
            <Link href="/register?type=recruiter" className="text-[#10B981] hover:text-[#34D399] text-sm font-medium transition-colors">
              Para empresas
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}



