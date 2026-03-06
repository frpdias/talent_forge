'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User, Phone, Mail, MapPin, Briefcase, FileText } from 'lucide-react';

interface CandidateProfile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  current_title: string | null;
  area_of_expertise: string | null;
  seniority_level: string | null;
  salary_expectation: number | null;
  employment_type: string[] | null;
  resume_url: string | null;
  resume_filename: string | null;
  onboarding_completed: boolean | null;
  profile_completion_percentage: number | null;
}

export default function CandidateProfilePage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
          setError('Faça login para visualizar seu perfil.');
          setProfile(null);
          return;
        }

        const { data, error: profileError } = await supabase
          .from('candidate_profiles')
          .select(
            'full_name, email, phone, city, state, current_title, area_of_expertise, seniority_level, salary_expectation, employment_type, resume_url, resume_filename, onboarding_completed, profile_completion_percentage'
          )
          .eq('user_id', userData.user.id)
          .maybeSingle();

        if (profileError) {
          setError(profileError.message);
          setProfile(null);
          return;
        }

        setProfile(data as CandidateProfile);
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar perfil');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#141042]">Meu Perfil</h1>
        <p className="text-xs sm:text-sm text-[#666666]">Informações baseadas em seu cadastro no portal.</p>
      </header>

      {loading && <p className="text-sm text-[#666666]">Carregando perfil...</p>}
      {!loading && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && !profile && (
        <div className="rounded-2xl border border-dashed border-[#E5E5DC] bg-white p-6 text-center text-sm text-[#666666]">
          Perfil não encontrado. Complete seu cadastro para aparecer aqui.
          <div className="mt-4">
            <Link className="text-[#141042] font-medium hover:underline" href="/onboarding">
              Completar perfil
            </Link>
          </div>
        </div>
      )}

      {!loading && profile && (
        <div className="grid gap-4">
          <section className="rounded-2xl border border-[#E5E5DC] bg-white p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F0] text-[#141042]">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#141042]">Dados pessoais</h2>
                <p className="text-xs text-[#999]">{profile.profile_completion_percentage ?? 0}% completo</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-[#666666]">
              <p><strong className="text-[#141042]">Nome:</strong> {profile.full_name || 'Não informado'}</p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> {profile.email || 'Não informado'}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> {profile.phone || 'Não informado'}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {[profile.city, profile.state].filter(Boolean).join(', ') || 'Não informado'}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5E5DC] bg-white p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F0] text-[#141042]">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#141042]">Dados profissionais</h2>
                <p className="text-xs text-[#999]">Resumo do seu perfil profissional.</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-[#666666]">
              <p><strong className="text-[#141042]">Cargo atual:</strong> {profile.current_title || 'Não informado'}</p>
              <p><strong className="text-[#141042]">Área:</strong> {profile.area_of_expertise || 'Não informado'}</p>
              <p><strong className="text-[#141042]">Senioridade:</strong> {profile.seniority_level || 'Não informado'}</p>
              <p><strong className="text-[#141042]">Pretensão:</strong> {profile.salary_expectation ? `R$ ${profile.salary_expectation}` : 'Não informado'}</p>
              <p><strong className="text-[#141042]">Regime:</strong> {profile.employment_type?.join(', ') || 'Não informado'}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E5E5DC] bg-white p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F0] text-[#141042]">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#141042]">Currículo</h2>
                <p className="text-xs text-[#999]">Arquivo enviado no onboarding.</p>
              </div>
            </div>
            <div className="text-sm text-[#666666]">
              {profile.resume_url ? (
                <a
                  className="text-[#141042] font-medium hover:underline"
                  href={profile.resume_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {profile.resume_filename || 'Abrir currículo'}
                </a>
              ) : (
                <span>Currículo não enviado.</span>
              )}
            </div>
          </section>

          <div>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#141042] hover:underline"
            >
              Atualizar informações
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
