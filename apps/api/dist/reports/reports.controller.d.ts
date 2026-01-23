import { ReportsService } from './reports.service';
export declare class ReportsController {
    private reportsService;
    constructor(reportsService: ReportsService);
    getDashboard(orgId: string): Promise<{
        stats: {
            totalJobs: number;
            openJobs: number;
            totalCandidates: number;
            totalApplications: number;
            totalAssessments: number;
        };
        recentActivity: {
            id: any;
            type: string;
            candidateName: any;
            jobTitle: any;
            status: any;
            createdAt: any;
        }[];
    }>;
    getPipelineReport(orgId: string, jobId?: string): Promise<{
        jobId: any;
        jobTitle: any;
        jobStatus: any;
        totalApplications: any;
        stages: {
            stageId: any;
            stageName: any;
            position: any;
            count: any;
            percentage: number;
        }[];
        conversions: number[];
        statusDistribution: {
            applied: any;
            in_process: any;
            hired: any;
            rejected: any;
        };
        averageDaysInPipeline: number;
        hireRate: number;
    } | {
        jobId: any;
        jobTitle: any;
        jobStatus: any;
        totalApplications: any;
        stages: {
            stageId: any;
            stageName: any;
            position: any;
            count: any;
            percentage: number;
        }[];
        conversions: number[];
        statusDistribution: {
            applied: any;
            in_process: any;
            hired: any;
            rejected: any;
        };
        averageDaysInPipeline: number;
        hireRate: number;
    }[]>;
    getAssessmentsReport(orgId: string, jobId?: string): Promise<{
        totalAssessments: number;
        completedAssessments: number;
        byType: Record<string, number>;
        recentAssessments: {
            id: any;
            type: any;
            status: any;
            createdAt: any;
            job: any;
        }[];
    }>;
}
