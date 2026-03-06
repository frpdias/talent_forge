import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { PhpSettingsDto } from './dto/settings.dto';
import { PhpModuleGuard } from '../guards/php-module.guard';

@ApiTags('PHP - Settings')
@ApiBearerAuth()
@Controller('api/v1/php/settings')
@UseGuards(PhpModuleGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':orgId')
  @ApiOperation({ summary: 'Get PHP module settings for an organization' })
  @ApiResponse({ status: 200, description: 'PHP module settings' })
  async getSettings(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return this.settingsService.getSettings(orgId);
  }

  @Put(':orgId')
  @ApiOperation({ summary: 'Update PHP module settings for an organization' })
  @ApiResponse({ status: 200, description: 'Updated settings' })
  async updateSettings(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() settings: PhpSettingsDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.settingsService.updateSettings(orgId, settings, userId);
  }

  @Post(':orgId/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset settings to defaults' })
  @ApiResponse({ status: 200, description: 'Settings reset to defaults' })
  async resetSettings(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.settingsService.resetSettings(orgId, userId);
  }

  @Post('test-webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test a webhook URL' })
  @ApiResponse({ status: 200, description: 'Webhook test result' })
  async testWebhook(@Body() body: { url: string }) {
    return this.settingsService.testWebhook(body.url);
  }
}
