import { IsUUID, IsNumber, Min, Max, IsOptional, IsString, IsEnum } from 'class-validator';

export class CreateCopcMetricDto {
  @IsUUID()
  org_id: string;

  @IsUUID()
  @IsOptional()
  team_id?: string;

  @IsUUID()
  @IsOptional()
  user_id?: string;

  // Quality (35%)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  quality_score?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  rework_rate?: number;

  // Efficiency (20%)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  process_adherence_rate?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  average_handle_time?: number; // seconds

  // Effectiveness (20%)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  first_call_resolution_rate?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  delivery_consistency?: number;

  // CX (15%)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  customer_satisfaction_score?: number;

  @IsNumber()
  @Min(-100)
  @Max(100)
  @IsOptional()
  nps_score?: number;

  // People (10%)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  absenteeism_rate?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  engagement_score?: number;

  @IsNumber()
  @Min(1)
  @Max(3)
  @IsOptional()
  operational_stress_level?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(['manual', 'api', 'integration', 'calculated'])
  @IsOptional()
  source?: string;
}

export class UpdateCopcMetricDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  quality_score?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  rework_rate?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  process_adherence_rate?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  average_handle_time?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  first_call_resolution_rate?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  delivery_consistency?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  customer_satisfaction_score?: number;

  @IsNumber()
  @Min(-100)
  @Max(100)
  @IsOptional()
  nps_score?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  absenteeism_rate?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  engagement_score?: number;

  @IsNumber()
  @Min(1)
  @Max(3)
  @IsOptional()
  operational_stress_level?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateCopcCatalogDto {
  @IsUUID()
  org_id: string;

  @IsEnum(['quality', 'efficiency', 'effectiveness', 'cx', 'people'])
  category: string;

  @IsString()
  metric_name: string;

  @IsString()
  metric_code: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  weight: number;

  @IsNumber()
  @IsOptional()
  target_value?: number;

  @IsString()
  @IsOptional()
  unit?: string;
}
