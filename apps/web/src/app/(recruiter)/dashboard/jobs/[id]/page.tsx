'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Calendar,
  Edit,
  Trash2,
  Share2,
  Copy,
  CheckCircle,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardHeader } from '@/components/DashboardHeader';
import { createBrowserClient } from '@supabase/ssr';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  department: string;
  location: string;
  type: string;
  salary_min?: number;
  salary_max?: number;
  status: 'open' | 'on_hold' | 'closed';
  cbo_code?: string;
  created_at: string;
  updated_at: string;
  org_id: string;
}

interface Application {
  id: string;
  candidate_name: string;
  candidate_email: string;
  status: string;
  created_at: string;
}

const statusColors = {
  open: 'bg-green-100 text-green-700 border-green-200',
  on_hold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  closed: 'bg-red-100 text-red-700 border-red-200',
};

const statusLabels = {
  open: 'Ativa',
  on_hold: 'Rascunho',
  closed: 'Fechada',
};

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (jobId) {
      loadJob();
      loadApplications();
    }
  }, [jobId]);

  async function loadJob() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error loading job:', error);
      router.push('/dashboard/jobs');
    } finally {
      setLoading(false);
    }
  }

  async function loadApplications() {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          candidate:candidate_profiles(full_name, email)
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      setApplications(
        (data || []).map((app: any) => ({
          id: app.id,
          candidate_name: app.candidate?.full_name || 'Candidato',
          candidate_email: app.candidate?.email || '',
          status: app.status,
          created_at: app.created_at,
        }))
      );
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir esta vaga? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setDeleting(true);
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
      router.push('/dashboard/jobs');
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Erro ao excluir vaga');
    } finally {
      setDeleting(false);
    }
  }

  async function handleStatusChange(newStatus: 'open' | 'on_hold' | 'closed') {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', jobId);

      if (error) throw error;
      setJob(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status');
    }
  }

  function copyJobLink() {
    const url = `${window.location.origin}/careers/${jobId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'A combinar';
    if (min && max) return `R$ ${min.toLocaleString('pt-BR')} - R$ ${max.toLocaleString('pt-BR')}`;
    if (min) return `A partir de R$ ${min.toLocaleString('pt-BR')}`;
    return `Até R$ ${max?.toLocaleString('pt-BR')}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#141042]" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <p>Vaga não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <DashboardHeader
        title={job.title}
        subtitle={job.department}
        actions={
          <div className="flex gap-2">
            <Link href="/dashboard/jobs">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <Link href={`/dashboard/jobs/${jobId}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
            <Button variant="outline" onClick={copyJobLink}>
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Copiado!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </>
              )}
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#141042] rounded-lg">
                      <Briefcase className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-black">{job.title}</CardTitle>
                      <p className="text-gray-500">{job.department}</p>
                    </div>
                  </div>
                  <Badge className={`${statusColors[job.status]} border px-3 py-1`}>
                    {statusLabels[job.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <span>{job.location || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span>{job.type || 'Não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span>{formatDate(job.created_at)}</span>
                  </div>
                </div>

                {job.cbo_code && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-500">Código CBO:</span>
                    <span className="ml-2 font-mono text-gray-700">{job.cbo_code}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-black">Descrição da Vaga</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {job.description || 'Nenhuma descrição fornecida.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {job.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-black">Requisitos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {job.benefits && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-black">Benefícios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{job.benefits}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-black">Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {job.status === 'on_hold' && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusChange('open')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Publicar Vaga
                  </Button>
                )}
                {job.status === 'open' && (
                  <Button
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                    onClick={() => handleStatusChange('on_hold')}
                  >
                    Pausar Vaga
                  </Button>
                )}
                {job.status !== 'closed' && (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleStatusChange('closed')}
                  >
                    Encerrar Vaga
                  </Button>
                )}
                {job.status === 'closed' && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusChange('open')}
                  >
                    Reabrir Vaga
                  </Button>
                )}
                <hr className="my-2" />
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? 'Excluindo...' : 'Excluir Vaga'}
                </Button>
              </CardContent>
            </Card>

            {/* Applications Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-black">Candidaturas</CardTitle>
                  <Badge variant="secondary">{applications.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Nenhuma candidatura ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {app.candidate_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(app.created_at)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {app.status}
                        </Badge>
                      </div>
                    ))}
                    {applications.length >= 5 && (
                      <Link href={`/dashboard/jobs/${jobId}/applications`}>
                        <Button variant="outline" className="w-full mt-2">
                          Ver todas candidaturas
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-black">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Visualizações</span>
                    <span className="font-semibold text-gray-900">-</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Candidaturas</span>
                    <span className="font-semibold text-gray-900">{applications.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Taxa de conversão</span>
                    <span className="font-semibold text-gray-900">-</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
