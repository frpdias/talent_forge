import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationStageDto, UpdateApplicationStatusDto } from './dto';
import type { JwtPayload } from '../auth/auth.service';
export declare class ApplicationsController {
    private applicationsService;
    constructor(applicationsService: ApplicationsService);
    create(dto: CreateApplicationDto, orgId: string, user: JwtPayload): Promise<{
        events: any;
        id: any;
        jobId: any;
        candidateId: any;
        currentStageId: any;
        status: any;
        score: any;
        createdBy: any;
        createdAt: any;
        updatedAt: any;
        candidate: {
            id: any;
            fullName: any;
            email: any;
            currentTitle: any;
            linkedinUrl: any;
        } | null;
        job: {
            id: any;
            title: any;
        } | null;
        currentStage: {
            id: any;
            name: any;
            position: any;
        } | null;
    }>;
    findAll(orgId: string, jobId?: string, status?: string, stageId?: string): Promise<{
        id: any;
        jobId: any;
        candidateId: any;
        currentStageId: any;
        status: any;
        score: any;
        createdBy: any;
        createdAt: any;
        updatedAt: any;
        candidate: {
            id: any;
            fullName: any;
            email: any;
            currentTitle: any;
            linkedinUrl: any;
        } | null;
        job: {
            id: any;
            title: any;
        } | null;
        currentStage: {
            id: any;
            name: any;
            position: any;
        } | null;
    }[]>;
    getKanbanBoard(jobId: string, orgId: string): Promise<{
        jobId: any;
        jobTitle: any;
        stages: {
            id: any;
            name: any;
            position: any;
            applications: {
                id: any;
                candidateId: any;
                candidateName: any;
                candidateEmail: any;
                candidateTitle: any;
                status: any;
                score: any;
                updatedAt: any;
            }[];
        }[];
    }>;
    findOne(id: string, orgId: string): Promise<{
        events: any;
        id: any;
        jobId: any;
        candidateId: any;
        currentStageId: any;
        status: any;
        score: any;
        createdBy: any;
        createdAt: any;
        updatedAt: any;
        candidate: {
            id: any;
            fullName: any;
            email: any;
            currentTitle: any;
            linkedinUrl: any;
        } | null;
        job: {
            id: any;
            title: any;
        } | null;
        currentStage: {
            id: any;
            name: any;
            position: any;
        } | null;
    }>;
    updateStage(id: string, dto: UpdateApplicationStageDto, orgId: string, user: JwtPayload): Promise<{
        events: any;
        id: any;
        jobId: any;
        candidateId: any;
        currentStageId: any;
        status: any;
        score: any;
        createdBy: any;
        createdAt: any;
        updatedAt: any;
        candidate: {
            id: any;
            fullName: any;
            email: any;
            currentTitle: any;
            linkedinUrl: any;
        } | null;
        job: {
            id: any;
            title: any;
        } | null;
        currentStage: {
            id: any;
            name: any;
            position: any;
        } | null;
    }>;
    updateStatus(id: string, dto: UpdateApplicationStatusDto, orgId: string, user: JwtPayload): Promise<{
        events: any;
        id: any;
        jobId: any;
        candidateId: any;
        currentStageId: any;
        status: any;
        score: any;
        createdBy: any;
        createdAt: any;
        updatedAt: any;
        candidate: {
            id: any;
            fullName: any;
            email: any;
            currentTitle: any;
            linkedinUrl: any;
        } | null;
        job: {
            id: any;
            title: any;
        } | null;
        currentStage: {
            id: any;
            name: any;
            position: any;
        } | null;
    }>;
    getEvents(id: string, orgId: string): Promise<{
        id: any;
        applicationId: any;
        fromStageId: any;
        toStageId: any;
        status: any;
        note: any;
        actorId: any;
        createdAt: any;
    }[]>;
    delete(id: string, orgId: string): Promise<{
        success: boolean;
    }>;
}
