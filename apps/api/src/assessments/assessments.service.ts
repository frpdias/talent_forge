import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateAssessmentDto, SubmitAssessmentDto } from './dto';

// Behavioral Assessment V1 - Simple questionnaire
const BEHAVIORAL_QUESTIONS_V1 = [
  {
    id: 'q1',
    text: 'Prefiro trabalhar sozinho do que em grupo',
    trait: 'extraversion',
    reverse: true,
  },
  {
    id: 'q2',
    text: 'Gosto de experimentar coisas novas',
    trait: 'openness',
    reverse: false,
  },
  {
    id: 'q3',
    text: 'Sou organizado e gosto de planejar com antecedência',
    trait: 'conscientiousness',
    reverse: false,
  },
  {
    id: 'q4',
    text: 'Costumo ajudar os outros mesmo quando não me pedem',
    trait: 'agreeableness',
    reverse: false,
  },
  {
    id: 'q5',
    text: 'Fico ansioso quando enfrento situações desconhecidas',
    trait: 'neuroticism',
    reverse: false,
  },
  {
    id: 'q6',
    text: 'Gosto de liderar projetos e equipes',
    trait: 'dominance',
    reverse: false,
  },
  {
    id: 'q7',
    text: 'Prefiro ambientes de trabalho previsíveis e estáveis',
    trait: 'steadiness',
    reverse: false,
  },
  {
    id: 'q8',
    text: 'Gosto de convencer pessoas e influenciar decisões',
    trait: 'influence',
    reverse: false,
  },
  {
    id: 'q9',
    text: 'Presto muita atenção aos detalhes',
    trait: 'compliance',
    reverse: false,
  },
  {
    id: 'q10',
    text: 'Adapto-me facilmente a mudanças',
    trait: 'openness',
    reverse: false,
  },
];

const BEHAVIORAL_OPTIONS = [
  { value: 1, label: 'Discordo totalmente' },
  { value: 2, label: 'Discordo parcialmente' },
  { value: 3, label: 'Neutro' },
  { value: 4, label: 'Concordo parcialmente' },
  { value: 5, label: 'Concordo totalmente' },
];

@Injectable()
export class AssessmentsService {
  constructor(private supabaseService: SupabaseService) {}

