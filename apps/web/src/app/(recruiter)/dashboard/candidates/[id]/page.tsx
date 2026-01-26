'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Edit, 
  FileText, 
  MessageSquare,
  TrendingUp,
  Palette,
  Target,
  Plus,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createBrowserClient } from '@supabase/ssr';
import { DashboardHeader } from '@/components/DashboardHeader';

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  cpf?: string | null;
  linkedin_url?: string | null;
  salary_expectation?: number | null;
  availability_date?: string | null;
  tags?: string[] | null;
  experience_years?: number;
  skills?: string[];
  education?: string;
  work_experience?: string;
  bio?: string;
  resume_url?: string | null;
  resume_filename?: string | null;
}

interface Note {
  id: string;
  note: string;
  created_at: string;
  author_id: string;
}

interface ColorResult {
  primary_color: string;
  secondary_color: string;
  scores: Record<string, number>;
}

interface DISCResult {
  dominance_score: number;
  influence_score: number;
  steadiness_score: number;
  conscientiousness_score: number;
  primary_profile: string;
  description: string;
}

interface PIResult {
  natural_profile: {
    direção: number;
    energia_social: number;
    ritmo: number;
    estrutura: number;
  };
  adapted_profile: {
    direção: number;
    energia_social: number;
    ritmo: number;
    estrutura: number;
  };
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [colorResult, setColorResult] = useState<ColorResult | null>(null);
  const [discResult, setDiscResult] = useState<DISCResult | null>(null);
  const [piResult, setPiResult] = useState<PIResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedCandidate, setEditedCandidate] = useState<Partial<Candidate>>({});
  const [activeTab, setActiveTab] = useState<'profile' | 'tests' | 'notes'>('profile');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const colorScoreOrder = ['azul', 'rosa', 'amarelo', 'verde', 'branco', 'vermelho'];

  useEffect(() => {
    loadData();
  }, [candidateId]);

  async function loadData() {
    try {
      setLoading(true);

      // Get candidate profile
      const { data: candidateRow } = await supabase
        .from('candidates')
        .select('id, user_id, full_name, email, phone, location, current_title, created_at, linkedin_url, salary_expectation, availability_date, tags')
        .eq('id', candidateId)
        .maybeSingle();

      if (!candidateRow) {
        setCandidate(null);
        return;
      }

      const baseCandidate: Candidate = {
        id: candidateRow.id,
        full_name: candidateRow.full_name || 'Candidato',
        email: candidateRow.email || '',
        phone: candidateRow.phone || undefined,
        location: candidateRow.location || undefined,
        headline: candidateRow.current_title || undefined,
        linkedin_url: candidateRow.linkedin_url || null,
        salary_expectation: candidateRow.salary_expectation ?? null,
        availability_date: candidateRow.availability_date ?? null,
        tags: candidateRow.tags || null,
        resume_url: null,
        resume_filename: null,
      };

      let profileData: Candidate | null = null;
      if (candidateRow.user_id) {
        const { data: profileByUser } = await supabase
          .from('candidate_profiles')
          .select('*')
          .eq('user_id', candidateRow.user_id)
          .maybeSingle();
        profileData = (profileByUser as Candidate | null) ?? null;
      }

      if (!profileData && candidateRow.email) {
        const { data: profileByEmail } = await supabase
          .from('candidate_profiles')
          .select('*')
          .eq('email', candidateRow.email)
          .maybeSingle();
        profileData = (profileByEmail as Candidate | null) ?? null;
      }

      const profileId = (profileData as any)?.id ?? null;

      let educationText: string | undefined;
      let experienceText: string | undefined;
      let experienceYears: number | undefined;

      if (profileId) {
        const [eduResult, expResult] = await Promise.all([
          supabase
            .from('candidate_education')
            .select('degree_level, course_name, institution, start_year, end_year, is_current')
            .eq('candidate_profile_id', profileId)
            .order('start_year', { ascending: true }),
          supabase
            .from('candidate_experience')
            .select('company_name, job_title, start_date, end_date, is_current, description')
            .eq('candidate_profile_id', profileId)
            .order('start_date', { ascending: true }),
        ]);

        const degreeLabelMap: Record<string, string> = {
          ensino_fundamental: 'Ensino Fundamental',
          ensino_medio: 'Ensino Médio',
          tecnico: 'Técnico',
          graduacao: 'Graduação',
          pos_graduacao: 'Pós-Graduação',
          mestrado: 'Mestrado',
          doutorado: 'Doutorado',
          mba: 'MBA',
        };

        const educations = eduResult.data || [];
        if (educations.length > 0) {
          educationText = educations
            .map((edu) => {
              const degree = degreeLabelMap[edu.degree_level] || edu.degree_level;
              const period = edu.is_current
                ? `${edu.start_year || ''} - Atual`
                : `${edu.start_year || ''}${edu.end_year ? ` - ${edu.end_year}` : ''}`;
              return `${degree} em ${edu.course_name} - ${edu.institution}${period.trim() ? ` (${period})` : ''}`;
            })
            .join('\n');
        }

        const experiences = expResult.data || [];
        if (experiences.length > 0) {
          experienceText = experiences
            .map((exp) => {
              const start = exp.start_date
                ? new Date(exp.start_date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' })
                : '';
              const end = exp.is_current
                ? 'Atual'
                : exp.end_date
                  ? new Date(exp.end_date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' })
                  : '';
              const period = start || end ? ` (${[start, end].filter(Boolean).join(' - ')})` : '';
              const description = exp.description ? `\n${exp.description}` : '';
              return `${exp.job_title} @ ${exp.company_name}${period}${description}`;
            })
            .join('\n\n');

          const startDates = experiences
            .map((exp) => (exp.start_date ? new Date(exp.start_date) : null))
            .filter(Boolean) as Date[];
          const endDates = experiences
            .map((exp) => (exp.is_current || !exp.end_date ? new Date() : new Date(exp.end_date)))
            .filter(Boolean) as Date[];
          if (startDates.length > 0 && endDates.length > 0) {
            const minStart = new Date(Math.min(...startDates.map((d) => d.getTime())));
            const maxEnd = new Date(Math.max(...endDates.map((d) => d.getTime())));
            const months = (maxEnd.getFullYear() - minStart.getFullYear()) * 12 + (maxEnd.getMonth() - minStart.getMonth());
            experienceYears = Math.max(0, Math.floor(months / 12));
          }
        }
      }

      const mergedCandidate: Candidate = {
        ...baseCandidate,
        ...(profileData || {}),
        full_name: profileData?.full_name || baseCandidate.full_name,
        email: profileData?.email || baseCandidate.email,
        phone: profileData?.phone || baseCandidate.phone,
        location: (profileData as any)?.city
          ? `${(profileData as any).city}${(profileData as any).state ? `, ${(profileData as any).state}` : ''}`
          : baseCandidate.location,
        headline: (profileData as any)?.current_title || baseCandidate.headline,
        cpf: (profileData as any)?.cpf || null,
        education: educationText,
        work_experience: experienceText,
        experience_years: experienceYears,
        resume_url: (profileData as any)?.resume_url || baseCandidate.resume_url,
      };

      setCandidate(mergedCandidate);
      setEditedCandidate(mergedCandidate);

      const candidateUserIds = Array.from(
        new Set(
          [candidateRow.user_id, (profileData as any)?.user_id].filter(Boolean) as string[]
        )
      );

      // Get notes
      const { data: notesData } = await supabase
        .from('candidate_notes')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (notesData) {
        setNotes(notesData);
      }

      const { data: assessmentUserIds } = await supabase
        .from('assessments')
        .select('candidate_user_id')
        .eq('candidate_id', candidateId)
        .not('candidate_user_id', 'is', null);

      const resolvedUserIds = Array.from(
        new Set([
          ...candidateUserIds,
          ...((assessmentUserIds || []).map((row: any) => row.candidate_user_id).filter(Boolean) as string[]),
        ])
      );

      const candidateIds = new Set<string>([candidateId]);
      if (mergedCandidate?.email) {
        const { data: candidatesByEmail } = await supabase
          .from('candidates')
          .select('id')
          .ilike('email', mergedCandidate.email)
          .limit(10);
        (candidatesByEmail || []).forEach((row) => candidateIds.add(row.id));
      }

      if (resolvedUserIds.length > 0) {
        const normalizeColorScores = (rawScores: Record<string, any>) => {
          const map: Record<string, number> = {};
          const toNumber = (value: any) => {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
              const parsed = Number(value.replace(',', '.'));
              return Number.isFinite(parsed) ? parsed : 0;
            }
            return 0;
          };

          colorScoreOrder.forEach((key) => {
            const lowerKey = key.toLowerCase();
            map[lowerKey] = toNumber(rawScores?.[lowerKey] ?? rawScores?.[key] ?? 0);
          });

          const total = Object.values(map).reduce((sum, value) => sum + value, 0);
          if (total > 0) {
            if (total >= 90 && total <= 110) {
              return map;
            }
            const normalized: Record<string, number> = {};
            Object.entries(map).forEach(([key, value]) => {
              normalized[key] = Math.round((value / total) * 100);
            });
            return normalized;
          }

          return map;
        };

        // Get Color assessment
        const { data: colorData } = await supabase
          .from('color_assessments')
          .select('id, primary_color, secondary_color, scores, completed_at')
          .in('candidate_user_id', resolvedUserIds)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (colorData) {
          let scores = normalizeColorScores((colorData.scores as Record<string, number> | null) || {});

          const hasScores = Object.values(scores).some((value) => value > 0);
          if (!hasScores && colorData.id) {
            const { data: colorResponses } = await supabase
              .from('color_responses')
              .select('selected_color')
              .eq('assessment_id', colorData.id);

            if (colorResponses && colorResponses.length > 0) {
              const counts: Record<string, number> = {};
              colorResponses.forEach((response: { selected_color: string }) => {
                const key = response.selected_color?.toLowerCase?.();
                if (!key) return;
                counts[key] = (counts[key] || 0) + 1;
              });
              scores = normalizeColorScores(counts);
            }
          }

          const orderedScores = Object.entries(scores)
            .map(([color, value]) => ({ color, value }))
            .sort((a, b) => b.value - a.value);
          const derivedPrimary = orderedScores[0]?.color || '';
          const derivedSecondary = orderedScores[1]?.color || '';

          const normalizedPrimary = (colorData.primary_color || '').toLowerCase();
          const normalizedSecondary = (colorData.secondary_color || '').toLowerCase();

          const primaryColor = derivedPrimary && derivedPrimary !== normalizedPrimary
            ? derivedPrimary
            : normalizedPrimary;

          const secondaryColor = derivedSecondary && derivedSecondary !== normalizedSecondary
            ? derivedSecondary
            : normalizedSecondary;

          setColorResult({
            primary_color: primaryColor,
            secondary_color: secondaryColor,
            scores,
          });
        }

        // Get DISC assessment
        const candidateIdsList = Array.from(candidateIds);
        const discFilters = [
          candidateIdsList.length > 0 ? `candidate_id.in.(${candidateIdsList.join(',')})` : '',
          resolvedUserIds.length > 0 ? `candidate_user_id.in.(${resolvedUserIds.join(',')})` : '',
        ].filter(Boolean).join(',');

        const { data: discAssessmentRows } = await supabase
          .from('assessments')
          .select('id, traits, status, completed_at')
          .or(discFilters)
          .eq('assessment_type', 'disc')
          .order('completed_at', { ascending: false })
          .limit(5);

        const discAssessmentIds = (discAssessmentRows || []).map((row) => row.id);
        let discPayload = null as any;

        if (discAssessmentIds.length > 0) {
          const { data: discRows } = await supabase
            .from('disc_assessments')
            .select('assessment_id, dominance_score, influence_score, steadiness_score, conscientiousness_score, primary_profile, description')
            .in('assessment_id', discAssessmentIds);

          const discMap = new Map((discRows || []).map((row) => [row.assessment_id, row]));
          for (const assessment of discAssessmentRows || []) {
            const candidateDisc = discMap.get(assessment.id);
            if (candidateDisc) {
              discPayload = candidateDisc;
              break;
            }
          }
        }

        if (discPayload) {
          setDiscResult({
            dominance_score: discPayload.dominance_score || 0,
            influence_score: discPayload.influence_score || 0,
            steadiness_score: discPayload.steadiness_score || 0,
            conscientiousness_score: discPayload.conscientiousness_score || 0,
            primary_profile: discPayload.primary_profile || '',
            description: discPayload.description || '',
          });
        } else {
          const fallbackAssessment = (discAssessmentRows || [])[0];
          if (fallbackAssessment?.traits?.disc) {
            const discTraits = fallbackAssessment.traits.disc;
            setDiscResult({
              dominance_score: Number(discTraits.D ?? discTraits.dominance_score ?? 0),
              influence_score: Number(discTraits.I ?? discTraits.influence_score ?? 0),
              steadiness_score: Number(discTraits.S ?? discTraits.steadiness_score ?? 0),
              conscientiousness_score: Number(discTraits.C ?? discTraits.conscientiousness_score ?? 0),
              primary_profile: discTraits.primary ?? discTraits.primary_profile ?? '',
              description: discTraits.description ?? '',
            });
          }
        }

        // Get PI assessment
        const { data: piData } = await supabase
          .from('pi_assessments')
          .select('scores_natural, scores_adapted, completed_at')
          .in('candidate_user_id', resolvedUserIds)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (piData) {
          const natural = (piData.scores_natural as Record<string, number> | null) || {};
          const adapted = (piData.scores_adapted as Record<string, number> | null) || {};
          setPiResult({
            natural_profile: {
              direção: natural.direcao || 0,
              energia_social: natural.energia_social || 0,
              ritmo: natural.ritmo || 0,
              estrutura: natural.estrutura || 0,
            },
            adapted_profile: {
              direção: adapted.direcao || 0,
              energia_social: adapted.energia_social || 0,
              ritmo: adapted.ritmo || 0,
              estrutura: adapted.estrutura || 0,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCpf = (value?: string | null) => {
    if (!value) return '-';
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length !== 11) return value;
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCurrency = (value?: number | null) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getDiscSummary = (result: DISCResult) => {
    const scores = [
      { label: 'D', value: result.dominance_score },
      { label: 'I', value: result.influence_score },
      { label: 'S', value: result.steadiness_score },
      { label: 'C', value: result.conscientiousness_score },
    ].sort((a, b) => b.value - a.value);

    const top = scores[0];
    const second = scores[1];

    const labelMap: Record<string, string> = {
      D: 'Dominância',
      I: 'Influência',
      S: 'Estabilidade',
      C: 'Consciência',
    };

    const topLabel = labelMap[top.label] || top.label;
    const secondLabel = labelMap[second.label] || second.label;

    return `Perfil ${result.primary_profile}. Predomínio em ${topLabel} (${top.value}%), seguido por ${secondLabel} (${second.value}%).`;
  };

  const getColorSummary = (result: ColorResult) => {
    const labelMap: Record<string, string> = {
      vermelho: 'Vermelho',
      amarelo: 'Amarelo',
      verde: 'Verde',
      azul: 'Azul',
      rosa: 'Rosa',
      branco: 'Branco',
    };

    const entries = Object.entries(result.scores || {})
      .map(([color, value]) => ({
        color,
        label: labelMap[color.toLowerCase()] || color,
        value,
      }))
      .sort((a, b) => b.value - a.value);

    const primary = entries[0];
    const secondary = entries[1];

    if (!primary) return 'Sem pontuações registradas.';

    return `Perfil primário ${labelMap[result.primary_color?.toLowerCase?.()] || result.primary_color}. ` +
      `Destaque em ${primary.label} (${primary.value}%)` +
      (secondary ? ` e ${secondary.label} (${secondary.value}%).` : '.');
  };

  const getPiSummary = (result: PIResult) => {
    const normalize = (value: number) => Number.isFinite(value) ? value : 0;

    const naturalScores = Object.entries(result.natural_profile).map(([axis, value]) => ({
      axis,
      value: normalize(value),
    }));

    const adaptedScores = Object.entries(result.adapted_profile).map(([axis, value]) => ({
      axis,
      value: normalize(value),
    }));

    const naturalTop = [...naturalScores].sort((a, b) => b.value - a.value)[0];
    const adaptedTop = [...adaptedScores].sort((a, b) => b.value - a.value)[0];

    const axisLabelMap: Record<string, string> = {
      direção: 'Direção',
      energia_social: 'Energia Social',
      ritmo: 'Ritmo',
      estrutura: 'Estrutura',
    };

    const naturalLabel = axisLabelMap[naturalTop.axis] || naturalTop.axis;
    const adaptedLabel = axisLabelMap[adaptedTop.axis] || adaptedTop.axis;

    return `Natural: ${naturalLabel} (${naturalTop.value}). Adaptado: ${adaptedLabel} (${adaptedTop.value}).`;
  };

  async function handleSaveProfile() {
    try {
      const { error } = await supabase
        .from('candidate_profiles')
        .update(editedCandidate)
        .eq('id', candidateId);

      if (error) throw error;

      setCandidate({ ...candidate, ...editedCandidate } as Candidate);
      setEditMode(false);
      alert('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(error.message || 'Erro ao salvar perfil');
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('candidate_notes')
        .insert([
          {
            candidate_id: candidateId,
            note: newNote,
            author_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setNotes([data, ...notes]);
        setNewNote('');
      }
    } catch (error: any) {
      console.error('Error adding note:', error);
      alert(error.message || 'Erro ao adicionar anotação');
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) return;

    try {
      const { error } = await supabase
        .from('candidate_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error: any) {
      console.error('Error deleting note:', error);
      alert(error.message || 'Erro ao excluir anotação');
    }
  }

  const getColorBadge = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; name: string }> = {
      vermelho: { bg: 'bg-red-100', text: 'text-red-700', name: 'Vermelho (Diretor)' },
      amarelo: { bg: 'bg-yellow-100', text: 'text-yellow-700', name: 'Amarelo (Comunicador)' },
      verde: { bg: 'bg-green-100', text: 'text-green-700', name: 'Verde (Planejador)' },
      azul: { bg: 'bg-blue-100', text: 'text-blue-700', name: 'Azul (Analítico)' },
      rosa: { bg: 'bg-pink-100', text: 'text-pink-700', name: 'Rosa' },
      branco: { bg: 'bg-gray-100', text: 'text-gray-700', name: 'Branco' },
    };
    const colorInfo = colorMap[color?.toLowerCase?.() || ''] || colorMap.vermelho;
    return (
      <Badge className={`${colorInfo.bg} ${colorInfo.text}`}>
        {colorInfo.name}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFAF8]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#141042]" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] p-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-12 text-center">
            <p className="text-gray-600 mb-4">Candidato não encontrado</p>
            <Button onClick={() => router.back()}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <DashboardHeader
        title={candidate.full_name}
        subtitle={candidate.email}
        actions={
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        }
      />

      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'profile'
                ? 'border-[#141042] text-[#141042]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Perfil e Currículo
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'tests'
                ? 'border-[#141042] text-[#141042]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Resultados dos Testes
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'notes'
                ? 'border-[#141042] text-[#141042]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Anotações ({notes.length})
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Informações Pessoais</CardTitle>
                {!editMode ? (
                  <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={() => setEditMode(false)} variant="outline" size="sm">
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveProfile} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome Completo</Label>
                  {editMode ? (
                    <Input
                      value={editedCandidate.full_name || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate, full_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-lg font-medium">{candidate.full_name}</p>
                  )}
                </div>

                <div>
                  <Label>Email</Label>
                  <p className="text-lg">{candidate.email}</p>
                </div>

                <div>
                  <Label>Telefone</Label>
                  {editMode ? (
                    <Input
                      value={editedCandidate.phone || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-lg">{candidate.phone || '-'}</p>
                  )}
                </div>

                <div>
                  <Label>CPF</Label>
                  <p className="text-lg">{formatCpf(candidate.cpf)}</p>
                </div>

                <div>
                  <Label>Localização</Label>
                  {editMode ? (
                    <Input
                      value={editedCandidate.location || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate, location: e.target.value })}
                    />
                  ) : (
                    <p className="text-lg">{candidate.location || '-'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label>Headline Profissional</Label>
                  {editMode ? (
                    <Input
                      value={editedCandidate.headline || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate, headline: e.target.value })}
                    />
                  ) : (
                    <p className="text-lg">{candidate.headline || '-'}</p>
                  )}
                </div>

                <div>
                  <Label>LinkedIn</Label>
                  {candidate.linkedin_url ? (
                    <a
                      href={candidate.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#141042] hover:underline"
                    >
                      {candidate.linkedin_url}
                    </a>
                  ) : (
                    <p className="text-lg">-</p>
                  )}
                </div>

                <div>
                  <Label>Pretensão Salarial</Label>
                  <p className="text-lg">{formatCurrency(candidate.salary_expectation)}</p>
                </div>

                <div>
                  <Label>Disponibilidade</Label>
                  <p className="text-lg">
                    {candidate.availability_date
                      ? new Date(candidate.availability_date).toLocaleDateString('pt-BR')
                      : '-'}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Label>Tags</Label>
                  {candidate.tags && candidate.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {candidate.tags.map((tag) => (
                        <Badge key={tag} variant="default">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-lg">-</p>
                  )}
                </div>

                <div>
                  <Label>Anos de Experiência</Label>
                  {editMode ? (
                    <Input
                      type="number"
                      value={editedCandidate.experience_years || 0}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate, experience_years: parseInt(e.target.value) })}
                    />
                  ) : (
                    <p className="text-lg">{candidate.experience_years || 0} anos</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label>Biografia</Label>
                  {editMode ? (
                    <Textarea
                      rows={4}
                      value={editedCandidate.bio || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate, bio: e.target.value })}
                    />
                  ) : (
                    <p className="text-gray-700">{candidate.bio || '-'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label>Educação</Label>
                  {editMode ? (
                    <Textarea
                      rows={3}
                      value={editedCandidate.education || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate, education: e.target.value })}
                    />
                  ) : (
                    <p className="text-gray-700">{candidate.education || '-'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label>Experiência Profissional</Label>
                  {editMode ? (
                    <Textarea
                      rows={6}
                      value={editedCandidate.work_experience || ''}
                      onChange={(e) => setEditedCandidate({ ...editedCandidate, work_experience: e.target.value })}
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-line">{candidate.work_experience || '-'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label>Currículo</Label>
                  {candidate.resume_url ? (
                    <a
                      href={candidate.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-[#141042] hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      {candidate.resume_filename || 'Ver currículo'}
                    </a>
                  ) : (
                    <p className="text-gray-700">-</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            {/* Color Assessment */}
            {colorResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Avaliação de Cores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    <strong>Resumo:</strong> {getColorSummary(colorResult)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="mb-2 block">Perfil Primário</Label>
                      {getColorBadge(colorResult.primary_color)}
                      {colorResult.secondary_color && (
                        <>
                          <Label className="mb-2 block mt-4">Perfil Secundário</Label>
                          {getColorBadge(colorResult.secondary_color)}
                        </>
                      )}
                    </div>

                    <div>
                      <Label className="mb-4 block">Distribuição de Cores</Label>
                      <div className="space-y-4">
                        {colorScoreOrder.map((color) => {
                          const score = colorResult.scores[color] ?? 0;
                          const colorLabelMap: Record<string, string> = {
                            vermelho: 'Vermelho',
                            amarelo: 'Amarelo',
                            verde: 'Verde',
                            azul: 'Azul',
                            rosa: 'Rosa',
                            branco: 'Branco',
                          };
                          const label = colorLabelMap[color.toLowerCase()] || color;
                          return (
                            <div key={color}>
                              <div className="flex justify-between mb-2">
                                <span className="capitalize font-medium">{label}</span>
                                <span className="text-sm font-bold">{score}%</span>
                              </div>
                              <Progress value={score} className="h-3" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* DISC Assessment */}
            {discResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Avaliação DISC
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 rounded-lg border border-purple-100 bg-purple-50 px-4 py-3 text-sm text-purple-900">
                    <strong>Resumo:</strong> {getDiscSummary(discResult)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="mb-2 block">Perfil Primário</Label>
                      <Badge className="bg-purple-100 text-purple-700 text-lg px-4 py-2">
                        {discResult.primary_profile}
                      </Badge>
                      <p className="text-gray-700 mt-3">{discResult.description}</p>
                    </div>

                    <div>
                      <Label className="mb-4 block">Distribuição DISC</Label>
                      <div className="space-y-4">
                        {[
                          { label: 'Dominância (D)', score: discResult.dominance_score },
                          { label: 'Influência (I)', score: discResult.influence_score },
                          { label: 'Estabilidade (S)', score: discResult.steadiness_score },
                          { label: 'Consciência (C)', score: discResult.conscientiousness_score },
                        ].map(({ label, score }) => (
                          <div key={label}>
                            <div className="flex justify-between mb-2">
                              <span className="font-medium">{label}</span>
                              <span className="text-sm font-bold">{score}%</span>
                            </div>
                            <Progress value={score} className="h-3" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* PI Assessment */}
            {piResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Avaliação PI (Predictive Index)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    <strong>Resumo:</strong> {getPiSummary(piResult)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="mb-4 block text-lg">Perfil Natural</Label>
                      <div className="space-y-4">
                        {Object.entries(piResult.natural_profile).map(([axis, score]) => (
                          <div key={axis}>
                            <div className="flex justify-between mb-2">
                              <span className="capitalize font-medium">{axis.replace('_', ' ')}</span>
                              <span className="text-sm font-bold">{score}</span>
                            </div>
                            <Progress value={(score / 100) * 100} className="h-3" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="mb-4 block text-lg">Perfil Adaptado</Label>
                      <div className="space-y-4">
                        {Object.entries(piResult.adapted_profile).map(([axis, score]) => (
                          <div key={axis}>
                            <div className="flex justify-between mb-2">
                              <span className="capitalize font-medium">{axis.replace('_', ' ')}</span>
                              <span className="text-sm font-bold">{score}</span>
                            </div>
                            <Progress value={(score / 100) * 100} className="h-3" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!colorResult && !discResult && !piResult && (
              <Card>
                <CardContent className="p-12 text-center">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma avaliação concluída
                  </h3>
                  <p className="text-gray-500">
                    O candidato ainda não completou nenhuma avaliação comportamental
                  </p>
                </CardContent>
              </Card>
            )}

            {!colorResult && !discResult && !piResult && (
              <Card>
                <CardContent className="py-10 text-center text-gray-600">
                  Nenhum resultado de teste encontrado para este candidato.
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Anotação</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={4}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Digite sua anotação sobre o candidato..."
                  className="mb-4"
                />
                <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Anotação
                </Button>
              </CardContent>
            </Card>

            {notes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma anotação ainda
                  </h3>
                  <p className="text-gray-500">
                    Adicione anotações sobre o candidato para referência futura
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleString('pt-BR')}
                        </span>
                        <Button
                          onClick={() => handleDeleteNote(note.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">{note.note}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
