'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileText, Briefcase, Clock, AlertCircle } from 'lucide-react';

const statusLabel: Record<string, string> = {
  applied: 'Recebida',
  in_process: 'Em andamento',
  hired: 'Contratado',
  rejected: 'Rejeitado',
};

interface ApplicationItem {
  id: string;
  jobTitle: string;
  location: string;
  status: string;
  createdAt: string;
}

export default function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          setError('Faça login para visualizar suas candidaturas.');
          setApplications([]);
          return;
        }

        const userEmail = userData.user.email;
        if (!userEmail) {
          setError('Seu email não está disponível no cadastro.');
          setApplications([]);
          return;
        }

        const { data: apps, error: appsError } = await supabase
          .rpc('get_my_applications');

        console.log('🔍 DEBUG RPC get_my_applications:', { apps, appsError, userId: userData.user.id, email: userEmail });

        if (appsError) {
          console.error('❌ Erro na RPC:', appsError);
          setError(appsError.message);
          setApplications([]);
          return;
        }

        console.log('✅ Aplicações retornadas:', apps);

        const mapped = (apps || []).map((app: any) => ({
          id: app.application_id,
          jobTitle: app.job_title || 'Vaga não identificada',
          location: app.job_location || 'Local não informado',
          status: app.status || 'em análise',
          createdAt: app.created_at ? new Date(app.created_at).toLocaleDateString('pt-BR') : 'Recente',
        }));

        setApplications(mapped);
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar candidaturas');
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#141042]">Candidaturas</h1>
        <p className="text-xs sm:text-sm text-[#666666]">Acompanhe o status das suas candidaturas.</p>
      </header>

      {loading && <p className="text-sm text-[#666666]">Carregando candidaturas...</p>}
      {!loading && error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {!loading && !error && applications.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#E5E5DC] bg-white p-6 text-center text-sm text-[#666666]">
          Você ainda não possui candidaturas registradas. Candidate-se a uma vaga para acompanhar aqui.
        </div>
      )}

      <div className="grid gap-4">
        {applications.map((application) => (
          <article
            key={application.id}
            className="rounded-2xl border border-[#E5E5DC] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-[#141042]">
                  {application.jobTitle}
                </h2>
                <p className="text-sm text-[#666666] flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {application.location}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F0] px-3 py-1 text-xs text-[#141042]">
                <FileText className="w-3.5 h-3.5" />
                {statusLabel[application.status as keyof typeof statusLabel] || application.status}
              </span>
            </div>
            <p className="text-xs text-[#999] mt-3 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {application.createdAt}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
