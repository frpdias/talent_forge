import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, Request,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto } from './dto/update-interview.dto';

@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateInterviewDto) {
    return this.interviewsService.create(req.orgId, req.user.id, dto);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('candidateId') candidateId?: string,
    @Query('jobId') jobId?: string,
    @Query('status') status?: string,
  ) {
    return this.interviewsService.findAll(req.orgId, { candidateId, jobId, status });
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.interviewsService.findOne(req.orgId, id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateInterviewDto) {
    return this.interviewsService.update(req.orgId, id, dto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.interviewsService.remove(req.orgId, id);
  }
}
