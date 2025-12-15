import { SupabaseService } from '../supabase/supabase.service';
import { CreateColorAssessmentDto, SubmitColorResponseDto, ColorChoice } from './dto';
type Scores = Record<ColorChoice, number>;
export declare class ColorAssessmentsService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    create(dto: CreateColorAssessmentDto, userId: string): Promise<any>;
    listQuestions(accessToken: string): Promise<any[]>;
    submitResponse(assessmentId: string, dto: SubmitColorResponseDto, userId: string, accessToken: string): Promise<any>;
    finalize(assessmentId: string, userId: string, accessToken: string): Promise<{
        primary_color: ColorChoice;
        secondary_color: ColorChoice;
        scores: Scores;
    }>;
    latestByUser(userId: string, accessToken: string): Promise<any>;
}
export {};
