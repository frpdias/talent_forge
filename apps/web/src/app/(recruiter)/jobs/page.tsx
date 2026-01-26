'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Card, CardContent, Badge, Button, Input, Select } from '@/components/ui';
import { useOrgStore } from '@/lib/store';
import { jobsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, formatCurrency, getJobStatusLabel, getJobStatusColor } from '@/lib/utils';
import {
  Plus,
  Search,
  MapPin,
  Briefcase,
  Clock,
  Users,
  MoreVertical,
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  location: string;
  employmentType: string;
  seniorityLevel: string;
  status: string;
  minSalary?: number;
  maxSalary?: number;
  createdAt: string;
  applicationCount?: number;
}

export default function JobsPage() {
  const { currentOrg } = useOrgStore();
  const { session } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (currentOrg?.id && session?.access_token) {
      loadJobs();
    }
  }, [currentOrg?.id, session?.access_token, search, statusFilter]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const params: { search?: string; status?: string } = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      
      const data = await jobsApi.list(session!.access_token, currentOrg!.id, params);
      setJobs((data as any).data || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const employmentTypeLabels: Record<string, string> = {
    full_time: 'CLT',
    part_time: 'Meio Período',
    contract: 'PJ',
    internship: 'Estágio',
    temporary: 'Temporário',
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Vagas"
        subtitle={`${jobs.length} vagas encontradas`}
        actions={
          <Link href="/jobs/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Vaga
            </Button>
          </Link>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar vagas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Todos os status' },
              { value: 'draft', label: 'Rascunho' },
              { value: 'open', label: 'Aberta' },
              { value: 'paused', label: 'Pausada' },
              { value: 'closed', label: 'Fechada' },
            ]}
            className="w-48"
          />
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando...</div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma vaga encontrada</h3>
              <p className="text-gray-500 mb-4">Crie sua primeira vaga para começar a receber candidatos.</p>
              <Link href="/jobs/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Vaga
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{job.location}</span>
                        </div>
                      </div>
                      <Badge variant={getJobStatusColor(job.status) as any}>
                        {getJobStatusLabel(job.status)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        <Briefcase className="h-3 w-3" />
                        {employmentTypeLabels[job.employmentType] || job.employmentType}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {job.seniorityLevel}
                      </span>
                    </div>

                    {(job.minSalary || job.maxSalary) && (
                      <p className="text-sm text-gray-600 mb-3">
                        {job.minSalary && job.maxSalary
                          ? `${formatCurrency(job.minSalary)} - ${formatCurrency(job.maxSalary)}`
                          : job.minSalary
                          ? `A partir de ${formatCurrency(job.minSalary)}`
                          : `Até ${formatCurrency(job.maxSalary!)}`}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Criada em {formatDate(job.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{job.applicationCount || 0} candidatos</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
