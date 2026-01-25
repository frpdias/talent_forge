import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './auth.service';
import { Public } from './decorators/public.decorator';
import type { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user info' })
  async me(@CurrentUser() user: JwtPayload) {
    const orgs = await this.authService.getUserOrganizations(user.sub);
    return {
      id: user.sub,
      email: user.email,
      organizations: orgs,
    };
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('google-calendar/authorize')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Google Calendar OAuth URL' })
  async authorizeGoogleCalendar(@CurrentUser() user: JwtPayload) {
    return this.authService.getGoogleCalendarAuthUrl(user.sub);
  }

  @Get('google-calendar/callback')
  @Public()
  @ApiOperation({ summary: 'Handle Google Calendar OAuth callback' })
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'state', required: true })
  async googleCalendarCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    await this.authService.handleGoogleCalendarCallback(code, state);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/dashboard/settings?google=connected`);
  }

  @Get('google-calendar/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Google Calendar connection status' })
  async googleCalendarStatus(@CurrentUser() user: JwtPayload) {
    return this.authService.getGoogleCalendarStatus(user.sub);
  }

  @Post('google-calendar/disconnect')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect Google Calendar' })
  async googleCalendarDisconnect(@CurrentUser() user: JwtPayload) {
    return this.authService.disconnectGoogleCalendar(user.sub);
  }
}
