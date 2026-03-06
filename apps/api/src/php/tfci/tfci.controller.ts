import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { TfciService } from './tfci.service';
import { CreateTfciCycleDto, UpdateTfciCycleDto, CreateTfciAssessmentDto } from './dto/tfci-cycle.dto';
import { PhpModuleGuard } from '../guards/php-module.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('PHP TFCI')
@ApiBearerAuth()
@Controller('php/tfci')
@UseGuards(PhpModuleGuard)
export class TfciController {
  constructor(private readonly tfciService: TfciService) {}

  // ==================== CYCLES ====================

  @Post('cycles')
  @ApiOperation({ summary: 'Create TFCI evaluation cycle' })
  @ApiResponse({ status: 201, description: 'Cycle created successfully' })
  async createCycle(
    @Headers('x-org-id') orgId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateTfciCycleDto,
  ) {
    return this.tfciService.createCycle(orgId, userId, dto);
  }

  @Get('cycles')
  @ApiOperation({ summary: 'List all TFCI cycles' })
  @ApiResponse({ status: 200, description: 'Returns all cycles' })
  async getCycles(@Headers('x-org-id') orgId: string) {
    return this.tfciService.getCycles(orgId);
  }

  @Get('cycles/:id')
  @ApiOperation({ summary: 'Get TFCI cycle by ID' })
  @ApiResponse({ status: 200, description: 'Returns cycle details' })
  @ApiResponse({ status: 404, description: 'Cycle not found' })
  async getCycleById(
    @Headers('x-org-id') orgId: string,
    @Param('id') cycleId: string,
  ) {
    return this.tfciService.getCycleById(orgId, cycleId);
  }

  @Patch('cycles/:id')
  @ApiOperation({ summary: 'Update TFCI cycle' })
  @ApiResponse({ status: 200, description: 'Cycle updated successfully' })
  @ApiResponse({ status: 404, description: 'Cycle not found' })
  async updateCycle(
    @Headers('x-org-id') orgId: string,
    @Param('id') cycleId: string,
    @Body() dto: UpdateTfciCycleDto,
  ) {
    return this.tfciService.updateCycle(orgId, cycleId, dto);
  }

  @Delete('cycles/:id')
  @ApiOperation({ summary: 'Delete TFCI cycle' })
  @ApiResponse({ status: 204, description: 'Cycle deleted successfully' })
  async deleteCycle(
    @Headers('x-org-id') orgId: string,
    @Param('id') cycleId: string,
  ) {
    await this.tfciService.deleteCycle(orgId, cycleId);
    return { message: 'Cycle deleted successfully' };
  }

  // ==================== ASSESSMENTS ====================

  @Post('assessments')
  @ApiOperation({ summary: 'Submit TFCI assessment' })
  @ApiResponse({ status: 201, description: 'Assessment submitted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createAssessment(
    @Headers('x-org-id') orgId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateTfciAssessmentDto,
  ) {
    return this.tfciService.createAssessment(orgId, userId, dto);
  }

  @Get('cycles/:id/assessments')
  @ApiOperation({ summary: 'List all assessments in a cycle' })
  @ApiResponse({ status: 200, description: 'Returns all assessments' })
  async getAssessmentsByCycle(
    @Headers('x-org-id') orgId: string,
    @Param('id') cycleId: string,
  ) {
    return this.tfciService.getAssessmentsByCycle(orgId, cycleId);
  }

  @Get('cycles/:id/heatmap')
  @ApiOperation({ summary: 'Get TFCI heatmap data for dashboard' })
  @ApiResponse({ status: 200, description: 'Returns heatmap data' })
  async getHeatmapData(
    @Headers('x-org-id') orgId: string,
    @Param('id') cycleId: string,
  ) {
    return this.tfciService.getHeatmapData(orgId, cycleId);
  }
}
