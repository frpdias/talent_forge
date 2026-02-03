import { ConfigService } from '@nestjs/config';
import { PhpEventsGateway, PhpDashboardMetrics } from '../events/php-events.gateway';
export declare class DashboardService {
    private readonly configService;
    private readonly eventsGateway;
    private readonly logger;
    private readonly supabase;
    private metricsCache;
    private readonly CACHE_TTL_MS;
    constructor(configService: ConfigService, eventsGateway: PhpEventsGateway);
    getMetrics(orgId: string, forceRefresh?: boolean): Promise<PhpDashboardMetrics>;
    refreshAndEmit(orgId: string): Promise<void>;
    private getTfciMetrics;
    private getNr1Metrics;
    private getCopcMetrics;
    private getActionPlanMetrics;
    private getEmployeeMetrics;
    private calculateTrend;
    getConnectionStats(): {
        total_connections: number;
        orgs_active: number;
        connections_by_org: Record<string, number>;
    };
}
