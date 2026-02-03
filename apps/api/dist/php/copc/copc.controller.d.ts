import { CopcService } from './copc.service';
import { CreateCopcMetricDto, UpdateCopcMetricDto, CreateCopcCatalogDto } from './dto/copc-metric.dto';
export declare class CopcController {
    private readonly copcService;
    constructor(copcService: CopcService);
    createMetric(dto: CreateCopcMetricDto, req: any): Promise<any>;
    listMetrics(orgId: string, teamId?: string, userId?: string, startDate?: string, endDate?: string, limit?: string): Promise<any[]>;
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
}
