'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  X,
  Briefcase,
  Calendar,
  Mail,
  Phone,
  Linkedin,
  MapPin,
  FileText,
  ExternalLink,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  FolderOpen,
  Eye,
  Download,
  UserCheck,
  Building2,
  ChevronRight,
} from 'lucide-react';

interface PipelineApplication {
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

const DOC_LABELS: Record<string, string> = {
  rg: 'RG / Identidade',
  cpf: 'CPF',
  ctps: 'Carteira de Trabalho (CTPS)',
  pis: 'PIS / PASEP / NIT',
  comprovante_residencia: 'Comprovante de Residência',
  certidao_civil: 'Certidão de Nascimento/Casamento',
  foto: 'Foto 3×4',
  titulo_eleitor: 'Título de Eleitor',
  reservista: 'Certificado de Reservista',
  escolaridade: 'Comprovante de Escolaridade',
  cnh: 'CNH',
  aso: 'Exame Admissional (ASO)',
  dados_bancarios: 'Dados Bancários',
  certidao_filhos: 'Certidão dos Filhos',
  outros: 'Outros',
};

interface ApplicationDocumentItem {
  id: string;
  document_type: string;
  file_name: string;
  bucket_path: string;
  uploaded_at: string;
}

interface CandidateProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  city: string | null;
  state: string | null;
  current_title: string | null;
  experience_years: number | null;
  resume_url: string | null;
  profile_completion_percentage: number | null;
}

