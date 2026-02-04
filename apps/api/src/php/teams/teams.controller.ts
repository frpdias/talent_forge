// apps/api/src/php/teams/teams.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiHeader, ApiParam } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto, AddTeamMemberDto } from './dto';
import { OrgGuard } from '../../auth/guards/org.guard';
import { OrgId } from '../../auth/decorators/org.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('PHP Module - Teams')
@ApiBearerAuth()
@ApiHeader({ name: 'x-org-id', required: true, description: 'Organization ID' })
@UseGuards(OrgGuard)
@Controller('php/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo time' })
  @ApiResponse({ status: 201, description: 'Time criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Nome duplicado na organização' })
  create(
    @OrgId() orgId: string,
    @CurrentUser('sub') userId: string,
    @Body() createTeamDto: CreateTeamDto,
  ) {
    return this.teamsService.create(userId, createTeamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar times da organização' })
  @ApiResponse({ status: 200, description: 'Lista de times' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nome' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (default: 20)' })
  findAll(
    @OrgId() orgId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.teamsService.findAll(orgId, {
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar time por ID com membros' })
  @ApiResponse({ status: 200, description: 'Detalhes do time' })
  @ApiResponse({ status: 404, description: 'Time não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do time' })
  findOne(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.teamsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar time' })
  @ApiResponse({ status: 200, description: 'Time atualizado' })
  @ApiResponse({ status: 404, description: 'Time não encontrado' })
  @ApiResponse({ status: 409, description: 'Nome duplicado na organização' })
  @ApiParam({ name: 'id', description: 'ID do time' })
  update(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.teamsService.update(orgId, id, updateTeamDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover time' })
  @ApiResponse({ status: 200, description: 'Time removido' })
  @ApiResponse({ status: 404, description: 'Time não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do time' })
  remove(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.teamsService.remove(orgId, id);
  }

  // ===== TEAM MEMBERS =====

  @Post(':id/members')
  @ApiOperation({ summary: 'Adicionar membro ao time' })
  @ApiResponse({ status: 201, description: 'Membro adicionado' })
  @ApiResponse({ status: 404, description: 'Time não encontrado' })
  @ApiResponse({ status: 409, description: 'Usuário já é membro do time' })
  @ApiParam({ name: 'id', description: 'ID do time' })
  addMember(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addMemberDto: AddTeamMemberDto,
  ) {
    return this.teamsService.addMember(orgId, id, addMemberDto);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remover membro do time' })
  @ApiResponse({ status: 200, description: 'Membro removido' })
  @ApiResponse({ status: 404, description: 'Time ou membro não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do time' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  removeMember(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.teamsService.removeMember(orgId, id, userId);
  }

  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: 'Atualizar papel do membro no time' })
  @ApiResponse({ status: 200, description: 'Papel atualizado' })
  @ApiResponse({ status: 404, description: 'Time ou membro não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do time' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiQuery({ name: 'role', required: true, enum: ['member', 'lead', 'coordinator'] })
  updateMemberRole(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('role') role: 'member' | 'lead' | 'coordinator',
  ) {
    return this.teamsService.updateMemberRole(orgId, id, userId, role);
  }

  @Get(':id/available-members')
  @ApiOperation({ summary: 'Listar membros disponíveis para adicionar ao time' })
  @ApiResponse({ status: 200, description: 'Lista de membros disponíveis' })
  @ApiResponse({ status: 404, description: 'Time não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do time' })
  getAvailableMembers(
    @OrgId() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.teamsService.getAvailableMembers(orgId, id);
  }
}
