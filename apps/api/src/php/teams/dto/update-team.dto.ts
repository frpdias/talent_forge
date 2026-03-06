// apps/api/src/php/teams/dto/update-team.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateTeamDto {
  @ApiPropertyOptional({ description: 'Nome do time', example: 'Equipe de Vendas B2B' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nome deve ter no mínimo 2 caracteres' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição do time', example: 'Equipe responsável por vendas B2B' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Descrição deve ter no máximo 500 caracteres' })
  description?: string;

  @ApiPropertyOptional({ description: 'ID do gestor do time', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsOptional()
  @IsUUID('4', { message: 'manager_id deve ser um UUID válido' })
  manager_id?: string | null;
}
