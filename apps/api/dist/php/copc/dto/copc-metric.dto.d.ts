export declare class CreateCopcMetricDto {
    org_id: string;
    team_id?: string;
    user_id?: string;
    quality_score?: number;
    rework_rate?: number;
    process_adherence_rate?: number;
    average_handle_time?: number;
    first_call_resolution_rate?: number;
    delivery_consistency?: number;
    customer_satisfaction_score?: number;
    nps_score?: number;
    absenteeism_rate?: number;
    engagement_score?: number;
    operational_stress_level?: number;
    notes?: string;
    source?: string;
}
export declare class UpdateCopcMetricDto {
    quality_score?: number;
    rework_rate?: number;
    process_adherence_rate?: number;
    average_handle_time?: number;
    first_call_resolution_rate?: number;
    delivery_consistency?: number;
    customer_satisfaction_score?: number;
    nps_score?: number;
    absenteeism_rate?: number;
    engagement_score?: number;
    operational_stress_level?: number;
    notes?: string;
}
export declare class CreateCopcCatalogDto {
    org_id: string;
    category: string;
    metric_name: string;
    metric_code: string;
    weight: number;
    target_value?: number;
    unit?: string;
}
