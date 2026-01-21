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

const PIPELINE_STAGES = [
  { id: 'new', title: 'Novas', color: 'bg-blue-50 border-blue-200' },
  { id: 'screening', title: 'Triagem', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'interview', title: 'Entrevista', color: 'bg-purple-50 border-purple-200' },
  { id: 'offer', title: 'Proposta', color: 'bg-green-50 border-green-200' },
  { id: 'hired', title: 'Contratado', color: 'bg-emerald-50 border-emerald-200' },
];

export default function PipelinePage() {
  const [columns, setColumns] = useState<Column[]>(
    PIPELINE_STAGES.map(stage => ({ ...stage, applications: [] }))
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's organization
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) return;

      // Load applications for the organization
      const { data: applications, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs!inner(title, organization_id),
          candidate_profiles!inner(full_name, email)
        `)
        .eq('jobs.organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group applications by stage
      const newColumns = PIPELINE_STAGES.map(stage => ({
        ...stage,
        applications: (applications || [])
          .filter((app: any) => app.status === stage.id)
          .map((app: any) => ({
            id: app.id,
            candidate_name: app.candidate_profiles.full_name,
            candidate_email: app.candidate_profiles.email,
            job_title: app.jobs.title,
            status: app.status,
            rating: app.rating,
            applied_at: app.created_at,
          })),
      }));

      setColumns(newColumns);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
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

      // Update status in database
      await supabase
        .from('applications')
        .update({ status: destination.droppableId })
        .eq('id', movedApp.id);
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
      />

      <div className="pl-0 pr-6 py-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
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
