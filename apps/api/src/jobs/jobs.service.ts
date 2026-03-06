import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateJobDto,
  UpdateJobDto,
  CreatePipelineStageDto,
  UpdatePipelineStageDto,
} from './dto';

@Injectable()
export class JobsService {
  constructor(private supabaseService: SupabaseService) {}

  async create(dto: CreateJobDto, orgId: string, userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        org_id: orgId,
        title: dto.title,
        description: dto.description,
        location: dto.location,
        salary_min: dto.salaryMin,
        salary_max: dto.salaryMax,
        employment_type: dto.employmentType,
        seniority: dto.seniority,
        status: dto.status || 'open',
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create default pipeline stages
    const defaultStages = [
      { name: 'Triagem', position: 0 },
      { name: 'Entrevista RH', position: 1 },
      { name: 'Entrevista Técnica', position: 2 },
      { name: 'Entrevista Cliente', position: 3 },
      { name: 'Oferta', position: 4 },
    ];

    for (const stage of defaultStages) {
      await supabase.from('pipeline_stages').insert({
        job_id: data.id,
        name: stage.name,
        position: stage.position,
      });
    }

    return this.findOne(data.id, orgId);
  }

  async findAll(orgId: string, query: { status?: string; search?: string }) {
    const supabase = this.supabaseService.getAdminClient();

    let queryBuilder = supabase
      .from('jobs')
      .select(
        `
        *,
        pipeline_stages (id, name, position),
        applications (id)
      `,
      )
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    if (query.search) {
      queryBuilder = queryBuilder.ilike('title', `%${query.search}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw error;
    }

    return data.map((job: any) => ({
      ...this.mapToResponse(job),
      stagesCount: job.pipeline_stages?.length || 0,
      applicationsCount: job.applications?.length || 0,
    }));
  }

  async findOne(id: string, orgId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('jobs')
      .select(
        `
        *,
        pipeline_stages (id, name, position)
      `,
      )
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Job not found');
    }

    return {
      ...this.mapToResponse(data),
      stages: data.pipeline_stages
        ?.sort((a: any, b: any) => a.position - b.position)
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          position: s.position,
        })),
    };
  }

  async update(id: string, dto: UpdateJobDto, orgId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.salaryMin !== undefined) updateData.salary_min = dto.salaryMin;
    if (dto.salaryMax !== undefined) updateData.salary_max = dto.salaryMax;
    if (dto.employmentType !== undefined)
      updateData.employment_type = dto.employmentType;
    if (dto.seniority !== undefined) updateData.seniority = dto.seniority;
    if (dto.status !== undefined) updateData.status = dto.status;

    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException('Job not found');
    }

    return this.findOne(id, orgId);
  }

  async delete(id: string, orgId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) {
      throw error;
    }

    return { success: true };
  }

  // Pipeline Stages
  async createStage(jobId: string, dto: CreatePipelineStageDto, orgId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Verify job belongs to org
    await this.findOne(jobId, orgId);

    const { data, error } = await supabase
      .from('pipeline_stages')
      .insert({
        job_id: jobId,
        name: dto.name,
        position: dto.position,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      jobId: data.job_id,
      name: data.name,
      position: data.position,
    };
  }

  async updateStage(
    jobId: string,
    stageId: string,
    dto: UpdatePipelineStageDto,
    orgId: string,
  ) {
    const supabase = this.supabaseService.getAdminClient();

    // Verify job belongs to org
    await this.findOne(jobId, orgId);

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.position !== undefined) updateData.position = dto.position;

    const { data, error } = await supabase
      .from('pipeline_stages')
      .update(updateData)
      .eq('id', stageId)
      .eq('job_id', jobId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      jobId: data.job_id,
      name: data.name,
      position: data.position,
    };
  }

  async deleteStage(jobId: string, stageId: string, orgId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Verify job belongs to org
    await this.findOne(jobId, orgId);

    const { error } = await supabase
      .from('pipeline_stages')
      .delete()
      .eq('id', stageId)
      .eq('job_id', jobId);

    if (error) {
      throw error;
    }

    return { success: true };
  }

  private mapToResponse(job: any) {
    return {
      id: job.id,
      orgId: job.org_id,
      title: job.title,
      description: job.description,
      location: job.location,
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      employmentType: job.employment_type,
      seniority: job.seniority,
      status: job.status,
      createdBy: job.created_by,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
    };
  }
}
