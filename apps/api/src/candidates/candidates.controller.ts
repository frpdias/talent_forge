import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { CandidatesService } from './candidates.service';
import {
  CreateCandidateDto,
  UpdateCandidateDto,
  CreateCandidateNoteDto,
} from './dto';
import { OrgGuard } from '../auth/guards/org.guard';
import { OrgId } from '../auth/decorators/org.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.service';

@ApiTags('Candidates')
@ApiBearerAuth()
@ApiHeader({ name: 'x-org-id', required: true, description: 'Organization ID' })
@UseGuards(OrgGuard)
@Controller('candidates')
export class CandidatesController {
  constructor(private candidatesService: CandidatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new candidate' })
  create(
    @Body() dto: CreateCandidateDto,
    @OrgId() orgId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.candidatesService.create(dto, orgId, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List all candidates for the organization' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tag', required: false })
  findAll(
    @OrgId() orgId: string,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
  ) {
    return this.candidatesService.findAll(orgId, { search, tag });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get candidate by ID with notes and assessments' })
  findOne(@Param('id') id: string, @OrgId() orgId: string) {
    return this.candidatesService.findOne(id, orgId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update candidate' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCandidateDto,
    @OrgId() orgId: string,
  ) {
    return this.candidatesService.update(id, dto, orgId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete candidate' })
  delete(@Param('id') id: string, @OrgId() orgId: string) {
    return this.candidatesService.delete(id, orgId);
  }

  // Notes
  @Post(':id/notes')
  @ApiOperation({ summary: 'Add a note to candidate' })
  createNote(
    @Param('id') candidateId: string,
    @Body() dto: CreateCandidateNoteDto,
    @OrgId() orgId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.candidatesService.createNote(candidateId, dto, orgId, user.sub);
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Get all notes for a candidate' })
  getNotes(@Param('id') candidateId: string, @OrgId() orgId: string) {
    return this.candidatesService.getNotes(candidateId, orgId);
  }
}
