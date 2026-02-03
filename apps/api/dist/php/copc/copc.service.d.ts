import { ConfigService } from '@nestjs/config';
import { CreateCopcMetricDto, UpdateCopcMetricDto, CreateCopcCatalogDto } from './dto/copc-metric.dto';
export declare class CopcService {
    private configService;
    private supabase;
    constructor(configService: ConfigService);
    createMetric(dto: CreateCopcMetricDto, createdBy: string): Promise<any>;
    listMetrics(filters: {
        org_id: string;
        team_id?: string;
        user_id?: string;
        start_date?: string;
        end_date?: string;
        limit?: number;
    }): Promise<any[]>;
    getMetric(id: string): Promise<any>;
    updateMetric(id: string, dto: UpdateCopcMetricDto): Promise<any>;
    deleteMetric(id: string): Promise<{
        message: string;
    }>;
    getDashboard(orgId: string, teamId?: string, period?: string): Promise<{
        org_id: string;
        team_id: string | undefined;
        period: string | undefined;
        summary: any;
        trends: any[];
        details: any[];
    }>;
    getSummary(orgId: string, teamId?: string): Promise<{
        org_id: string;
        team_id: string | undefined;
        categories: {
            quality: number;
            efficiency: number;
            effectiveness: number;
            cx: number;
            people: number;
        };
        overall_score: number;
        metrics_count: any;
    }>;
    getTrends(orgId: string, teamId?: string, period?: string): Promise<{
        org_id: string;
        team_id: string | undefined;
        period: string | undefined;
        trends: {
            quality: any;
            efficiency: any;
            effectiveness: any;
            cx: any;
            people: any;
        };
        weekly_data: any[];
    }>;
    getCatalog(orgId?: string): Promise<{
        total_metrics: number;
        by_category: any;
        metrics: any[];
    }>;
    createCatalogMetric(dto: CreateCopcCatalogDto): Promise<any>;
    private getPeriodDays;
    private getDaysAgo;
    private calculateSummary;
    private calculateCategoryAvg;
    private calculateOverallScore;
    private groupByDate;
    private groupByWeek;
    private calculateTrend;
    private getWeekNumber;
    private getMonday;
    private avg;
    private avgField;
}
