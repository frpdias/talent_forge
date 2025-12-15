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
import { JobsService } from './jobs.service';
import {
  CreateJobDto,
  UpdateJobDto,
  CreatePipelineStageDto,
  UpdatePipelineStageDto,
} from './dto';
import { OrgGuard } from '../auth/guards/org.guard';
import { OrgId } from '../auth/decorators/org.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';

@ApiTags('Jobs')
@ApiBearerAuth()
@ApiHeader({ name: 'x-org-id', required: true, description: 'Organization ID' })
@UseGuards(OrgGuard)
@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job posting' })
  create(
    @Body() dto: CreateJobDto,
    @OrgId() orgId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.jobsService.create(dto, orgId, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List all jobs for the organization' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['open', 'on_hold', 'closed'],
  })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @OrgId() orgId: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.jobsService.findAll(orgId, { status, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID with pipeline stages' })
  findOne(@Param('id') id: string, @OrgId() orgId: string) {
    return this.jobsService.findOne(id, orgId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update job posting' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
    @OrgId() orgId: string,
  ) {
    return this.jobsService.update(id, dto, orgId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete job posting' })
  delete(@Param('id') id: string, @OrgId() orgId: string) {
    return this.jobsService.delete(id, orgId);
  }

  // Pipeline Stages
  @Post(':id/stages')
  @ApiOperation({ summary: 'Add a pipeline stage to job' })
  createStage(
    @Param('id') jobId: string,
    @Body() dto: CreatePipelineStageDto,
    @OrgId() orgId: string,
  ) {
    return this.jobsService.createStage(jobId, dto, orgId);
  }

  @Patch(':id/stages/:stageId')
  @ApiOperation({ summary: 'Update pipeline stage' })
  updateStage(
    @Param('id') jobId: string,
    @Param('stageId') stageId: string,
    @Body() dto: UpdatePipelineStageDto,
    @OrgId() orgId: string,
  ) {
    return this.jobsService.updateStage(jobId, stageId, dto, orgId);
  }

  @Delete(':id/stages/:stageId')
  @ApiOperation({ summary: 'Delete pipeline stage' })
  deleteStage(
    @Param('id') jobId: string,
    @Param('stageId') stageId: string,
    @OrgId() orgId: string,
  ) {
    return this.jobsService.deleteStage(jobId, stageId, orgId);
  }
}
