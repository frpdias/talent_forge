import { SupabaseService } from '../supabase/supabase.service';
import { CreatePiAssessmentDto, SubmitPiDescriptorDto, SubmitPiSituationalDto, PiAxis } from './dto';
type AxisScores = Record<PiAxis, number>;
export declare class PiAssessmentsService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    create(dto: CreatePiAssessmentDto, userId: string): Promise<any>;
    listDescriptors(accessToken: string): Promise<any[]>;
    listSituationalQuestions(accessToken: string): Promise<any[]>;
    private assertOwnership;
    submitDescriptor(assessmentId: string, dto: SubmitPiDescriptorDto, userId: string, accessToken: string): Promise<any>;
    submitSituational(assessmentId: string, dto: SubmitPiSituationalDto, userId: string, accessToken: string): Promise<any>;
    private baseScores;
    finalize(assessmentId: string, userId: string, accessToken: string): Promise<{
        scores_natural: AxisScores;
        scores_adapted: AxisScores;
        gaps: Record<string, number>;
    }>;
    latestByUser(userId: string, accessToken: string): Promise<any>;
}
export {};
