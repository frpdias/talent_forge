import { IsString, IsDateString, IsEnum, IsOptional, IsUUID, IsInt, Min, Max, IsBoolean } from 'class-validator';

export class CreateTfciCycleDto {
  @IsString()
  name: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'completed', 'cancelled'])
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
}

export class UpdateTfciCycleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'completed', 'cancelled'])
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
}

export class CreateTfciAssessmentDto {
  @IsUUID()
  cycle_id: string;

  @IsUUID()
  target_user_id: string;

  @IsOptional()
  @IsUUID()
  team_id?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  collaboration_score: number;

  @IsInt()
  @Min(1)
  @Max(5)
  communication_score: number;

  @IsInt()
  @Min(1)
  @Max(5)
  adaptability_score: number;

  @IsInt()
  @Min(1)
  @Max(5)
  accountability_score: number;

  @IsInt()
  @Min(1)
  @Max(5)
  leadership_score: number;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsBoolean()
  is_anonymous?: boolean;
}
