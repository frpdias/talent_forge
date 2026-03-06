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
  Request,
} from '@nestjs/common';
import { Nr1Service } from './nr1.service';
import { CreateNr1AssessmentDto, UpdateNr1AssessmentDto } from './dto/nr1-assessment.dto';
import { PhpModuleGuard } from '../guards/php-module.guard';

@Controller('php/nr1')
@UseGuards(PhpModuleGuard)
export class Nr1Controller {
  constructor(private readonly nr1Service: Nr1Service) {}

  @Post('assessments')
  async createAssessment(
    @Body() dto: CreateNr1AssessmentDto,
    @Request() req,
  ) {
    return this.nr1Service.createAssessment(dto, req.user.id);
  }

  @Get('assessments')
  async listAssessments(
    @Query('org_id') orgId: string,
    @Query('team_id') teamId?: string,
    @Query('user_id') userId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.nr1Service.listAssessments({
      org_id: orgId,
      team_id: teamId,
      user_id: userId,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Get('assessments/:id')
  async getAssessment(@Param('id') id: string) {
    return this.nr1Service.getAssessment(id);
  }

  @Put('assessments/:id')
  async updateAssessment(
    @Param('id') id: string,
    @Body() dto: UpdateNr1AssessmentDto,
  ) {
    return this.nr1Service.updateAssessment(id, dto);
  }

  @Delete('assessments/:id')
  async deleteAssessment(@Param('id') id: string) {
    return this.nr1Service.deleteAssessment(id);
  }

  @Get('risk-matrix/:org_id')
  async getRiskMatrix(
    @Param('org_id') orgId: string,
    @Query('team_id') teamId?: string,
  ) {
    return this.nr1Service.getRiskMatrix(orgId, teamId);
  }

  @Get('compliance-report/:org_id')
  async getComplianceReport(@Param('org_id') orgId: string) {
    return this.nr1Service.getComplianceReport(orgId);
  }

  @Post('action-plans')
  async generateActionPlans(
    @Body() body: { org_id: string; min_risk_level: number },
    @Request() req,
  ) {
    return this.nr1Service.generateActionPlans(
      body.org_id,
      body.min_risk_level || 3,
      req.user.id,
    );
  }

  @Post('self-assessments')
  async createSelfAssessment(
    @Body() dto: any,
    @Request() req,
  ) {
    return this.nr1Service.createSelfAssessment(dto, req.user.id);
  }

  @Get('self-assessments')
  async listSelfAssessments(
    @Query('org_id') orgId: string,
    @Query('employee_id') employeeId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.nr1Service.listSelfAssessments({
      org_id: orgId,
      employee_id: employeeId,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Get('self-assessments/:id')
  async getSelfAssessment(@Param('id') id: string) {
    return this.nr1Service.getSelfAssessment(id);
  }

  @Get('comparative-analysis/:org_id')
  async getComparativeAnalysis(
    @Param('org_id') orgId: string,
    @Query('employee_id') employeeId?: string,
  ) {
    return this.nr1Service.getComparativeAnalysis(orgId, employeeId);
  }

  // ========================================
  // Invitation Endpoints
  // ========================================

  @Post('invitations')
  async createInvitation(
    @Body() body: { org_id: string; employee_ids: string[]; organizational_assessment_id?: string },
    @Request() req,
  ) {
    return this.nr1Service.createInvitations(body, req.user.id);
  }

  @Get('invitations')
  async listInvitations(
    @Query('org_id') orgId: string,
    @Query('status') status?: string,
  ) {
    return this.nr1Service.listInvitations(orgId, status);
  }

  @Get('invitations/:id')
  async getInvitation(@Param('id') id: string) {
    return this.nr1Service.getInvitation(id);
  }

  @Get('invitations/token/:token')
  async getInvitationByToken(@Param('token') token: string) {
    return this.nr1Service.getInvitationByToken(token);
  }

  @Post('invitations/:id/resend')
  async resendInvitation(@Param('id') id: string) {
    return this.nr1Service.resendInvitation(id);
  }

  @Delete('invitations/:id')
  async cancelInvitation(@Param('id') id: string) {
    return this.nr1Service.cancelInvitation(id);
  }
}
