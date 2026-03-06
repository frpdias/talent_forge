import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { PhpModuleGuard } from '../guards/php-module.guard';

@ApiTags('PHP - Dashboard')
@ApiBearerAuth()
@Controller('api/v1/php/dashboard')
@UseGuards(PhpModuleGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get(':orgId/metrics')
  @ApiOperation({ summary: 'Get dashboard metrics for organization' })
  async getMetrics(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('force_refresh') forceRefresh?: string,
  ) {
    const metrics = await this.dashboardService.getMetrics(
      orgId,
      forceRefresh === 'true',
    );
    return metrics;
  }

  @Post(':orgId/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force refresh and emit metrics to connected clients' })
  async refreshMetrics(@Param('orgId', ParseUUIDPipe) orgId: string) {
    await this.dashboardService.refreshAndEmit(orgId);
    return { success: true, message: 'Metrics refreshed and emitted' };
  }

  @Get('stats/connections')
  @ApiOperation({ summary: 'Get WebSocket connection statistics' })
  async getConnectionStats() {
    const stats = this.dashboardService.getConnectionStats();
    return {
      ...stats,
      timestamp: new Date().toISOString(),
    };
  }
}
