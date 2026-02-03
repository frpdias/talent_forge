export interface TfciCycle {
    id: string;
    org_id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'active' | 'completed' | 'cancelled';
    participants_count: number;
    completion_rate: number;
    created_by: string;
    created_at: string;
    updated_at: string;
}
export interface TfciAssessment {
    id: string;
    org_id: string;
    team_id: string | null;
    evaluator_id: string | null;
    target_user_id: string;
    cycle_id: string;
    collaboration_score: number;
    communication_score: number;
    adaptability_score: number;
    accountability_score: number;
    leadership_score: number;
    overall_score: number;
    comments: string | null;
    is_anonymous: boolean;
    submitted_at: string;
    created_at: string;
}
export interface TfciDimensionScore {
    dimension: string;
    score: number;
    label: string;
}
export interface TfciHeatmapData {
    user_id: string;
    user_name: string;
    team_name: string | null;
    collaboration: number;
    communication: number;
    adaptability: number;
    accountability: number;
    leadership: number;
    overall: number;
    assessment_count: number;
}
