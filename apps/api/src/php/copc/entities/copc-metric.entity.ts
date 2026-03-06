export interface CopcMetric {
  id: string;
  org_id: string;
  team_id?: string;
  user_id?: string;
  metric_date: string;

  // Quality (35%)
  quality_score: number;
  rework_rate: number;

  // Efficiency (20%)
  process_adherence_rate: number;
  average_handle_time: number;

  // Effectiveness (20%)
  first_call_resolution_rate: number;
  delivery_consistency: number;

  // CX (15%)
  customer_satisfaction_score: number;
  nps_score: number;

  // People (10%)
  absenteeism_rate: number;
  engagement_score: number;
  operational_stress_level: number;

  // Auto-calculated (GENERATED column)
  overall_performance_score: number;

  // Metadata
  notes?: string;
  metric_source: 'manual' | 'automated' | 'integration';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CopcCatalogMetric {
  id: string;
  org_id?: string; // null = global template
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
