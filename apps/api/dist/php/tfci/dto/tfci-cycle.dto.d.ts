export declare class CreateTfciCycleDto {
    name: string;
    start_date: string;
    end_date: string;
    status?: 'draft' | 'active' | 'completed' | 'cancelled';
}
export declare class UpdateTfciCycleDto {
    name?: string;
    start_date?: string;
    end_date?: string;
    status?: 'draft' | 'active' | 'completed' | 'cancelled';
}
export declare class CreateTfciAssessmentDto {
    cycle_id: string;
    target_user_id: string;
    team_id?: string;
    collaboration_score: number;
    communication_score: number;
    adaptability_score: number;
    accountability_score: number;
    leadership_score: number;
    comments?: string;
    is_anonymous?: boolean;
}
