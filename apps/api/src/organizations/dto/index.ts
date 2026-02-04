import { IsString, IsEnum, IsOptional, IsEmail, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OrgType {
  HEADHUNTER = 'headhunter',
  COMPANY = 'company',
}

export enum OrgSize {
  MICRO = 'micro',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ENTERPRISE = 'enterprise',
}

export class CreateOrganizationDto {
  @ApiProperty({ description: 'Organization name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: OrgType, description: 'Organization type' })
  @IsEnum(OrgType)
  orgType: OrgType;

  @ApiPropertyOptional({ description: 'CNPJ da empresa' })
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiPropertyOptional({ description: 'Setor/indústria' })
  @IsOptional()
  @IsString()
  industry?: string;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ description: 'Organization name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'CNPJ da empresa' })
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiPropertyOptional({ description: 'Setor/indústria' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ enum: OrgSize, description: 'Porte da empresa' })
  @IsOptional()
  @IsEnum(OrgSize)
  size?: OrgSize;

  @ApiPropertyOptional({ description: 'Email de contato' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone de contato' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Website' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Endereço' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Cidade' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Estado (UF)' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'CEP' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Descrição da empresa' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'URL do logo' })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}
