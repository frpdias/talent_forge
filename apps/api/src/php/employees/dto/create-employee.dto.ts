// apps/api/src/php/employees/dto/create-employee.dto.ts
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsDateString, IsObject, IsEmail, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ description: 'ID da organização (empresa cliente)', example: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  organization_id: string;

  @ApiProperty({ description: 'Nome completo do funcionário', example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ description: 'CPF do funcionário (apenas números)', example: '12345678900' })
  @IsString()
  @IsNotEmpty()
  cpf: string;

  @ApiPropertyOptional({ description: 'Email do funcionário', example: 'joao.silva@empresa.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone do funcionário', example: '11999999999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Data de nascimento (ISO 8601)', example: '1990-05-15' })
  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @ApiProperty({ description: 'Data de admissão (ISO 8601)', example: '2024-01-15' })
  @IsDateString()
  @IsNotEmpty()
  hire_date: string;

  @ApiPropertyOptional({ description: 'ID do gestor imediato', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  manager_id?: string;

  @ApiPropertyOptional({ description: 'Cargo/posição', example: 'Vendedor' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: 'Departamento', example: 'Comercial' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Status do funcionário', example: 'active', enum: ['active', 'inactive', 'terminated'] })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'terminated'])
  status?: string;

  @ApiPropertyOptional({ description: 'ID do usuário (se tiver login)', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais (endereço, contatos, etc)', example: { phone: '11999999999' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
