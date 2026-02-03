import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { PhpService } from './php.service';
import { ActivatePhpDto, UpdatePhpSettingsDto } from './dto/activate-php.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('PHP Module')
@ApiBearerAuth()
@Controller('php')
export class PhpController {
  constructor(private readonly phpService: PhpService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get PHP module activation status' })
  @ApiResponse({ status: 200, description: 'Returns activation status' })
  async getStatus(
    @Headers('x-org-id') orgId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.phpService.getStatus(orgId, userId);
  }

  @Post('activate')
  @ApiOperation({ summary: 'Activate PHP module for organization' })
  @ApiResponse({ status: 201, description: 'Module activated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async activate(
    @Headers('x-org-id') orgId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: ActivatePhpDto,
  ) {
    return this.phpService.activate(orgId, userId, dto);
  }

  @Post('deactivate')
  @ApiOperation({ summary: 'Deactivate PHP module for organization' })
  @ApiResponse({ status: 200, description: 'Module deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Activation not found' })
  async deactivate(
    @Headers('x-org-id') orgId: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.phpService.deactivate(orgId, userId);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update PHP module settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({ status: 404, description: 'Activation not found' })
  async updateSettings(
    @Headers('x-org-id') orgId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: UpdatePhpSettingsDto,
  ) {
    return this.phpService.updateSettings(orgId, userId, dto);
  }
}
