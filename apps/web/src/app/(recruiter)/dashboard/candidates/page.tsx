'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, 
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Eye,
  Link2,
  Banknote,
  IdCard,
  GraduationCap,
  FileText,
  BarChart3,
  User,
  X,
  Download,
  ExternalLink,
  Sparkles,
  Star,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DashboardHeader } from '@/components/DashboardHeader';
import { NotesPanel } from '@/components/candidates/NotesPanel';
import { generateCurriculumPDF, type CurriculumData } from '@/components/curriculum/CandidateCurriculumPDF';
import { createClient } from '@/lib/supabase/client';

interface Candidate {
  id: string;
  profile_id?: string | null;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  assessment_completed: boolean;
  created_at: string;
  linkedin_url?: string;
  salary_expectation?: number;
  availability_date?: string | null;
  tags?: string[];
  cpf?: string;
  degree_level?: string;
  user_id?: string | null;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssessment, setFilterAssessment] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'resume' | 'assessments' | 'review'>('profile');
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [currentReview, setCurrentReview] = useState<{
    id: string;
    score_total: number;
    score_testes: number;
    score_experiencia: number;
    score_recrutador: number;
    recruiter_rating: number;
    recruiter_note: string;
    ai_review: string;
    ai_model: string;
    created_at: string;
  } | null>(null);
  const [reviewHistory, setReviewHistory] = useState<typeof currentReview[]>([]);
  const [showReviewHistory, setShowReviewHistory] = useState(false);
  const [resolvedOrgId, setResolvedOrgId] = useState<string | null>(null);
  const [candidateDetails, setCandidateDetails] = useState<{
    profile: any;
    experiences: any[];
    education: any[];
    assessments: any[];
  } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [resumeViewerUrl, setResumeViewerUrl] = useState<string | null>(null);
  const [resumeViewerLoading, setResumeViewerLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    loadCandidates();
  }, [filterAssessment]);

  useEffect(() => {
    if (selectedCandidate) {
      setResumeViewerUrl(null);
      setCurrentReview(null);
      setReviewHistory([]);
      setActiveTab('profile');
      loadCandidateDetails(selectedCandidate);
      loadReviews(selectedCandidate.id);
    }
  }, [selectedCandidate]);

  async function loadReviews(candidateId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const orgId = resolvedOrgId
        ?? localStorage.getItem('selected_org_id')
        ?? session.user.user_metadata?.org_id;
      if (!orgId) return;
      const res = await fetch(`/api/recruiter/candidates/${candidateId}/technical-review`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-org-id': orgId,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reviews?.length > 0) {
          setCurrentReview(data.reviews[0]);
          setReviewHistory(data.reviews);
        }
      }
    } catch (err) {
      console.error('loadReviews error:', err);
    }
  }

  async function handleGenerateReview() {
    if (!selectedCandidate || reviewLoading) return;
    try {
      setReviewLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Sessão expirada. Faça login novamente.');
        return;
      }
      const orgId = resolvedOrgId
        ?? localStorage.getItem('selected_org_id')
        ?? session.user.user_metadata?.org_id;
      if (!orgId) {
        alert('Organização não identificada. Tente recarregar a página.');
        return;
      }
      const res = await fetch(`/api/recruiter/candidates/${selectedCandidate.id}/technical-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-org-id': orgId,
        },
        body: JSON.stringify({ recruiter_note: reviewNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar parecer');
      setCurrentReview(data);
      setReviewHistory(prev => [data, ...(prev || [])]);
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar parecer');
    } finally {
      setReviewLoading(false);
    }
  }

  async function loadCandidateDetails(candidate: Candidate) {
    try {
      setDetailsLoading(true);
      
      console.log('[loadCandidateDetails] Carregando dados do candidato:', {
        id: candidate.id,
        user_id: candidate.user_id,
        email: candidate.email
      });
      
      // Buscar perfil completo - tenta por user_id e email
      let profiles: any[] = [];
      
      if (candidate.user_id) {
        const { data: profilesByUser } = await supabase
          .from('candidate_profiles')
          .select('*')
          .eq('user_id', candidate.user_id)
          .order('updated_at', { ascending: false });
        profiles = profilesByUser || [];
        console.log('[loadCandidateDetails] Profiles por user_id:', profiles.length);
      }
      
      if (profiles.length === 0 && candidate.email) {
        const { data: profilesByEmail } = await supabase
          .from('candidate_profiles')
          .select('*')
          .eq('email', candidate.email)
          .order('updated_at', { ascending: false });
        profiles = profilesByEmail || [];
        console.log('[loadCandidateDetails] Profiles por email:', profiles.length);
      }
      
      const profile = profiles?.[0] || null;
      const profileIds = profiles?.map(p => p.id) || [];
      console.log('[loadCandidateDetails] Profile selecionado:', profile?.id);
      
      // Buscar experiências
      let experiences: any[] = [];
      if (profileIds.length > 0) {
        const { data: expData } = await supabase
          .from('candidate_experience')
          .select('*')
          .in('candidate_profile_id', profileIds)
          .order('start_date', { ascending: false });
        experiences = expData || [];
        console.log('[loadCandidateDetails] Experiências:', experiences.length);
      }
      
      // Buscar educação
      let education: any[] = [];
      if (profileIds.length > 0) {
        const { data: eduData } = await supabase
          .from('candidate_education')
          .select('*')
          .in('candidate_profile_id', profileIds)
          .order('start_year', { ascending: false });
        education = eduData || [];
        console.log('[loadCandidateDetails] Educação:', education.length);
      }
      
      // Buscar assessments via API server-side (service_role — sem bloqueio de RLS)
      const { data: { session: assessSession } } = await supabase.auth.getSession();
      const assessOrgId = resolvedOrgId ?? localStorage.getItem('selected_org_id');
      
      let allAssessments: any[] = [];
      
      if (assessSession?.access_token && assessOrgId) {
        const assessRes = await fetch(`/api/recruiter/candidates/${candidate.id}/assessments`, {
          headers: {
            'Authorization': `Bearer ${assessSession.access_token}`,
            'x-org-id': assessOrgId,
          },
        });
        if (assessRes.ok) {
          const assessData = await assessRes.json();
          const discList: any[] = assessData.disc ?? [];
          const colorList: any[] = assessData.color ?? [];
          const piList: any[] = assessData.pi ?? [];
          
          console.log('[loadCandidateDetails] Testes DISC:', discList.length);
          console.log('[loadCandidateDetails] Testes de Cores:', colorList.length);
          console.log('[loadCandidateDetails] Testes PI:', piList.length);
          
          allAssessments = [
            ...discList.map(a => ({ ...a, test_type: 'disc' })),
            ...colorList.map(a => ({ ...a, test_type: 'color', type: 'color' })),
            ...piList.map(a => ({ ...a, test_type: 'pi', type: 'pi' })),
          ].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
        } else {
          console.error('[loadCandidateDetails] Erro na API de assessments:', await assessRes.text());
        }
      } else {
        console.warn('[loadCandidateDetails] Sem sessão ou org_id, assessments não carregados');
      }
      
      console.log('[loadCandidateDetails] Total de testes combinados:', allAssessments.length);
      
      setCandidateDetails({
        profile,
        experiences,
        education,
        assessments: allAssessments
      });
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleGeneratePDF() {
    if (!selectedCandidate || !candidateDetails) return;
    try {
      setPdfLoading(true);
      const p = candidateDetails.profile;
      const data: CurriculumData = {
        fullName: selectedCandidate.full_name || p?.full_name || selectedCandidate.email || 'Candidato',
        email: selectedCandidate.email || p?.email || '',
        phone: p?.phone ?? selectedCandidate.phone,
        city: p?.city,
        state: p?.state,
        currentTitle: p?.current_title ?? selectedCandidate.headline,
        areaOfExpertise: p?.area_of_expertise,
        seniorityLevel: p?.seniority_level,
        salaryExpectation: p?.salary_expectation,
        employmentType: p?.employment_type,
        linkedinUrl: p?.linkedin_url,
        avatarUrl: p?.avatar_url ?? null,
        experiences: (candidateDetails.experiences ?? []).map((e: any) => ({
          job_title: e.job_title,
          company_name: e.company_name,
          start_date: e.start_date,
          end_date: e.end_date,
          is_current: e.is_current,
          description: e.description,
        })),
        education: (candidateDetails.education ?? []).map((e: any) => ({
          degree_level: e.degree_level,
          course_name: e.course_name,
          institution: e.institution,
          start_year: e.start_year,
          end_year: e.end_year,
          is_current: e.is_current,
        })),
      };
      await generateCurriculumPDF(data);
    } catch (err) {
      console.error('[PDF] Erro ao gerar currículo:', err);
      alert('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setPdfLoading(false);
    }
  }

  async function openResumeViewer(publicUrl: string) {
    try {
      setResumeViewerLoading(true);
      // Extrai bucket e path da URL pública do Supabase Storage
      // Formato: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
      const match = publicUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
      if (!match) {
        setResumeViewerUrl(publicUrl);
        return;
      }
      const bucket = match[1];
      const path = decodeURIComponent(match[2]);

      // API route server-side com service_role (bypass RLS do storage privado)
      const res = await fetch('/api/storage/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket, path }),
      });

      if (!res.ok) {
        console.warn('[openResumeViewer] API falhou, usando URL pública');
        setResumeViewerUrl(publicUrl);
        return;
      }

      const { signedUrl } = await res.json();
      setResumeViewerUrl(signedUrl);
    } catch (err) {
      console.error('openResumeViewer:', err);
      setResumeViewerUrl(publicUrl);
    } finally {
      setResumeViewerLoading(false);
    }
  }

  async function loadCandidates() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let orgId: string | null = null;
      const { data: orgMembership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      orgId = orgMembership?.org_id || null;

      if (orgId) {
        setResolvedOrgId(orgId);
        localStorage.setItem('selected_org_id', orgId);
      }

      if (!orgId) {
        setCandidates([]);
        return;
      }

      const { data: candidateRows, error } = await supabase
        .from('candidates')
        .select('id, user_id, full_name, email, phone, location, current_title, created_at, created_by, linkedin_url, salary_expectation, availability_date, tags')
        .eq('owner_org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      let resolvedCandidates = candidateRows || [];
      if (resolvedCandidates.length === 0) {
        const { data: fallbackRows } = await supabase
          .from('candidates')
          .select('id, user_id, full_name, email, phone, location, current_title, created_at, created_by, linkedin_url, salary_expectation, availability_date, tags')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });
        resolvedCandidates = fallbackRows || [];
      }

      const candidateIds = resolvedCandidates.map((candidate) => candidate.id);
      const userIds = resolvedCandidates.map((candidate) => candidate.user_id).filter(Boolean);
      const emails = resolvedCandidates.map((candidate) => candidate.email).filter(Boolean);
      let completedAssessmentIds = new Set<string>();
      if (candidateIds.length > 0) {
        const { data: assessments } = await supabase
          .from('assessments')
          .select('candidate_id, status')
          .in('candidate_id', candidateIds)
          .in('status', ['completed', 'reviewed']);

        (assessments || []).forEach((assessment: { candidate_id: string }) => {
          completedAssessmentIds.add(assessment.candidate_id);
        });
      }

      const profileMap = new Map<string, { id: string; user_id: string | null; email: string | null; cpf: string | null }>();
      if (userIds.length > 0) {
        const { data: profilesByUser } = await supabase
          .from('candidate_profiles')
          .select('id, user_id, email, cpf')
          .in('user_id', userIds as string[]);
        (profilesByUser || []).forEach((profile: any) => {
          profileMap.set(profile.user_id, profile);
          if (profile.email) profileMap.set(profile.email, profile);
        });
      }

      if (profileMap.size === 0 && emails.length > 0) {
        const { data: profilesByEmail } = await supabase
          .from('candidate_profiles')
          .select('id, user_id, email, cpf')
          .in('email', emails as string[]);
        (profilesByEmail || []).forEach((profile: any) => {
          if (profile.user_id) profileMap.set(profile.user_id, profile);
          if (profile.email) profileMap.set(profile.email, profile);
        });
      }

      const profileIds = Array.from(new Set(
        Array.from(profileMap.values()).map((profile) => profile.id)
      ));
      const educationMap = new Map<string, string>();

      if (profileIds.length > 0) {
        const { data: educations } = await supabase
          .from('candidate_education')
          .select('candidate_profile_id, degree_level, end_year, is_current')
          .in('candidate_profile_id', profileIds);

        (educations || []).forEach((edu: any) => {
          const existing = educationMap.get(edu.candidate_profile_id);
          if (!existing) {
            educationMap.set(edu.candidate_profile_id, edu.degree_level);
            return;
          }

          if (edu.is_current) {
            educationMap.set(edu.candidate_profile_id, edu.degree_level);
            return;
          }

          const currentValue = educationMap.get(edu.candidate_profile_id);
          if (!currentValue) {
            educationMap.set(edu.candidate_profile_id, edu.degree_level);
          }
        });
      }

      let candidatesList = resolvedCandidates.map((candidate) => {
        const profile = profileMap.get(candidate.user_id) || profileMap.get(candidate.email);
        const degreeLevel = profile?.id ? educationMap.get(profile.id) : undefined;

        return {
          id: candidate.id,
          user_id: candidate.user_id,
          profile_id: profile?.id ?? null,
          full_name: candidate.full_name,
          email: candidate.email,
          phone: candidate.phone || undefined,
          location: candidate.location || undefined,
          headline: candidate.current_title || undefined,
          assessment_completed: completedAssessmentIds.has(candidate.id),
          created_at: candidate.created_at,
          linkedin_url: candidate.linkedin_url || undefined,
          salary_expectation: candidate.salary_expectation ?? undefined,
          availability_date: candidate.availability_date ?? null,
          tags: candidate.tags || undefined,
          cpf: profile?.cpf || undefined,
          degree_level: degreeLevel,
        };
      });

      // Apply assessment filter
      if (filterAssessment === 'completed') {
        candidatesList = candidatesList.filter(c => c.assessment_completed);
      } else if (filterAssessment === 'pending') {
        candidatesList = candidatesList.filter(c => !c.assessment_completed);
      }

      setCandidates(candidatesList);
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCandidates = candidates.filter(candidate =>
    candidate.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const latestDiscAssessment = candidateDetails?.assessments?.find(
    (assessment: any) => assessment.test_type === 'disc' || assessment.type === 'disc'
  );
  const latestColorAssessment = candidateDetails?.assessments?.find(
    (assessment: any) => assessment.test_type === 'color' || assessment.type === 'color'
  );
  const latestPiAssessment = candidateDetails?.assessments?.find(
    (assessment: any) => assessment.test_type === 'pi' || assessment.type === 'pi'
  );

  const discTraits = latestDiscAssessment?.traits?.disc || latestDiscAssessment?.traits || {};
  const discResult = latestDiscAssessment
    ? {
        primary_profile: discTraits.primary ?? discTraits.primary_profile ?? null,
        secondary_profile: discTraits.secondary ?? discTraits.secondary_profile ?? null,
        dominance_score: Number(discTraits.D ?? discTraits.dominance_score ?? 0),
        influence_score: Number(discTraits.I ?? discTraits.influence_score ?? 0),
        steadiness_score: Number(discTraits.S ?? discTraits.steadiness_score ?? 0),
        conscientiousness_score: Number(discTraits.C ?? discTraits.conscientiousness_score ?? 0),
        description: discTraits.description ?? null,
      }
    : null;

  const colorResult = latestColorAssessment
    ? {
        scores:
          latestColorAssessment.scores ||
          latestColorAssessment.traits?.scores ||
          latestColorAssessment.results?.scores ||
          {},
        primary_color:
          latestColorAssessment.primary_color ||
          latestColorAssessment.traits?.primary_color ||
          latestColorAssessment.results?.primary_color ||
          null,
        secondary_color:
          latestColorAssessment.secondary_color ||
          latestColorAssessment.traits?.secondary_color ||
          latestColorAssessment.results?.secondary_color ||
          null,
      }
    : null;

  const piResult = latestPiAssessment
    ? {
        scores_adapted:
          latestPiAssessment.scores_adapted ||
          latestPiAssessment.traits?.scores_adapted ||
          null,
        scores_natural:
          latestPiAssessment.scores_natural ||
          latestPiAssessment.traits?.scores_natural ||
          null,
        gaps: latestPiAssessment.gaps || latestPiAssessment.traits?.gaps || null,
      }
    : null;

  const profileCompleteness = candidateDetails
    ?
        (
          (candidateDetails.profile ? 1 : 0) +
          (candidateDetails.experiences.length > 0 ? 1 : 0) +
          (candidateDetails.education.length > 0 ? 1 : 0) +
          (candidateDetails.assessments.length > 0 ? 1 : 0)
        )
    : 0;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCpf = (value?: string) => {
    if (!value) return null;
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length !== 11) return value;
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatBirthDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('pt-BR');
  };

  const calculateAge = (value?: string | null) => {
    if (!value) return null;
    const birth = new Date(value);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age -= 1;
    }
    return age;
  };

  const degreeLabels: Record<string, string> = {
    ensino_fundamental: 'Ensino fundamental',
    ensino_medio: 'Ensino médio',
    tecnico: 'Técnico',
    graduacao: 'Graduação',
    pos_graduacao: 'Pós-graduação',
    mestrado: 'Mestrado',
    doutorado: 'Doutorado',
    mba: 'MBA',
  };

  const discProfileSummary: Record<string, string> = {
    D: 'Foco em resultados, decisão rápida e assertividade.',
    I: 'Comunicação intensa, influência e energia para mobilizar pessoas.',
    S: 'Estabilidade, consistência e suporte ao time em ritmo orgânico.',
    C: 'Rigor, precisão, qualidade e orientação a processos bem definidos.',
  };

  const colorSummary: Record<string, string> = {
    azul: 'Lógica, visão de longo prazo e comunicação estruturada.',
    rosa: 'Inovação, velocidade e desafio orientado a ideias.',
    amarelo: 'Conexão humana, empatia e alta expressividade.',
    verde: 'Continuidade, estabilidade e integração de contextos.',
    branco: 'Propósito, estrutura, pragmatismo e execução eficiente.',
  };

  const colorLabel: Record<string, string> = {
    azul: 'Azul',
    rosa: 'Rosa',
    amarelo: 'Amarelo',
    verde: 'Verde',
    branco: 'Branco',
  };

  const getDiscColors = (profile?: string | null) => {
    switch (profile) {
      case 'D':
        return { bg: 'from-red-100 to-red-200', text: 'text-red-700' };
      case 'I':
        return { bg: 'from-amber-100 to-amber-200', text: 'text-amber-700' };
      case 'S':
        return { bg: 'from-green-100 to-green-200', text: 'text-green-700' };
      case 'C':
        return { bg: 'from-blue-100 to-blue-200', text: 'text-blue-700' };
      default:
        return { bg: 'from-purple-100 to-purple-200', text: 'text-purple-700' };
    }
  };

  return (
    <div className="min-h-full">
      <DashboardHeader
        title="Candidatos"
        subtitle="Gerencie seu banco de talentos"
      />

      <div className="px-6 py-6 space-y-5">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar candidatos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterAssessment}
                  onChange={(e) => setFilterAssessment(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#141042]"
                >
                  <option value="all">Todos</option>
                  <option value="completed">Com Avaliação</option>
                  <option value="pending">Sem Avaliação</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidates List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#141042]" />
          </div>
        ) : filteredCandidates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum candidato encontrado
              </h3>
              <p className="text-gray-500">
                {searchQuery
                  ? 'Tente ajustar seus filtros de busca'
                  : 'Candidatos aparecerão aqui quando se candidatarem às suas vagas'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredCandidates.map((candidate) => (
              <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-[#141042] text-white text-lg">
                        {candidate.full_name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {candidate.full_name}
                          </h3>
                          {candidate.headline && (
                            <p className="text-sm text-gray-600">{candidate.headline}</p>
                          )}
                        </div>
                        {candidate.assessment_completed && (
                          <Badge className="bg-green-100 text-green-700">
                            <Award className="h-3 w-3 mr-1" />
                            Avaliado
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{candidate.email}</span>
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{candidate.phone}</span>
                          </div>
                        )}
                        {candidate.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{candidate.location}</span>
                          </div>
                        )}
                        {candidate.cpf && (
                          <div className="flex items-center gap-2">
                            <IdCard className="h-4 w-4" />
                            <span>{formatCpf(candidate.cpf)}</span>
                          </div>
                        )}
                        {candidate.linkedin_url && (
                          <div className="flex items-center gap-2">
                            <Link2 className="h-4 w-4" />
                            <a
                              href={candidate.linkedin_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#141042] hover:underline truncate"
                            >
                              LinkedIn
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Desde {formatDate(candidate.created_at)}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          {candidate.degree_level && (
                            <span className="inline-flex items-center gap-2">
                              <GraduationCap className="h-4 w-4" />
                              {degreeLabels[candidate.degree_level] || candidate.degree_level}
                            </span>
                          )}
                          {candidate.salary_expectation !== undefined && (
                            <span className="inline-flex items-center gap-2">
                              <Banknote className="h-4 w-4" />
                              {formatCurrency(candidate.salary_expectation)}
                            </span>
                          )}
                          {candidate.availability_date && (
                            <span className="inline-flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Disponível em {formatDate(candidate.availability_date)}
                            </span>
                          )}
                          {candidate.tags && candidate.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {candidate.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="default" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedCandidate(candidate);
                              setActiveTab('profile');
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Candidato */}
      <Dialog open={!!selectedCandidate} onOpenChange={(open) => !open && setSelectedCandidate(null)}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
          {selectedCandidate && (
            <div className="relative flex flex-col h-full">
              {/* Header */}
              <div className="bg-[#141042] text-white p-6 flex-shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-white">
                      <AvatarFallback className="bg-white text-[#141042] text-xl font-semibold">
                        {selectedCandidate.full_name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <h2 className="text-2xl font-bold leading-tight" style={{ color: '#ffffff' }}>
                        {selectedCandidate.full_name || selectedCandidate.email || 'Candidato'}
                      </h2>
                      <div className="mt-1">
                        <Badge className={profileCompleteness === 4 ? 'bg-[#10B981] text-white border-0' : 'bg-white/20 text-white border-0'}>
                          Perfil {profileCompleteness}/4
                        </Badge>
                      </div>
                      {selectedCandidate.headline && (
                        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{selectedCandidate.headline}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                      disabled={pdfLoading || detailsLoading || !candidateDetails}
                      onClick={handleGeneratePDF}
                    >
                      {pdfLoading ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                      ) : (
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Currículo PDF
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white text-[var(--tf-primary)] border-white hover:bg-white/90"
                      onClick={() => setSelectedCandidate(null)}
                    >
                      Voltar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-[var(--border)] bg-[var(--tf-gray-50)] flex-shrink-0">
                <div className="flex gap-1 px-6">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'profile'
                        ? 'border-[var(--tf-primary)] text-[var(--tf-primary)]'
                        : 'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    Perfil
                  </button>
                  <button
                    onClick={() => setActiveTab('resume')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'resume'
                        ? 'border-[var(--tf-primary)] text-[var(--tf-primary)]'
                        : 'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    Currículo
                  </button>
                  <button
                    onClick={() => setActiveTab('assessments')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'assessments'
                        ? 'border-[var(--tf-primary)] text-[var(--tf-primary)]'
                        : 'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Testes
                    {selectedCandidate.assessment_completed && (
                      <Badge className="bg-[var(--tf-success)] text-white ml-1 px-1.5 py-0 text-xs">✓</Badge>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('review')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'review'
                        ? 'border-[var(--tf-primary)] text-[var(--tf-primary)]'
                        : 'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                    Parecer Técnico
                    {currentReview && (
                      <Badge className={`ml-1 px-1.5 py-0 text-xs ${
                        currentReview.score_total >= 80 ? 'bg-green-100 text-green-700' :
                        currentReview.score_total >= 60 ? 'bg-blue-100 text-blue-700' :
                        currentReview.score_total >= 40 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>{Math.round(currentReview.score_total)}</Badge>
                    )}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 md:p-6">
                  {/* Conteúdo Principal (2/3) */}
                  <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'profile' && (
                      <>
                        <Card>
                          <CardContent className="p-6 space-y-4">
                            <div>
                              <h2 className="text-xl font-semibold text-[var(--tf-primary)]">
                                {selectedCandidate.full_name || selectedCandidate.email || 'Candidato'}
                              </h2>
                              {selectedCandidate.headline && (
                                <p className="text-sm text-[var(--foreground-muted)] mt-1">
                                  {selectedCandidate.headline}
                                </p>
                              )}
                              {candidateDetails?.profile?.salary_expectation && (
                                <p className="text-sm text-[var(--foreground-muted)] mt-1">
                                  Pretensão salarial: {formatCurrency(candidateDetails.profile.salary_expectation)}
                                </p>
                              )}
                            </div>
                            <h3 className="font-semibold text-lg mb-4">Informações Pessoais</h3>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                              <Mail className="h-4 w-4 text-[var(--foreground-muted)]" />
                              <span className="font-medium">Email:</span>
                              <span>{selectedCandidate.email}</span>
                            </div>
                            
                            {selectedCandidate.phone && (
                              <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-[var(--foreground-muted)]" />
                                <span className="font-medium">Telefone:</span>
                                <span>{selectedCandidate.phone}</span>
                              </div>
                            )}
                            
                            {selectedCandidate.location && (
                              <div className="flex items-center gap-3 text-sm">
                                <MapPin className="h-4 w-4 text-[var(--foreground-muted)]" />
                                <span className="font-medium">Localização:</span>
                                <span>{selectedCandidate.location}</span>
                              </div>
                            )}
                            
                            {selectedCandidate.cpf && (
                              <div className="flex items-center gap-3 text-sm">
                                <IdCard className="h-4 w-4 text-[var(--foreground-muted)]" />
                                <span className="font-medium">CPF:</span>
                                <span>{formatCpf(selectedCandidate.cpf)}</span>
                              </div>
                            )}
                            
                            {selectedCandidate.degree_level && (
                              <div className="flex items-center gap-3 text-sm">
                                <GraduationCap className="h-4 w-4 text-[var(--foreground-muted)]" />
                                <span className="font-medium">Escolaridade:</span>
                                <span>{degreeLabels[selectedCandidate.degree_level] || selectedCandidate.degree_level}</span>
                              </div>
                            )}

                            {(candidateDetails?.education?.length ?? 0) > 0 && (
                              <div className="pt-2">
                                <div className="flex items-center gap-3 text-sm mb-2">
                                  <GraduationCap className="h-4 w-4 text-[var(--foreground-muted)]" />
                                  <span className="font-medium">Formação:</span>
                                </div>
                                <div className="space-y-2">
                                  {candidateDetails?.education?.map((edu: any, idx: number) => (
                                    <div key={idx} className="text-sm">
                                      <div className="font-medium">
                                        {degreeLabels[edu.degree_level] || edu.degree_level}
                                      </div>
                                      <div className="text-[var(--foreground-muted)]">
                                        {edu.course_name} · {edu.institution}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {selectedCandidate.salary_expectation && (
                              <div className="flex items-center gap-3 text-sm">
                                <Banknote className="h-4 w-4 text-[var(--foreground-muted)]" />
                                <span className="font-medium">Pretensão Salarial:</span>
                                <span>{formatCurrency(selectedCandidate.salary_expectation)}</span>
                              </div>
                            )}

                            {candidateDetails?.profile?.birth_date && (
                              <div className="flex items-center gap-3 text-sm">
                                <Calendar className="h-4 w-4 text-[var(--foreground-muted)]" />
                                <span className="font-medium">Nascimento:</span>
                                <span>
                                  {formatBirthDate(candidateDetails.profile.birth_date)}
                                  {calculateAge(candidateDetails.profile.birth_date) !== null && (
                                    <span className="text-[var(--foreground-muted)]">{' '}({calculateAge(candidateDetails.profile.birth_date)} anos)</span>
                                  )}
                                </span>
                              </div>
                            )}
                            
                            {selectedCandidate.availability_date && (
                              <div className="flex items-center gap-3 text-sm">
                                <Calendar className="h-4 w-4 text-[var(--foreground-muted)]" />
                                <span className="font-medium">Disponibilidade:</span>
                                <span>{formatDate(selectedCandidate.availability_date)}</span>
                              </div>
                            )}
                            
                            {selectedCandidate.linkedin_url && (
                              <div className="flex items-center gap-3 text-sm">
                                <Link2 className="h-4 w-4 text-[var(--foreground-muted)]" />
                                <span className="font-medium">LinkedIn:</span>
                                <a
                                  href={selectedCandidate.linkedin_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[var(--tf-accent)] hover:underline"
                                >
                                  Ver perfil
                                </a>
                              </div>
                            )}
                          </div>
                          
                          {selectedCandidate.tags && selectedCandidate.tags.length > 0 && (
                            <div className="pt-4 border-t border-[var(--border)]">
                              <span className="font-medium text-sm mb-2 block">Tags:</span>
                              <div className="flex flex-wrap gap-2">
                                {selectedCandidate.tags.map((tag) => (
                                  <Badge key={tag} variant="default">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-6">
                            <h3 className="font-semibold text-lg mb-4">Resumo Profissional</h3>
                            <div className="space-y-2 text-sm text-[var(--foreground-muted)]">
                              {candidateDetails?.profile?.current_title && (
                                <p><span className="font-medium text-[var(--foreground)]">Cargo:</span> {candidateDetails.profile.current_title}</p>
                              )}
                              {candidateDetails?.profile?.area_of_expertise && (
                                <p><span className="font-medium text-[var(--foreground)]">Área:</span> {candidateDetails.profile.area_of_expertise}</p>
                              )}
                              {candidateDetails?.profile?.seniority_level && (
                                <p><span className="font-medium text-[var(--foreground)]">Senioridade:</span> {candidateDetails.profile.seniority_level}</p>
                              )}
                              {!candidateDetails?.profile?.current_title &&
                                !candidateDetails?.profile?.area_of_expertise &&
                                !candidateDetails?.profile?.seniority_level && (
                                  <p>Resumo profissional não informado.</p>
                                )}
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}

                    {activeTab === 'resume' && (
                      <div className="space-y-6">
                        {detailsLoading ? (
                          <Card>
                            <CardContent className="p-6">
                              <p className="text-sm text-[var(--foreground-muted)]">Carregando currículo...</p>
                            </CardContent>
                          </Card>
                        ) : candidateDetails?.profile ? (
                          <>
                            {/* Arquivo de Currículo */}
                            {candidateDetails.profile.resume_url && (
                              <Card>
                                <CardContent className="p-6">
                                  <h3 className="font-semibold text-lg mb-4">Documento</h3>
                                  <div className="flex items-center gap-3">
                                    <FileText className="h-8 w-8 text-[var(--tf-primary)]" />
                                    <div className="flex-1">
                                      <p className="font-medium">{candidateDetails.profile.resume_filename || 'Currículo'}</p>
                                      <p className="text-sm text-[var(--foreground-muted)]">PDF</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        disabled={resumeViewerLoading}
                                        onClick={() => openResumeViewer(candidateDetails.profile.resume_url)}
                                        className="bg-[#141042] hover:bg-[#1a1554]"
                                      >
                                        {resumeViewerLoading ? (
                                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                                        ) : (
                                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                                        )}
                                        Visualizar
                                      </Button>
                                      <a
                                        href={candidateDetails.profile.resume_url}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Button size="sm" variant="outline">
                                          <Download className="h-3.5 w-3.5 mr-1.5" />
                                          Baixar
                                        </Button>
                                      </a>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            
                            {/* Experiências */}
                            {candidateDetails.experiences.length > 0 && (
                              <Card>
                                <CardContent className="p-6">
                                  <h3 className="font-semibold text-lg mb-4">Experiência Profissional</h3>
                                  <div className="space-y-4">
                                    {candidateDetails.experiences.map((exp: any, idx: number) => (
                                      <div key={idx} className="border-l-2 border-[var(--tf-primary)] pl-4">
                                        <h4 className="font-semibold">{exp.job_title}</h4>
                                        <p className="text-sm text-[var(--foreground-muted)]">{exp.company_name}</p>
                                        <p className="text-xs text-[var(--foreground-muted)] mt-1">
                                          {formatDate(exp.start_date)} - {exp.is_current ? 'Atual' : formatDate(exp.end_date)}
                                        </p>
                                        {exp.description && (
                                          <p className="text-sm mt-2">{exp.description}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            
                            {/* Educação */}
                          </>
                        ) : (
                          <Card>
                            <CardContent className="p-6">
                              <p className="text-sm text-[var(--foreground-muted)]">
                                Nenhuma informação de currículo encontrada
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {activeTab === 'assessments' && (
                      <div className="space-y-6">
                        {detailsLoading ? (
                          <Card>
                            <CardContent className="p-6">
                              <p className="text-sm text-[var(--foreground-muted)]">Carregando testes...</p>
                            </CardContent>
                          </Card>
                        ) : (
                          <>
                            {/* Perfil DISC */}
                            <div className="relative overflow-visible rounded-2xl border border-[#E5E5DC] bg-white/90 p-4 sm:p-6 lg:p-7 shadow-[0_12px_40px_-28px_rgba(20,16,66,0.5)]">
                              <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute -top-20 -left-10 h-40 w-40 rounded-full bg-purple-200/50 blur-3xl" />
                                <div className="absolute -bottom-16 -right-8 h-32 w-32 rounded-full bg-blue-200/50 blur-3xl" />
                              </div>

                              <div className="relative flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${getDiscColors(discResult?.primary_profile).bg} ${getDiscColors(discResult?.primary_profile).text} flex items-center justify-center shadow-inner text-2xl font-extrabold`}>
                                      {discResult?.primary_profile || 'D'}
                                    </div>
                                    <div>
                                      <p className="text-xs uppercase tracking-wide text-purple-700/80 font-semibold">Perfil DISC</p>
                                    </div>
                                  </div>
                                  <span className="text-xs sm:text-sm font-semibold text-purple-700">Ver/Refazer teste</span>
                                </div>

                                {discResult ? (
                                  <>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-1">
                                      {[
                                        { label: 'Dominância', score: discResult.dominance_score, color: 'from-red-500/70 to-red-600/90', code: 'D', summary: discProfileSummary['D'] },
                                        { label: 'Influência', score: discResult.influence_score, color: 'from-amber-400/80 to-amber-500/90', code: 'I', summary: discProfileSummary['I'] },
                                        { label: 'Estabilidade', score: discResult.steadiness_score, color: 'from-green-500/70 to-green-600/90', code: 'S', summary: discProfileSummary['S'] },
                                        { label: 'Consciência', score: discResult.conscientiousness_score, color: 'from-blue-500/70 to-blue-600/90', code: 'C', summary: discProfileSummary['C'] },
                                      ].map((item) => (
                                        <div
                                          key={item.label}
                                          className="relative group p-3 rounded-xl bg-[#F7F7F2] border border-[#EFEFE7]"
                                          title={`${item.label}: ${item.summary || ''}`}
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-semibold text-[#444]">{item.label}</p>
                                            <span className="text-xs text-[#666]">{item.score}%</span>
                                          </div>
                                          <div className="h-2 rounded-full bg-[#E5E5DC] overflow-hidden">
                                            <div
                                              className={`h-full rounded-full bg-linear-to-r ${item.color}`}
                                              style={{ width: `${Math.min(item.score, 100)}%` }}
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <p className="text-sm text-[#2E2E2E] leading-relaxed mt-3">
                                      {discResult.description ||
                                        'Você é equilibrado(a) e traz uma combinação de características únicas para o trabalho.'}
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-sm text-[#666]">
                                    Ainda não encontramos o perfil DISC do candidato.
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Perfil Cores */}
                            <div className="relative overflow-visible rounded-2xl border border-[#E5E5DC] bg-white/90 p-4 sm:p-6 lg:p-7 shadow-[0_12px_40px_-28px_rgba(20,16,66,0.5)]">
                              <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute -top-20 -left-10 h-40 w-40 rounded-full bg-amber-200/50 blur-3xl" />
                                <div className="absolute -bottom-16 -right-8 h-32 w-32 rounded-full bg-blue-200/40 blur-3xl" />
                              </div>

                              <div className="relative flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-300 to-blue-300 text-[#141042] flex items-center justify-center shadow-inner text-2xl font-extrabold">
                                      👔
                                    </div>
                                    <div>
                                      <p className="text-xs uppercase tracking-wide text-purple-700/80 font-semibold">Perfil Cores</p>
                                    </div>
                                  </div>
                                  <span className="text-xs sm:text-sm font-semibold text-purple-700">Ver/Refazer teste</span>
                                </div>

                                {colorResult ? (
                                  <>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mt-1">
                                      {([
                                        { code: 'azul', label: 'Azul', colorClasses: 'from-blue-500/70 to-blue-600/90', summary: colorSummary['azul'] },
                                        { code: 'rosa', label: 'Rosa', colorClasses: 'from-rose-400/80 to-rose-500/90', summary: colorSummary['rosa'] },
                                        { code: 'amarelo', label: 'Amarelo', colorClasses: 'from-amber-400/80 to-amber-500/90', summary: colorSummary['amarelo'] },
                                        { code: 'verde', label: 'Verde', colorClasses: 'from-emerald-400/80 to-emerald-500/90', summary: colorSummary['verde'] },
                                        { code: 'branco', label: 'Branco', colorClasses: 'from-slate-300/80 to-slate-400/90', summary: colorSummary['branco'] },
                                      ] as const).map((item) => {
                                        const scores = (colorResult.scores || {}) as Record<string, number>;
                                        const val = scores[item.code] || 0;
                                        return (
                                          <div
                                            key={item.code}
                                            className="relative group p-3 rounded-xl bg-[#F7F7F2] border border-[#EFEFE7]"
                                            title={`${item.label}: ${item.summary}`}
                                          >
                                            <div className="flex items-center justify-between mb-2">
                                              <p className="text-sm font-semibold text-[#444]">{item.label}</p>
                                              <span className="text-xs text-[#666]">{val}</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-[#E5E5DC] overflow-hidden">
                                              <div
                                                className={`h-full rounded-full bg-linear-to-r ${item.colorClasses}`}
                                                style={{ width: `${Math.min(val, 80)}%` }}
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <p className="text-sm text-[#2E2E2E] leading-relaxed mt-3">
                                      Cor primária:{' '}
                                      <strong title={colorSummary[colorResult.primary_color as string] || ''}>
                                        {colorLabel[colorResult.primary_color as string] || colorResult.primary_color || '-'}
                                      </strong>{' '}
                                      • Secundária:{' '}
                                      <strong title={colorSummary[colorResult.secondary_color as string] || ''}>
                                        {colorLabel[colorResult.secondary_color as string] || colorResult.secondary_color || '-'}
                                      </strong>
                                    </p>
                                  </>
                                ) : (
                                  <p className="text-sm text-[#666]">
                                    Ainda não encontramos o perfil de cores do candidato.
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Perfil PI */}
                            <div className="relative overflow-visible rounded-2xl border border-[#E5E5DC] bg-white/90 p-4 sm:p-6 lg:p-7 shadow-[0_12px_40px_-28px_rgba(20,16,66,0.5)]">
                              <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute -top-20 -left-10 h-40 w-40 rounded-full bg-indigo-200/50 blur-3xl" />
                                <div className="absolute -bottom-16 -right-8 h-32 w-32 rounded-full bg-violet-200/40 blur-3xl" />
                              </div>

                              <div className="relative flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-400 to-violet-500 text-white flex items-center justify-center shadow-inner text-2xl font-extrabold">
                                      📈
                                    </div>
                                    <div>
                                      <p className="text-xs uppercase tracking-wide text-purple-700/80 font-semibold">Perfil PI</p>
                                    </div>
                                  </div>
                                  <span className="text-xs sm:text-sm font-semibold text-purple-700">Ver/Refazer teste</span>
                                </div>

                                {piResult ? (
                                  <>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-1">
                                      {[
                                        {
                                          label: 'Direção',
                                          score: piResult.scores_adapted?.direcao || piResult.scores_natural?.direcao || 0,
                                          color: 'from-amber-400/80 to-amber-600/90',
                                          description: 'Influência e controle sobre o ambiente',
                                        },
                                        {
                                          label: 'Energia Social',
                                          score: piResult.scores_adapted?.energia_social || piResult.scores_natural?.energia_social || 0,
                                          color: 'from-rose-400/80 to-rose-600/90',
                                          description: 'Expressividade e interação social',
                                        },
                                        {
                                          label: 'Ritmo',
                                          score: piResult.scores_adapted?.ritmo || piResult.scores_natural?.ritmo || 0,
                                          color: 'from-emerald-400/80 to-emerald-600/90',
                                          description: 'Velocidade e aceleração no trabalho',
                                        },
                                        {
                                          label: 'Estrutura',
                                          score: piResult.scores_adapted?.estrutura || piResult.scores_natural?.estrutura || 0,
                                          color: 'from-blue-400/80 to-blue-600/90',
                                          description: 'Organização e conformidade',
                                        },
                                      ].map((item) => {
                                        const normalizedScore = Math.round(((item.score + 10) / 20) * 100);
                                        return (
                                          <div
                                            key={item.label}
                                            className="relative group p-3 rounded-xl bg-[#F7F7F2] border border-[#EFEFE7]"
                                            title={`${item.label}: ${item.description}`}
                                          >
                                            <div className="flex items-center justify-between mb-2">
                                              <p className="text-sm font-semibold text-[#444]">{item.label}</p>
                                              <span className="text-xs text-[#666]">{item.score > 0 ? '+' : ''}{item.score}</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-[#E5E5DC] overflow-hidden">
                                              <div
                                                className={`h-full rounded-full bg-linear-to-r ${item.color}`}
                                                style={{ width: `${normalizedScore}%` }}
                                              />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                      <p className="text-[#2E2E2E] leading-relaxed">
                                        <span className="font-semibold">Perfil Natural:</span> Como você age naturalmente
                                      </p>
                                      <p className="text-[#2E2E2E] leading-relaxed">
                                        <span className="font-semibold">Perfil Adaptado:</span> Como você se adapta ao contexto
                                      </p>
                                    </div>
                                    {piResult.gaps && (
                                      <p className="text-sm text-[#666] leading-relaxed mt-2">
                                        💡 Diferenças entre perfis indicam áreas de adaptação comportamental no ambiente de trabalho.
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-sm text-[#666]">
                                    Ainda não encontramos o perfil PI do candidato.
                                  </p>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {activeTab === 'review' && (
                      <div className="space-y-5">
                        {/* Gerar parecer */}
                        <div className="rounded-2xl border border-[#E5E5DC] bg-white/90 p-5 shadow-sm">
                          <h3 className="font-semibold text-[#141042] mb-3 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                            Gerar Novo Parecer Técnico
                          </h3>
                          <div className="mb-3 rounded-xl bg-purple-50 border border-purple-100 p-3 text-xs text-purple-700 leading-relaxed">
                            A IA irá analisar o perfil do candidato, as anotações salvas, os resultados comportamentais e as vagas em que se candidatou para gerar o parecer e definir automaticamente a nota de avaliação.
                          </div>
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1.5">Contexto adicional para a IA <span className="text-gray-400 font-normal">(opcional)</span></p>
                            <textarea
                              value={reviewNote}
                              onChange={e => setReviewNote(e.target.value)}
                              placeholder="Ex: candidato tem perfil ótimo para liderança, mas precisa desenvolver habilidades técnicas em Python..."
                              rows={3}
                              className="w-full rounded-lg border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#141042]/20"
                            />
                          </div>
                          <button
                            onClick={handleGenerateReview}
                            disabled={reviewLoading}
                            className="w-full flex items-center justify-center gap-2 bg-[#141042] text-white rounded-xl py-2.5 font-medium text-sm hover:bg-[#1a1660] transition-colors disabled:opacity-60"
                          >
                            {reviewLoading ? (
                              <><RefreshCw className="h-4 w-4 animate-spin" /> Gerando parecer...</>
                            ) : (
                              <><Sparkles className="h-4 w-4" /> Gerar Parecer com IA</>
                            )}
                          </button>
                        </div>

                        {/* Score e parecer atual */}
                        {currentReview && (
                          <div className="rounded-2xl border border-[#E5E5DC] bg-white/90 p-5 shadow-sm space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {[
                                { label: 'Score Total', value: currentReview.score_total, color: 'bg-[#141042] text-white' },
                                { label: 'Testes (40%)', value: currentReview.score_testes, color: 'bg-purple-50 text-purple-700' },
                                { label: 'Experiência (35%)', value: currentReview.score_experiencia, color: 'bg-blue-50 text-blue-700' },
                                { label: 'Recrutador (25%)', value: currentReview.score_recrutador, color: 'bg-green-50 text-green-700' },
                              ].map(item => (
                                <div key={item.label} className={`rounded-xl p-3 text-center ${item.color}`}>
                                  <p className="text-2xl font-bold">{Math.round(item.value)}</p>
                                  <p className="text-xs mt-0.5 opacity-80">{item.label}</p>
                                </div>
                              ))}
                            </div>
                            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  currentReview.score_total >= 80 ? 'bg-green-500' :
                                  currentReview.score_total >= 60 ? 'bg-blue-500' :
                                  currentReview.score_total >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(currentReview.score_total, 100)}%` }}
                              />
                            </div>
                            <div className="rounded-xl bg-[#FAFAF8] p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {currentReview.ai_review}
                            </div>
                            <p className="text-xs text-gray-400">
                              Gerado em {new Date(currentReview.created_at).toLocaleString('pt-BR')} • {currentReview.ai_model}
                            </p>
                            {reviewHistory.length > 1 && (
                              <button
                                onClick={() => setShowReviewHistory(p => !p)}
                                className="text-xs text-purple-600 hover:underline"
                              >
                                {showReviewHistory ? 'Ocultar' : `Ver ${reviewHistory.length - 1} parecer(es) anterior(es)`}
                              </button>
                            )}
                            {showReviewHistory && reviewHistory.slice(1).map((r, i) => r && (
                              <div key={i} className="rounded-xl border border-gray-100 p-3 text-xs text-gray-500 space-y-1">
                                <p>Score: <strong>{Math.round(r.score_total)}</strong> • Nota IA: {r.recruiter_rating}/10</p>
                                <p className="whitespace-pre-wrap">{r.ai_review?.slice(0, 300)}...</p>
                                <p className="text-gray-400">{new Date(r.created_at).toLocaleString('pt-BR')}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Painel de Anotações (1/3) */}
                  <div className="lg:col-span-1">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">Anotações</h3>
                            <p className="text-sm text-[var(--foreground-muted)]">
                              Clique para abrir quando precisar.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setShowNotesPanel((prev) => !prev)}
                          >
                            {showNotesPanel ? 'Fechar' : 'Abrir'}
                          </Button>
                        </div>

                        {showNotesPanel && (
                          <div className="mt-4">
                            <NotesPanel
                              candidateId={selectedCandidate.id}
                              context={activeTab === 'review' ? 'assessments' : activeTab}
                              placeholder={`Anotações sobre ${
                                activeTab === 'profile' ? 'o perfil' :
                                activeTab === 'resume' ? 'o currículo' :
                                activeTab === 'review' ? 'o parecer técnico' :
                                'os testes'
                              } do candidato...`}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              <img
                src="https://fjudsjzfnysaztcwlwgm.supabase.co/storage/v1/object/public/LOGOS/LOGO4.png"
                alt="Fartech"
                className="pointer-events-none absolute bottom-4 right-4 h-16 w-auto opacity-20"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Visualizador de Currículo inline */}
      {resumeViewerUrl && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[70]"
            onClick={() => setResumeViewerUrl(null)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-[800px] bg-white z-[71] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-[#141042] shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" style={{ color: '#fff' }} />
                <span className="text-sm font-medium" style={{ color: '#fff' }}>Currículo</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={resumeViewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-white/10 transition-colors"
                  title="Abrir em nova aba"
                >
                  <ExternalLink className="h-4 w-4" style={{ color: '#fff' }} />
                </a>
                <button
                  onClick={() => setResumeViewerUrl(null)}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4" style={{ color: '#fff' }} />
                </button>
              </div>
            </div>
            {/* Visualizador de Currículo inline */}
            <div className="flex-1 bg-gray-100 overflow-hidden">
              <iframe
                src={resumeViewerUrl}
                className="w-full h-full border-0"
                title="Visualizador de Currículo"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
