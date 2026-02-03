import { IsUUID, IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class CreateNr1AssessmentDto {
  @IsUUID()
  org_id: string;

  @IsUUID()
  @IsOptional()
  team_id?: string;

  @IsUUID()
  @IsOptional()
  user_id?: string;

  @IsInt()
  @Min(1)
  @Max(3)
  workload_pace_risk: number;

  @IsInt()
  @Min(1)
  @Max(3)
  goal_pressure_risk: number;

  @IsInt()
  @Min(1)
  @Max(3)
  role_clarity_risk: number;

  @IsInt()
  @Min(1)
  @Max(3)
  autonomy_control_risk: number;

  @IsInt()
  @Min(1)
  @Max(3)
  leadership_support_risk: number;

  @IsInt()
  @Min(1)
  @Max(3)
  peer_collaboration_risk: number;

  @IsInt()
  @Min(1)
  @Max(3)
  recognition_justice_risk: number;

  @IsInt()
  @Min(1)
  @Max(3)
  communication_change_risk: number;

  @IsInt()
  @Min(1)
  @Max(3)
  conflict_harassment_risk: number;

  @IsInt()
  @Min(1)
  @Max(3)
  recovery_boundaries_risk: number;

  @IsString()
  @IsOptional()
  action_plan?: string;
}

export class UpdateNr1AssessmentDto {
  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  workload_pace_risk?: number;

  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  goal_pressure_risk?: number;

  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  role_clarity_risk?: number;

  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  autonomy_control_risk?: number;

  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  leadership_support_risk?: number;

  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  peer_collaboration_risk?: number;

  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  recognition_justice_risk?: number;

  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  communication_change_risk?: number;

  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  conflict_harassment_risk?: number;

  @IsInt()
  @Min(1)
  @Max(3)
  @IsOptional()
  recovery_boundaries_risk?: number;

  @IsString()
  @IsOptional()
  action_plan?: string;
}
