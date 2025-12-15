import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum AssessmentKind {
  BEHAVIORAL_V1 = 'behavioral_v1',
}

export class CreateAssessmentDto {
  @ApiProperty({ description: 'Candidate ID' })
  @IsUUID()
  candidateId: string;

  @ApiPropertyOptional({
    description: 'Job ID (optional, links assessment to application)',
  })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiPropertyOptional({
    enum: AssessmentKind,
    default: AssessmentKind.BEHAVIORAL_V1,
  })
  @IsOptional()
  @IsEnum(AssessmentKind)
  assessmentKind?: AssessmentKind;
}

export class AssessmentAnswerDto {
  @ApiProperty({ description: 'Question ID' })
  @IsString()
  questionId: string;

  @ApiProperty({ description: 'Answer value (1-5 scale)' })
  @IsNumber()
  value: number;
}

export class SubmitAssessmentDto {
  @ApiProperty({ type: [AssessmentAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssessmentAnswerDto)
  answers: AssessmentAnswerDto[];
}
