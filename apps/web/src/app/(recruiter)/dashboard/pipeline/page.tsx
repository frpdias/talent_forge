'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ApplicationDetailsDrawer } from '@/components/pipeline/ApplicationDetailsDrawer';
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
  RefreshCw,
  UserCheck,
  Building2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useOrgStore } from '@/lib/store';

interface Application {
  id: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  status: string;
  rating?: number;
  applied_at: string;
  job_id?: string;
  current_stage?: { id: string; name: string; position: number } | null;
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
  { id: 'in_documentation', title: 'Em Documentação', color: 'from-violet-500 to-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', icon: ArrowRight },
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
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [recruiters, setRecruiters] = useState<{ id: string; name: string }[]>([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadApplications();
  }, [currentOrg?.id]);

  useEffect(() => {
    buildColumns();
  }, [applicationsCache, stageDefinitions, searchQuery, useStageColumns, selectedJob, selectedRecruiter]);

  // Salva direto no Supabase — sem depender do NestJS
  async function autoSaveToSupabase(
    applicationId: string,
    payload: { type: 'status' | 'stage'; status?: string; toStageId?: string }
  ) {
    try {
      setSaving(true);
      if (payload.type === 'status' && payload.status) {
        const { error } = await supabase
          .from('applications')
          .update({ status: payload.status, updated_at: new Date().toISOString() })
          .eq('id', applicationId);
        if (error) throw error;
      } else if (payload.type === 'stage' && payload.toStageId) {
        const { error } = await supabase
          .from('applications')
          .update({ current_stage_id: payload.toStageId, updated_at: new Date().toISOString() })
          .eq('id', applicationId);
        if (error) throw error;
      }
    } catch (error) {
      console.error('[Pipeline] Erro ao salvar no Supabase:', error);
    } finally {
      setSaving(false);
    }
  }

  async function loadApplications() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      let resolvedOrgId = currentOrg?.id || null;

