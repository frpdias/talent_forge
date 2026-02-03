export type TriggeredBy = 'tfci' | 'nr1' | 'copc' | 'manual' | 'ai';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ActionPlanStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export declare class CreateActionPlanDto {
    org_id: string;
    team_id?: string;
    user_id?: string;
    triggered_by: TriggeredBy;
    risk_level?: RiskLevel;
    title: string;
    description?: string;
    root_cause?: string;
    recommended_actions?: Record<string, any>[];
    assigned_to?: string;
    priority?: number;
    due_date?: string;
}
declare const UpdateActionPlanDto_base: import("@nestjs/common").Type<Partial<CreateActionPlanDto>>;
export declare class UpdateActionPlanDto extends UpdateActionPlanDto_base {
    status?: ActionPlanStatus;
    effectiveness_score?: number;
    follow_up_required?: boolean;
}
export declare class CreateActionItemDto {
    action_plan_id: string;
    description: string;
    assigned_to?: string;
    due_date?: string;
    notes?: string;
}
declare const UpdateActionItemDto_base: import("@nestjs/common").Type<Partial<CreateActionItemDto>>;
export declare class UpdateActionItemDto extends UpdateActionItemDto_base {
    status?: ActionPlanStatus;
}
export declare class ActionPlanQueryDto {
    org_id?: string;
    team_id?: string;
    status?: ActionPlanStatus;
    triggered_by?: TriggeredBy;
    risk_level?: RiskLevel;
    assigned_to?: string;
    limit?: number;
    offset?: number;
}
export {};
