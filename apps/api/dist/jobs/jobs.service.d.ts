import { SupabaseService } from '../supabase/supabase.service';
import { CreateJobDto, UpdateJobDto, CreatePipelineStageDto, UpdatePipelineStageDto } from './dto';
export declare class JobsService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    create(dto: CreateJobDto, orgId: string, userId: string): Promise<{
        stages: any;
        id: any;
        orgId: any;
        title: any;
        description: any;
        location: any;
        salaryMin: any;
        salaryMax: any;
        employmentType: any;
        seniority: any;
        status: any;
        createdBy: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findAll(orgId: string, query: {
        status?: string;
        search?: string;
    }): Promise<{
        stagesCount: any;
        applicationsCount: any;
        id: any;
        orgId: any;
        title: any;
        description: any;
        location: any;
        salaryMin: any;
        salaryMax: any;
        employmentType: any;
        seniority: any;
        status: any;
        createdBy: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    findOne(id: string, orgId: string): Promise<{
        stages: any;
        id: any;
        orgId: any;
        title: any;
        description: any;
        location: any;
        salaryMin: any;
        salaryMax: any;
        employmentType: any;
        seniority: any;
        status: any;
        createdBy: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateJobDto, orgId: string): Promise<{
        stages: any;
        id: any;
        orgId: any;
        title: any;
        description: any;
        location: any;
        salaryMin: any;
        salaryMax: any;
        employmentType: any;
        seniority: any;
        status: any;
        createdBy: any;
        createdAt: any;
        updatedAt: any;
    }>;
    delete(id: string, orgId: string): Promise<{
        success: boolean;
    }>;
    createStage(jobId: string, dto: CreatePipelineStageDto, orgId: string): Promise<{
        id: any;
        jobId: any;
        name: any;
        position: any;
    }>;
    updateStage(jobId: string, stageId: string, dto: UpdatePipelineStageDto, orgId: string): Promise<{
        id: any;
        jobId: any;
        name: any;
        position: any;
    }>;
    deleteStage(jobId: string, stageId: string, orgId: string): Promise<{
        success: boolean;
    }>;
    private mapToResponse;
}
