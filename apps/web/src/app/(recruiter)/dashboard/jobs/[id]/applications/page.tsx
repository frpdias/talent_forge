'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Mail,
  Phone,
  Calendar,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardHeader } from '@/components/DashboardHeader';
import { createBrowserClient } from '@supabase/ssr';

interface Application {
  id: string;
  status: string;
  created_at: string;
  cover_letter?: string;
  candidate: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    current_title?: string;
    location?: string;
  };
}

interface Job {
  id: string;
  title: string;
  department: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  reviewing: { label: 'Em Análise', color: 'bg-blue-100 text-blue-700', icon: Eye },
  interview: { label: 'Entrevista', color: 'bg-purple-100 text-purple-700', icon: Users },
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function JobApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (jobId) {
      loadJob();
      loadApplications();
    }
  }, [jobId, statusFilter]);

  async function loadJob() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, department')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error loading job:', error);
      router.push('/dashboard/jobs');
    }
  }

  async function loadApplications() {
    try {
      setLoading(true);
      
      let query = supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          cover_letter,
          candidate:candidate_profiles(
            id,
            full_name,
            email,
            phone,
            current_title,
            location
          )
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setApplications(
        (data || []).map((app: any) => ({
          id: app.id,
          status: app.status,
          created_at: app.created_at,
          cover_letter: app.cover_letter,
          candidate: app.candidate || {
            id: '',
            full_name: 'Candidato',
            email: '',
          },
        }))
      );
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateApplicationStatus(applicationId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status');
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !job) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#141042]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <DashboardHeader
        title="Candidaturas"
        subtitle={job?.title || 'Carregando...'}
        actions={
          <Link href={`/dashboard/jobs/${jobId}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Vaga
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042] text-black"
              >
                <option value="all">Todos os status</option>
                <option value="pending">Pendentes</option>
                <option value="reviewing">Em Análise</option>
                <option value="interview">Entrevista</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Rejeitados</option>
              </select>
              <span className="text-sm text-gray-500">
                {applications.length} candidatura(s)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#141042]" />
          </div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma candidatura encontrada
              </h3>
              <p className="text-gray-500">
                {statusFilter !== 'all'
                  ? 'Tente ajustar o filtro de status'
                  : 'Esta vaga ainda não recebeu candidaturas'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {applications.map((application) => {
              const StatusIcon = statusConfig[application.status]?.icon || Clock;
              return (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-[#141042] rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {application.candidate.full_name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {application.candidate.full_name}
                              </h3>
                              {application.candidate.current_title && (
                                <p className="text-sm text-gray-500">
                                  {application.candidate.current_title}
                                </p>
                              )}
                            </div>
                            <Badge className={statusConfig[application.status]?.color || 'bg-gray-100'}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[application.status]?.label || application.status}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                            {application.candidate.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <a href={`mailto:${application.candidate.email}`} className="hover:text-[#141042]">
                                  {application.candidate.email}
                                </a>
                              </div>
                            )}
                            {application.candidate.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{application.candidate.phone}</span>
                              </div>
                            )}
                            {application.candidate.location && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{application.candidate.location}</span>
                              </div>
                            )}
                          </div>

                          {application.cover_letter && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {application.cover_letter}
                              </p>
                            </div>
                          )}

                          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              Candidatura em {formatDate(application.created_at)}
                            </span>
                            <div className="flex gap-2">
                              <select
                                value={application.status}
                                onChange={(e) => updateApplicationStatus(application.id, e.target.value)}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042] text-black"
                              >
                                <option value="pending">Pendente</option>
                                <option value="reviewing">Em Análise</option>
                                <option value="interview">Entrevista</option>
                                <option value="approved">Aprovado</option>
                                <option value="rejected">Rejeitado</option>
                              </select>
                              <Link href={`/dashboard/candidates/${application.candidate.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Perfil
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
