import { IsString, IsUUID, IsOptional, IsEnum, IsInt, Min, Max, IsDateString, IsBoolean, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export type TriggeredBy = 'tfci' | 'nr1' | 'copc' | 'manual' | 'ai';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ActionPlanStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export class CreateActionPlanDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsUUID()
  org_id: string;

  @ApiPropertyOptional({ description: 'Team ID (optional)' })
  @IsOptional()
  @IsUUID()
  team_id?: string;

  @ApiPropertyOptional({ description: 'User ID (optional - for individual plans)' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiProperty({ description: 'Source that triggered the action plan', enum: ['tfci', 'nr1', 'copc', 'manual', 'ai'] })
  @IsEnum(['tfci', 'nr1', 'copc', 'manual', 'ai'])
  triggered_by: TriggeredBy;

  @ApiPropertyOptional({ description: 'Risk level', enum: ['low', 'medium', 'high', 'critical'], default: 'medium' })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  risk_level?: RiskLevel;

  @ApiProperty({ description: 'Action plan title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Root cause analysis' })
  @IsOptional()
  @IsString()
  root_cause?: string;

  @ApiPropertyOptional({ description: 'AI-recommended actions (JSON array)' })
  @IsOptional()
  recommended_actions?: Record<string, any>[];

  @ApiPropertyOptional({ description: 'User ID to assign the plan to' })
  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @ApiPropertyOptional({ description: 'Priority (1-5, 1 = highest)', minimum: 1, maximum: 5, default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @ApiPropertyOptional({ description: 'Due date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  due_date?: string;
}

export class UpdateActionPlanDto extends PartialType(CreateActionPlanDto) {
  @ApiPropertyOptional({ description: 'Status', enum: ['open', 'in_progress', 'completed', 'cancelled'] })
  @IsOptional()
  @IsEnum(['open', 'in_progress', 'completed', 'cancelled'])
  status?: ActionPlanStatus;

  @ApiPropertyOptional({ description: 'Effectiveness score after completion (1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  effectiveness_score?: number;

  @ApiPropertyOptional({ description: 'Whether follow-up is required' })
  @IsOptional()
  @IsBoolean()
  follow_up_required?: boolean;
}

export class CreateActionItemDto {
  @ApiProperty({ description: 'Action plan ID' })
  @IsUUID()
  action_plan_id: string;

  @ApiProperty({ description: 'Item description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'User ID to assign the item to' })
  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @ApiPropertyOptional({ description: 'Due date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateActionItemDto extends PartialType(CreateActionItemDto) {
  @ApiPropertyOptional({ description: 'Status', enum: ['open', 'in_progress', 'completed', 'cancelled'] })
  @IsOptional()
  @IsEnum(['open', 'in_progress', 'completed', 'cancelled'])
  status?: ActionPlanStatus;
}

export class ActionPlanQueryDto {
  @ApiPropertyOptional({ description: 'Filter by organization ID' })
  @IsOptional()
  @IsUUID()
  org_id?: string;

  @ApiPropertyOptional({ description: 'Filter by team ID' })
  @IsOptional()
  @IsUUID()
  team_id?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsEnum(['open', 'in_progress', 'completed', 'cancelled'])
  status?: ActionPlanStatus;

  @ApiPropertyOptional({ description: 'Filter by triggered source' })
  @IsOptional()
  @IsEnum(['tfci', 'nr1', 'copc', 'manual', 'ai'])
  triggered_by?: TriggeredBy;

  @ApiPropertyOptional({ description: 'Filter by risk level' })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  risk_level?: RiskLevel;

  @ApiPropertyOptional({ description: 'Filter by assigned user' })
  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @ApiPropertyOptional({ description: 'Limit results', default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset for pagination', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}
