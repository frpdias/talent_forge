import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CopcService } from './copc.service';
import {
  CreateCopcMetricDto,
  UpdateCopcMetricDto,
  CreateCopcCatalogDto,
} from './dto/copc-metric.dto';
import { PhpModuleGuard } from '../guards/php-module.guard';

@Controller('php/copc')
@UseGuards(PhpModuleGuard)
export class CopcController {
  constructor(private readonly copcService: CopcService) {}

  // ========== Metrics ==========
  @Post('metrics')
  async createMetric(@Body() dto: CreateCopcMetricDto, @Request() req) {
    return this.copcService.createMetric(dto, req.user.id);
  }

  @Get('metrics')
  async listMetrics(
    @Query('org_id') orgId: string,
    @Query('team_id') teamId?: string,
    @Query('user_id') userId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.copcService.listMetrics({
      org_id: orgId,
      team_id: teamId,
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Get('metrics/:id')
  async getMetric(@Param('id') id: string) {
    return this.copcService.getMetric(id);
  }

  @Put('metrics/:id')
  async updateMetric(
    @Param('id') id: string,
    @Body() dto: UpdateCopcMetricDto,
  ) {
    return this.copcService.updateMetric(id, dto);
  }

  @Delete('metrics/:id')
  async deleteMetric(@Param('id') id: string) {
    return this.copcService.deleteMetric(id);
  }

  // ========== Dashboard ==========
  @Get('dashboard/:org_id')
  async getDashboard(
    @Param('org_id') orgId: string,
    @Query('team_id') teamId?: string,
    @Query('period') period?: string, // '7d', '30d', '90d'
  ) {
    return this.copcService.getDashboard(orgId, teamId, period || '30d');
  }

  @Get('summary/:org_id')
  async getSummary(
    @Param('org_id') orgId: string,
    @Query('team_id') teamId?: string,
  ) {
    return this.copcService.getSummary(orgId, teamId);
  }

  @Get('trends/:org_id')
  async getTrends(
    @Param('org_id') orgId: string,
    @Query('team_id') teamId?: string,
    @Query('period') period?: string,
  ) {
    return this.copcService.getTrends(orgId, teamId, period || '90d');
  }

  // ========== Catalog ==========
  @Get('catalog')
  async getCatalog(@Query('org_id') orgId?: string) {
    return this.copcService.getCatalog(orgId);
  }

  @Post('catalog')
  async createCatalogMetric(@Body() dto: CreateCopcCatalogDto) {
    return this.copcService.createCatalogMetric(dto);
  }
}
