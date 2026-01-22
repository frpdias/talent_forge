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
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardHeader } from '@/components/DashboardHeader';
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
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssessment, setFilterAssessment] = useState<string>('all');
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    loadCandidates();
  }, [filterAssessment]);

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

  return (
    <div className="min-h-full">
      <DashboardHeader
        title="Candidatos"
        subtitle="Gerencie seu banco de talentos"
      />

      <div className="pl-0 pr-6 py-6 space-y-5">
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
                          <Link href={`/dashboard/candidates/${candidate.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </Link>
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
    </div>
  );
}
