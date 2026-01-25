import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum NoteContext {
  PROFILE = 'profile',
  RESUME = 'resume',
  ASSESSMENTS = 'assessments',
  INTERVIEW = 'interview',
  GENERAL = 'general',
}

export class UpdateCandidateNoteDto {
  @ApiProperty({
    example: 'Candidato demonstrou excelente fit cultural durante a entrevista.',
    description: 'Updated note content',
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({
    example: 'interview',
    enum: NoteContext,
    description: 'Context where the note was created',
    required: false,
  })
  @IsEnum(NoteContext)
  @IsOptional()
  context?: NoteContext;
}
