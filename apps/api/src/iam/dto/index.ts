import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, IsIn, IsObject } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ description: 'Tenant name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Plan id' })
  @IsOptional()
  @IsString()
  planId?: string;
}

export class AddTenantUserDto {
  @ApiProperty({ description: 'User id' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ description: 'Role (owner/admin/member)' })
  @IsOptional()
  @IsString()
  role?: string;
}

export class UpdateTenantUserDto {
  @ApiPropertyOptional({ description: 'Role (owner/admin/member)' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Status (active/invited/suspended)' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Role scope' })
  @IsOptional()
  @IsString()
  scope?: string;
}

export class CreatePermissionDto {
  @ApiProperty({ description: 'Action' })
  @IsString()
  action: string;

  @ApiProperty({ description: 'Resource' })
  @IsString()
  resource: string;
}

export class CreatePolicyDto {
  @ApiPropertyOptional({ description: 'Effect (allow/deny)' })
  @IsOptional()
  @IsString()
  effect?: string;

  @ApiProperty({ description: 'Conditions (ABAC)', type: Object })
  @IsObject()
  conditions: Record<string, any>;
}

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Tenant id' })
  @IsUUID()
  tenantId: string;

  @ApiPropertyOptional({ description: 'Scopes' })
  @IsOptional()
  @IsArray()
  scopes?: string[];

  @ApiPropertyOptional({ description: 'Expires at (ISO)' })
  @IsOptional()
  @IsString()
  expiresAt?: string;
}
