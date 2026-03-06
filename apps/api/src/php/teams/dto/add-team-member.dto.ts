// apps/api/src/php/teams/dto/add-team-member.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsIn } from 'class-validator';

export class AddTeamMemberDto {
  @ApiProperty({ 
    description: 'ID do funcionário (employee_id) do organograma', 
    example: '550e8400-e29b-41d4-a716-446655440002' 
  })
  @IsUUID('4', { message: 'user_id (employee_id) deve ser um UUID válido' })
  user_id: string; // Note: This is actually employee_id, kept as user_id for DB compatibility

  @ApiPropertyOptional({ 
    description: 'Papel no time', 
    example: 'member',
    enum: ['member', 'lead', 'coordinator']
  })
  @IsOptional()
  @IsIn(['member', 'lead', 'coordinator'], { message: 'role_in_team deve ser member, lead ou coordinator' })
  role_in_team?: 'member' | 'lead' | 'coordinator';
}
