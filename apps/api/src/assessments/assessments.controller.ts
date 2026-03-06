import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiHeader,
} from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentDto, SubmitAssessmentDto } from './dto';
import { OrgGuard } from '../auth/guards/org.guard';
import { OrgId } from '../auth/decorators/org.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Assessments')
@Controller('assessments')
export class AssessmentsController {
  constructor(private assessmentsService: AssessmentsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-org-id',
    required: true,
    description: 'Organization ID',
  })
  @UseGuards(OrgGuard)
  @ApiOperation({ summary: 'Create a new assessment for a candidate' })
  create(@Body() dto: CreateAssessmentDto, @OrgId() orgId: string) {
    return this.assessmentsService.create(dto, orgId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-org-id',
    required: true,
    description: 'Organization ID',
  })
  @UseGuards(OrgGuard)
  @ApiOperation({ summary: 'Get assessment by ID' })
  findOne(@Param('id') id: string, @OrgId() orgId: string) {
    return this.assessmentsService.findOne(id, orgId);
  }

  @Get('candidate/:candidateId')
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-org-id',
    required: true,
    description: 'Organization ID',
  })
  @UseGuards(OrgGuard)
  @ApiOperation({ summary: 'Get all assessments for a candidate' })
  findByCandidateId(
    @Param('candidateId') candidateId: string,
    @OrgId() orgId: string,
  ) {
    return this.assessmentsService.findByCandidateId(candidateId, orgId);
  }

  // Public endpoints for candidates to take assessments
  @Get('take/:id')
  @Public()
  @ApiOperation({
    summary: 'Get assessment questions (public endpoint for candidates)',
  })
  getQuestions(@Param('id') id: string) {
    return this.assessmentsService.getAssessmentQuestions(id);
  }

  @Post('take/:id')
  @Public()
  @ApiOperation({
    summary: 'Submit assessment answers (public endpoint for candidates)',
  })
  submit(@Param('id') id: string, @Body() dto: SubmitAssessmentDto) {
    return this.assessmentsService.submitAssessment(id, dto);
  }
}
