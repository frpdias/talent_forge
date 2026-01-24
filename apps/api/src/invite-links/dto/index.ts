import {
  IsArray,
  IsDateString,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInviteLinkDto {
  @ApiPropertyOptional({ description: 'Invite link expiration date (ISO)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Maximum number of uses' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;
}

export class CreateCandidateFromInviteDto {
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

export class CreateCandidateAccountFromInviteDto {
  @ApiProperty({ description: 'Candidate full name' })
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Account password' })
  @IsString()
  @MinLength(6)
  password: string;
}
