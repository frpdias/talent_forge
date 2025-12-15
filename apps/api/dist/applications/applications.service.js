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
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let ApplicationsService = class ApplicationsService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async create(dto, orgId, userId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('id, org_id')
            .eq('id', dto.jobId)
            .eq('org_id', orgId)
            .single();
        if (jobError || !job) {
            throw new common_1.NotFoundException('Job not found');
        }
        const { data: candidate, error: candidateError } = await supabase
            .from('candidates')
            .select('id, owner_org_id')
            .eq('id', dto.candidateId)
            .eq('owner_org_id', orgId)
            .single();
        if (candidateError || !candidate) {
            throw new common_1.NotFoundException('Candidate not found');
        }
        const { data: existing } = await supabase
            .from('applications')
            .select('id')
            .eq('job_id', dto.jobId)
            .eq('candidate_id', dto.candidateId)
            .single();
        if (existing) {
            throw new common_1.ConflictException('Candidate already applied to this job');
        }
        const { data: firstStage } = await supabase
            .from('pipeline_stages')
            .select('id')
            .eq('job_id', dto.jobId)
            .order('position', { ascending: true })
            .limit(1)
            .single();
        const { data, error } = await supabase
            .from('applications')
            .insert({
            job_id: dto.jobId,
            candidate_id: dto.candidateId,
            current_stage_id: firstStage?.id || null,
            status: 'applied',
            created_by: userId,
        })
            .select()
            .single();
        if (error) {
            throw error;
        }
        await supabase.from('application_events').insert({
            application_id: data.id,
            to_stage_id: firstStage?.id || null,
            status: 'applied',
            actor_id: userId,
        });
        return this.findOne(data.id, orgId);
    }
    async findAll(orgId, query) {
        const supabase = this.supabaseService.getAdminClient();
        let queryBuilder = supabase
            .from('applications')
            .select(`
        *,
        candidates (id, full_name, email, current_title),
        jobs!inner (id, title, org_id),
        pipeline_stages (id, name, position)
      `)
            .eq('jobs.org_id', orgId)
            .order('updated_at', { ascending: false });
        if (query.jobId) {
            queryBuilder = queryBuilder.eq('job_id', query.jobId);
        }
        if (query.status) {
            queryBuilder = queryBuilder.eq('status', query.status);
        }
        if (query.stageId) {
            queryBuilder = queryBuilder.eq('current_stage_id', query.stageId);
        }
        const { data, error } = await queryBuilder;
        if (error) {
            throw error;
        }
        return data.map((app) => this.mapToResponse(app));
    }
    async findOne(id, orgId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('applications')
            .select(`
        *,
        candidates (id, full_name, email, phone, current_title, linkedin_url),
        jobs!inner (id, title, org_id, status),
        pipeline_stages (id, name, position),
        application_events (id, from_stage_id, to_stage_id, status, note, actor_id, created_at)
      `)
            .eq('id', id)
            .eq('jobs.org_id', orgId)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Application not found');
        }
        return {
            ...this.mapToResponse(data),
            events: data.application_events
                ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((e) => ({
                id: e.id,
                fromStageId: e.from_stage_id,
                toStageId: e.to_stage_id,
                status: e.status,
                note: e.note,
                actorId: e.actor_id,
                createdAt: e.created_at,
            })),
        };
    }
    async updateStage(id, dto, orgId, userId) {
        const supabase = this.supabaseService.getAdminClient();
        const current = await this.findOne(id, orgId);
        const { error } = await supabase
            .from('applications')
            .update({
            current_stage_id: dto.toStageId,
            status: dto.status || current.status,
            updated_at: new Date().toISOString(),
        })
            .eq('id', id);
        if (error) {
            throw error;
        }
        await supabase.from('application_events').insert({
            application_id: id,
            from_stage_id: current.currentStageId,
            to_stage_id: dto.toStageId,
            status: dto.status || current.status,
            note: dto.note,
            actor_id: userId,
        });
        return this.findOne(id, orgId);
    }
    async getEvents(id, orgId) {
        const supabase = this.supabaseService.getAdminClient();
        await this.findOne(id, orgId);
        const { data, error } = await supabase
            .from('application_events')
            .select('*')
            .eq('application_id', id)
            .order('created_at', { ascending: false });
        if (error) {
            throw error;
        }
        return data.map((e) => ({
            id: e.id,
            applicationId: e.application_id,
            fromStageId: e.from_stage_id,
            toStageId: e.to_stage_id,
            status: e.status,
            note: e.note,
            actorId: e.actor_id,
            createdAt: e.created_at,
        }));
    }
    async delete(id, orgId) {
        const supabase = this.supabaseService.getAdminClient();
        await this.findOne(id, orgId);
        const { error } = await supabase.from('applications').delete().eq('id', id);
        if (error) {
            throw error;
        }
        return { success: true };
    }
    async getKanbanBoard(jobId, orgId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select(`
        id,
        title,
        pipeline_stages (id, name, position)
      `)
            .eq('id', jobId)
            .eq('org_id', orgId)
            .single();
        if (jobError || !job) {
            throw new common_1.NotFoundException('Job not found');
        }
        const { data: applications, error: appError } = await supabase
            .from('applications')
            .select(`
        *,
        candidates (id, full_name, email, current_title),
        assessments:candidates(assessments(normalized_score))
      `)
            .eq('job_id', jobId)
            .order('updated_at', { ascending: false });
        if (appError) {
            throw appError;
        }
        const stages = job.pipeline_stages
            ?.sort((a, b) => a.position - b.position)
            .map((stage) => ({
            id: stage.id,
            name: stage.name,
            position: stage.position,
            applications: applications
                ?.filter((app) => app.current_stage_id === stage.id)
                .map((app) => ({
                id: app.id,
                candidateId: app.candidate_id,
                candidateName: app.candidates?.full_name,
                candidateEmail: app.candidates?.email,
                candidateTitle: app.candidates?.current_title,
                status: app.status,
                score: app.score,
                updatedAt: app.updated_at,
            })),
        }));
        return {
            jobId: job.id,
            jobTitle: job.title,
            stages,
        };
    }
    mapToResponse(app) {
        return {
            id: app.id,
            jobId: app.job_id,
            candidateId: app.candidate_id,
            currentStageId: app.current_stage_id,
            status: app.status,
            score: app.score,
            createdBy: app.created_by,
            createdAt: app.created_at,
            updatedAt: app.updated_at,
            candidate: app.candidates
                ? {
                    id: app.candidates.id,
                    fullName: app.candidates.full_name,
                    email: app.candidates.email,
                    currentTitle: app.candidates.current_title,
                    linkedinUrl: app.candidates.linkedin_url,
                }
                : null,
            job: app.jobs
                ? {
                    id: app.jobs.id,
                    title: app.jobs.title,
                }
                : null,
            currentStage: app.pipeline_stages
                ? {
                    id: app.pipeline_stages.id,
                    name: app.pipeline_stages.name,
                    position: app.pipeline_stages.position,
                }
                : null,
        };
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map