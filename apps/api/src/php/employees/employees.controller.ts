// apps/api/src/php/employees/employees.controller.ts
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
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiHeader, ApiConsumes } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto';
import { OrgGuard } from '../../auth/guards/org.guard';
import { OrgId } from '../../auth/decorators/org.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('PHP Module - Employees')
@ApiBearerAuth()
@ApiHeader({ name: 'x-org-id', required: true, description: 'Organization ID' })
@UseGuards(OrgGuard)
@Controller('php/employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo funcionário' })
  @ApiResponse({ status: 201, description: 'Funcionário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou CPF duplicado' })
  @ApiResponse({ status: 404, description: 'Organização não encontrada' })
  create(
    @OrgId() orgId: string,
    @CurrentUser('sub') userId: string,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    return this.employeesService.create(userId, createEmployeeDto);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importar funcionários via CSV' })
  @ApiResponse({ status: 200, description: 'Importação concluída' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou erros de validação' })
  async importCSV(
    @OrgId() orgId: string,
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: any,
    @Body('organization_id') organizationId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo CSV é obrigatório');
    }
    if (!organizationId) {
      throw new BadRequestException('organization_id é obrigatório');
    }
    return this.employeesService.importFromCSV(userId, organizationId, file.buffer);
  }

  @Get()
  @ApiOperation({ summary: 'Listar funcionários com filtros' })
  @ApiQuery({ name: 'organization_id', required: false, description: 'Filtrar por organização' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'terminated'] })
  @ApiQuery({ name: 'department', required: false, description: 'Filtrar por departamento' })
  @ApiQuery({ name: 'manager_id', required: false, description: 'Filtrar por gestor' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nome ou CPF' })
  @ApiResponse({ status: 200, description: 'Lista de funcionários' })
  findAll(
    @OrgId() orgId: string,
    @CurrentUser('sub') userId: string,
    @Query('organization_id') organizationId?: string,
    @Query('status') status?: 'active' | 'inactive' | 'terminated',
    @Query('department') department?: string,
    @Query('manager_id') managerId?: string,
    @Query('search') search?: string,
  ) {
    return this.employeesService.findAll(userId, {
      organization_id: organizationId,
      status,
      department,
      manager_id: managerId,
      search,
    });
  }

  @Get('hierarchy/:organizationId')
  @ApiOperation({ summary: 'Obter hierarquia/organograma da organização' })
  @ApiResponse({ status: 200, description: 'Árvore hierárquica de funcionários' })
  getHierarchy(
    @OrgId() orgId: string,
    @CurrentUser('sub') userId: string,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.employeesService.getHierarchy(userId, organizationId);
  }

  @Get('hierarchy-levels/:organizationId')
  @ApiOperation({ summary: 'Listar níveis hierárquicos (N1-N11)' })
  @ApiResponse({ status: 200, description: 'Lista de níveis hierárquicos' })
  getHierarchyLevels(
    @OrgId() orgId: string,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.employeesService.getHierarchyLevels(organizationId);
  }

  @Get('valid-managers/:organizationId')
  @ApiOperation({ summary: 'Listar gestores válidos para um nível hierárquico' })
  @ApiQuery({ name: 'level', required: true, example: 'N5', description: 'Nível hierárquico (N1-N11)' })
  @ApiResponse({ status: 200, description: 'Lista de gestores válidos' })
  getValidManagers(
    @OrgId() orgId: string,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query('level') level: string,
  ) {
    if (!level) {
      throw new BadRequestException('Query param "level" é obrigatório');
    }
    return this.employeesService.getValidManagers(level, organizationId);
  }

  @Get('hierarchy-config/:organizationId')
  @ApiOperation({ summary: 'Obter configuração completa de hierarquia (JSONB)' })
  @ApiResponse({ status: 200, description: 'Configuração de hierarquia completa' })
  getHierarchyConfig(
    @OrgId() orgId: string,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.employeesService.getHierarchyConfig(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar funcionário por ID' })
  @ApiResponse({ status: 200, description: 'Dados do funcionário' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  findOne(
    @OrgId() orgId: string,
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.employeesService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar funcionário' })
  @ApiResponse({ status: 200, description: 'Funcionário atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  update(
    @OrgId() orgId: string,
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(userId, id, updateEmployeeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar funcionário' })
  @ApiResponse({ status: 200, description: 'Funcionário deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  @ApiResponse({ status: 400, description: 'Não é possível deletar (tem subordinados ativos)' })
  remove(
    @OrgId() orgId: string,
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.employeesService.remove(userId, id);
  }
}
