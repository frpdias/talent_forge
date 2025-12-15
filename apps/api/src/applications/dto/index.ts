import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ApplicationStatus {
  APPLIED = 'applied',
  IN_PROCESS = 'in_process',
  HIRED = 'hired',
  REJECTED = 'rejected',
}

export class CreateApplicationDto {
  @ApiProperty({ description: 'Job ID' })
  @IsUUID()
  jobId: string;

  @ApiProperty({ description: 'Candidate ID' })
  @IsUUID()
  candidateId: string;
}

export class UpdateApplicationStageDto {
  @ApiProperty({ description: 'Target stage ID' })
  @IsUUID()
  toStageId: string;

  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Note about the stage change' })
  @IsOptional()
  @IsString()
  note?: string;
}