interface Props {
  application: PipelineApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (applicationId: string, newStatus: string) => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  applied: { label: 'Nova Candidatura', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_process: { label: 'Em Avaliação', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  interview_hr: { label: 'Entrevista com o RH', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  interview_manager: { label: 'Entrevista com o Gestor', color: 'bg-teal-100 text-teal-700 border-teal-200' },
  in_documentation: { label: 'Em Documentação', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  hired: { label: 'Contratado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Não Aprovado', color: 'bg-red-100 text-red-700 border-red-200' },
};

const STAGE_PIPELINE = [
  { id: 'applied',          label: 'Nova Candidatura',        icon: Clock,         colorClass: 'border-blue-200 text-blue-700 bg-blue-50',   activeClass: 'bg-blue-100 border-blue-400 text-blue-800' },
  { id: 'in_process',       label: 'Em Avaliação',            icon: Clock,         colorClass: 'border-amber-200 text-amber-700 bg-amber-50', activeClass: 'bg-amber-100 border-amber-400 text-amber-800' },
  { id: 'interview_hr',     label: 'Entrevista com o RH',     icon: UserCheck,     colorClass: 'border-orange-200 text-orange-700 bg-orange-50', activeClass: 'bg-orange-100 border-orange-400 text-orange-800' },
  { id: 'interview_manager',label: 'Entrevista com o Gestor', icon: Building2,     colorClass: 'border-teal-200 text-teal-700 bg-teal-50',   activeClass: 'bg-teal-100 border-teal-400 text-teal-800' },
  { id: 'in_documentation', label: 'Em Documentação',         icon: ArrowRight,    colorClass: 'border-violet-200 text-violet-700 bg-violet-50', activeClass: 'bg-violet-100 border-violet-400 text-violet-800' },
  { id: 'hired',            label: 'Contratado',              icon: CheckCircle2,  colorClass: 'border-emerald-200 text-emerald-700 bg-emerald-50', activeClass: 'bg-emerald-100 border-emerald-400 text-emerald-800' },
  { id: 'rejected',         label: 'Não Aprovado',            icon: XCircle,       colorClass: 'border-red-200 text-red-700 bg-red-50',      activeClass: 'bg-red-100 border-red-400 text-red-800' },
];

export function ApplicationDetailsDrawer({ application, isOpen, onClose, onStatusChange }: Props) {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [resumeViewerUrl, setResumeViewerUrl] = useState<string | null>(null);
  const [resumeViewerLoading, setResumeViewerLoading] = useState(false);
  const [admissionDocs, setAdmissionDocs] = useState<ApplicationDocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docViewerUrl, setDocViewerUrl] = useState<string | null>(null);
  const [docViewerLabel, setDocViewerLabel] = useState('');
  const [docViewerLoading, setDocViewerLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!isOpen || !application) {
      setProfile(null);
      setResumeViewerUrl(null);
      setAdmissionDocs([]);
      setDocViewerUrl(null);
      return;
    }
    loadProfile(application.candidate_email);
    loadAdmissionDocs(application.id);
  }, [isOpen, application?.id]);

  async function loadProfile(email: string) {
    if (!email || email === '-') return;
    try {
      setLoadingProfile(true);
      const { data } = await supabase
        .from('candidate_profiles')
        .select('id, full_name, email, phone, linkedin_url, city, state, current_title, experience_years, resume_url, profile_completion_percentage')
        .eq('email', email)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      setProfile(data || null);
    } catch {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function loadAdmissionDocs(applicationId: string) {
    try {
      setLoadingDocs(true);
      const { data } = await supabase
        .from('application_documents')
        .select('id, document_type, file_name, bucket_path, uploaded_at')
        .eq('application_id', applicationId)
        .order('uploaded_at', { ascending: true });
      setAdmissionDocs(data || []);
    } catch {
      setAdmissionDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  }

  async function openDoc(bucketPath: string, label: string) {
    setDocViewerLoading(true);
    setDocViewerLabel(label);
    try {
      const { data, error } = await supabase.storage
        .from('application-documents')
        .createSignedUrl(bucketPath, 3600);
      if (error || !data?.signedUrl) throw error;
      setDocViewerUrl(data.signedUrl);
    } catch {
      setDocViewerUrl(null);
    } finally {
      setDocViewerLoading(false);
    }
  }

  async function openResume(resumeUrl: string) {
    try {
      setResumeViewerLoading(true);
      const match = resumeUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
      if (!match) {
        setResumeViewerUrl(resumeUrl);
        return;
      }
      const bucket = match[1];
      const path = decodeURIComponent(match[2]);
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
      if (error || !data?.signedUrl) {
        setResumeViewerUrl(resumeUrl);
      } else {
        setResumeViewerUrl(data.signedUrl);
      }
    } catch {
      setResumeViewerUrl(resumeUrl);
    } finally {
      setResumeViewerLoading(false);
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const statusInfo = application ? (STATUS_LABELS[application.status] || { label: application.status, color: 'bg-gray-100 text-gray-700 border-gray-200' }) : null;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-[60]"
        onClick={() => {
          if (resumeViewerUrl) {
            setResumeViewerUrl(null);
          } else {
            onClose();
          }
        }}
      />

      {/* Doc Viewer Panel */}
      {docViewerUrl && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[80]" onClick={() => setDocViewerUrl(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-[800px] bg-white z-[81] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ backgroundColor: '#141042' }}>
              <div className="flex items-center gap-3">
                <FolderOpen className="h-5 w-5 text-white/80" />
                <span className="text-white font-semibold text-sm">{docViewerLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <a href={docViewerUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <ExternalLink className="h-4 w-4 text-white/80" />
                </a>
                <button onClick={() => setDocViewerUrl(null)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <X className="h-4 w-4 text-white/80" />
                </button>
              </div>
            </div>
            <iframe src={docViewerUrl} className="w-full flex-1 border-0" title={docViewerLabel} />
          </div>
        </>
      )}

      {/* Resume Viewer Panel (z higher than drawer) */}
      {resumeViewerUrl && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[80]" onClick={() => setResumeViewerUrl(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-[800px] bg-white z-[81] flex flex-col shadow-2xl">
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ backgroundColor: '#141042' }}
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-white/80" />
                <span className="text-white font-semibold text-sm">Visualizador de Currículo</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={resumeViewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-white/80" />
                </a>
                <button
                  onClick={() => setResumeViewerUrl(null)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4 text-white/80" />
                </button>
              </div>
            </div>
            <iframe
              src={resumeViewerUrl}
              className="w-full flex-1 border-0"
              title="Currículo"
            />
          </div>
        </>
      )}

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-[500px] bg-white z-[61] flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="flex-shrink-0" style={{ backgroundColor: '#141042' }}>
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between mb-4">
              <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                Detalhes da Candidatura
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4 text-white/80" />
              </button>
            </div>

            {application && (
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 ring-2 ring-white/20 flex-shrink-0">
                  <AvatarFallback className="bg-white/15 text-white text-lg font-semibold">
                    {initials(application.candidate_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold truncate" style={{ color: '#ffffff' }}>
                    {application.candidate_name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Mail className="h-3.5 w-3.5 text-white/60 flex-shrink-0" />
                    <span className="text-sm text-white/70 truncate">{application.candidate_email}</span>
                  </div>
                  {profile?.current_title && (
                    <p className="text-xs mt-1.5 truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {profile.current_title}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {application && (
            <>
              {/* Candidatura */}
              <div className="px-5 py-4 border-b border-[#E5E5DC]">
                <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
                  Candidatura
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[rgba(20,16,66,0.06)] flex items-center justify-center flex-shrink-0">
                      <Briefcase className="h-4 w-4 text-[#666666]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-[#94A3B8]">Vaga</p>
                      <p className="text-sm font-medium text-[#141042] truncate">{application.job_title}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[rgba(20,16,66,0.06)] flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-[#666666]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#94A3B8]">Status</p>
                      {statusInfo && (
                        <Badge className={`border text-xs mt-0.5 ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {application.current_stage && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[rgba(20,16,66,0.06)] flex items-center justify-center flex-shrink-0">
                        <ArrowRight className="h-4 w-4 text-[#666666]" />
                      </div>
                      <div>
                        <p className="text-xs text-[#94A3B8]">Etapa atual</p>
                        <p className="text-sm font-medium text-[#141042]">{application.current_stage.name}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[rgba(20,16,66,0.06)] flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-4 w-4 text-[#666666]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#94A3B8]">Candidatou-se em</p>
                      <p className="text-sm font-medium text-[#141042]">{formatDate(application.applied_at)}</p>
                    </div>
                  </div>

                  {/* Rating */}
                  {application.rating !== undefined && application.rating > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[rgba(20,16,66,0.06)] flex items-center justify-center flex-shrink-0">
                        <Star className="h-4 w-4 text-[#666666]" />
                      </div>
                      <div>
                        <p className="text-xs text-[#94A3B8]">Avaliação</p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < application.rating!
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-[#E5E5DC]'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-sm text-[#666666]">{application.rating}/5</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mover Etapa */}
              {onStatusChange && (
                <div className="px-5 py-4 border-b border-[#E5E5DC]">
                  <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
                    Atualizar Etapa
                  </h3>
                  <div className="space-y-1.5">
                    {STAGE_PIPELINE.map((stage, index) => {
                      const isCurrent = application.status === stage.id;
                      const Icon = stage.icon;
                      return (
                        <button
                          key={stage.id}
                          disabled={isCurrent || updatingStatus}
                          onClick={() => {
                            if (!isCurrent && onStatusChange) {
                              setUpdatingStatus(true);
                              onStatusChange(application.id, stage.id);
                              setTimeout(() => setUpdatingStatus(false), 500);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                            isCurrent
                              ? `${stage.activeClass} font-semibold cursor-default`
                              : 'bg-white border-[#E5E5DC] hover:border-[#141042]/30 hover:bg-[#FAFAF8] cursor-pointer'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isCurrent ? 'border-current bg-current/10' : 'border-[#E5E5DC]'
                          }`}>
                            {isCurrent ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <span className="text-[9px] font-bold text-[#94A3B8]">{index + 1}</span>
                            )}
                          </div>
                          <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${isCurrent ? '' : 'text-[#94A3B8]'}`} />
                          <span className="text-sm flex-1">{stage.label}</span>
                          {!isCurrent && (
                            <ChevronRight className="h-3.5 w-3.5 text-[#94A3B8] flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Candidate Profile */}
              <div className="px-5 py-4 border-b border-[#E5E5DC]">
                <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
                  Perfil do Candidato
                </h3>

                {loadingProfile ? (
                  <div className="flex items-center gap-2 text-sm text-[#94A3B8] py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando perfil...
                  </div>
                ) : profile ? (
                  <div className="space-y-3">
                    {profile.phone && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[rgba(20,16,66,0.06)] flex items-center justify-center flex-shrink-0">
                          <Phone className="h-4 w-4 text-[#666666]" />
                        </div>
                        <div>
                          <p className="text-xs text-[#94A3B8]">Telefone</p>
                          <p className="text-sm font-medium text-[#141042]">{profile.phone}</p>
                        </div>
                      </div>
                    )}
                    {(profile.city || profile.state) && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[rgba(20,16,66,0.06)] flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-4 w-4 text-[#666666]" />
                        </div>
                        <div>
                          <p className="text-xs text-[#94A3B8]">Localização</p>
                          <p className="text-sm font-medium text-[#141042]">{[profile.city, profile.state].filter(Boolean).join(', ')}</p>
                        </div>
                      </div>
                    )}
                    {profile.experience_years != null && profile.experience_years > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[rgba(20,16,66,0.06)] flex items-center justify-center flex-shrink-0">
                          <Briefcase className="h-4 w-4 text-[#666666]" />
                        </div>
                        <div>
                          <p className="text-xs text-[#94A3B8]">Experiência</p>
                          <p className="text-sm font-medium text-[#141042]">
                            {profile.experience_years} {profile.experience_years === 1 ? 'ano' : 'anos'}
                          </p>
                        </div>
                      </div>
                    )}
                    {profile.linkedin_url && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[rgba(20,16,66,0.06)] flex items-center justify-center flex-shrink-0">
                          <Linkedin className="h-4 w-4 text-[#666666]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-[#94A3B8]">LinkedIn</p>
                          <a
                            href={profile.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#3B82F6] hover:underline truncate block max-w-[280px]"
                          >
                            {profile.linkedin_url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}
                          </a>
                        </div>
                      </div>
                    )}
                    {profile.profile_completion_percentage != null && profile.profile_completion_percentage > 0 && (
                      <div className="mt-2 p-3 bg-[rgba(20,16,66,0.04)] rounded-lg border border-[#E5E5DC]">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-[#666666]">Completude do perfil</span>
                          <span className="text-xs font-bold text-[#141042]">{profile.profile_completion_percentage}%</span>
                        </div>
                        <div className="w-full bg-[#E5E5DC] rounded-full h-1.5">
                          <div
                            className="bg-[#10B981] h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(profile.profile_completion_percentage!, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[#94A3B8] py-2">Perfil não encontrado</p>
                )}
              </div>

              {/* Admission Documents Section */}
              {(application.status === 'in_documentation' || admissionDocs.length > 0) && (
                <div className="px-5 py-4 border-b border-[#E5E5DC]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                      Documentos de Admissão
                    </h3>
                    {application.status === 'in_documentation' && (
                      <span className="text-xs text-violet-600 font-medium bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                        {admissionDocs.length} enviado{admissionDocs.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {loadingDocs ? (
                    <div className="flex items-center gap-2 text-sm text-[#94A3B8] py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando documentos...
                    </div>
                  ) : admissionDocs.length === 0 ? (
                    <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-lg border border-violet-100">
                      <FolderOpen className="h-4 w-4 text-violet-400 flex-shrink-0" />
                      <p className="text-xs text-violet-600">Aguardando o candidato enviar os documentos de admissão.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {admissionDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-3 p-3 bg-[#FAFAF8] rounded-lg border border-[#E5E5DC] hover:border-[#141042]/20 transition-colors">
                          <div className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[#141042] truncate">
                              {DOC_LABELS[doc.document_type] || doc.document_type}
                            </p>
                            <p className="text-xs text-[#94A3B8] truncate">{doc.file_name}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-xs text-[#94A3B8]">
                              {new Date(doc.uploaded_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                            <button
                              onClick={() => openDoc(doc.bucket_path, DOC_LABELS[doc.document_type] || doc.document_type)}
                              disabled={docViewerLoading}
                              className="p-1.5 rounded-lg text-[#666666] hover:text-[#3B82F6] hover:bg-blue-50 transition-colors"
                              title="Visualizar"
                            >
                              {docViewerLoading && docViewerLabel === (DOC_LABELS[doc.document_type] || doc.document_type) ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Resume */}
              {profile?.resume_url && (
                <div className="px-5 py-4 border-b border-[#E5E5DC]">
                  <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
                    Currículo
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(59,130,246,0.08)] flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-[#3B82F6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#141042]">Currículo enviado</p>
                      <p className="text-xs text-[#94A3B8]">Clique para visualizar</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openResume(profile.resume_url!)}
                        disabled={resumeViewerLoading}
                        className="text-xs"
                      >
                        {resumeViewerLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Visualizar
                      </Button>
                      <a
                        href={profile.resume_url}
                        download
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-[#E5E5DC] bg-white hover:bg-[#F8F8F5] text-[#666666] transition-colors"
                        title="Baixar currículo"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-[#E5E5DC] bg-[#FAFAF8]">
          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </div>
    </>
  );
}
