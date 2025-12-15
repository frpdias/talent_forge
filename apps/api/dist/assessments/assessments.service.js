"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
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
let AssessmentsService = class AssessmentsService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async create(dto, orgId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data: candidate, error: candError } = await supabase
            .from('candidates')
            .select('id')
            .eq('id', dto.candidateId)
            .eq('owner_org_id', orgId)
            .single();
        if (candError || !candidate) {
            throw new common_1.NotFoundException('Candidate not found');
        }
        if (dto.jobId) {
            const { data: job, error: jobError } = await supabase
                .from('jobs')
                .select('id')
                .eq('id', dto.jobId)
                .eq('org_id', orgId)
                .single();
            if (jobError || !job) {
                throw new common_1.NotFoundException('Job not found');
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
    async findOne(id, orgId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('assessments')
            .select(`
        *,
        candidates!inner (id, full_name, owner_org_id)
      `)
            .eq('id', id)
            .eq('candidates.owner_org_id', orgId)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Assessment not found');
        }
        return this.mapToResponse(data);
    }
    async findByCandidateId(candidateId, orgId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('assessments')
            .select(`
        *,
        candidates!inner (id, owner_org_id)
      `)
            .eq('candidate_id', candidateId)
            .eq('candidates.owner_org_id', orgId)
            .order('created_at', { ascending: false });
        if (error) {
            throw error;
        }
        return data.map((a) => this.mapToResponse(a));
    }
    async getAssessmentQuestions(id) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('assessments')
            .select(`
        id,
        assessment_kind,
        raw_score,
        candidates!inner (full_name)
      `)
            .eq('id', id)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Assessment not found');
        }
        const candidateName = Array.isArray(data.candidates)
            ? data.candidates?.[0]?.full_name
            : data.candidates?.full_name;
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
    async submitAssessment(id, dto) {
        const supabase = this.supabaseService.getAdminClient();
        const { data: assessment, error: assError } = await supabase
            .from('assessments')
            .select('*')
            .eq('id', id)
            .single();
        if (assError || !assessment) {
            throw new common_1.NotFoundException('Assessment not found');
        }
        if (assessment.raw_score !== null) {
            throw new Error('Assessment already completed');
        }
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
    calculateScores(answers) {
        const traitScores = {};
        for (const answer of answers) {
            const question = BEHAVIORAL_QUESTIONS_V1.find((q) => q.id === answer.questionId);
            if (!question)
                continue;
            const score = question.reverse ? 6 - answer.value : answer.value;
            if (!traitScores[question.trait]) {
                traitScores[question.trait] = [];
            }
            traitScores[question.trait].push(score);
        }
        const traits = {};
        let totalScore = 0;
        let traitCount = 0;
        for (const [trait, scores] of Object.entries(traitScores)) {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            traits[trait] = Math.round(avg * 20);
            totalScore += traits[trait];
            traitCount++;
        }
        const normalizedScore = traitCount > 0 ? Math.round(totalScore / traitCount) : 0;
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
    mapToResponse(assessment) {
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
};
exports.AssessmentsService = AssessmentsService;
exports.AssessmentsService = AssessmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AssessmentsService);
//# sourceMappingURL=assessments.service.js.map