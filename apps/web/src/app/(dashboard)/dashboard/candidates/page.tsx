'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { createBrowserClient } from '@supabase/ssr';

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  experience_years?: number;
  assessment_completed: boolean;
  created_at: string;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssessment, setFilterAssessment] = useState<string>('all');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadCandidates();
  }, [filterAssessment]);

  async function loadCandidates() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's organization
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) return;

      // Get candidates from applications
      let query = supabase
        .from('applications')
        .select(`
          candidate_id,
          candidate_profiles!inner(
            id,
            full_name,
            email,
            phone,
            location,
            headline,
            experience_years,
            created_at
          ),
          jobs!inner(organization_id)
        `)
        .eq('jobs.organization_id', profile.organization_id);

      const { data: applications, error } = await query;

      if (error) throw error;

      // Get unique candidates
      const uniqueCandidates = new Map();
      
      for (const app of applications || []) {
        const candidate = (app as any).candidate_profiles;
        if (!uniqueCandidates.has(candidate.id)) {
          // Check if candidate has completed assessments
          const { data: assessments } = await supabase
            .from('color_assessments')
            .select('id')
            .eq('candidate_id', candidate.id)
            .eq('status', 'completed')
            .limit(1);

          uniqueCandidates.set(candidate.id, {
            id: candidate.id,
            full_name: candidate.full_name,
            email: candidate.email,
            phone: candidate.phone,
            location: candidate.location,
            headline: candidate.headline,
            experience_years: candidate.experience_years,
            assessment_completed: (assessments?.length || 0) > 0,
            created_at: candidate.created_at,
          });
        }
      }

      let candidatesList = Array.from(uniqueCandidates.values());

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
    candidate.headline?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Desde {formatDate(candidate.created_at)}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {candidate.experience_years && (
                            <span>{candidate.experience_years} anos de experiência</span>
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
