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
  Search
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { applicationsApi } from '@/lib/api';

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
  { id: 'applied', title: 'Novas', color: 'bg-blue-50 border-blue-200' },
  { id: 'in_process', title: 'Em Processo', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'hired', title: 'Contratado', color: 'bg-emerald-50 border-emerald-200' },
  { id: 'rejected', title: 'Rejeitado', color: 'bg-red-50 border-red-200' },
];

const STAGE_COLORS = [
  'bg-blue-50 border-blue-200',
  'bg-yellow-50 border-yellow-200',
  'bg-purple-50 border-purple-200',
  'bg-green-50 border-green-200',
  'bg-emerald-50 border-emerald-200',
  'bg-pink-50 border-pink-200',
  'bg-indigo-50 border-indigo-200',
];

export default function PipelinePage() {
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
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, { type: 'stage' | 'status'; toStageId?: string; status?: string }>
  >({});

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    buildColumns();
  }, [applicationsCache, stageDefinitions, searchQuery, useStageColumns, selectedJob, selectedRecruiter]);

  async function loadApplications() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || null;

      // Get user's organization
      const { data: orgMembership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user?.id)
        .limit(1)
        .maybeSingle();

      const resolvedOrgId = orgMembership?.org_id || null;
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
          .select('user_id, full_name, email')
          .in('user_id', recruiterIds);
        setRecruiters((profiles || []).map((profile: any) => ({
          id: profile.user_id,
          name: profile.full_name || profile.email || 'Recrutador',
        })));
      } else {
        setRecruiters([]);
      }

      const applications = await applicationsApi.list(token, resolvedOrgId);
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
        color: STAGE_COLORS[index % STAGE_COLORS.length],
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
      ...stage,
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

  return (
    <div className="min-h-full">
      <DashboardHeader
        title="Pipeline de Recrutamento"
        subtitle="Gerencie o status das candidaturas"
        actions={
          <div className="flex items-center gap-2">
            {Object.keys(pendingChanges).length > 0 && (
              <Badge variant="warning">
                {Object.keys(pendingChanges).length} pendente(s)
              </Badge>
            )}
            <Button
              onClick={handleSaveChanges}
              disabled={saving || Object.keys(pendingChanges).length === 0}
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        }
      />

      <div className="pl-0 pr-6 py-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar candidatos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                />
              </div>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#141042]"
              >
                <option value="">Todas as vagas</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
              <select
                value={selectedRecruiter}
                onChange={(e) => setSelectedRecruiter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#141042]"
              >
                <option value="">Todos recrutadores</option>
                {recruiters.map((recruiter) => (
                  <option key={recruiter.id} value={recruiter.id}>
                    {recruiter.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#141042]" />
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {columns.map((column) => (
                <Droppable key={column.id} droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`rounded-lg border-2 ${column.color} ${
                        snapshot.isDraggingOver ? 'ring-2 ring-[#141042]' : ''
                      }`}
                    >
                      <div className="p-3 border-b">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {column.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {column.applications.length} candidato(s)
                        </p>
                      </div>

                      <div className="p-2 space-y-2 min-h-50">
                        {column.applications.map((app, index) => (
                          <Draggable
                            key={app.id}
                            draggableId={app.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-move ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                <div className="flex items-start gap-2 mb-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-[#141042] text-white text-xs">
                                      {app.candidate_name
                                        .split(' ')
                                        .map(n => n[0])
                                        .join('')
                                        .slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate">
                                      {app.candidate_name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {app.job_title}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(app.applied_at)}</span>
                                </div>

                                {app.rating && (
                                  <div className="flex items-center gap-1 mt-2">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 ${
                                          i < app.rating!
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
