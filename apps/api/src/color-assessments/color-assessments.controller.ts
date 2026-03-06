import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ColorAssessmentsService } from './color-assessments.service';
import { CreateColorAssessmentDto, SubmitColorResponseDto } from './dto';

@Controller('color-assessments')
export class ColorAssessmentsController {
  constructor(
    private readonly colorAssessmentsService: ColorAssessmentsService,
  ) {}

  @Post()
  create(@Body() dto: CreateColorAssessmentDto, @Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.colorAssessmentsService.create(dto, userId);
  }

  @Get('questions')
  listQuestions(@Req() req: Request) {
    const accessToken = (req as any).accessToken;
    return this.colorAssessmentsService.listQuestions(accessToken);
  }

  @Post(':id/responses')
  submit(
    @Param('id') assessmentId: string,
    @Body() dto: SubmitColorResponseDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.sub;
    const accessToken = (req as any).accessToken;
    return this.colorAssessmentsService.submitResponse(
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
    return this.colorAssessmentsService.finalize(
      assessmentId,
      userId,
      accessToken,
    );
  }

  @Get('latest')
  latest(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    const accessToken = (req as any).accessToken;
    return this.colorAssessmentsService.latestByUser(userId, accessToken);
  }
}
