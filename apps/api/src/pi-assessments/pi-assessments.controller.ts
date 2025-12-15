import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PiAssessmentsService } from './pi-assessments.service';
import {
  CreatePiAssessmentDto,
  SubmitPiDescriptorDto,
  SubmitPiSituationalDto,
} from './dto';

@Controller('pi-assessments')
export class PiAssessmentsController {
  constructor(private readonly piAssessmentsService: PiAssessmentsService) {}

  @Post()
  create(@Body() dto: CreatePiAssessmentDto, @Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.piAssessmentsService.create(dto, userId);
  }

  @Get('descriptors')
  listDescriptors(@Req() req: Request) {
    const accessToken = (req as any).accessToken;
    return this.piAssessmentsService.listDescriptors(accessToken);
  }

  @Get('questions')
  listSituational(@Req() req: Request) {
    const accessToken = (req as any).accessToken;
    return this.piAssessmentsService.listSituationalQuestions(accessToken);
  }

  @Post(':id/responses/descriptor')
  submitDescriptor(
    @Param('id') assessmentId: string,
    @Body() dto: SubmitPiDescriptorDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.sub;
    const accessToken = (req as any).accessToken;
    return this.piAssessmentsService.submitDescriptor(
      assessmentId,
      dto,
      userId,
      accessToken,
    );
  }

  @Post(':id/responses/situational')
  submitSituational(
    @Param('id') assessmentId: string,
    @Body() dto: SubmitPiSituationalDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.sub;
    const accessToken = (req as any).accessToken;
    return this.piAssessmentsService.submitSituational(
      assessmentId,
      dto,
      userId,
      accessToken,
    );
  }

  @Post(':id/complete')
  finalize(@Param('id') assessmentId: string, @Req() req: Request) {
    const userId = (req as any).user?.sub;
    const accessToken = (req as any).accessToken;
    return this.piAssessmentsService.finalize(
      assessmentId,
      userId,
      accessToken,
    );
  }

  @Get('latest')
  latest(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    const accessToken = (req as any).accessToken;
    return this.piAssessmentsService.latestByUser(userId, accessToken);
  }
}
