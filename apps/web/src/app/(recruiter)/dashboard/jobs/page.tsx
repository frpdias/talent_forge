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
  ChevronDown,
  Copy,
  Archive,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Filter,
  ArrowUpDown,
  Wifi,
  ExternalLink,
} from 'lucide-react';
import { JobDetailsModal } from '@/components/jobs/JobDetailsModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface StageCount {
  stage_name: string;
  count: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  open:    { label: 'Ativa',     color: 'bg-green-50 text-green-700 border-green-200',  dot: 'bg-green-500' },
  on_hold: { label: 'Rascunho',  color: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-400' },
  closed:  { label: 'Fechada',   color: 'bg-gray-100 text-gray-500 border-gray-200',    dot: 'bg-gray-400' },
};

const MODALITY_LABELS: Record<string, string> = {
  remote: 'Remoto', hybrid: 'Híbrido', on_site: 'Presencial',
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
        .then(({ data }) => { if (data?.slug) setOrgSlug(data.slug); });
    }
  }, [currentOrg?.id]);

  async function loadJobs() {
    try {
      setLoading(true);
      let query = supabase
        .from('jobs')
        .select('*')
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
      <div className="bg-white border-b border-[#E5E5DC]">
        <div className="px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-[#3B82F6] uppercase tracking-wider mb-1">Gestão</p>
              <h1 className="text-2xl font-semibold text-[#141042]">Vagas</h1>
              <p className="text-sm text-[#666666] mt-1">Gerencie suas oportunidades de trabalho</p>
            </div>
            <Button onClick={() => setShowNewJobModal(true)} className="bg-[#141042] hover:bg-[#1a164f] text-white">
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
            { label: 'Total',        value: kpis.total,    color: 'text-[#141042]',  bg: 'bg-white',           icon: Briefcase },
            { label: 'Ativas',       value: kpis.active,   color: 'text-green-600',  bg: 'bg-green-50',         icon: CheckCircle2 },
            { label: 'Rascunhos',    value: kpis.drafts,   color: 'text-amber-600',  bg: 'bg-amber-50',         icon: Clock },
            { label: 'Fechadas',     value: kpis.closed,   color: 'text-gray-500',   bg: 'bg-gray-50',          icon: XCircle },
            { label: 'Candidaturas', value: kpis.totalApps,color: 'text-[#3B82F6]',  bg: 'bg-blue-50',          icon: Users },
          ].map(({ label, value, color, bg, icon: Icon }) => (
            <div key={label} className={`${bg} border border-[#E5E5DC] rounded-xl p-4 flex items-center gap-3`}>
              <Icon className={`h-5 w-5 shrink-0 ${color}`} />
              <div>
                <p className="text-xs text-[#999999]">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Barra de filtros + busca ───────────────────────────────── */}
        <div className="bg-white border border-[#E5E5DC] rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título, departamento ou localidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#E5E5DC] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#141042] transition-all"
              />
            </div>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 text-sm border border-[#E5E5DC] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#141042]"
            >
              <option value="all">Todas</option>
              <option value="on_hold">Rascunhos</option>
              <option value="open">Ativas</option>
              <option value="closed">Fechadas</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 text-sm border border-[#E5E5DC] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#141042]"
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
                  ? 'border-[#141042] bg-[rgba(20,16,66,0.05)] text-[#141042]'
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
            <div className="flex border border-[#E5E5DC] rounded-lg overflow-hidden">
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
            <div className="flex flex-wrap gap-3 pt-2 border-t border-[#E5E5DC] animate-in slide-in-from-top-2 duration-150">
              {/* Departamento */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-[#E5E5DC] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#141042]"
              >
                <option value="all">Todos os departamentos</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {/* Tipo de contrato */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-[#E5E5DC] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#141042]"
              >
                <option value="all">Tipo de contrato</option>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>

              {/* Modalidade */}
              <select
                value={modalityFilter}
                onChange={(e) => setModalityFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-[#E5E5DC] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#141042]"
              >
                <option value="all">Modalidade</option>
                <option value="remote">Remoto</option>
                <option value="hybrid">Híbrido</option>
                <option value="on_site">Presencial</option>
              </select>

              {/* Reset */}
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

        {/* ─── Bulk actions ────────────────────────────────────────────── */}
        {selectedJobs.size > 0 && (
          <div className="bg-[#141042] text-white rounded-xl px-5 py-3 flex items-center justify-between animate-in slide-in-from-top-2">
            <span className="text-sm font-medium">{selectedJobs.size} vaga(s) selecionada(s)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkArchive}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
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
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#141042] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white border border-[#E5E5DC] rounded-xl p-12 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-[#141042] mb-2">Nenhuma vaga encontrada</h3>
            <p className="text-sm text-[#666666] mb-6">
              {searchQuery ? 'Tente ajustar seus filtros de busca' : 'Comece criando sua primeira vaga'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowNewJobModal(true)} className="bg-[#141042] hover:bg-[#1a164f] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Criar Vaga
              </Button>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          /* ─── VIEW CARDS ──────────────────────────────────────────── */
          <div className="grid gap-4">
            {filteredJobs.map((job) => {
              const status = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.closed;
              const days = daysOpen(job.created_at);
              const deadlineDays = daysUntilDeadline(job.application_deadline);
              const pubs = pubsByJob.get(job.id) || [];
              const stageCounts = job.stage_counts || {};
              const stageEntries = Object.entries(stageCounts).slice(0, 4);
              const isSelected = selectedJobs.has(job.id);

              return (
                <div
                  key={job.id}
                  className={`bg-white border rounded-xl transition-all ${
                    isSelected
                      ? 'border-[#141042] shadow-md ring-2 ring-[#141042]/20'
                      : 'border-[#E5E5DC] hover:border-[#141042]/30 hover:shadow-md'
                  }`}
                >
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

                      {/* Icon */}
                      <div className="p-2.5 bg-blue-50 rounded-lg shrink-0">
                        <Briefcase className="h-5 w-5 text-[#3B82F6]" />
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
                            <p className="text-sm text-[#666666] mt-0.5">{job.department}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Urgência de deadline */}
                            {deadlineDays !== null && deadlineDays <= 7 && deadlineDays >= 0 && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full border border-red-200">
                                <AlertTriangle className="h-3 w-3" />
                                {deadlineDays === 0 ? 'Vence hoje' : `${deadlineDays}d restantes`}
                              </span>
                            )}
                            {deadlineDays !== null && deadlineDays < 0 && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full border border-gray-200">
                                <XCircle className="h-3 w-3" />
                                Prazo expirado
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </div>
                        </div>

                        {/* Metadados */}
                        <div className="flex flex-wrap gap-3 text-sm text-[#666666] mb-3">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {job.location}
                            {job.is_remote && <span className="ml-1 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Remoto</span>}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5 shrink-0" />
                            {formatSalary(job.salary_min, job.salary_max)}
                          </span>
                          {job.employment_type && (
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="h-3.5 w-3.5 shrink-0" />
                              {TYPE_LABELS[job.employment_type] || job.employment_type}
                            </span>
                          )}
                          {job.seniority_level && (
                            <span className="text-xs bg-[#FAFAF8] border border-[#E5E5DC] px-2 py-0.5 rounded-full text-[#666666]">
                              {SENIORITY_LABELS[job.seniority_level] || job.seniority_level}
                            </span>
                          )}
                        </div>

                        {/* Métricas + mini funil */}
                        <div className="flex flex-wrap items-center gap-4 mb-3">
                          {/* Candidaturas */}
                          <div className="flex items-center gap-1.5 text-sm">
                            <Users className="h-4 w-4 text-[#3B82F6]" />
                            <span className="font-semibold text-[#141042]">{job.applications_count || 0}</span>
                            <span className="text-[#999999]">candidatos</span>
                          </div>

                          {/* Hire rate */}
                          {(job.hire_rate || 0) > 0 && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className="font-semibold text-green-600">{job.hire_rate}%</span>
                              <span className="text-[#999999]">contratados</span>
                            </div>
                          )}

                          {/* Tempo médio */}
                          {(job.avg_time_to_hire || 0) > 0 && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Clock className="h-4 w-4 text-[#666666]" />
                              <span className="font-semibold text-[#141042]">{job.avg_time_to_hire}d</span>
                              <span className="text-[#999999]">tempo médio</span>
                            </div>
                          )}

                          {/* Dias aberta */}
                          <span className="text-xs text-[#999999] ml-auto">
                            Aberta há {days === 0 ? 'menos de 1 dia' : `${days} dia${days !== 1 ? 's' : ''}`}
                          </span>
                        </div>

                        {/* Mini-funil por etapa */}
                        {stageEntries.length > 0 && (
                          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                            {stageEntries.map(([stage, count]) => (
                              <span
                                key={stage}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FAFAF8] border border-[#E5E5DC] rounded-full text-xs text-[#666666]"
                              >
                                <span className="font-semibold text-[#141042]">{count}</span>
                                <span className="truncate max-w-20">{stage}</span>
                              </span>
                            ))}
                            {Object.keys(stageCounts).length > 4 && (
                              <span className="text-xs text-[#999999]">+{Object.keys(stageCounts).length - 4} etapas</span>
                            )}
                          </div>
                        )}

                        {/* Publication badges */}
                        {pubs.length > 0 && (
                          <div className="mb-3">
                            <PublicationBadges publications={pubs as any} />
                          </div>
                        )}

                        {/* Footer */}
                        <div className="pt-3 border-t border-[#E5E5DC] flex items-center justify-between">
                          <span className="text-xs text-[#999999]">
                            Criada em {formatDate(job.created_at)}
                            {job.application_deadline && (
                              <> · Prazo: {formatDate(job.application_deadline)}</>
                            )}
                          </span>
                          <div className="flex items-center gap-1">
                            {/* Copiar link */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopyLink(job); }}
                              title="Copiar link da vaga"
                              className="p-1.5 text-[#999999] hover:text-[#141042] hover:bg-[#FAFAF8] rounded-lg transition-colors"
                            >
                              <Copy className="h-4 w-4" />
                            </button>

                            {/* Duplicar */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDuplicate(job); }}
                              title="Duplicar vaga"
                              className="p-1.5 text-[#999999] hover:text-[#141042] hover:bg-[#FAFAF8] rounded-lg transition-colors"
                            >
                              <Archive className="h-4 w-4" />
                            </button>

                            {/* Ver detalhes */}
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedJobId(job.id); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#141042] border border-[#E5E5DC] rounded-lg hover:bg-[#FAFAF8] transition-colors"
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
          <div className="bg-white border border-[#E5E5DC] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAF8] border-b border-[#E5E5DC]">
                  <tr>
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
                    <th className="text-left px-4 py-3 font-semibold text-[#141042]">Vaga</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#141042]">Localidade</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#141042]">Tipo</th>
                    <th className="text-center px-4 py-3 font-semibold text-[#141042]">Status</th>
                    <th className="text-center px-4 py-3 font-semibold text-[#141042]">Candidatos</th>
                    <th className="text-center px-4 py-3 font-semibold text-[#141042]">Contratados</th>
                    <th className="text-center px-4 py-3 font-semibold text-[#141042]">Dias aberta</th>
                    <th className="text-right px-4 py-3 font-semibold text-[#141042]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5DC]">
                  {filteredJobs.map((job) => {
                    const status = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.closed;
                    const days = daysOpen(job.created_at);
                    const deadlineDays = daysUntilDeadline(job.application_deadline);
                    const isSelected = selectedJobs.has(job.id);

                    return (
                      <tr
                        key={job.id}
                        className={`hover:bg-[#FAFAF8] cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                        onClick={() => setSelectedJobId(job.id)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectJob(job.id)}
                            className="h-4 w-4 rounded border-[#E5E5DC] text-[#141042] cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-[#141042]">{job.title}</p>
                            <p className="text-xs text-[#999999]">{job.department}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#666666]">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {job.location}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#666666]">
                          {TYPE_LABELS[job.employment_type] || job.employment_type || '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-[#141042]">
                          {job.applications_count || 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(job.hire_rate || 0) > 0 ? (
                            <span className="text-green-600 font-semibold">{job.hire_rate}%</span>
                          ) : <span className="text-[#999999]">—</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-medium ${days > 30 ? 'text-amber-600' : 'text-[#666666]'}`}>
                            {days}d
                          </span>
                          {deadlineDays !== null && deadlineDays <= 7 && deadlineDays >= 0 && (
                            <AlertTriangle className="inline ml-1 h-3.5 w-3.5 text-red-500" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleCopyLink(job)}
                              title="Copiar link"
                              className="p-1.5 text-[#999999] hover:text-[#141042] hover:bg-[#FAFAF8] rounded-lg transition-colors"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setSelectedJobId(job.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#141042] border border-[#E5E5DC] rounded-lg hover:bg-[#FAFAF8] transition-colors"
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

            <div className="px-4 py-3 border-t border-[#E5E5DC] bg-[#FAFAF8] text-xs text-[#999999]">
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
