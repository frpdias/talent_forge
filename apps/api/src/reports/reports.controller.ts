import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { OrgGuard } from '../auth/guards/org.guard';
import { OrgId } from '../auth/decorators/org.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@ApiHeader({ name: 'x-org-id', required: true, description: 'Organization ID' })
@UseGuards(OrgGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getDashboard(@OrgId() orgId: string) {
    return this.reportsService.getDashboardStats(orgId);
  }

  @Get('pipelines')
  @ApiOperation({ summary: 'Get pipeline report for jobs' })
  @ApiQuery({ name: 'jobId', required: false })
  getPipelineReport(@OrgId() orgId: string, @Query('jobId') jobId?: string) {
    return this.reportsService.getPipelineReport(orgId, jobId);
  }

  @Get('assessments')
  @ApiOperation({ summary: 'Get assessments report' })
  @ApiQuery({ name: 'jobId', required: false })
  getAssessmentsReport(@OrgId() orgId: string, @Query('jobId') jobId?: string) {
    return this.reportsService.getAssessmentsReport(orgId, jobId);
  }
}
