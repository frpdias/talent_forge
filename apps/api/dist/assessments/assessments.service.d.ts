import { SupabaseService } from '../supabase/supabase.service';
import { CreateAssessmentDto, SubmitAssessmentDto } from './dto';
export declare class AssessmentsService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    create(dto: CreateAssessmentDto, orgId: string): Promise<{
        link: string;
        questions: {
            id: string;
            text: string;
            options: {
                value: number;
                label: string;
            }[];
        }[];
        id: any;
        candidateId: any;
        jobId: any;
        assessmentKind: any;
        rawScore: any;
        normalizedScore: any;
        traits: any;
        createdAt: any;
    }>;
    findOne(id: string, orgId: string): Promise<{
        id: any;
        candidateId: any;
        jobId: any;
        assessmentKind: any;
        rawScore: any;
        normalizedScore: any;
        traits: any;
        createdAt: any;
    }>;
    findByCandidateId(candidateId: string, orgId: string): Promise<{
        id: any;
        candidateId: any;
        jobId: any;
        assessmentKind: any;
        rawScore: any;
        normalizedScore: any;
        traits: any;
        createdAt: any;
    }[]>;
    getAssessmentQuestions(id: string): Promise<{
        id: any;
        completed: boolean;
        message: string;
        candidateName: any;
        kind?: undefined;
        questions?: undefined;
    } | {
        id: any;
        kind: any;
        candidateName: any;
        questions: {
            id: string;
            text: string;
            options: {
                value: number;
                label: string;
            }[];
        }[];
        completed?: undefined;
        message?: undefined;
    }>;
    submitAssessment(id: string, dto: SubmitAssessmentDto): Promise<{
        success: boolean;
        message: string;
        score: number;
    }>;
    private calculateScores;
    private mapToResponse;
}
