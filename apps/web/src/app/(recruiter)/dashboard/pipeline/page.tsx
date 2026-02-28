'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { 
  Calendar,
  Star,
  Search,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  MoreVertical,
  Mail,
  Briefcase,
  Filter,
  RefreshCw
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { applicationsApi } from '@/lib/api';
import { useOrgStore } from '@/lib/store';

interface Application {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  status: string;
  rating?: number;
  applied_at: string;
}

interface Column {
  id: string;
  title: string;
  color: string;
  applications: Application[];
}

const STATUS_COLUMNS = [
  { id: 'applied', title: 'Novas Candidaturas', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: Users },
  { id: 'in_process', title: 'Em Avaliação', color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', icon: Clock },
  { id: 'hired', title: 'Contratados', color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', icon: CheckCircle2 },
  { id: 'rejected', title: 'Não Aprovados', color: 'from-red-500 to-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: XCircle },
];

const STAGE_COLORS = [
  { color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { color: 'from-violet-500 to-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
  { color: 'from-cyan-500 to-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
  { color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { color: 'from-pink-500 to-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
  { color: 'from-indigo-500 to-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
];

export default function PipelinePage() {
  const { currentOrg } = useOrgStore();
  const [columns, setColumns] = useState<Column[]>(
    STATUS_COLUMNS.map(stage => ({ ...stage, applications: [] }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [useStageColumns, setUseStageColumns] = useState(false);
  const [applicationsCache, setApplicationsCache] = useState<any[]>([]);
  const [stageDefinitions, setStageDefinitions] = useState<any[]>([]);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [recruiters, setRecruiters] = useState<{ id: string; name: string }[]>([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, { type: 'stage' | 'status'; toStageId?: string; status?: string }>
  >({});

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadApplications();
  }, [currentOrg?.id]);

  useEffect(() => {
    buildColumns();
  }, [applicationsCache, stageDefinitions, searchQuery, useStageColumns, selectedJob, selectedRecruiter]);

  async function loadApplications() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      const { data: sessionData } = await supabase.auth.getSession();
      let token = sessionData?.session?.access_token || null;

      if (!token && sessionData?.session?.refresh_token) {
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError) {
          token = refreshed?.session?.access_token || null;
        }
      }

      let resolvedOrgId = currentOrg?.id || null;

      // Fallback: derive org from membership if store is not ready
      if (!resolvedOrgId) {
        const { data: orgMembership } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user?.id)
          .limit(1)
          .maybeSingle();

        resolvedOrgId = orgMembership?.org_id || null;
      }
      console.log('🔍 [Pipeline] Debug:', { userId: user?.id, orgId: resolvedOrgId, hasToken: !!token });
      
      if (!token || !resolvedOrgId) {
        console.error('❌ [Pipeline] Sem token ou orgId');
        return;
      }

      setSessionToken(token);
      setOrgId(resolvedOrgId);

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, title')
        .eq('org_id', resolvedOrgId)
        .order('created_at', { ascending: false });
      setJobs((jobsData || []).map((job: any) => ({ id: job.id, title: job.title || 'Vaga' })));

      const { data: orgMembers } = await supabase
        .from('org_members')
        .select('user_id, role')
        .eq('org_id', resolvedOrgId);
      const recruiterIds = (orgMembers || [])
        .filter((member: any) => ['admin', 'manager', 'recruiter'].includes(member.role))
        .map((member: any) => member.user_id);

      if (recruiterIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .in('id', recruiterIds);
        setRecruiters((profiles || []).map((profile: any) => ({
          id: profile.id,
          name: profile.full_name || profile.email || 'Recrutador',
        })));
      } else {
        setRecruiters([]);
      }

      let applications;
      try {
        applications = await applicationsApi.list(token, resolvedOrgId);
      } catch (error: any) {
        if (String(error?.message || '').toLowerCase().includes('invalid or expired token')) {
          const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
          const refreshedToken = refreshed?.session?.access_token || null;

          if (refreshError || !refreshedToken) {
            throw error;
          }

          token = refreshedToken;
          setSessionToken(refreshedToken);
          applications = await applicationsApi.list(refreshedToken, resolvedOrgId);
        } else {
          throw error;
        }
      }

      console.log('✅ [Pipeline] Aplicações retornadas da API:', applications);

      const normalizedApplications = (applications as any || []).map((app: any) => ({
        id: app.id,
        candidate_name: app.candidate?.fullName || 'Candidato',
        candidate_email: app.candidate?.email || '-',
        job_title: app.job?.title || '-',
        status: app.status,
        rating: app.score || app.rating,
        applied_at: app.createdAt,
        job_id: app.jobId,
        created_by: app.createdBy,
        current_stage_id: app.currentStageId || null,
        current_stage: app.currentStage || null,
      }));

      console.log('📊 [Pipeline] Aplicações normalizadas:', normalizedApplications.length, normalizedApplications);

      const stages = normalizedApplications
        .map((app: any) => app.current_stage)
        .filter(Boolean)
        .reduce((acc: any[], stage: any) => {
          if (!acc.find((item) => item.id === stage.id)) acc.push(stage);
          return acc;
        }, [])
        .sort((a: any, b: any) => a.position - b.position);

      setApplicationsCache(normalizedApplications);
      setStageDefinitions(stages);
      setUseStageColumns(stages.length > 0);
      setUseStageColumns(Boolean(stages && stages.length > 0));
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  }

  function buildColumns() {
    let filteredApplications = applicationsCache;

    if (searchQuery.trim()) {
      filteredApplications = filteredApplications.filter((app: any) =>
        `${app.candidate_name} ${app.candidate_email} ${app.job_title}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    if (selectedJob) {
      filteredApplications = filteredApplications.filter((app: any) => app.job_id === selectedJob);
    }

    if (selectedRecruiter) {
      filteredApplications = filteredApplications.filter((app: any) => app.created_by === selectedRecruiter);
    }

    if (useStageColumns && stageDefinitions.length > 0) {
      const sortedStages = [...stageDefinitions].sort((a: any, b: any) => a.position - b.position);
      const newColumns = sortedStages.map((stage: any, index: number) => ({
        id: stage.id,
        title: stage.name,
        color: STAGE_COLORS[index % STAGE_COLORS.length].color,
        applications: filteredApplications
          .filter((app: any) => app.current_stage_id === stage.id)
          .map((app: any) => ({
            id: app.id,
            candidate_name: app.candidate_name,
            candidate_email: app.candidate_email,
            job_title: app.job_title,
            status: app.status,
            rating: app.rating,
            applied_at: app.applied_at,
          })),
      }));
      setColumns(newColumns);
      return;
    }

    const fallbackColumns = STATUS_COLUMNS.map(stage => ({
      id: stage.id,
      title: stage.title,
      color: stage.color,
      applications: filteredApplications
        .filter((app: any) => app.status === stage.id)
        .map((app: any) => ({
          id: app.id,
          candidate_name: app.candidate_name,
          candidate_email: app.candidate_email,
          job_title: app.job_title,
          status: app.status,
          rating: app.rating,
          applied_at: app.applied_at,
        })),
    }));
    setColumns(fallbackColumns);
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // If dropped in same position, do nothing
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColumnIndex = columns.findIndex(
      col => col.id === source.droppableId
    );
    const destColumnIndex = columns.findIndex(
      col => col.id === destination.droppableId
    );

    const sourceColumn = columns[sourceColumnIndex];
    const destColumn = columns[destColumnIndex];

    const sourceApps = [...sourceColumn.applications];
    const destApps = [...destColumn.applications];

    const [movedApp] = sourceApps.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      sourceApps.splice(destination.index, 0, movedApp);
      const newColumns = [...columns];
      newColumns[sourceColumnIndex] = {
        ...sourceColumn,
        applications: sourceApps,
      };
      setColumns(newColumns);
    } else {
      destApps.splice(destination.index, 0, movedApp);
      const newColumns = [...columns];
      newColumns[sourceColumnIndex] = {
        ...sourceColumn,
        applications: sourceApps,
      };
      newColumns[destColumnIndex] = {
        ...destColumn,
        applications: destApps,
      };
      setColumns(newColumns);

      setPendingChanges((prev) => ({
        ...prev,
        [movedApp.id]: useStageColumns
          ? { type: 'stage', toStageId: destination.droppableId }
          : { type: 'status', status: destination.droppableId },
      }));
    }
  };

  const handleSaveChanges = async () => {
    if (!sessionToken || !orgId) return;
    const entries = Object.entries(pendingChanges);
    if (entries.length === 0) return;

    try {
      setSaving(true);
      await Promise.all(
        entries.map(([applicationId, payload]) => {
          if (payload.type === 'status' && payload.status) {
            return applicationsApi.updateStatus(
              applicationId,
              { status: payload.status },
              sessionToken,
              orgId
            );
          }

          if (payload.type === 'stage' && payload.toStageId) {
            return applicationsApi.updateStage(
              applicationId,
              { toStageId: payload.toStageId },
              sessionToken,
              orgId
            );
          }

          return Promise.resolve();
        })
      );
      setPendingChanges({});
      await loadApplications();
    } catch (error) {
      console.error('Erro ao salvar mudanças do pipeline:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  // Calculate stats
  const totalCandidates = applicationsCache.length;
  const inProcessCount = applicationsCache.filter(a => a.status === 'in_process').length;
  const hiredCount = applicationsCache.filter(a => a.status === 'hired').length;
  const conversionRate = totalCandidates > 0 ? Math.round((hiredCount / totalCandidates) * 100) : 0;

  return (
    <div className="min-h-full">
      {/* Header Section */}
      <div className="bg-white/85 backdrop-blur-xl border-b border-[#E5E5DC] sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#141042]">Pipeline de Recrutamento</h1>
              <p className="text-sm text-[#666666] mt-1">Gerencie e acompanhe o progresso das candidaturas</p>
            </div>
            <div className="flex items-center gap-3">
              {pendingChanges && Object.keys(pendingChanges).length > 0 && (
                <Badge className="bg-amber-100 text-amber-800 border border-amber-200">
                  <Clock className="h-3 w-3 mr-1" />
                  {Object.keys(pendingChanges).length} alteração(ões) pendente(s)
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadApplications()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={saving || !pendingChanges || Object.keys(pendingChanges).length === 0}
                className="bg-[#141042] hover:bg-[#1a164f]"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Total de Candidatos</p>
                  <p className="text-3xl font-bold mt-1">{totalCandidates}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-2">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-xs font-medium uppercase tracking-wider">Em Avaliação</p>
                  <p className="text-3xl font-bold mt-1">{inProcessCount}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-2">
                  <Clock className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Contratados</p>
                  <p className="text-3xl font-bold mt-1">{hiredCount}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-2">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-violet-100 text-xs font-medium uppercase tracking-wider">Taxa de Conversão</p>
                  <p className="text-3xl font-bold mt-1">{conversionRate}%</p>
                </div>
                <div className="bg-white/20 rounded-lg p-2">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou vaga..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042] focus:border-transparent transition-all"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-[rgba(20,16,66,0.06)]' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {(selectedJob || selectedRecruiter) && (
                <Badge className="ml-2 bg-[#141042] text-white text-xs">
                  {(selectedJob ? 1 : 0) + (selectedRecruiter ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-3 p-4 bg-[#FAFAF8] rounded-lg border border-[#E5E5DC] animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs font-medium text-[#666666] uppercase tracking-wider mb-1.5 block">
                    Vaga
                  </label>
                  <select
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5DC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  >
                    <option value="">Todas as vagas</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-[#666666] uppercase tracking-wider mb-1.5 block">
                    Recrutador
                  </label>
                  <select
                    value={selectedRecruiter}
                    onChange={(e) => setSelectedRecruiter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E5E5DC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#141042]"
                  >
                    <option value="">Todos os recrutadores</option>
                    {recruiters.map((recruiter) => (
                      <option key={recruiter.id} value={recruiter.id}>
                        {recruiter.name}
                      </option>
                    ))}
                  </select>
                </div>
                {(selectedJob || selectedRecruiter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedJob('');
                      setSelectedRecruiter('');
                    }}
                    className="mt-6 text-[#666666] hover:text-[#141042]"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#E5E5DC] border-t-[#141042] mb-4" />
              <p className="text-[#666666]">Carregando pipeline...</p>
            </div>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {columns.map((column, columnIndex) => {
                const columnConfig = STATUS_COLUMNS.find(s => s.id === column.id) || {
                  color: STAGE_COLORS[columnIndex % STAGE_COLORS.length].color,
                  bgColor: STAGE_COLORS[columnIndex % STAGE_COLORS.length].bgColor,
                  borderColor: STAGE_COLORS[columnIndex % STAGE_COLORS.length].borderColor,
                  icon: Users
                };
                const IconComponent = columnConfig.icon || Users;

                return (
                  <Droppable key={column.id} droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-shrink-0 w-80 rounded-xl border-2 transition-all duration-200 ${
                          snapshot.isDraggingOver
                            ? 'ring-2 ring-[#141042] ring-offset-2 border-[#141042] shadow-lg'
                            : `${columnConfig.borderColor} border-opacity-50`
                        } bg-white shadow-[var(--shadow-sm)]`}
                      >
                        {/* Column Header */}
                        <div className={`bg-gradient-to-r ${columnConfig.color} rounded-t-lg p-4`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-white/20 rounded-lg p-2">
                                <IconComponent className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-white text-sm">
                                  {column.title}
                                </h3>
                                <p className="text-white/80 text-xs mt-0.5">
                                  {column.applications.length} candidato{column.applications.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <button className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                              <MoreVertical className="h-4 w-4 text-white/80" />
                            </button>
                          </div>
                        </div>

                        {/* Column Content */}
                        <div className="p-3 space-y-3 min-h-[400px] max-h-[calc(100vh-400px)] overflow-y-auto">
                          {column.applications.length === 0 ? (
                            <div className={`${columnConfig.bgColor} rounded-lg border-2 border-dashed ${columnConfig.borderColor} p-6 text-center`}>
                              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${columnConfig.bgColor} mb-3`}>
                                <IconComponent className="h-6 w-6 text-[#94A3B8]" />
                              </div>
                              <p className="text-[#666666] text-sm">
                                Nenhum candidato nesta etapa
                              </p>
                              <p className="text-[#94A3B8] text-xs mt-1">
                                Arraste candidatos para cá
                              </p>
                            </div>
                          ) : (
                            column.applications.map((app, index) => (
                              <Draggable key={app.id} draggableId={app.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white rounded-xl border border-[#E5E5DC] p-4 transition-all duration-300 cursor-grab active:cursor-grabbing group ${
                                      snapshot.isDragging
                                        ? 'shadow-xl ring-2 ring-[#141042] rotate-2 scale-105'
                                        : 'hover:shadow-[var(--shadow-md)] hover:-translate-y-px hover:border-[#141042]/20'
                                    }`}
                                  >
                                    {/* Card Header */}
                                    <div className="flex items-start gap-3">
                                      <Avatar className="h-10 w-10 ring-2 ring-[#E5E5DC]">
                                        <AvatarFallback className="bg-gradient-to-br from-[#1F4ED8] to-[#3b82f6] text-white text-sm font-medium">
                                          {app.candidate_name
                                            .split(' ')
                                            .map((n: string) => n[0])
                                            .join('')
                                            .slice(0, 2)
                                            .toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-[#141042] truncate">
                                          {app.candidate_name}
                                        </p>
                                        <div className="flex items-center gap-1 text-xs text-[#666666] mt-0.5">
                                          <Mail className="h-3 w-3" />
                                          <span className="truncate">{app.candidate_email}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Job Badge */}
                                    <div className="mt-3">
                                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[rgba(20,16,66,0.05)] rounded-full">
                                        <Briefcase className="h-3 w-3 text-[#666666]" />
                                        <span className="text-xs font-medium text-[#444444] truncate max-w-[180px]">
                                          {app.job_title}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="mt-3 pt-3 border-t border-[#E5E5DC]/60 flex items-center justify-between">
                                      <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{formatDate(app.applied_at)}</span>
                                      </div>
                                      
                                      {app.rating && (
                                        <div className="flex items-center gap-0.5">
                                          {[...Array(5)].map((_, i) => (
                                            <Star
                                              key={i}
                                              className={`h-3.5 w-3.5 ${
                                                i < app.rating!
                                                  ? 'fill-amber-400 text-amber-400'
                                                  : 'text-[#E5E5DC]'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* Hover Actions */}
                                    <div className="mt-2 pt-2 border-t border-[#E5E5DC]/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="flex items-center justify-between">
                                        <button className="text-xs text-[#141042] hover:text-[#3B82F6] font-medium transition-colors">
                                          Ver perfil
                                        </button>
                                        <ArrowRight className="h-4 w-4 text-[#94A3B8]" />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
