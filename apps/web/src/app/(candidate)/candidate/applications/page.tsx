'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  FileText,
  Briefcase,
  Clock,
  AlertCircle,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  FolderOpen,
  Info,
  Eye,
  ExternalLink,
  X,
} from 'lucide-react';

// ── Documentos de admissão CLT ───────────────────────────────
const ADMISSION_DOCS = [
  { type: 'rg', label: 'RG / Identidade', description: 'Cédula de identidade (frente e verso)', required: true },
  { type: 'cpf', label: 'CPF', description: 'Cartão CPF ou documento que contenha o número', required: true },
  { type: 'ctps', label: 'Carteira de Trabalho (CTPS)', description: 'Física ou digital (print da tela)', required: true },
  { type: 'pis', label: 'PIS / PASEP / NIT', description: 'Número PIS (pode ser do extrato CTPS digital)', required: true },
  { type: 'comprovante_residencia', label: 'Comprovante de Residência', description: 'Conta de luz, água ou gás (últimos 90 dias)', required: true },
  { type: 'certidao_civil', label: 'Certidão de Nascimento ou Casamento', description: 'Estado civil comprovado', required: true },
  { type: 'foto', label: 'Foto 3×4', description: 'Foto recente, fundo branco', required: true },
  { type: 'titulo_eleitor', label: 'Título de Eleitor', description: 'Frente e verso', required: true },
  { type: 'reservista', label: 'Certificado de Reservista', description: 'Obrigatório para homens até 45 anos', required: false },
  { type: 'escolaridade', label: 'Comprovante de Escolaridade', description: 'Diploma ou histórico escolar', required: true },
  { type: 'cnh', label: 'CNH (se exigida pela vaga)', description: 'Habilitação válida, se aplicável à função', required: false },
  { type: 'aso', label: 'Exame Admissional (ASO)', description: 'Atestado de Saúde Ocupacional — fornecido pela empresa', required: false },
  { type: 'dados_bancarios', label: 'Dados Bancários', description: 'Comprovante de conta corrente para depósito de salário', required: true },
  { type: 'certidao_filhos', label: 'Certidão de Nascimento dos Filhos', description: 'Para salário-família, se houver filhos até 14 anos', required: false },
] as const;

type DocType = (typeof ADMISSION_DOCS)[number]['type'];

interface ApplicationDocument {
  id: string;
  document_type: DocType;
  file_name: string;
  bucket_path: string;
  uploaded_at: string;
}

interface ApplicationItem {
  id: string;
  jobTitle: string;
  location: string;
  status: string;
  createdAt: string;
  documents?: ApplicationDocument[];
}

const BUCKET = 'application-documents';

