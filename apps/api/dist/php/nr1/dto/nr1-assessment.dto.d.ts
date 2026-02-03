export declare class CreateNr1AssessmentDto {
    org_id: string;
    team_id?: string;
    user_id?: string;
    workload_pace_risk: number;
    goal_pressure_risk: number;
    role_clarity_risk: number;
    autonomy_control_risk: number;
    leadership_support_risk: number;
    peer_collaboration_risk: number;
    recognition_justice_risk: number;
    communication_change_risk: number;
    conflict_harassment_risk: number;
    recovery_boundaries_risk: number;
    action_plan?: string;
}
export declare class UpdateNr1AssessmentDto {
    workload_pace_risk?: number;
    goal_pressure_risk?: number;
    role_clarity_risk?: number;
    autonomy_control_risk?: number;
    leadership_support_risk?: number;
    peer_collaboration_risk?: number;
    recognition_justice_risk?: number;
    communication_change_risk?: number;
    conflict_harassment_risk?: number;
    recovery_boundaries_risk?: number;
    action_plan?: string;
}
