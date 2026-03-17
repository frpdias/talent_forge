'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, MapPin, Briefcase, Clock, Building2, SlidersHorizontal,
  X, ChevronRight, Sparkles, Loader2, ArrowUpRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
}

const TYPE_LABEL: Record<string, string> = {
  full_time: 'CLT',
  part_time: 'Meio período',
  contract: 'PJ',
  internship: 'Estágio',
};

const TYPE_COLOR: Record<string, string> = {
  full_time: 'bg-violet-50 text-violet-700 border-violet-200',
  part_time: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  contract: 'bg-orange-50 text-orange-700 border-orange-200',
  internship: 'bg-rose-50 text-rose-700 border-rose-200',
};

const MODALITY_LABEL: Record<string, string> = {
  presencial: 'Presencial',
  hibrido: 'Híbrido',
  remoto: 'Remoto',
};

const MODALITY_COLOR: Record<string, string> = {
  presencial: 'bg-blue-50 text-blue-700 border-blue-200',
  hibrido: 'bg-amber-50 text-amber-700 border-amber-200',
  remoto: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const SENIORITY_LABEL: Record<string, string> = {
  intern: 'Estágio', junior: 'Júnior', mid: 'Pleno',
  senior: 'Sênior', lead: 'Lead', manager: 'Gerente',
  director: 'Diretor', executive: 'Executivo',
};

function daysAgo(date: string) {
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (d === 0) return 'Hoje';
  if (d === 1) return 'Ontem';
  if (d < 7) return `${d}d atrás`;
  if (d < 30) return `${Math.floor(d / 7)}sem atrás`;
  return `${Math.floor(d / 30)}m atrás`;
}

function OrgAvatar({ name, logoUrl, size = 'md' }: { name: string; logoUrl: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-sm';
  if (logoUrl) {
    return (
      <div className={`${sz} rounded-xl overflow-hidden shrink-0 bg-white border border-[#E5E5DC] flex items-center justify-center`}>
        <img src={logoUrl} alt={name} className="w-full h-full object-contain p-1" />
      </div>
    );
  }
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['bg-violet-100 text-violet-700', 'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-teal-100 text-teal-700'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`${sz} ${color} rounded-xl flex items-center justify-center font-bold shrink-0`}>
      {initials}
    </div>
  );
}

export default function VagasPage() {
  const supabase = createClient();
  const [jobs, setJobs] = useState<GlobalJob[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterModality, setFilterModality] = useState<string | null>(null);
  const [filterIndustry, setFilterIndustry] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

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
      }));

      setJobs(mapped);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  const industries = useMemo(() =>
    Array.from(new Set(jobs.map(j => j.org_industry).filter(Boolean))) as string[],
    [jobs]
  );

  const filtered = useMemo(() => {
    return jobs.filter(j => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q ||
        j.title.toLowerCase().includes(q) ||
        j.org_name.toLowerCase().includes(q) ||
        (j.location || '').toLowerCase().includes(q);
      const matchType = !filterType || j.employment_type === filterType;
      const matchModality = !filterModality || j.work_modality === filterModality;
      const matchIndustry = !filterIndustry || j.org_industry === filterIndustry;
      return matchSearch && matchType && matchModality && matchIndustry;
    });
  }, [jobs, search, filterType, filterModality, filterIndustry]);

  const activeFilters = [filterType, filterModality, filterIndustry].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Header */}
      <header className="bg-[#141042] sticky top-0 z-20 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-[#10B981] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg hidden sm:block">TalentForge</span>
            <span className="text-white/50 text-sm hidden sm:block">·</span>
            <span className="text-white/70 text-sm hidden sm:block">Vagas</span>
          </div>

          {/* Search bar no header (desktop) */}
          <div className="flex-1 max-w-xl hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder="Buscar vagas, empresas ou localidades..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/10 border border-white/15 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 focus:bg-white/15 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5 text-white/50 hover:text-white/80 transition-colors" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="text-sm text-white/70 hover:text-white transition-colors hidden sm:block"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg transition-colors"
            >
              Candidatar-se
            </Link>
          </div>
        </div>
      </header>

      {/* Hero strip */}
      <div className="bg-[#141042] pb-8 pt-2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center pt-4 pb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              Encontre sua próxima oportunidade
            </h1>
            <p className="text-white/60 text-sm">
              {loading ? '...' : `${jobs.length} vagas abertas em ${new Set(jobs.map(j => j.org_id)).size} empresas`}
            </p>
          </div>

          {/* Search mobile */}
          <div className="md:hidden mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder="Buscar vagas ou empresas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/10 border border-white/15 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters bar */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {/* Toggle filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              showFilters || activeFilters > 0
                ? 'bg-[#141042] text-white border-[#141042]'
                : 'bg-white text-[#444] border-[#E5E5DC] hover:border-[#141042]/30'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeFilters > 0 && (
              <span className="bg-[#10B981] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>

          {/* Active filter chips */}
          {filterType && (
            <button
              onClick={() => setFilterType(null)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-100 text-violet-700 border border-violet-200 text-sm font-medium"
            >
              {TYPE_LABEL[filterType] || filterType}
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {filterModality && (
            <button
              onClick={() => setFilterModality(null)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 text-sm font-medium"
            >
              {MODALITY_LABEL[filterModality] || filterModality}
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {filterIndustry && (
            <button
              onClick={() => setFilterIndustry(null)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 text-sm font-medium"
            >
              {filterIndustry}
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {activeFilters > 0 && (
            <button
              onClick={() => { setFilterType(null); setFilterModality(null); setFilterIndustry(null); }}
              className="text-sm text-[#94A3B8] hover:text-[#444] transition-colors px-2"
            >
              Limpar tudo
            </button>
          )}

          <div className="ml-auto text-sm text-[#94A3B8]">
            {!loading && (
              <span>
                <span className="font-semibold text-[#141042]">{filtered.length}</span>{' '}
                {filtered.length === 1 ? 'vaga' : 'vagas'}
              </span>
            )}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-[#E5E5DC] p-5 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Tipo */}
            <div>
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2.5">Tipo de contrato</p>
              <div className="flex flex-wrap gap-2">
                {(['full_time', 'part_time', 'contract', 'internship'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(filterType === t ? null : t)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      filterType === t
                        ? TYPE_COLOR[t].replace('border-', 'border-2 border-') + ' font-semibold'
                        : 'bg-[#FAFAF8] border-[#E5E5DC] text-[#666] hover:border-[#141042]/20'
                    }`}
                  >
                    {TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Modalidade */}
            <div>
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2.5">Modalidade</p>
              <div className="flex flex-wrap gap-2">
                {(['presencial', 'hibrido', 'remoto'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setFilterModality(filterModality === m ? null : m)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      filterModality === m
                        ? MODALITY_COLOR[m].replace('border-', 'border-2 border-') + ' font-semibold'
                        : 'bg-[#FAFAF8] border-[#E5E5DC] text-[#666] hover:border-[#141042]/20'
                    }`}
                  >
                    {MODALITY_LABEL[m]}
                  </button>
                ))}
              </div>
            </div>

            {/* Setor */}
            {industries.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2.5">Setor</p>
                <div className="flex flex-wrap gap-2">
                  {industries.slice(0, 8).map(ind => (
                    <button
                      key={ind}
                      onClick={() => setFilterIndustry(filterIndustry === ind ? null : ind)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        filterIndustry === ind
                          ? 'bg-amber-100 border-amber-400 text-amber-800 font-semibold'
                          : 'bg-[#FAFAF8] border-[#E5E5DC] text-[#666] hover:border-[#141042]/20'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Job list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-[#141042] animate-spin" />
            <p className="text-sm text-[#94A3B8]">Carregando vagas...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#F0F0EA] flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-[#BCBCB4]" />
            </div>
            <p className="text-base font-semibold text-[#444]">Nenhuma vaga encontrada</p>
            <p className="text-sm text-[#94A3B8]">Tente outros termos ou remova os filtros</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(job => (
              <Link
                key={job.id}
                href={`/jobs/${job.org_slug}/${job.id}`}
                className="group bg-white rounded-xl border border-[#E5E5DC] p-5 hover:border-[#141042]/30 hover:shadow-md transition-all duration-200 flex flex-col gap-3"
              >
                {/* Header card */}
                <div className="flex items-start gap-3">
                  <OrgAvatar name={job.org_name} logoUrl={job.org_logo_url} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#94A3B8] truncate">{job.org_name}</p>
                    <h3 className="font-semibold text-[#141042] text-sm leading-tight mt-0.5 group-hover:text-[#141042] line-clamp-2">
                      {job.title}
                    </h3>
                  </div>
                  <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="h-4 w-4 text-[#141042]" />
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {job.employment_type && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${TYPE_COLOR[job.employment_type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {TYPE_LABEL[job.employment_type] || job.employment_type}
                    </span>
                  )}
                  {job.work_modality && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${MODALITY_COLOR[job.work_modality] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {MODALITY_LABEL[job.work_modality] || job.work_modality}
                    </span>
                  )}
                  {job.seniority && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-gray-100 text-gray-600 border-gray-200">
                      {SENIORITY_LABEL[job.seniority] || job.seniority}
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-1">
                  <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[140px]">{job.location}</span>
                      </span>
                    )}
                    {job.salary_range && (
                      <span className="text-[#10B981] font-medium">{job.salary_range}</span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-[#BCBCB4]">
                    <Clock className="h-3 w-3" />
                    {daysAgo(job.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <p className="text-center text-xs text-[#BCBCB4] mt-10 pb-6">
            Mostrando {filtered.length} de {jobs.length} vagas · Powered by{' '}
            <span className="font-semibold text-[#141042]">TalentForge</span>
          </p>
        )}
      </div>
    </div>
  );
}