const statusLabel: Record<string, { label: string; color: string }> = {
  applied: { label: 'Candidatura recebida', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_process: { label: 'Em avaliação', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_documentation: { label: 'Aguardando documentos', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  hired: { label: 'Contratado! 🎉', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Não aprovado', color: 'bg-red-50 text-red-700 border-red-200' },
};

export default function CandidateApplicationsPage() {
  const supabase = createClient();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state por (applicationId_docType)
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadError, setUploadError] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Viewer inline
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerLabel, setViewerLabel] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError('Faça login para visualizar suas candidaturas.');
        return;
      }

      const { data: apps, error: appsError } = await supabase.rpc('get_my_applications');
      if (appsError) throw appsError;

      const mappedIds: string[] = (apps || []).map((a: any) => a.application_id).filter(Boolean);

      // Buscar documentos já enviados
      let docsMap: Record<string, ApplicationDocument[]> = {};
      if (mappedIds.length > 0) {
        const { data: docs } = await supabase
          .from('application_documents')
          .select('id, application_id, document_type, file_name, bucket_path, uploaded_at')
          .in('application_id', mappedIds);
        (docs || []).forEach((doc: any) => {
          if (!docsMap[doc.application_id]) docsMap[doc.application_id] = [];
          docsMap[doc.application_id].push(doc);
        });
      }

      const mapped: ApplicationItem[] = (apps || []).map((app: any) => ({
        id: app.application_id,
        jobTitle: app.job_title || 'Vaga não identificada',
        location: app.job_location || 'Local não informado',
        status: app.status || 'applied',
        createdAt: app.created_at ? new Date(app.created_at).toLocaleDateString('pt-BR') : 'Recente',
        documents: docsMap[app.application_id] || [],
      }));

      setApplications(mapped);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar candidaturas');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(applicationId: string, docType: DocType, file: File) {
    const key = `${applicationId}_${docType}`;
    setUploading(prev => ({ ...prev, [key]: true }));
    setUploadError(prev => { const n = { ...prev }; delete n[key]; return n; });

    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${applicationId}/${docType}_${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { error: insertErr } = await supabase.rpc('upsert_application_document', {
        p_application_id: applicationId,
        p_document_type:  docType,
        p_file_name:      file.name,
        p_bucket_path:    path,
      });
      if (insertErr) throw insertErr;

      setApplications(prev => prev.map(app => {
        if (app.id !== applicationId) return app;
        const existing = (app.documents || []).filter(d => d.document_type !== docType);
        return {
          ...app,
          documents: [...existing, { id: key, document_type: docType, file_name: file.name, bucket_path: path, uploaded_at: new Date().toISOString() }],
        };
      }));
    } catch (err: any) {
      setUploadError(prev => ({ ...prev, [key]: err?.message || 'Erro ao enviar arquivo' }));
    } finally {
      setUploading(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  }

  async function openViewer(bucketPath: string, label: string) {
    setViewerLoading(true);
    setViewerLabel(label);
    try {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(bucketPath, 3600);
      if (error || !data?.signedUrl) throw error;
      setViewerUrl(data.signedUrl);
    } catch {
      setViewerUrl(null);
    } finally {
      setViewerLoading(false);
    }
  }

  const totalRequired = ADMISSION_DOCS.filter(d => d.required).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#141042]">Candidaturas</h1>
        <p className="text-xs sm:text-sm text-[#666666]">Acompanhe o status das suas candidaturas.</p>
      </header>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[#666666]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando candidaturas...
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && applications.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#E5E5DC] bg-white p-6 text-center text-sm text-[#666666]">
          Você ainda não possui candidaturas. Candidate-se a uma vaga para acompanhar aqui.
        </div>
      )}

      <div className="grid gap-5">
        {applications.map((application) => {
          const statusInfo = statusLabel[application.status] ?? { label: application.status, color: 'bg-gray-50 text-gray-700 border-gray-200' };
          const isDocPhase = application.status === 'in_documentation';
          const docs = application.documents || [];
          const requiredSent = ADMISSION_DOCS.filter(d => d.required && docs.some(doc => doc.document_type === d.type)).length;

          return (
            <article key={application.id} className="rounded-2xl border border-[#E5E5DC] bg-white shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-[#141042] truncate">{application.jobTitle}</h2>
                    <p className="text-sm text-[#666666] flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{application.location}</span>
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap flex-shrink-0 ${statusInfo.color}`}>
                    {application.status === 'hired' && <CheckCircle2 className="w-3 h-3" />}
                    {application.status === 'rejected' && <XCircle className="w-3 h-3" />}
                    {application.status === 'in_documentation' && <FolderOpen className="w-3 h-3" />}
                    {!['hired', 'rejected', 'in_documentation'].includes(application.status) && <Clock className="w-3 h-3" />}
                    {statusInfo.label}
                  </span>
                </div>
                <p className="text-xs text-[#999] mt-3 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Candidatou-se em {application.createdAt}
                </p>
              </div>

              {/* ── Seção de Documentação Admissional ── */}
              {isDocPhase && (
                <div className="border-t border-[#E5E5DC]">
                  {/* Banner */}
                  <div className="flex items-start gap-3 px-5 py-4 bg-violet-50 border-b border-violet-100">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FolderOpen className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-violet-800">Seu headhunter solicitou documentos de admissão</p>
                      <p className="text-xs text-violet-600 mt-0.5">
                        Envie os documentos abaixo para avançar no processo. Obrigatórios: {requiredSent}/{totalRequired} enviados.
                      </p>
                    </div>
                    <button onClick={load} className="p-1.5 rounded-lg hover:bg-violet-100 transition-colors" title="Atualizar lista">
                      <RefreshCw className="w-3.5 h-3.5 text-violet-500" />
                    </button>
                  </div>

                  {/* Barra de progresso */}
                  <div className="px-5 py-3 bg-violet-50/50 border-b border-violet-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-violet-700 font-medium">Progresso dos obrigatórios</span>
                      <span className="text-xs font-bold text-violet-800">{Math.round((requiredSent / totalRequired) * 100)}%</span>
                    </div>
                    <div className="w-full bg-violet-100 rounded-full h-2">
                      <div
                        className="bg-violet-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((requiredSent / totalRequired) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Lista de documentos */}
                  <div className="divide-y divide-[#F0F0EA]">
                    {ADMISSION_DOCS.map((docDef) => {
                      const sent = docs.find(d => d.document_type === docDef.type);
                      const uploadKey = `${application.id}_${docDef.type}`;
                      const isUp = uploading[uploadKey];
                      const upErr = uploadError[uploadKey];

                      return (
                        <div key={docDef.type} className="flex items-center gap-3 px-5 py-3.5">
                          {/* Status icon */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${sent ? 'bg-emerald-100' : docDef.required ? 'bg-red-50 border border-red-200' : 'bg-gray-100'}`}>
                            {sent ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : docDef.required ? (
                              <span className="text-red-400 text-xs font-bold">!</span>
                            ) : (
                              <span className="text-gray-300 text-xs">–</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-medium text-[#141042]">{docDef.label}</span>
                              {docDef.required ? (
                                <span className="text-xs text-red-500 font-medium">obrigatório</span>
                              ) : (
                                <span className="text-xs text-[#94A3B8]">opcional</span>
                              )}
                            </div>
                            <p className="text-xs text-[#94A3B8] mt-0.5 truncate">{docDef.description}</p>
                            {sent && <p className="text-xs text-emerald-600 mt-0.5 truncate">✓ {sent.file_name}</p>}
                            {upErr && <p className="text-xs text-red-500 mt-0.5">{upErr}</p>}
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {sent && (
                              <button
                                onClick={() => openViewer(sent.bucket_path, docDef.label)}
                                disabled={viewerLoading}
                                className="p-1.5 rounded-lg text-[#666666] hover:text-[#3B82F6] hover:bg-blue-50 transition-colors"
                                title="Visualizar"
                              >
                                {viewerLoading && viewerLabel === docDef.label ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                            <input
                              ref={el => { fileInputRefs.current[uploadKey] = el; }}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                              className="hidden"
                              onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) handleUpload(application.id, docDef.type, f);
                                e.target.value = '';
                              }}
                            />
                            <button
                              onClick={() => fileInputRefs.current[uploadKey]?.click()}
                              disabled={isUp}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sent ? 'bg-[#F5F5F0] text-[#666666] hover:bg-[#EAEAE5]' : 'bg-[#141042] text-white hover:bg-[#1a164f]'}`}
                            >
                              {isUp ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                              {sent ? 'Substituir' : 'Enviar'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Nota */}
                  <div className="flex items-start gap-2 px-5 py-3 bg-[#FAFAF8] border-t border-[#E5E5DC]">
                    <Info className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[#94A3B8]">
                      Formatos aceitos: PDF, JPEG, PNG, WEBP, DOC, DOCX — máx. 10 MB por arquivo.
                    </p>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Viewer inline */}
      {viewerUrl && (
        <>
          <div className="fixed inset-0 bg-black/60 z-[70]" onClick={() => setViewerUrl(null)} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-[800px] bg-white z-[71] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ backgroundColor: '#141042' }}>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-white/80" />
                <span className="text-white font-semibold text-sm">{viewerLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <a href={viewerUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <ExternalLink className="h-4 w-4 text-white/80" />
                </a>
                <button onClick={() => setViewerUrl(null)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <X className="h-4 w-4 text-white/80" />
                </button>
              </div>
            </div>
            <iframe src={viewerUrl} className="w-full flex-1 border-0" title={viewerLabel} />
          </div>
        </>
      )}
    </div>
  );
}
