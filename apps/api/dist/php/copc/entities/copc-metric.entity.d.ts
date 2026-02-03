export interface CopcMetric {
    id: string;
    org_id: string;
    team_id?: string;
    user_id?: string;
    metric_date: string;
    quality_score: number;
    rework_rate: number;
    process_adherence_rate: number;
    average_handle_time: number;
    first_call_resolution_rate: number;
    delivery_consistency: number;
    customer_satisfaction_score: number;
    nps_score: number;
    absenteeism_rate: number;
    engagement_score: number;
    operational_stress_level: number;
    overall_performance_score: number;
    notes?: string;
    metric_source: 'manual' | 'automated' | 'integration';
    created_by: string;
    created_at: string;
    updated_at: string;
}
export interface CopcCatalogMetric {
    id: string;
    org_id?: string;
    category: 'quality' | 'efficiency' | 'effectiveness' | 'cx' | 'people';
    metric_name: string;
    metric_code: string;
    weight: number;
    target_value: number;
    measurement_unit: string;
    description?: string;
    created_at: string;
    updated_at: string;
}
