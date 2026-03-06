import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsEmail,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCandidateDto {
  @ApiProperty({ description: 'Candidate full name' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Current job title' })
  @IsOptional()
  @IsString()
  currentTitle?: string;

  @ApiPropertyOptional({ description: 'LinkedIn URL' })
  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @ApiPropertyOptional({ description: 'Candidate source channel' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Salary expectation' })
  @IsOptional()
  @IsNumber()
  salaryExpectation?: number;

  @ApiPropertyOptional({ description: 'Availability date' })
  @IsOptional()
  @IsDateString()
  availabilityDate?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateCandidateDto {
  @ApiPropertyOptional({ description: 'Candidate full name' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Current job title' })
  @IsOptional()
  @IsString()
  currentTitle?: string;

  @ApiPropertyOptional({ description: 'LinkedIn URL' })
  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @ApiPropertyOptional({ description: 'Candidate source channel' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Salary expectation' })
  @IsOptional()
  @IsNumber()
  salaryExpectation?: number;

  @ApiPropertyOptional({ description: 'Availability date' })
  @IsOptional()
  @IsDateString()
  availabilityDate?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export enum NoteContext {
  PROFILE = 'profile',
  RESUME = 'resume',
  ASSESSMENTS = 'assessments',
  INTERVIEW = 'interview',
  GENERAL = 'general',
}

export class CreateCandidateNoteDto {
  @ApiProperty({ description: 'Note content' })
  @IsString()
  note: string;

  @ApiPropertyOptional({
    description: 'Context where the note was created',
    enum: NoteContext,
    default: 'general',
  })
  @IsOptional()
  @IsString()
  context?: string;
}

export class UpdateCandidateNoteDto {
  @ApiPropertyOptional({ description: 'Note content' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Context where the note was updated',
    enum: NoteContext,
  })
  @IsOptional()
  @IsString()
  context?: string;
}
