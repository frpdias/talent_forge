import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { InviteLinksService } from './invite-links.service';
import {
  CreateCandidateFromInviteDto,
  CreateCandidateAccountFromInviteDto,
  CreateInviteLinkDto,
} from './dto';
import { Public } from '../auth/decorators/public.decorator';
import { OrgGuard } from '../auth/guards/org.guard';
import { OrgId, OrgRole } from '../auth/decorators/org.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';

@ApiTags('Invite Links')
@Controller('invite-links')
export class InviteLinksController {
  constructor(private inviteLinksService: InviteLinksService) {}

  @Post()
  @ApiBearerAuth()
  @ApiHeader({ name: 'x-org-id', required: true, description: 'Organization ID' })
  @UseGuards(OrgGuard)
  @ApiOperation({ summary: 'Create a candidate invite link' })
  create(
    @Body() dto: CreateInviteLinkDto,
    @OrgId() orgId: string,
    @OrgRole() orgRole: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!['owner', 'admin', 'recruiter'].includes(orgRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.inviteLinksService.createInviteLink(orgId, user.sub, dto);
  }

  @Public()
  @Get(':token')
  @ApiOperation({ summary: 'Validate candidate invite token' })
  validate(@Param('token') token: string) {
    return this.inviteLinksService.validateInviteToken(token);
  }

  @Public()
  @Post(':token/candidates')
  @ApiOperation({ summary: 'Create candidate from invite token' })
  createCandidate(
    @Param('token') token: string,
    @Body() dto: CreateCandidateFromInviteDto,
  ) {
    return this.inviteLinksService.createCandidateFromInvite(token, dto);
  }

  @Public()
  @Post(':token/register')
  @ApiOperation({ summary: 'Register candidate account from invite token' })
  registerCandidate(
    @Param('token') token: string,
    @Body() dto: CreateCandidateAccountFromInviteDto,
  ) {
    return this.inviteLinksService.createCandidateAccountFromInvite(token, dto);
  }
}
