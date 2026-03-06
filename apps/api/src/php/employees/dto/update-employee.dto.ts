// apps/api/src/php/employees/dto/update-employee.dto.ts
import { IsString, IsOptional, IsDateString, IsUUID, IsIn, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ description: 'Nome completo do funcionário', example: 'João Silva Santos' })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({ description: 'Data de nascimento (ISO 8601)', example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @ApiPropertyOptional({ description: 'Data de desligamento (ISO 8601)', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  termination_date?: string;

  @ApiPropertyOptional({ description: 'ID do gestor imediato', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  manager_id?: string;

  @ApiPropertyOptional({ description: 'Cargo/posição', example: 'Gerente de Vendas' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: 'Departamento', example: 'Comercial' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'ID do usuário (se tiver login)', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({ description: 'Status do funcionário', enum: ['active', 'inactive', 'terminated'] })
  @IsOptional()
  @IsIn(['active', 'inactive', 'terminated'])
  status?: 'active' | 'inactive' | 'terminated';

  @ApiPropertyOptional({ description: 'Metadados adicionais', example: { phone: '11999999999', email: 'joao@example.com' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
