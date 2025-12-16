"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let JobsService = class JobsService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async create(dto, orgId, userId) {
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
    async findAll(orgId, query) {
        const supabase = this.supabaseService.getAdminClient();
        let queryBuilder = supabase
            .from('jobs')
            .select(`
        *,
        pipeline_stages (id, name, position),
        applications (id)
      `)
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
        return data.map((job) => ({
            ...this.mapToResponse(job),
            stagesCount: job.pipeline_stages?.length || 0,
            applicationsCount: job.applications?.length || 0,
        }));
    }
    async findOne(id, orgId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('jobs')
            .select(`
        *,
        pipeline_stages (id, name, position)
      `)
            .eq('id', id)
            .eq('org_id', orgId)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Job not found');
        }
        return {
            ...this.mapToResponse(data),
            stages: data.pipeline_stages
                ?.sort((a, b) => a.position - b.position)
                .map((s) => ({
                id: s.id,
                name: s.name,
                position: s.position,
            })),
        };
    }
    async update(id, dto, orgId) {
        const supabase = this.supabaseService.getAdminClient();
        const updateData = {
            updated_at: new Date().toISOString(),
        };
        if (dto.title !== undefined)
            updateData.title = dto.title;
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.location !== undefined)
            updateData.location = dto.location;
        if (dto.salaryMin !== undefined)
            updateData.salary_min = dto.salaryMin;
        if (dto.salaryMax !== undefined)
            updateData.salary_max = dto.salaryMax;
        if (dto.employmentType !== undefined)
            updateData.employment_type = dto.employmentType;
        if (dto.seniority !== undefined)
            updateData.seniority = dto.seniority;
        if (dto.status !== undefined)
            updateData.status = dto.status;
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
            throw new common_1.NotFoundException('Job not found');
        }
        return this.findOne(id, orgId);
    }
    async delete(id, orgId) {
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
    async createStage(jobId, dto, orgId) {
        const supabase = this.supabaseService.getAdminClient();
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
    async updateStage(jobId, stageId, dto, orgId) {
        const supabase = this.supabaseService.getAdminClient();
        await this.findOne(jobId, orgId);
        const updateData = {};
        if (dto.name !== undefined)
            updateData.name = dto.name;
        if (dto.position !== undefined)
            updateData.position = dto.position;
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
    async deleteStage(jobId, stageId, orgId) {
        const supabase = this.supabaseService.getAdminClient();
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
    mapToResponse(job) {
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
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map