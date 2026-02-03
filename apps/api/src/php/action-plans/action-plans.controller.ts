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
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ActionPlansService } from './action-plans.service';
import {
  CreateActionPlanDto,
  UpdateActionPlanDto,
  CreateActionItemDto,
  UpdateActionItemDto,
  ActionPlanQueryDto,
} from './dto/action-plan.dto';
import { PhpModuleGuard } from '../guards/php-module.guard';

@ApiTags('PHP - Action Plans')
@ApiBearerAuth()
@Controller('api/v1/php/action-plans')
@UseGuards(PhpModuleGuard)
export class ActionPlansController {
  constructor(private readonly actionPlansService: ActionPlansService) {}

  // =====================================================================
  // ACTION PLANS
  // =====================================================================

  @Get()
  @ApiOperation({ summary: 'List all action plans with filters' })
  @ApiResponse({ status: 200, description: 'List of action plans' })
  async findAll(@Query() query: ActionPlanQueryDto) {
    return this.actionPlansService.findAll(query);
  }

  @Get('stats/:orgId')
  @ApiOperation({ summary: 'Get action plan statistics for an organization' })
  @ApiResponse({ status: 200, description: 'Action plan statistics' })
  async getStats(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return this.actionPlansService.getStats(orgId);
  }

  @Get('top-priority/:orgId')
  @ApiOperation({ summary: 'Get top 5 priority action plans' })
  @ApiResponse({ status: 200, description: 'Top priority action plans' })
  async getTopPriority(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('limit') limit?: number,
  ) {
    return this.actionPlansService.getTopPriority(orgId, limit || 5);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get action plan by ID' })
  @ApiResponse({ status: 200, description: 'Action plan details' })
  @ApiResponse({ status: 404, description: 'Action plan not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.actionPlansService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new action plan' })
  @ApiResponse({ status: 201, description: 'Action plan created' })
  async create(@Body() dto: CreateActionPlanDto, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.actionPlansService.create(dto, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an action plan' })
  @ApiResponse({ status: 200, description: 'Action plan updated' })
  @ApiResponse({ status: 404, description: 'Action plan not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActionPlanDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.actionPlansService.update(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an action plan' })
  @ApiResponse({ status: 204, description: 'Action plan deleted' })
  @ApiResponse({ status: 404, description: 'Action plan not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.actionPlansService.remove(id);
  }

  // =====================================================================
  // ACTION ITEMS
  // =====================================================================

  @Get(':planId/items')
  @ApiOperation({ summary: 'List all items for an action plan' })
  @ApiResponse({ status: 200, description: 'List of action items' })
  async findItems(@Param('planId', ParseUUIDPipe) planId: string) {
    return this.actionPlansService.findItemsByPlan(planId);
  }

  @Post(':planId/items')
  @ApiOperation({ summary: 'Create a new action item' })
  @ApiResponse({ status: 201, description: 'Action item created' })
  async createItem(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: CreateActionItemDto,
  ) {
    // Ensure the planId in URL matches the DTO
    dto.action_plan_id = planId;
    return this.actionPlansService.createItem(dto);
  }

  @Put('items/:id')
  @ApiOperation({ summary: 'Update an action item' })
  @ApiResponse({ status: 200, description: 'Action item updated' })
  async updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActionItemDto,
  ) {
    return this.actionPlansService.updateItem(id, dto);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an action item' })
  @ApiResponse({ status: 204, description: 'Action item deleted' })
  async removeItem(@Param('id', ParseUUIDPipe) id: string) {
    await this.actionPlansService.removeItem(id);
  }
}
