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
import { NotificationsService } from './notifications.service';
import { PhpModuleGuard } from '../guards/php-module.guard';

@ApiTags('PHP - Notifications')
@ApiBearerAuth()
@Controller('api/v1/php/notifications')
@UseGuards(PhpModuleGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get(':orgId')
  @ApiOperation({ summary: 'Get unread notifications for organization' })
  async getNotifications(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('user_id') userId?: string,
    @Query('limit') limit?: number,
  ) {
    const notifications = await this.notificationsService.getUnread(
      orgId,
      userId,
      limit || 20,
    );
    return {
      org_id: orgId,
      count: notifications.length,
      notifications,
    };
  }

  @Get(':orgId/count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('user_id') userId?: string,
  ) {
    const count = await this.notificationsService.getUnreadCount(orgId, userId);
    return { org_id: orgId, unread_count: count };
  }

  @Post(':notificationId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('notificationId') notificationId: string) {
    await this.notificationsService.markAsRead(notificationId);
    return { success: true };
  }

  @Post(':orgId/read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query('user_id') userId?: string,
  ) {
    const count = await this.notificationsService.markAllAsRead(orgId, userId);
    return { success: true, marked_count: count };
  }
}
