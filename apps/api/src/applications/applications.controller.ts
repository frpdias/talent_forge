import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationStageDto } from './dto';
import { OrgGuard } from '../auth/guards/org.guard';
import { OrgId } from '../auth/decorators/org.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';

@ApiTags('Applications')
@ApiBearerAuth()
@ApiHeader({ name: 'x-org-id', required: true, description: 'Organization ID' })
@UseGuards(OrgGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new application (add candidate to job pipeline)',
  })
  create(
    @Body() dto: CreateApplicationDto,
    @OrgId() orgId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.create(dto, orgId, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List all applications' })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['applied', 'in_process', 'hired', 'rejected'],
  })
  @ApiQuery({ name: 'stageId', required: false })
  findAll(
    @OrgId() orgId: string,
    @Query('jobId') jobId?: string,
    @Query('status') status?: string,
    @Query('stageId') stageId?: string,
  ) {
    return this.applicationsService.findAll(orgId, { jobId, status, stageId });
  }

  @Get('kanban/:jobId')
  @ApiOperation({ summary: 'Get Kanban board view for a job' })
  getKanbanBoard(@Param('jobId') jobId: string, @OrgId() orgId: string) {
    return this.applicationsService.getKanbanBoard(jobId, orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application by ID with events' })
  findOne(@Param('id') id: string, @OrgId() orgId: string) {
    return this.applicationsService.findOne(id, orgId);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Move application to a different stage' })
  updateStage(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStageDto,
    @OrgId() orgId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.applicationsService.updateStage(id, dto, orgId, user.sub);
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Get application events history' })
  getEvents(@Param('id') id: string, @OrgId() orgId: string) {
    return this.applicationsService.getEvents(id, orgId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove application' })
  delete(@Param('id') id: string, @OrgId() orgId: string) {
    return this.applicationsService.delete(id, orgId);
  }
}
