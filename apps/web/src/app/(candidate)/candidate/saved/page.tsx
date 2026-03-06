'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, BookmarkX, MapPin, Briefcase, ArrowRight, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SavedJob {
  saved_id: string;
  saved_at: string;
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  employment_type: string | null;
  seniority: string | null;
  salary_min: number | null;
  salary_max: number | null;
  created_at: string | null;
}

export default function CandidateSavedPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const { data, error: rpcError } = await supabase.rpc('get_my_saved_jobs');
        if (rpcError) { setError(rpcError.message); return; }
        setSavedJobs((data as SavedJob[]) || []);
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar vagas salvas');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRemove = async (savedId: string, jobId: string) => {
    setRemovingId(savedId);
    try {
      const supabase = createClient();
      const { error: delError } = await supabase
        .from('candidate_saved_jobs')
        .delete()
        .eq('job_id', jobId);
      if (delError) { setError(delError.message); return; }
      setSavedJobs((prev) => prev.filter((j) => j.saved_id !== savedId));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#141042]">Vagas Salvas</h1>
          <p className="text-xs sm:text-sm text-[#666666]">
            {loading ? 'Carregando...' : `${savedJobs.length} vaga${savedJobs.length !== 1 ? 's' : ''} salva${savedJobs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/candidate/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#141042] border border-[#E5E5DC] rounded-lg px-3 py-1.5 hover:border-[#141042] transition-colors"
        >
          Ver todas as vagas
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
      )}

      {loading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-[#E5E5DC] bg-white p-5 animate-pulse">
              <div className="h-4 w-1/2 bg-[#E5E5DC] rounded mb-3" />
              <div className="h-3 w-3/4 bg-[#F5F5F0] rounded mb-2" />
              <div className="h-3 w-1/4 bg-[#F5F5F0] rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && savedJobs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#E5E5DC] bg-white p-10 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F5F0] text-[#141042]">
            <Bookmark className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#141042]">Nenhuma vaga salva ainda</p>
            <p className="text-xs text-[#666666] mt-1">
              Clique no ícone de marcador em qualquer vaga para salvá-la aqui.
            </p>
          </div>
          <Link
            href="/candidate/jobs"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#141042] hover:underline"
          >
            Explorar vagas disponíveis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {!loading && savedJobs.length > 0 && (
        <div className="grid gap-4">
          {savedJobs.map((job) => (
            <article
              key={job.saved_id}
              className="rounded-2xl border border-[#E5E5DC] bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold text-[#141042] truncate">{job.title}</h2>
                  {job.description && (
                    <p className="text-sm text-[#666666] mt-1 line-clamp-2">{job.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-[#666666]">
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
                        {job.salary_max ? ` – R$ ${job.salary_max}` : ''}
                      </span>
                    )}
                    <span className="flex items-center gap-1 ml-auto">
                      <Clock className="w-3.5 h-3.5" />
                      Salva em {new Date(job.saved_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  title="Remover dos salvos"
                  disabled={removingId === job.saved_id}
                  onClick={() => handleRemove(job.saved_id, job.id)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5DC] text-xs text-[#666666] hover:border-red-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                >
                  <BookmarkX className="w-4 h-4" />
                  {removingId === job.saved_id ? 'Removendo...' : 'Remover'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
