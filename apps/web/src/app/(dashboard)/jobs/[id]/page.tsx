'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Card, CardContent, Badge, Button, Modal } from '@/components/ui';
import { KanbanBoard, KanbanColumnData } from '@/components/kanban';
import { useOrgStore } from '@/lib/store';
import { jobsApi, applicationsApi, candidatesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, formatCurrency, getJobStatusLabel, getJobStatusColor } from '@/lib/utils';
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Briefcase,
  Clock,
  Users,
  Plus,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  location: string;
  employmentType: string;
  seniorityLevel: string;
  status: string;
  minSalary?: number;
  maxSalary?: number;
  isRemote: boolean;
  createdAt: string;
  pipelineStages: Array<{
    id: string;
    name: string;
    color: string;
    order: number;
  }>;
}

interface KanbanData {
  columns: KanbanColumnData[];
}

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { currentOrg } = useOrgStore();
  const { session } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [kanbanData, setKanbanData] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');

  useEffect(() => {
    if (currentOrg?.id && session?.access_token && id) {
      loadJob();
      loadKanban();
    }
  }, [currentOrg?.id, session?.access_token, id]);

  const loadJob = async () => {
    try {
      const data = await jobsApi.get(id as string, session!.access_token, currentOrg!.id);
      setJob((data as any).data);
    } catch (error) {
      console.error('Failed to load job:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadKanban = async () => {
    try {
      const data = await applicationsApi.getKanban(id as string, session!.access_token, currentOrg!.id);
      setKanbanData(data as any);
    } catch (error) {
      console.error('Failed to load kanban:', error);
    }
  };

  const handleMoveCard = useCallback(async (cardId: string, fromColumn: string, toColumn: string, newIndex: number) => {
    try {
      await applicationsApi.updateStage(
        cardId,
        { toStageId: toColumn },
        session!.access_token,
        currentOrg!.id
      );
    } catch (error) {
      console.error('Failed to move card:', error);
      // Reload kanban to restore correct state
      loadKanban();
    }
  }, [session, currentOrg]);

  const handleAddCandidate = async () => {
    if (!selectedCandidate) return;

    try {
      await applicationsApi.create(
        { jobId: id as string, candidateId: selectedCandidate },
        session!.access_token,
        currentOrg!.id
      );
      setShowAddCandidate(false);
      setSelectedCandidate('');
      loadKanban();
    } catch (error) {
      console.error('Failed to add candidate:', error);
    }
  };

  const loadCandidates = async () => {
    try {
      const data = await candidatesApi.list(session!.access_token, currentOrg!.id);
      setCandidates((data as any).data || []);
    } catch (error) {
      console.error('Failed to load candidates:', error);
    }
  };

  useEffect(() => {
    if (showAddCandidate && session?.access_token && currentOrg?.id) {
      loadCandidates();
    }
  }, [showAddCandidate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Vaga não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title={job.title}
        subtitle={job.location}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddCandidate(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Candidato
            </Button>
            <Link href={`/jobs/${id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-6">
        {/* Job Info */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant={getJobStatusColor(job.status) as any}>
                {getJobStatusLabel(job.status)}
              </Badge>
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                {job.location}
                {job.isRemote && ' (Remoto)'}
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <Briefcase className="h-4 w-4" />
                {job.employmentType} • {job.seniorityLevel}
              </span>
              {(job.minSalary || job.maxSalary) && (
                <span className="text-sm text-gray-500">
                  {job.minSalary && job.maxSalary
                    ? `${formatCurrency(job.minSalary)} - ${formatCurrency(job.maxSalary)}`
                    : job.minSalary
                    ? `A partir de ${formatCurrency(job.minSalary)}`
                    : `Até ${formatCurrency(job.maxSalary!)}`}
                </span>
              )}
              <span className="flex items-center gap-1 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                Criada em {formatDate(job.createdAt)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline de Candidatos</h2>
        </div>

        {kanbanData ? (
          <KanbanBoard columns={kanbanData.columns} onMoveCard={handleMoveCard} />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum candidato ainda</h3>
              <p className="text-gray-500 mb-4">Adicione candidatos para iniciar o processo seletivo.</p>
              <Button onClick={() => setShowAddCandidate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Candidato
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Candidate Modal */}
      <Modal
        isOpen={showAddCandidate}
        onClose={() => setShowAddCandidate(false)}
        title="Adicionar Candidato à Vaga"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Selecione um candidato existente para adicionar a esta vaga.
          </p>
          
          <select
            value={selectedCandidate}
            onChange={(e) => setSelectedCandidate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione um candidato...</option>
            {candidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name} - {candidate.email}
              </option>
            ))}
          </select>

          <div className="flex justify-between items-center pt-2">
            <Link href="/candidates/new" className="text-sm text-blue-600 hover:underline">
              + Criar novo candidato
            </Link>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddCandidate(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddCandidate} disabled={!selectedCandidate}>
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
