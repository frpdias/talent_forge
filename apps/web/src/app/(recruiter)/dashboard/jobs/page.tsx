'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Eye,
  MapPin,
  DollarSign,
  Clock,
  Users,
  LayoutGrid,
  List,
  Copy,
  Archive,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react';
import { JobDetailsModal } from '@/components/jobs/JobDetailsModal';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { PublicationBadges } from '@/components/publisher/PublicationStatus';
import { NewJobModal } from '@/components/jobs/NewJobModal';
import { useOrgStore } from '@/lib/store';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  employment_type: string;
  seniority_level?: string;
  is_remote?: boolean;
  salary_min?: number;
  salary_max?: number;
  status: 'open' | 'on_hold' | 'closed';
  application_deadline?: string;
  applications_count?: number;
  hire_rate?: number;
  avg_time_to_hire?: number;
  stage_counts?: Record<string, number>;
  created_at: string;
  org_id?: string;
  slug?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; stripe: string; iconBg: string; iconColor: string }> = {
  open:    { label: 'Ativa',    color: 'bg-green-50 text-green-700 border-green-200',  dot: 'bg-green-500',  stripe: 'bg-green-500',  iconBg: 'bg-green-50',  iconColor: 'text-green-600' },
  on_hold: { label: 'Rascunho', color: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-400',  stripe: 'bg-amber-400',  iconBg: 'bg-amber-50',  iconColor: 'text-amber-600' },
  closed:  { label: 'Fechada',  color: 'bg-gray-100 text-gray-500 border-gray-200',    dot: 'bg-gray-400',   stripe: 'bg-gray-300',   iconBg: 'bg-gray-100',  iconColor: 'text-gray-400'  },
};

const SENIORITY_LABELS: Record<string, string> = {
  junior: 'Júnior', mid: 'Pleno', senior: 'Sênior', lead: 'Lead', manager: 'Gerente',
};

const TYPE_LABELS: Record<string, string> = {
  clt: 'CLT', pj: 'PJ', internship: 'Estágio', freelancer: 'Freelancer', temporary: 'Temporário',
};

function daysOpen(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
}

function daysUntilDeadline(deadline?: string): number | null {
  if (!deadline) return null;
  return Math.floor((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function JobsPage() {
  const { currentOrg } = useOrgStore();
  const supabase = createClient();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [modalityFilter, setModalityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'applications' | 'title'>('date');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [pubsByJob, setPubsByJob] = useState<Map<string, any[]>>(new Map());
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [orgSlug, setOrgSlug] = useState<string>('');

  useEffect(() => {
    loadJobs();
  }, [statusFilter, currentOrg?.id]);

  useEffect(() => {
    if (currentOrg?.id) {
      supabase.from('organizations').select('slug').eq('id', currentOrg.id).single()
        .then(({ data }: { data: { slug?: string } | null }) => { if (data?.slug) setOrgSlug(data.slug); });
    }
  }, [currentOrg?.id]);

  async function loadJobs() {
    if (!currentOrg?.id) return;
    try {
      setLoading(true);
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') query = query.eq('status', statusFilter);

      const { data, error } = await query;
      if (error) throw error;

      const jobIds = (data || []).map((j: any) => j.id);

      if (jobIds.length > 0) {
        // Aplicações por vaga
        const { data: applications } = await supabase
          .from('applications')
          .select('job_id, status, current_stage_id, created_at, updated_at, pipeline_stages(name)')
          .in('job_id', jobIds);

        const totals = new Map<string, number>();
        const hires = new Map<string, number>();
        const durations = new Map<string, number[]>();
        const stageCounts = new Map<string, Record<string, number>>();

        (applications || []).forEach((app: any) => {
          const jid = app.job_id;
          totals.set(jid, (totals.get(jid) || 0) + 1);

          // Stage counts (mini funil)
          const stageName = app.pipeline_stages?.name || app.status;
          if (!stageCounts.has(jid)) stageCounts.set(jid, {});
          const sc = stageCounts.get(jid)!;
          sc[stageName] = (sc[stageName] || 0) + 1;

          if (app.status === 'hired') {
            hires.set(jid, (hires.get(jid) || 0) + 1);
            if (app.created_at && app.updated_at) {
              const days = Math.round(
                (new Date(app.updated_at).getTime() - new Date(app.created_at).getTime()) /
                (1000 * 60 * 60 * 24)
              );
              const list = durations.get(jid) || [];
              list.push(days);
              durations.set(jid, list);
            }
          }
        });

        const enriched = (data || []).map((job: any) => {
          const total = totals.get(job.id) || 0;
          const hired = hires.get(job.id) || 0;
          const durationList = durations.get(job.id);
          const avgDays = durationList?.length
            ? Math.round(durationList.reduce((s, v) => s + v, 0) / durationList.length)
            : 0;
          return {
            ...job,
            applications_count: total,
            hire_rate: total > 0 ? Math.round((hired / total) * 100) : 0,
            avg_time_to_hire: avgDays,
            stage_counts: stageCounts.get(job.id) || {},
          };
        });

        setJobs(enriched);

        // Publicações ativas
        const { data: pubs } = await supabase
          .from('job_publications')
          .select('job_id, status, external_url, job_publication_channels(channel_code, display_name)')
          .in('job_id', jobIds)
          .eq('status', 'published');

        const map = new Map<string, any[]>();
        (pubs || []).forEach((p: any) => {
          const list = map.get(p.job_id) || [];
          list.push(p);
          map.set(p.job_id, list);
        });
        setPubsByJob(map);
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  }

  // KPIs
  const kpis = useMemo(() => {
    const total = jobs.length;
    const active = jobs.filter(j => j.status === 'open').length;
    const drafts = jobs.filter(j => j.status === 'on_hold').length;
    const closed = jobs.filter(j => j.status === 'closed').length;
    const totalApps = jobs.reduce((s, j) => s + (j.applications_count || 0), 0);
    return { total, active, drafts, closed, totalApps };
  }, [jobs]);

  // Departamentos únicos
  const departments = useMemo(() =>
    [...new Set(jobs.map(j => j.department).filter(Boolean))].sort(),
    [jobs]
  );

  // Filtro + sort
  const filteredJobs = useMemo(() => {
    let list = jobs.filter(job => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !job.title.toLowerCase().includes(q) &&
          !job.department?.toLowerCase().includes(q) &&
          !job.location?.toLowerCase().includes(q)
        ) return false;
      }
      if (departmentFilter !== 'all' && job.department !== departmentFilter) return false;
      if (typeFilter !== 'all' && job.employment_type !== typeFilter) return false;
      if (modalityFilter !== 'all') {
        if (modalityFilter === 'remote' && !job.is_remote) return false;
        if (modalityFilter === 'on_site' && job.is_remote) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'applications') return (b.applications_count || 0) - (a.applications_count || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'pt-BR');
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [jobs, searchQuery, statusFilter, departmentFilter, typeFilter, modalityFilter, sortBy]);

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'A combinar';
    if (min && max) return `R$ ${min.toLocaleString('pt-BR')} – R$ ${max.toLocaleString('pt-BR')}`;
    if (min) return `A partir de R$ ${min.toLocaleString('pt-BR')}`;
    return `Até R$ ${max?.toLocaleString('pt-BR')}`;
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  const toggleSelectJob = (id: string) => {
    setSelectedJobs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkArchive = async () => {
    await supabase.from('jobs').update({ status: 'closed' }).in('id', [...selectedJobs]);
    setSelectedJobs(new Set());
    loadJobs();
  };

  const handleCopyLink = (job: Job) => {
    const link = orgSlug
      ? `${window.location.origin}/empresas/${orgSlug}/${job.id}`
      : `${window.location.origin}/vagas/${job.id}`;
    navigator.clipboard.writeText(link).then(() => alert('Link copiado!'));
  };

  const handleDuplicate = async (job: Job) => {
    const { id, created_at, ...rest } = job as any;
    await supabase.from('jobs').insert({ ...rest, title: `${job.title} (cópia)`, status: 'on_hold' });
    loadJobs();
  };

  return (
    <div className="min-h-full bg-[#FAFAF8]">

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E5E5DC]" style={{ boxShadow: 'var(--shadow-xs)' }}>
        <div className="px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-[#3B82F6] uppercase tracking-widest mb-1">Gestão de Talentos</p>
              <h1 className="text-2xl font-bold gradient-text">Vagas</h1>
              <p className="text-sm text-[#666666] mt-1">
                {kpis.active > 0
                  ? <><span className="font-semibold text-[#141042]">{kpis.active}</span> vagas ativas · <span className="font-semibold text-[#141042]">{kpis.totalApps}</span> candidaturas no total</>
                  : 'Gerencie suas oportunidades de trabalho'}
              </p>
            </div>
            <Button
              onClick={() => setShowNewJobModal(true)}
              className="bg-[#141042] hover:bg-[#1E1859] text-white"
              style={{ boxShadow: '0 1px 3px rgba(20,16,66,0.20), inset 0 1px 0 rgba(255,255,255,0.12)' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Vaga
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-5">

        {/* ─── KPI Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total',        value: kpis.total,     iconColor: 'text-[#141042]',  iconBg: 'bg-[rgba(20,16,66,0.06)]',  accent: 'bg-[#141042]', icon: Briefcase  },
            { label: 'Ativas',       value: kpis.active,    iconColor: 'text-green-600',   iconBg: 'bg-green-100',               accent: 'bg-green-500', icon: CheckCircle2 },
            { label: 'Rascunhos',    value: kpis.drafts,    iconColor: 'text-amber-600',   iconBg: 'bg-amber-100',               accent: 'bg-amber-400', icon: Clock      },
            { label: 'Fechadas',     value: kpis.closed,    iconColor: 'text-gray-400',    iconBg: 'bg-gray-100',                accent: 'bg-gray-300',  icon: XCircle    },
            { label: 'Candidaturas', value: kpis.totalApps, iconColor: 'text-[#3B82F6]',   iconBg: 'bg-blue-100',                accent: 'bg-[#3B82F6]', icon: Users      },
          ].map(({ label, value, iconColor, iconBg, accent, icon: Icon }) => (
            <div
              key={label}
              className="bg-white border border-[#E5E5DC] rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 group"
              style={{ boxShadow: 'var(--shadow-sm)' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
            >
              {/* Accent strip */}
              <div className={`h-0.5 w-full ${accent}`} />
              <div className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-[#999999] font-medium">{label}</p>
                  <p className={`text-xl font-bold ${iconColor}`}>{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Status quick tabs + Busca + Filtros ────────────────────── */}
        <div className="bg-white border border-[#E5E5DC] rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-xs)' }}>
          {/* Status tabs */}
          <div className="flex border-b border-[#E5E5DC] overflow-x-auto">
            {[
              { value: 'all',     label: 'Todas',      count: kpis.total },
              { value: 'open',    label: 'Ativas',     count: kpis.active },
              { value: 'on_hold', label: 'Rascunhos',  count: kpis.drafts },
              { value: 'closed',  label: 'Fechadas',   count: kpis.closed },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  statusFilter === tab.value
                    ? 'border-[#141042] text-[#141042]'
                    : 'border-transparent text-[#666666] hover:text-[#141042] hover:bg-[#FAFAF8]'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 text-xs rounded-full font-semibold ${
                  statusFilter === tab.value
                    ? 'bg-[#141042] text-white'
                    : 'bg-[#F1F5F9] text-[#666666]'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Buscar por título, departamento ou localidade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#E5E5DC] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#141042] transition-all"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2.5 text-sm border border-[#E5E5DC] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#141042] text-[#666666]"
              >
                <option value="date">Mais recentes</option>
                <option value="applications">Mais candidaturas</option>
                <option value="title">A–Z</option>
              </select>

              {/* Filtros extras toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm border rounded-lg transition-colors ${
                  showFilters || departmentFilter !== 'all' || typeFilter !== 'all' || modalityFilter !== 'all'
                    ? 'border-[#141042] bg-[rgba(20,16,66,0.05)] text-[#141042] font-medium'
                    : 'border-[#E5E5DC] bg-white text-[#666666]'
                }`}
              >
                <Filter className="h-4 w-4" />
                Filtros
                {(departmentFilter !== 'all' || typeFilter !== 'all' || modalityFilter !== 'all') && (
                  <span className="w-4 h-4 rounded-full bg-[#141042] text-white text-[10px] flex items-center justify-center font-bold">
                    {[departmentFilter, typeFilter, modalityFilter].filter(f => f !== 'all').length}
                  </span>
                )}
              </button>

              {/* View toggle */}
              <div className="flex border border-[#E5E5DC] rounded-lg overflow-hidden" style={{ boxShadow: 'var(--shadow-xs)' }}>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2.5 transition-colors ${viewMode === 'cards' ? 'bg-[#141042] text-white' : 'bg-white text-[#666666] hover:bg-[#FAFAF8]'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2.5 transition-colors ${viewMode === 'table' ? 'bg-[#141042] text-white' : 'bg-white text-[#666666] hover:bg-[#FAFAF8]'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filtros expandidos */}
            {showFilters && (
              <div className="flex flex-wrap gap-3 pt-3 border-t border-[#E5E5DC] animate-in slide-in-from-top-2 duration-150">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-[#E5E5DC] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#141042] text-[#666666]"
                >
                  <option value="all">Todos os departamentos</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-[#E5E5DC] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#141042] text-[#666666]"
                >
                  <option value="all">Tipo de contrato</option>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select
                  value={modalityFilter}
                  onChange={(e) => setModalityFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-[#E5E5DC] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#141042] text-[#666666]"
                >
                  <option value="all">Modalidade</option>
                  <option value="remote">Remoto</option>
                  <option value="hybrid">Híbrido</option>
                  <option value="on_site">Presencial</option>
                </select>
                {(departmentFilter !== 'all' || typeFilter !== 'all' || modalityFilter !== 'all') && (
                  <button
                    onClick={() => { setDepartmentFilter('all'); setTypeFilter('all'); setModalityFilter('all'); }}
                    className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Bulk actions ────────────────────────────────────────────── */}
        {selectedJobs.size > 0 && (
          <div
            className="text-white rounded-xl px-5 py-3 flex items-center justify-between animate-in slide-in-from-top-2"
            style={{ background: 'linear-gradient(135deg, #141042 0%, #1E1859 100%)', boxShadow: 'var(--shadow-md)' }}
          >
            <span className="text-sm font-medium">{selectedJobs.size} vaga(s) selecionada(s)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkArchive}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20"
              >
                <Archive className="h-4 w-4" />
                Arquivar
              </button>
              <button
                onClick={() => setSelectedJobs(new Set())}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ─── Resultado ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-9 h-9 border-2 border-[#141042] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#999999]">Carregando vagas…</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white border border-[#E5E5DC] rounded-xl p-14 text-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <div className="w-16 h-16 bg-[rgba(20,16,66,0.05)] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-[#141042]/40" />
            </div>
            <h3 className="text-base font-semibold text-[#141042] mb-1">Nenhuma vaga encontrada</h3>
            <p className="text-sm text-[#666666] mb-6">
              {searchQuery ? 'Tente ajustar seus filtros de busca' : 'Comece criando sua primeira vaga'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowNewJobModal(true)} className="bg-[#141042] hover:bg-[#1E1859] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Criar Vaga
              </Button>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          /* ─── VIEW CARDS ──────────────────────────────────────────── */
          <div className="grid gap-3">
            {filteredJobs.map((job) => {
              const status = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.closed;
              const days = daysOpen(job.created_at);
              const deadlineDays = daysUntilDeadline(job.application_deadline);
              const pubs = pubsByJob.get(job.id) || [];
              const stageCounts = job.stage_counts || {};
              const stageEntries = Object.entries(stageCounts);
              const totalInStages = stageEntries.reduce((s, [, c]) => s + (c as number), 0);
              const isSelected = selectedJobs.has(job.id);

              return (
                <div
                  key={job.id}
                  className="bg-white border rounded-xl overflow-hidden transition-all duration-200"
                  style={{
                    borderColor: isSelected ? '#141042' : '#E5E5DC',
                    boxShadow: isSelected
                      ? '0 0 0 2px rgba(20,16,66,0.15), var(--shadow-md)'
                      : 'var(--shadow-sm)',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = isSelected ? '0 0 0 2px rgba(20,16,66,0.15), var(--shadow-md)' : 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Faixa de status lateral (topo) */}
                  <div className={`h-0.5 w-full ${status.stripe}`} />

                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectJob(job.id)}
                        className="mt-1 h-4 w-4 rounded border-[#E5E5DC] text-[#141042] cursor-pointer shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />

                      {/* Ícone com cor por status */}
                      <div className={`p-2.5 rounded-lg shrink-0 ${status.iconBg}`}>
                        <Briefcase className={`h-5 w-5 ${status.iconColor}`} />
                      </div>

                      {/* Content */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setSelectedJobId(job.id)}
                      >
                        {/* Título + status */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <h3 className="text-base font-semibold text-[#141042] leading-tight">{job.title}</h3>
                            <p className="text-xs text-[#999999] mt-0.5 font-medium uppercase tracking-wide">{job.department}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {deadlineDays !== null && deadlineDays <= 7 && deadlineDays >= 0 && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full border border-red-200">
                                <AlertTriangle className="h-3 w-3" />
                                {deadlineDays === 0 ? 'Vence hoje' : `${deadlineDays}d`}
                              </span>
                            )}
                            {deadlineDays !== null && deadlineDays < 0 && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full border border-gray-200">
                                <XCircle className="h-3 w-3" />
                                Expirado
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </div>
                        </div>

                        {/* Metadados */}
                        <div className="flex flex-wrap gap-3 text-sm text-[#666666] mb-3">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" />
                            {job.location}
                            {job.is_remote && (
                              <span className="ml-1 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold border border-blue-100">
                                Remoto
                              </span>
                            )}
                          </span>
                          {(job.salary_min || job.salary_max) && (
                            <span className="flex items-center gap-1.5">
                              <DollarSign className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" />
                              {formatSalary(job.salary_min, job.salary_max)}
                            </span>
                          )}
                          {job.employment_type && (
                            <span className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded-full text-[#475569] font-medium">
                              {TYPE_LABELS[job.employment_type] || job.employment_type}
                            </span>
                          )}
                          {job.seniority_level && (
                            <span className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded-full text-[#475569] font-medium">
                              {SENIORITY_LABELS[job.seniority_level] || job.seniority_level}
                            </span>
                          )}
                        </div>

                        {/* Métricas */}
                        <div className="flex flex-wrap items-center gap-5 mb-3">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Users className="h-4 w-4 text-[#3B82F6]" />
                            <span className="font-bold text-[#141042]">{job.applications_count || 0}</span>
                            <span className="text-[#94A3B8] text-xs">candidatos</span>
                          </div>
                          {(job.hire_rate || 0) > 0 && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className="font-bold text-green-600">{job.hire_rate}%</span>
                              <span className="text-[#94A3B8] text-xs">contratados</span>
                            </div>
                          )}
                          {(job.avg_time_to_hire || 0) > 0 && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Clock className="h-4 w-4 text-[#94A3B8]" />
                              <span className="font-bold text-[#141042]">{job.avg_time_to_hire}d</span>
                              <span className="text-[#94A3B8] text-xs">tempo médio</span>
                            </div>
                          )}
                          <span className="text-xs text-[#94A3B8] ml-auto">
                            {days === 0 ? 'Criada hoje' : `Aberta há ${days}d`}
                          </span>
                        </div>

                        {/* Mini-funil com barras proporcionais */}
                        {stageEntries.length > 0 && totalInStages > 0 && (
                          <div className="mb-3 space-y-1.5">
                            <p className="text-xs text-[#94A3B8] font-medium uppercase tracking-wide">Funil de candidatos</p>
                            <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-[#F1F5F9]">
                              {stageEntries.slice(0, 6).map(([stage, count], i) => {
                                const pct = Math.round(((count as number) / totalInStages) * 100);
                                const colors = ['bg-[#3B82F6]', 'bg-violet-500', 'bg-cyan-500', 'bg-amber-500', 'bg-green-500', 'bg-pink-500'];
                                return pct > 0 ? (
                                  <div
                                    key={stage}
                                    title={`${stage}: ${count}`}
                                    className={`${colors[i % colors.length]} h-full transition-all`}
                                    style={{ width: `${pct}%` }}
                                  />
                                ) : null;
                              })}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {stageEntries.slice(0, 4).map(([stage, count], i) => {
                                const colors = ['text-[#3B82F6]', 'text-violet-500', 'text-cyan-500', 'text-amber-500'];
                                return (
                                  <span key={stage} className="text-xs text-[#64748B] flex items-center gap-0.5">
                                    <span className={`font-bold ${colors[i % colors.length]}`}>{count as number}</span>
                                    <span className="truncate max-w-20">{stage}</span>
                                  </span>
                                );
                              })}
                              {stageEntries.length > 4 && (
                                <span className="text-xs text-[#94A3B8]">+{stageEntries.length - 4}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Publication badges */}
                        {pubs.length > 0 && (
                          <div className="mb-3">
                            <PublicationBadges publications={pubs as any} />
                          </div>
                        )}

                        {/* Footer */}
                        <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                          <span className="text-xs text-[#94A3B8]">
                            {formatDate(job.created_at)}
                            {job.application_deadline && (
                              <> · <span className={deadlineDays !== null && deadlineDays <= 7 ? 'text-red-500 font-semibold' : ''}>Prazo: {formatDate(job.application_deadline)}</span></>
                            )}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopyLink(job); }}
                              title="Copiar link da vaga"
                              className="p-1.5 text-[#94A3B8] hover:text-[#141042] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDuplicate(job); }}
                              title="Duplicar vaga"
                              className="p-1.5 text-[#94A3B8] hover:text-[#141042] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedJobId(job.id); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#141042] border border-[#E5E5DC] rounded-lg hover:bg-[#F8FAFC] hover:border-[#141042]/30 transition-colors font-medium"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Ver Detalhes
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ─── VIEW TABLE ──────────────────────────────────────────── */
          <div className="bg-white border border-[#E5E5DC] rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E5E5DC]">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) setSelectedJobs(new Set(filteredJobs.map(j => j.id)));
                          else setSelectedJobs(new Set());
                        }}
                        checked={selectedJobs.size === filteredJobs.length && filteredJobs.length > 0}
                        className="h-4 w-4 rounded border-[#E5E5DC] text-[#141042] cursor-pointer"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#141042] text-xs uppercase tracking-wide">Vaga</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#141042] text-xs uppercase tracking-wide">Localidade</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#141042] text-xs uppercase tracking-wide">Tipo</th>
                    <th className="text-center px-4 py-3 font-semibold text-[#141042] text-xs uppercase tracking-wide">Status</th>
                    <th className="text-center px-4 py-3 font-semibold text-[#141042] text-xs uppercase tracking-wide">Candidatos</th>
                    <th className="text-center px-4 py-3 font-semibold text-[#141042] text-xs uppercase tracking-wide">Contratados</th>
                    <th className="text-center px-4 py-3 font-semibold text-[#141042] text-xs uppercase tracking-wide">Dias aberta</th>
                    <th className="text-right px-4 py-3 font-semibold text-[#141042] text-xs uppercase tracking-wide">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredJobs.map((job) => {
                    const status = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.closed;
                    const days = daysOpen(job.created_at);
                    const deadlineDays = daysUntilDeadline(job.application_deadline);
                    const isSelected = selectedJobs.has(job.id);

                    return (
                      <tr
                        key={job.id}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-[rgba(20,16,66,0.03)]' : 'hover:bg-[#F8FAFC]'}`}
                        onClick={() => setSelectedJobId(job.id)}
                      >
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectJob(job.id)}
                            className="h-4 w-4 rounded border-[#E5E5DC] text-[#141042] cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-1 h-8 rounded-full shrink-0 ${status.stripe}`} />
                            <div>
                              <p className="font-semibold text-[#141042]">{job.title}</p>
                              <p className="text-xs text-[#94A3B8] font-medium uppercase tracking-wide">{job.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-[#64748B]">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" />
                            {job.location}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded-full text-[#475569] font-medium">
                            {TYPE_LABELS[job.employment_type] || job.employment_type || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="font-bold text-[#141042] text-base">{job.applications_count || 0}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {(job.hire_rate || 0) > 0 ? (
                            <span className="text-green-600 font-bold">{job.hire_rate}%</span>
                          ) : <span className="text-[#94A3B8]">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-sm font-semibold ${days > 30 ? 'text-amber-600' : 'text-[#64748B]'}`}>
                            {days}d
                          </span>
                          {deadlineDays !== null && deadlineDays <= 7 && deadlineDays >= 0 && (
                            <AlertTriangle className="inline ml-1 h-3.5 w-3.5 text-red-500" />
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleCopyLink(job)}
                              title="Copiar link"
                              className="p-1.5 text-[#94A3B8] hover:text-[#141042] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setSelectedJobId(job.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#141042] border border-[#E5E5DC] rounded-lg hover:bg-[#F8FAFC] hover:border-[#141042]/30 transition-colors font-medium"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Detalhes
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-[#F1F5F9] bg-[#F8FAFC] text-xs text-[#94A3B8] font-medium">
              {filteredJobs.length} vaga{filteredJobs.length !== 1 ? 's' : ''} exibida{filteredJobs.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      <NewJobModal
        isOpen={showNewJobModal}
        onClose={() => setShowNewJobModal(false)}
        onSuccess={() => { void loadJobs(); }}
      />

      <JobDetailsModal
        jobId={selectedJobId}
        onClose={() => setSelectedJobId(null)}
        onUpdated={() => { void loadJobs(); }}
      />
    </div>
  );
}
