'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Eye,
  MapPin,
  DollarSign,
  Clock,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardHeader } from '@/components/DashboardHeader';
import { createBrowserClient } from '@supabase/ssr';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary_min?: number;
  salary_max?: number;
  status: 'open' | 'on_hold' | 'closed';
  applications_count?: number;
  hire_rate?: number;
  avg_time_to_hire?: number;
  created_at: string;
}

const statusColors = {
  open: 'success',
  on_hold: 'warning',
  closed: 'danger',
} as const;

const statusLabels = {
  open: 'Ativa',
  on_hold: 'Rascunho',
  closed: 'Fechada',
};

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadJobs();
  }, [statusFilter]);

  async function loadJobs() {
    try {
      setLoading(true);
      let query = supabase
        .from('jobs')
        .select('*, applications:applications(count)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const jobIds = (data || []).map((job: any) => job.id);
      if (jobIds.length > 0) {
        const { data: applications } = await supabase
          .from('applications')
          .select('job_id, status, created_at, updated_at')
          .in('job_id', jobIds);

        const totals = new Map<string, number>();
        const hires = new Map<string, number>();
        const durations = new Map<string, number[]>();

        (applications || []).forEach((app: any) => {
          totals.set(app.job_id, (totals.get(app.job_id) || 0) + 1);
          if (app.status === 'hired') {
            hires.set(app.job_id, (hires.get(app.job_id) || 0) + 1);
            if (app.created_at && app.updated_at) {
              const days = Math.round(
                (new Date(app.updated_at).getTime() - new Date(app.created_at).getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              const list = durations.get(app.job_id) || [];
              list.push(days);
              durations.set(app.job_id, list);
            }
          }
        });

        const enrichedJobs = (data || []).map((job: any) => {
          const total = totals.get(job.id) || 0;
          const hired = hires.get(job.id) || 0;
          const avgDays = durations.get(job.id)?.length
            ? Math.round(
                durations.get(job.id)!.reduce((sum, val) => sum + val, 0) /
                  durations.get(job.id)!.length
              )
            : 0;
          return {
            ...job,
            applications_count: total,
            hire_rate: total > 0 ? Math.round((hired / total) * 100) : 0,
            avg_time_to_hire: avgDays,
          };
        });

        setJobs(enrichedJobs);
      } else {
        setJobs(data || []);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'A combinar';
    if (min && max) return `R$ ${min.toLocaleString()} - R$ ${max.toLocaleString()}`;
    if (min) return `A partir de R$ ${min.toLocaleString()}`;
    return `Até R$ ${max?.toLocaleString()}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <div className="bg-white border-b border-[var(--border)]">
        <div className="pl-0 pr-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--tf-accent)] uppercase tracking-wider mb-1">
                Gestão
              </p>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                Vagas
              </h1>
              <p className="text-sm text-[var(--foreground-muted)] mt-1">
                Gerencie suas oportunidades de trabalho
              </p>
            </div>
            <Link href="/dashboard/jobs/new">
              <Button>
                <Plus className="h-4 w-4" />
                Nova Vaga
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="pl-0 pr-6 py-6 space-y-5">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--tf-gray-400)]" />
                <input
                  type="text"
                  placeholder="Buscar vagas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-[var(--border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--tf-accent)] focus:border-[var(--tf-accent)] transition-all"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 text-sm border border-[var(--border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--tf-accent)] focus:border-[var(--tf-accent)]"
                >
                  <option value="all">Todas</option>
                  <option value="on_hold">Rascunhos</option>
                  <option value="open">Ativas</option>
                  <option value="closed">Fechadas</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[var(--tf-accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-12 h-12 bg-[var(--tf-gray-100)] rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-6 w-6 text-[var(--tf-gray-400)]" />
              </div>
              <h3 className="text-base font-semibold text-[var(--foreground)] mb-2">
                Nenhuma vaga encontrada
              </h3>
              <p className="text-sm text-[var(--foreground-muted)] mb-6">
                {searchQuery
                  ? 'Tente ajustar seus filtros de busca'
                  : 'Comece criando sua primeira vaga'}
              </p>
              {!searchQuery && (
                <Link href="/dashboard/jobs/new">
                  <Button>
                    <Plus className="h-4 w-4" />
                    Criar Vaga
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} hover>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-[var(--tf-accent-subtle)] rounded-lg shrink-0">
                      <Briefcase className="h-5 w-5 text-[var(--tf-accent)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-base font-semibold text-[var(--foreground)] mb-0.5">
                            {job.title}
                          </h3>
                          <p className="text-sm text-[var(--foreground-muted)]">{job.department}</p>
                        </div>
                        <Badge variant={statusColors[job.status]}>
                          {statusLabels[job.status]}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-[var(--foreground-muted)]">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{job.type}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          <span>{job.applications_count || 0} candidaturas</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          <span>Hire rate: {job.hire_rate || 0}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Tempo médio: {job.avg_time_to_hire || 0}d</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-[var(--divider)] flex items-center justify-between">
                        <span className="text-xs text-[var(--tf-gray-400)]">
                          Criada em {formatDate(job.created_at)}
                        </span>
                        <Link href={`/dashboard/jobs/${job.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3.5 w-3.5" />
                            Ver Detalhes
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
