export interface Nr1Assessment {
  id: string;
  org_id: string;
  team_id?: string;
  user_id?: string;
  assessment_date: string;
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
  overall_risk_level: 'low' | 'medium' | 'high';
  action_plan?: string;
  action_plan_status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  assessed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}
