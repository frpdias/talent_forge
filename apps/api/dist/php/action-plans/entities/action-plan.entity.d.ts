export interface ActionPlan {
    id: string;
    org_id: string;
    team_id?: string;
    user_id?: string;
    triggered_by: 'tfci' | 'nr1' | 'copc' | 'manual' | 'ai';
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description?: string;
    root_cause?: string;
    recommended_actions?: Record<string, any>[];
    assigned_to?: string;
    status: 'open' | 'in_progress' | 'completed' | 'cancelled';
    priority: number;
    due_date?: string;
    completed_at?: string;
    effectiveness_score?: number;
    follow_up_required: boolean;
    created_by?: string;
    created_at: string;
    updated_at: string;
    items?: ActionItem[];
    assigned_user?: {
        id: string;
        email: string;
        full_name?: string;
    };
    team?: {
        id: string;
        name: string;
    };
}
export interface ActionItem {
    id: string;
    action_plan_id: string;
    description: string;
    assigned_to?: string;
    status: 'open' | 'in_progress' | 'completed' | 'cancelled';
    due_date?: string;
    completed_at?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    assigned_user?: {
        id: string;
        email: string;
        full_name?: string;
    };
}
export interface ActionPlanStats {
    total: number;
    by_status: {
        open: number;
        in_progress: number;
        completed: number;
        cancelled: number;
    };
    by_risk_level: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
    by_source: {
        tfci: number;
        nr1: number;
        copc: number;
        manual: number;
        ai: number;
    };
    overdue_count: number;
    avg_effectiveness_score?: number;
}
