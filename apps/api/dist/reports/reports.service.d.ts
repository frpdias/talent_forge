import { SupabaseService } from '../supabase/supabase.service';
export declare class ReportsService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
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
        averageScore: number;
        medianScore: any;
        scoreDistribution: {
            range: string;
            count: number;
            percentage: number;
        }[];
        traitAverages: {
            bigFive: {
                openness: number;
                conscientiousness: number;
                extraversion: number;
                agreeableness: number;
                neuroticism: number;
            };
            disc: {
                dominance: number;
                influence: number;
                steadiness: number;
                conscientiousness: number;
            };
        } | null;
    }>;
    getDashboardStats(orgId: string): Promise<{
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
}
