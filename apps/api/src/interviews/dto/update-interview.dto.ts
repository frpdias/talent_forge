import { IsIn, IsOptional, IsString, IsDateString, IsInt, Min } from 'class-validator';

export class UpdateInterviewDto {
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsInt()
  @Min(15)
  @IsOptional()
  durationMinutes?: number;

  @IsIn(['video', 'presencial', 'phone'])
  @IsOptional()
  type?: 'video' | 'presencial' | 'phone';

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  meetLink?: string;

  @IsIn(['scheduled', 'completed', 'cancelled'])
  @IsOptional()
  status?: 'scheduled' | 'completed' | 'cancelled';
}