      // Fallback: derive org from membership if store is not ready
      if (!resolvedOrgId && user?.id) {
        const { data: orgMemberships } = await supabase
          .from('org_members')
          .select('org_id, role')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: true });

        if (orgMemberships && orgMemberships.length > 0) {
          const adminOrg = orgMemberships.find((m: any) => m.role === 'admin');
          const managerOrg = orgMemberships.find((m: any) => m.role === 'manager');
          resolvedOrgId = adminOrg?.org_id || managerOrg?.org_id || orgMemberships[0].org_id;
        }
      }
      
      if (!resolvedOrgId) {
        console.error('❌ [Pipeline] Sem orgId');
        return;
      }

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

      // Busca applications direto no Supabase — sem NestJS
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select(`
          id,
          job_id,
          candidate_id,
          current_stage_id,
          status,
          score,
          created_by,
          created_at,
          updated_at,
          candidates!inner ( id, full_name, email, current_title, linkedin_url ),
          jobs!inner ( id, title, org_id ),
          pipeline_stages ( id, name, position )
        `)
        .eq('jobs.org_id', resolvedOrgId)
        .order('updated_at', { ascending: false });

      if (appsError) throw appsError;

      const normalizedApplications = (appsData || []).map((app: any) => ({
        id: app.id,
        candidate_name: app.candidates?.full_name || 'Candidato',
        candidate_email: app.candidates?.email || '-',
        job_title: app.jobs?.title || '-',
        status: app.status,
        rating: app.score,
        applied_at: app.created_at,
        job_id: app.job_id,
        created_by: app.created_by,
        current_stage_id: app.current_stage_id || null,
        current_stage: app.pipeline_stages
          ? { id: app.pipeline_stages.id, name: app.pipeline_stages.name, position: app.pipeline_stages.position }
          : null,
      }));


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
            job_id: app.job_id,
            current_stage: app.current_stage,
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
        .filter((app: any) =>
          stage.id === 'in_process'
            ? ['in_process', 'interview_hr', 'interview_manager'].includes(app.status)
            : app.status === stage.id
        )
        .map((app: any) => ({
          id: app.id,
          candidate_name: app.candidate_name,
          candidate_email: app.candidate_email,
          job_title: app.job_title,
          status: app.status,
          rating: app.rating,
          applied_at: app.applied_at,
          job_id: app.job_id,
          current_stage: app.current_stage,
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
      // Atualiza o status do card para refletir a nova coluna
      const newStatus = useStageColumns ? movedApp.status : destination.droppableId;
      const updatedApp = { ...movedApp, status: newStatus };

      destApps.splice(destination.index, 0, updatedApp);
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

      // Atualiza cache otimisticamente
      setApplicationsCache(prev =>
        prev.map(app => app.id === movedApp.id
          ? {
              ...app,
              status: newStatus,
              current_stage_id: useStageColumns ? destination.droppableId : app.current_stage_id,
            }
          : app
        )
      );

      // Auto-save imediato no Supabase
      if (useStageColumns) {
        autoSaveToSupabase(movedApp.id, { type: 'stage', toStageId: destination.droppableId });
      } else {
        autoSaveToSupabase(movedApp.id, { type: 'status', status: destination.droppableId });
      }
    }
  };

  function handleStatusChangeFromDrawer(applicationId: string, newStatus: string) {
    setApplicationsCache(prev =>
      prev.map(app => app.id === applicationId ? { ...app, status: newStatus } : app)
    );
    setSelectedApplication(prev =>
      prev && prev.id === applicationId ? { ...prev, status: newStatus } : prev
    );
    // Auto-save imediato no Supabase (sem NestJS)
    autoSaveToSupabase(applicationId, { type: 'status', status: newStatus });
  }

  // Reprocessa colunas sem recarregar do servidor
  const handleSaveChanges = async () => {
    await loadApplications();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  // Calculate stats
  const totalCandidates = applicationsCache.length;
  const inProcessCount = applicationsCache.filter(a => ['in_process', 'interview_hr', 'interview_manager'].includes(a.status)).length;
  const inDocumentationCount = applicationsCache.filter(a => a.status === 'in_documentation').length;
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
              {saving && (
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Salvando...
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
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Total</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 text-white">{totalCandidates}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-2">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Em Avaliação</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 text-white">{inProcessCount}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-2">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Em Documentação</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 text-white">{inDocumentationCount}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-2">
                  <ArrowRight className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Contratados</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 text-white">{hiredCount}</p>
                </div>
                <div className="bg-white/20 rounded-lg p-2">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#141042] to-[#1a164f] rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-xs font-medium uppercase tracking-wider">Conversão</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1 text-white">{conversionRate}%</p>
                </div>
                <div className="bg-white/20 rounded-lg p-2">
                  <TrendingUp className="h-6 w-6 text-white" />
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
            {/* Filtro por vaga — sempre visível */}
            <div className="w-56">
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg text-sm text-[#141042] focus:outline-none focus:ring-2 focus:ring-[#141042] transition-all"
              >
                <option value="">Todas as vagas</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-[rgba(20,16,66,0.06)]' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {selectedRecruiter && (
                <Badge className="ml-2 bg-[#141042] text-white text-xs">1</Badge>
              )}
            </Button>
          </div>

          {/* Expandable Filters — apenas recrutador */}
          {showFilters && (
            <div className="mt-3 p-4 bg-[#FAFAF8] rounded-lg border border-[#E5E5DC] animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-4">
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
                {selectedRecruiter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRecruiter('')}
                    className="mt-6 text-[#666666] hover:text-[#141042]"
                  >
                    Limpar filtro
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
                                    onClick={() => !snapshot.isDragging && setSelectedApplication(app)}
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

                                    {/* Interview Stage Badge */}
                                    {(app.status === 'interview_hr' || app.status === 'interview_manager') && (
                                      <div className={`mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                        app.status === 'interview_hr'
                                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                                          : 'bg-teal-50 text-teal-700 border-teal-200'
                                      }`}>
                                        {app.status === 'interview_hr' ? (
                                          <><UserCheck className="h-3 w-3 mr-1" />Entrevista c/ RH</>
                                        ) : (
                                          <><Building2 className="h-3 w-3 mr-1" />Entrevista c/ Gestor</>
                                        )}
                                      </div>
                                    )}

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
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setSelectedApplication(app); }}
                                          className="text-xs text-[#141042] hover:text-[#3B82F6] font-medium transition-colors"
                                        >
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

      <ApplicationDetailsDrawer
        application={selectedApplication}
        isOpen={selectedApplication !== null}
        onClose={() => setSelectedApplication(null)}
        onStatusChange={handleStatusChangeFromDrawer}
      />
    </div>
  );
}
