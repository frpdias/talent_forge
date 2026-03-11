'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Clock, Briefcase, ArrowLeft, Calendar, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import DOMPurify from 'dompurify';

interface PublicJob {
  id: string;
  title: string;
  description: string;
  description_html: string | null;
  location: string | null;
  employment_type: string | null;
  benefits: string | null;
  requirements: string | null;
  application_deadline: string | null;
  created_at: string;
  org_name: string;
  org_slug: string;
  org_industry: string | null;
  career_page_headline: string | null;
  career_page_logo_url: string | null;
  career_page_color: string | null;
}

const EMPLOYMENT_TYPE_LABEL: Record<string, string> = {
  full_time: 'Tempo integral',
  part_time: 'Meio período',
  contract: 'PJ / Contrato',
  internship: 'Estágio',
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const jobId = params.jobId as string;
  const supabase = createClient();

  const [job, setJob] = useState<PublicJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    loadJob();
  }, [orgSlug, jobId]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_public_jobs_by_org', { p_org_slug: orgSlug });
      if (error) throw error;
      const found = (data as PublicJob[])?.find((j) => j.id === jobId);
      if (!found) { setNotFound(true); return; }
      setJob(found);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/register?redirect=/jobs/${orgSlug}/${jobId}`);
      return;
    }
    // Usuário autenticado → redireciona para área do candidato com jobId pre-selecionado
    router.push(`/candidate/jobs?apply=${jobId}`);
  };

  const primaryColor = job?.career_page_color || '#141042';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141042]" />
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <Briefcase className="w-16 h-16 text-[#E5E5DC] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#141042] mb-2">Vaga não encontrada</h1>
          <p className="text-[#666666] mb-6">Esta vaga não está mais disponível.</p>
          <button
            onClick={() => router.push(`/jobs/${orgSlug}`)}
            className="px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#1a1554] transition-colors"
          >
            Ver todas as vagas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header strip */}
      <div style={{ background: primaryColor }} className="text-white py-4 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push(`/jobs/${orgSlug}`)}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {job.org_name}
          </button>
          {job.career_page_logo_url && (
            <img src={job.career_page_logo_url} alt={job.org_name} className="h-8 object-contain" />
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold text-[#141042] mb-4">{job.title}</h1>

            {/* Meta tags */}
            <div className="flex flex-wrap gap-3 mb-8">
              {job.location && (
                <span className="flex items-center gap-1.5 text-sm text-[#666666] bg-white border border-[#E5E5DC] px-3 py-1.5 rounded-full">
                  <MapPin className="w-4 h-4" /> {job.location}
                </span>
              )}
              {job.employment_type && (
                <span className="flex items-center gap-1.5 text-sm text-[#666666] bg-white border border-[#E5E5DC] px-3 py-1.5 rounded-full">
                  <Briefcase className="w-4 h-4" />
                  {EMPLOYMENT_TYPE_LABEL[job.employment_type] || job.employment_type}
                </span>
              )}
              {job.application_deadline && (
                <span className="flex items-center gap-1.5 text-sm text-[#666666] bg-white border border-[#E5E5DC] px-3 py-1.5 rounded-full">
                  <Calendar className="w-4 h-4" />
                  Prazo: {new Date(job.application_deadline).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>

            {/* Description */}
            {job.description_html ? (
              <div
                className="prose max-w-none text-[#141042] mb-8"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description_html) }}
              />
            ) : job.description ? (
              <div className="bg-white border border-[#E5E5DC] rounded-xl p-6 mb-8">
                <h2 className="text-lg font-semibold text-[#141042] mb-3">Sobre a vaga</h2>
                <p className="text-[#666666] whitespace-pre-wrap leading-relaxed">{job.description}</p>
              </div>
            ) : null}

            {/* Requirements */}
            {job.requirements && (
              <div className="bg-white border border-[#E5E5DC] rounded-xl p-6 mb-8">
                <h2 className="text-lg font-semibold text-[#141042] mb-3">Requisitos</h2>
                <p className="text-[#666666] whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && (
              <div className="bg-white border border-[#E5E5DC] rounded-xl p-6 mb-8">
                <h2 className="text-lg font-semibold text-[#141042] mb-3">Benefícios</h2>
                <p className="text-[#666666] whitespace-pre-wrap leading-relaxed">{job.benefits}</p>
              </div>
            )}
          </div>

          {/* Sidebar — Apply CTA */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-[#E5E5DC] rounded-xl p-6 sticky top-6">
              <p className="text-sm text-[#666666] mb-1">{job.org_name}</p>
              {job.org_industry && (
                <p className="text-xs text-[#999999] mb-4">{job.org_industry}</p>
              )}

              {applied ? (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">Candidatura enviada!</span>
                </div>
              ) : (
                <button
                  onClick={handleApply}
                  disabled={applying}
                  style={{ background: primaryColor }}
                  className="w-full py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {applying ? 'Enviando...' : 'Candidatar-se'}
                </button>
              )}

              <p className="text-xs text-[#999999] mt-3 text-center">
                Publicada em {new Date(job.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#E5E5DC] mt-8 py-8 text-center text-xs text-[#999999]">
        Powered by <span className="font-semibold text-[#141042]">TALENT</span><span className="font-bold text-[#F97316]">FORGE</span>
      </div>
    </div>
  );
}