  async create(dto: CreateAssessmentDto, orgId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Verify candidate belongs to org
    const { data: candidate, error: candError } = await supabase
      .from('candidates')
      .select('id')
      .eq('id', dto.candidateId)
      .eq('owner_org_id', orgId)
      .single();

    if (candError || !candidate) {
      throw new NotFoundException('Candidate not found');
    }

    // Verify job if provided
    if (dto.jobId) {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', dto.jobId)
        .eq('org_id', orgId)
        .single();

      if (jobError || !job) {
        throw new NotFoundException('Job not found');
      }
    }

    const { data, error } = await supabase
      .from('assessments')
      .insert({
        candidate_id: dto.candidateId,
        job_id: dto.jobId || null,
        assessment_kind: dto.assessmentKind || 'behavioral_v1',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Generate assessment link (in a real app, this would be a short URL)
    const assessmentLink = `/assessments/take/${data.id}`;

    return {
      ...this.mapToResponse(data),
      link: assessmentLink,
      questions: BEHAVIORAL_QUESTIONS_V1.map((q) => ({
        id: q.id,
        text: q.text,
        options: BEHAVIORAL_OPTIONS,
      })),
    };
  }

  async findOne(id: string, orgId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('assessments')
      .select(
        `
        *,
        candidates!inner (id, full_name, owner_org_id)
      `,
      )
      .eq('id', id)
      .eq('candidates.owner_org_id', orgId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Assessment not found');
    }

    return this.mapToResponse(data);
  }

  async findByCandidateId(candidateId: string, orgId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('assessments')
      .select(
        `
        *,
        candidates!inner (id, owner_org_id)
      `,
      )
      .eq('candidate_id', candidateId)
      .eq('candidates.owner_org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map((a: any) => this.mapToResponse(a));
  }

  // Public endpoint for candidates to take the assessment
  async getAssessmentQuestions(id: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('assessments')
      .select(
        `
        id,
        assessment_kind,
        raw_score,
        candidates!inner (full_name)
      `,
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Assessment not found');
    }

    const candidateName = Array.isArray((data as any).candidates)
      ? (data as any).candidates?.[0]?.full_name
      : (data as any).candidates?.full_name;

    if (data.raw_score !== null) {
      return {
        id: data.id,
        completed: true,
        message: 'Este assessment já foi respondido',
        candidateName,
      };
    }

    return {
      id: data.id,
      kind: data.assessment_kind,
      candidateName,
      questions: BEHAVIORAL_QUESTIONS_V1.map((q) => ({
        id: q.id,
        text: q.text,
        options: BEHAVIORAL_OPTIONS,
      })),
    };
  }

  // Public endpoint for candidates to submit answers
  async submitAssessment(id: string, dto: SubmitAssessmentDto) {
    const supabase = this.supabaseService.getAdminClient();

    // Verify assessment exists and is not completed
    const { data: assessment, error: assError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (assError || !assessment) {
      throw new NotFoundException('Assessment not found');
    }

    if (assessment.raw_score !== null) {
      throw new Error('Assessment already completed');
    }

    // Calculate scores
    const scores = this.calculateScores(dto.answers);

    const { data, error } = await supabase
      .from('assessments')
      .update({
        raw_score: scores.rawScore,
        normalized_score: scores.normalizedScore,
        traits: scores.traits,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update application score if job is linked
    if (assessment.job_id) {
      await supabase
        .from('applications')
        .update({ score: scores.normalizedScore })
        .eq('job_id', assessment.job_id)
        .eq('candidate_id', assessment.candidate_id);
    }

    return {
      success: true,
      message: 'Assessment submitted successfully',
      score: scores.normalizedScore,
    };
  }

  private calculateScores(answers: { questionId: string; value: number }[]) {
    const traitScores: Record<string, number[]> = {};

    for (const answer of answers) {
      const question = BEHAVIORAL_QUESTIONS_V1.find(
        (q) => q.id === answer.questionId,
      );
      if (!question) continue;

      const score = question.reverse ? 6 - answer.value : answer.value;

      if (!traitScores[question.trait]) {
        traitScores[question.trait] = [];
      }
      traitScores[question.trait].push(score);
    }

    // Calculate average for each trait
    const traits: Record<string, number> = {};
    let totalScore = 0;
    let traitCount = 0;

    for (const [trait, scores] of Object.entries(traitScores)) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      traits[trait] = Math.round(avg * 20); // Convert 1-5 scale to 0-100
      totalScore += traits[trait];
      traitCount++;
    }

    const normalizedScore =
      traitCount > 0 ? Math.round(totalScore / traitCount) : 0;

    // Structure Big Five + DISC
    const structuredTraits = {
      bigFive: {
        openness: traits.openness || 50,
        conscientiousness: traits.conscientiousness || 50,
        extraversion: traits.extraversion || 50,
        agreeableness: traits.agreeableness || 50,
        neuroticism: traits.neuroticism || 50,
      },
      disc: {
        dominance: traits.dominance || 50,
        influence: traits.influence || 50,
        steadiness: traits.steadiness || 50,
        conscientiousness: traits.compliance || 50,
      },
    };

    return {
      rawScore: totalScore,
      normalizedScore,
      traits: structuredTraits,
    };
  }

  private mapToResponse(assessment: any) {
    return {
      id: assessment.id,
      candidateId: assessment.candidate_id,
      jobId: assessment.job_id,
      assessmentKind: assessment.assessment_kind,
      rawScore: assessment.raw_score,
      normalizedScore: assessment.normalized_score,
      traits: assessment.traits,
      createdAt: assessment.created_at,
    };
  }
}
