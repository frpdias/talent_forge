import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getMetrics(orgId: string, forceRefresh?: string): Promise<import("../events/php-events.gateway").PhpDashboardMetrics>;
    refreshMetrics(orgId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getConnectionStats(): Promise<{
        timestamp: string;
        total_connections: number;
        orgs_active: number;
        connections_by_org: Record<string, number>;
    }>;
}
