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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let ReportsService = class ReportsService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async getPipelineReport(orgId, jobId) {
        const supabase = this.supabaseService.getAdminClient();
        let queryBuilder = supabase
            .from('jobs')
            .select(`
        id,
        title,
        status,
        created_at,
        pipeline_stages (id, name, position),
        applications (id, current_stage_id, status, created_at, updated_at)
      `)
            .eq('org_id', orgId);
        if (jobId) {
            queryBuilder = queryBuilder.eq('id', jobId);
        }
        const { data: jobs, error } = await queryBuilder;
        if (error) {
            throw error;
        }
        if (!jobs || jobs.length === 0) {
            throw new common_1.NotFoundException('No jobs found');
        }
        const reports = jobs.map((job) => {
            const stages = (job.pipeline_stages || []).sort((a, b) => a.position - b.position);
            const applications = job.applications || [];
            const stageStats = stages.map((stage) => {
                const stageApps = applications.filter((app) => app.current_stage_id === stage.id);
                return {
                    stageId: stage.id,
                    stageName: stage.name,
                    position: stage.position,
                    count: stageApps.length,
                    percentage: applications.length > 0
                        ? Math.round((stageApps.length / applications.length) * 100)
                        : 0,
                };
            });
            const conversions = stageStats.slice(0, -1).map((stage, idx) => {
                const nextStage = stageStats[idx + 1];
                if (!nextStage || stage.count === 0)
                    return 0;
                return Math.round((nextStage.count / stage.count) * 100);
            });
            const statusCounts = {
                applied: applications.filter((a) => a.status === 'applied').length,
                in_process: applications.filter((a) => a.status === 'in_process')
                    .length,
                hired: applications.filter((a) => a.status === 'hired').length,
                rejected: applications.filter((a) => a.status === 'rejected')
                    .length,
            };
            const avgDays = applications.length > 0
                ? Math.round(applications.reduce((sum, app) => {
                    const created = new Date(app.created_at);
                    const updated = new Date(app.updated_at);
                    return (sum +
                        (updated.getTime() - created.getTime()) /
                            (1000 * 60 * 60 * 24));
                }, 0) / applications.length)
                : 0;
            return {
                jobId: job.id,
                jobTitle: job.title,
                jobStatus: job.status,
                totalApplications: applications.length,
                stages: stageStats,
                conversions,
                statusDistribution: statusCounts,
                averageDaysInPipeline: avgDays,
                hireRate: applications.length > 0
                    ? Math.round((statusCounts.hired / applications.length) * 100)
                    : 0,
            };
        });
        return jobId ? reports[0] : reports;
    }
    async getAssessmentsReport(orgId, jobId) {
        const supabase = this.supabaseService.getAdminClient();
        let queryBuilder = supabase
            .from('assessments')
            .select(`
        id,
        status,
        assessment_type,
        raw_score,
        normalized_score,
        traits,
        created_at,
        candidates!inner (id, owner_org_id),
        jobs (id, title)
      `)
            .eq('candidates.owner_org_id', orgId)
            .eq('status', 'completed');
        if (jobId) {
            queryBuilder = queryBuilder.eq('job_id', jobId);
        }
        const { data: assessments, error } = await queryBuilder;
        if (error) {
            throw error;
        }
        if (!assessments || assessments.length === 0) {
            return {
                totalAssessments: 0,
                completedAssessments: 0,
                byType: {},
                recentAssessments: [],
            };
        }
        const byType = {};
        for (const a of assessments) {
            const type = a.assessment_type || 'unknown';
            byType[type] = (byType[type] || 0) + 1;
        }
        const recentAssessments = assessments.slice(0, 10).map((a) => ({
            id: a.id,
            type: a.assessment_type,
            status: a.status,
            createdAt: a.created_at,
            job: a.jobs,
        }));
        return {
            totalAssessments: assessments.length,
            completedAssessments: assessments.filter((a) => a.status === 'completed').length,
            byType,
            recentAssessments,
        };
    }
    async getDashboardStats(orgId) {
        const supabase = this.supabaseService.getAdminClient();
        const [jobsResult, candidatesResult, applicationsResult, assessmentsResult,] = await Promise.all([
            supabase
                .from('jobs')
                .select('id', { count: 'exact', head: true })
                .eq('org_id', orgId),
            supabase
                .from('candidates')
                .select('id', { count: 'exact', head: true })
                .eq('owner_org_id', orgId),
            supabase
                .from('applications')
                .select('id, jobs!inner(org_id)', { count: 'exact', head: true })
                .eq('jobs.org_id', orgId),
            supabase
                .from('assessments')
                .select('id, candidates!inner(owner_org_id)', {
                count: 'exact',
                head: true,
            })
                .eq('candidates.owner_org_id', orgId),
        ]);
        const { data: recentApplications } = await supabase
            .from('applications')
            .select(`
        id,
        status,
        created_at,
        candidates (full_name),
        jobs!inner (title, org_id)
      `)
            .eq('jobs.org_id', orgId)
            .order('created_at', { ascending: false })
            .limit(5);
        const { count: openJobsCount } = await supabase
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .eq('status', 'open');
        return {
            stats: {
                totalJobs: jobsResult.count || 0,
                openJobs: openJobsCount || 0,
                totalCandidates: candidatesResult.count || 0,
                totalApplications: applicationsResult.count || 0,
                totalAssessments: assessmentsResult.count || 0,
            },
            recentActivity: (recentApplications || []).map((app) => ({
                id: app.id,
                type: 'application',
                candidateName: app.candidates?.full_name,
                jobTitle: app.jobs?.title,
                status: app.status,
                createdAt: app.created_at,
            })),
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map