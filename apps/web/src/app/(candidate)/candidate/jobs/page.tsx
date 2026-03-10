'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Briefcase, Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Job {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  employment_type?: string | null;
  seniority?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  created_at?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  department?: string | null;
  type?: string | null;
  external_apply_url?: string | null;
  cbo_code?: string | null;
}

export default function CandidateJobsPage() {
  return (
    <Suspense fallback={null}>
      <CandidateJobsContent />
    </Suspense>
  );
}

function CandidateJobsContent() {
  const searchParams = useSearchParams();
  const autoApplyJobId = searchParams.get('apply');

  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [autoApplyDone, setAutoApplyDone] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [savingJobId, setSavingJobId] = useState<string | null>(null);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const { data, error: jobsError } = await supabase
          .rpc('get_open_jobs');

        if (jobsError) {
          setError(jobsError.message);
          setJobs([]);
          return;
        }

        setJobs((data as Job[]) || []);

        const { data: appliedData } = await supabase.rpc('get_my_applied_jobs');
        if (Array.isArray(appliedData)) {
          setAppliedJobIds(new Set(appliedData.map((row: { job_id: string }) => row.job_id)));
        }

        const { data: savedData } = await supabase
          .from('candidate_saved_jobs')
          .select('job_id');
        if (Array.isArray(savedData)) {
          setSavedJobIds(new Set(savedData.map((row: { job_id: string }) => row.job_id)));
        }
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar vagas');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  // Auto-aplicar quando redireccionado da career page com ?apply=jobId
  useEffect(() => {
    if (!autoApplyJobId || autoApplyDone || loading || appliedJobIds.has(autoApplyJobId)) return;
    const autoApply = async () => {
      setAutoApplyDone(true);
      setApplyingJobId(autoApplyJobId);
      try {
        const supabase = createClient();
        const { error: applyError } = await supabase.rpc('apply_to_job', { p_job_id: autoApplyJobId });
        if (!applyError) {
          setAppliedJobIds((prev) => new Set([...Array.from(prev), autoApplyJobId]));
        } else {
          setError(applyError.message);
        }
      } finally {
        setApplyingJobId(null);
      }
    };
    autoApply();
  }, [autoApplyJobId, autoApplyDone, loading, appliedJobIds]); = useMemo(() => {
    if (!query) return jobs;
    const normalized = query.toLowerCase();
    return jobs.filter((job) =>
      [job.title, job.description, job.location, job.employment_type, job.seniority]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [jobs, query]);

  const handleToggleSave = async (jobId: string) => {
    setSavingJobId(jobId);
    try {
      const supabase = createClient();
      const isSaved = savedJobIds.has(jobId);
      if (isSaved) {
        const { error: delError } = await supabase
          .from('candidate_saved_jobs')
          .delete()
          .eq('job_id', jobId);
        if (delError) { setError(delError.message); return; }
        setSavedJobIds((prev) => { const next = new Set(prev); next.delete(jobId); return next; });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error: insError } = await supabase
          .from('candidate_saved_jobs')
          .insert({ user_id: user.id, job_id: jobId });
        if (insError) { setError(insError.message); return; }
        setSavedJobIds((prev) => new Set([...Array.from(prev), jobId]));
      }
    } finally {
      setSavingJobId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#141042]">Buscar Vagas</h1>
        <p className="text-xs sm:text-sm text-[#666666]">
          Lista de vagas abertas disponíveis no Talent Forge.
        </p>
      </header>

      {/* Banner de candidatura automática via redirect */}
      {autoApplyJobId && autoApplyDone && (
        <div className={`rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm font-medium border ${
          appliedJobIds.has(autoApplyJobId)
            ? 'bg-green-50 text-green-700 border-green-200'
            : error
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          {appliedJobIds.has(autoApplyJobId)
            ? <>✅ Candidatura enviada com sucesso!
            </>
            : error
              ? <>⚠️ Erro ao enviar candidatura: {error}</>
              : <>⏳ Enviando candidatura...</>}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por vaga, local ou nível"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E5DC] rounded-xl text-sm text-[#141042] placeholder-[#999] focus:outline-none focus:border-[#141042]"
        />
      </div>

      {loading && <p className="text-sm text-[#666666]">Carregando vagas...</p>}
      {!loading && error && (
        <p className="text-sm text-red-600">
          Não foi possível carregar as vagas. {error}
        </p>
      )}

      {!loading && !error && filteredJobs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#E5E5DC] bg-white p-6 text-center text-sm text-[#666666]">
          Nenhuma vaga disponível no momento. Volte mais tarde ou aguarde novas publicações.
        </div>
      )}

      <div className="grid gap-4">
        {filteredJobs.map((job) => (
          <article
            key={job.id}
            className="rounded-2xl border border-[#E5E5DC] bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base sm:text-lg font-semibold text-[#141042]">{job.title}</h2>
                <span className="text-xs text-[#666666] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {job.created_at ? new Date(job.created_at).toLocaleDateString('pt-BR') : 'Recente'}
                </span>
              </div>
              <p className="text-sm text-[#666666] line-clamp-2">
                {job.description || 'Descrição não informada.'}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-[#666666]">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location}
                  </span>
                )}
                {job.employment_type && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {job.employment_type}
                  </span>
                )}
                {job.seniority && <span>Nível: {job.seniority}</span>}
                {(job.salary_min || job.salary_max) && (
                  <span>
                    Faixa: {job.salary_min ? `R$ ${job.salary_min}` : '—'}
                    {job.salary_max ? ` - R$ ${job.salary_max}` : ''}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedJob(job);
                    const supabase = createClient();
                    const { data } = await supabase.rpc('get_open_job', { p_job_id: job.id });
                    setSelectedJob((Array.isArray(data) ? data[0] : data) || job);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E5DC] text-xs font-medium text-[#141042] hover:border-[#141042]"
                >
                  Ver detalhes
                </button>
                <button
                  type="button"
                  disabled={savingJobId === job.id}
                  onClick={() => handleToggleSave(job.id)}
                  title={savedJobIds.has(job.id) ? 'Remover dos salvos' : 'Salvar vaga'}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    savedJobIds.has(job.id)
                      ? 'border-[#10B981] text-[#10B981] bg-[#10B981]/5 hover:bg-[#10B981]/10'
                      : 'border-[#E5E5DC] text-[#666666] hover:border-[#141042] hover:text-[#141042]'
                  } disabled:opacity-40`}
                >
                  {savedJobIds.has(job.id)
                    ? <><BookmarkCheck className="w-3.5 h-3.5" /> Salva</>
                    : <><Bookmark className="w-3.5 h-3.5" /> Salvar</>}
                </button>
                <button
                  type="button"
                  disabled={appliedJobIds.has(job.id) || applyingJobId === job.id}
                  onClick={async () => {
                    try {
                      setApplyingJobId(job.id);
                      const supabase = createClient();
                      const { error: applyError } = await supabase.rpc('apply_to_job', { p_job_id: job.id });
                      if (applyError) {
                        setError(applyError.message);
                        return;
                      }
                      setAppliedJobIds((prev) => new Set([...Array.from(prev), job.id]));
                    } finally {
                      setApplyingJobId(null);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#141042] text-xs font-medium text-white hover:bg-[#1f1a66] disabled:bg-[#999999]"
                >
                  {appliedJobIds.has(job.id)
                    ? 'Candidatura enviada'
                    : applyingJobId === job.id
                      ? 'Enviando...'
                      : 'Candidatar-se'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {selectedJob && (
        <div className="rounded-2xl border border-[#E5E5DC] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#141042]">{selectedJob.title}</h2>
              <p className="text-sm text-[#666666] mt-2">
                {selectedJob.description || 'Descrição não informada.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedJob(null)}
              className="text-xs text-[#666666] hover:text-[#141042]"
            >
              Fechar
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#666666]">
            {selectedJob.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {selectedJob.location}
              </span>
            )}
            {selectedJob.employment_type && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                {selectedJob.employment_type}
              </span>
            )}
            {selectedJob.seniority && <span>Nível: {selectedJob.seniority}</span>}
            {selectedJob.department && <span>Área: {selectedJob.department}</span>}
            {selectedJob.type && <span>Tipo: {selectedJob.type}</span>}
            {selectedJob.cbo_code && <span>CBO: {selectedJob.cbo_code}</span>}
            {(selectedJob.salary_min || selectedJob.salary_max) && (
              <span>
                Faixa: {selectedJob.salary_min ? `R$ ${selectedJob.salary_min}` : '—'}
                {selectedJob.salary_max ? ` - R$ ${selectedJob.salary_max}` : ''}
              </span>
            )}
          </div>

          {(selectedJob.requirements || selectedJob.benefits || selectedJob.external_apply_url) && (
            <div className="mt-4 space-y-4 text-sm text-[#666666]">
              {selectedJob.requirements && (
                <div>
                  <p className="font-medium text-[#141042]">Requisitos</p>
                  <p className="whitespace-pre-line">{selectedJob.requirements}</p>
                </div>
              )}
              {selectedJob.benefits && (
                <div>
                  <p className="font-medium text-[#141042]">Benefícios</p>
                  <p className="whitespace-pre-line">{selectedJob.benefits}</p>
                </div>
              )}
              {selectedJob.external_apply_url && (
                <div>
                  <p className="font-medium text-[#141042]">Link externo</p>
                  <a
                    href={selectedJob.external_apply_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#141042] hover:underline"
                  >
                    {selectedJob.external_apply_url}
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="mt-4">
            <button
              type="button"
              disabled={appliedJobIds.has(selectedJob.id) || applyingJobId === selectedJob.id}
              onClick={async () => {
                try {
                  setApplyingJobId(selectedJob.id);
                  const supabase = createClient();
                  const { error: applyError } = await supabase.rpc('apply_to_job', { p_job_id: selectedJob.id });
                  if (applyError) {
                    setError(applyError.message);
                    return;
                  }
                  setAppliedJobIds((prev) => new Set([...Array.from(prev), selectedJob.id]));
                } finally {
                  setApplyingJobId(null);
                }
              }}
              className="px-4 py-2 rounded-lg bg-[#141042] text-sm font-medium text-white hover:bg-[#1f1a66] disabled:bg-[#999999]"
            >
              {appliedJobIds.has(selectedJob.id)
                ? 'Candidatura enviada'
                : applyingJobId === selectedJob.id
                  ? 'Enviando...'
                  : 'Candidatar-se'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
