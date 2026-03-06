'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Calendar,
  Edit,
  Trash2,
  Share2,
  CheckCircle,
  Send,
  Globe,
  X,
} from 'lucide-react';
import { PublishDrawer } from '@/components/jobs/PublishDrawer';
import { EditJobDrawer } from '@/components/jobs/EditJobDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

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
}

interface Application {
  id: string;
  candidate_name: string;
  status: string;
  created_at: string;
}

interface JobDetailsModalProps {
  jobId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

const STATUS_COLORS = {
  open: 'bg-green-100 text-green-700 border-green-200',
  on_hold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  closed: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_LABELS = {
  open: 'Ativa',
  on_hold: 'Rascunho',
  closed: 'Fechada',
};

function formatSalary(min?: number, max?: number) {
  if (!min && !max) return 'A combinar';
  if (min && max)
    return `R$ ${min.toLocaleString('pt-BR')} – R$ ${max.toLocaleString('pt-BR')}`;
  if (min) return `A partir de R$ ${min.toLocaleString('pt-BR')}`;
  return `Até R$ ${max?.toLocaleString('pt-BR')}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function JobDetailsModal({ jobId, onClose, onUpdated }: JobDetailsModalProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPublishDrawer, setShowPublishDrawer] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setApplications([]);
      setShowPublishDrawer(false);
      setShowEditDrawer(false);
      return;
    }
    void loadJob(jobId);
    void loadApplications(jobId);
  }, [jobId]);

  async function loadJob(id: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setJob(data);
    } catch {
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function loadApplications(id: string) {
    try {
      const { data } = await supabase
        .from('applications')
        .select(`id, status, created_at, candidate:candidate_profiles(full_name)`)
        .eq('job_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

      setApplications(
        (data || []).map((a: any) => ({
          id: a.id,
          candidate_name: a.candidate?.full_name || 'Candidato',
          status: a.status,
          created_at: a.created_at,
        }))
      );
    } catch {
      /* silencioso */
    }
  }

  async function handleStatusChange(newStatus: 'open' | 'on_hold' | 'closed') {
    if (!job) return;
    setSavingStatus(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', job.id);
      if (error) throw error;
      setJob(prev => (prev ? { ...prev, status: newStatus } : null));
      onUpdated();
    } catch {
      alert('Erro ao atualizar status');
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleDelete() {
    if (!job) return;
    if (!confirm('Tem certeza que deseja excluir esta vaga? Esta ação não pode ser desfeita.'))
      return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('jobs').delete().eq('id', job.id);
      if (error) throw error;
      onUpdated();
      onClose();
    } catch {
      alert('Erro ao excluir vaga');
    } finally {
      setDeleting(false);
    }
  }

  function copyJobLink() {
    if (!job) return;
    void navigator.clipboard.writeText(`${window.location.origin}/careers/${job.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!jobId) return null;

  return (
    <>

    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-[#141042]/40 backdrop-blur-sm" />

      {/* Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl z-10">
            <div className="w-8 h-8 border-2 border-[#141042] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {job && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 bg-[#141042] rounded-lg shrink-0">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-[#141042] leading-tight truncate">
                    {job.title}
                  </h2>
                  <p className="text-sm text-gray-500">{job.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <span className={`text-xs font-medium border rounded-full px-2.5 py-0.5 ${STATUS_COLORS[job.status]}`}>
                  {STATUS_LABELS[job.status]}
                </span>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 border-b border-gray-100 shrink-0 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setShowEditDrawer(true)}>
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Editar
              </Button>
              <Button size="sm" className="bg-[#141042] hover:bg-[#1a1554]" onClick={() => setShowPublishDrawer(true)}>
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Publicar
              </Button>
              <Button variant="outline" size="sm" onClick={copyJobLink}>
                {copied ? (
                  <><CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-500" />Copiado!</>
                ) : (
                  <><Share2 className="h-3.5 w-3.5 mr-1.5" />Compartilhar</>
                )}
              </Button>

              <div className="ml-auto flex items-center gap-2">
                {/* Status actions */}
                {job.status === 'on_hold' && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => void handleStatusChange('open')}
                    disabled={savingStatus}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Ativar
                  </Button>
                )}
                {job.status === 'open' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                    onClick={() => void handleStatusChange('on_hold')}
                    disabled={savingStatus}
                  >
                    Pausar
                  </Button>
                )}
                {job.status !== 'closed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-gray-500 border-gray-200 hover:bg-gray-50"
                    onClick={() => void handleStatusChange('closed')}
                    disabled={savingStatus}
                  >
                    Encerrar
                  </Button>
                )}
                {job.status === 'closed' && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => void handleStatusChange('open')}
                    disabled={savingStatus}
                  >
                    Reabrir
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  {deleting ? 'Excluindo…' : 'Excluir'}
                </Button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna principal */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Info chips */}
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {job.location || 'Localização não informada'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {job.type || 'Tipo não informado'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      {formatSalary(job.salary_min, job.salary_max)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(job.created_at)}
                    </span>
                    {job.cbo_code && (
                      <span className="flex items-center gap-1.5 font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                        CBO: {job.cbo_code}
                      </span>
                    )}
                  </div>

                  {/* Descrição */}
                  {job.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-[#141042] mb-2">Descrição</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {job.description}
                      </p>
                    </div>
                  )}

                  {/* Requisitos */}
                  {job.requirements && (
                    <>
                      <hr className="border-gray-100" />
                      <div>
                        <h3 className="text-sm font-semibold text-[#141042] mb-2">Requisitos</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {job.requirements}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Benefícios */}
                  {job.benefits && (
                    <>
                      <hr className="border-gray-100" />
                      <div>
                        <h3 className="text-sm font-semibold text-[#141042] mb-2">Benefícios</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {job.benefits}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                  {/* Candidaturas */}
                  <div className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-[#141042]">Candidaturas</h3>
                      <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                        {applications.length}
                      </span>
                    </div>
                    {applications.length === 0 ? (
                      <div className="text-center py-4">
                        <Users className="h-8 w-8 text-gray-200 mx-auto mb-1.5" />
                        <p className="text-xs text-gray-400">Nenhuma candidatura ainda</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {applications.map((app) => (
                          <div
                            key={app.id}
                            className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                          >
                            <div>
                              <p className="text-xs font-medium text-gray-800">
                                {app.candidate_name}
                              </p>
                              <p className="text-[11px] text-gray-400">{formatDate(app.created_at)}</p>
                            </div>
                            <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              {app.status}
                            </span>
                          </div>
                        ))}
                        {applications.length >= 5 && (
                          <Link href={`/dashboard/jobs/${job.id}/applications`}>
                            <button className="w-full mt-1 text-xs text-[#141042] font-medium hover:underline text-center">
                              Ver todas →
                            </button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Publicações */}
                  <div className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-[#141042]">Publicações</h3>
                      <Globe className="h-4 w-4 text-gray-300" />
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Distribua esta vaga nos principais portais de emprego.
                    </p>
                    <Button
                      size="sm"
                      className="w-full bg-[#141042] hover:bg-[#1a1554]"
                      onClick={() => setShowPublishDrawer(true)}
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Gerenciar Publicações
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>

      {showPublishDrawer && job && (
        <PublishDrawer
          jobId={job.id}
          orgId={(job as any).org_id ?? null}
          jobTitle={job.title}
          isOpen={showPublishDrawer}
          onClose={() => setShowPublishDrawer(false)}
        />
      )}
      {showEditDrawer && job && (
        <EditJobDrawer
          jobId={job.id}
          isOpen={showEditDrawer}
          onClose={() => setShowEditDrawer(false)}
          onSaved={() => { void loadJob(job.id); setShowEditDrawer(false); }}
        />
      )}
    </>
  );
}
