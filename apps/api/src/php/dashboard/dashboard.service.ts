import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PhpEventsGateway, PhpDashboardMetrics } from '../events/php-events.gateway';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private readonly supabase: SupabaseClient;
  private metricsCache = new Map<string, { data: PhpDashboardMetrics; timestamp: number }>();
  private readonly CACHE_TTL_MS = 30 * 1000; // 30 seconds

  constructor(
    private readonly configService: ConfigService,
    private readonly eventsGateway: PhpEventsGateway,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Get dashboard metrics for an organization
   */
  async getMetrics(orgId: string, forceRefresh = false): Promise<PhpDashboardMetrics> {
    // Check cache
    const cached = this.metricsCache.get(orgId);
    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data;
    }

    // Fetch fresh data
    const [tfci, nr1, copc, actionPlans, employees] = await Promise.all([
      this.getTfciMetrics(orgId),
      this.getNr1Metrics(orgId),
      this.getCopcMetrics(orgId),
      this.getActionPlanMetrics(orgId),
      this.getEmployeeMetrics(orgId),
    ]);

    const metrics: PhpDashboardMetrics = {
      org_id: orgId,
      tfci,
      nr1,
      copc,
      action_plans: actionPlans,
      employees,
      updated_at: new Date().toISOString(),
    };

    // Update cache
    this.metricsCache.set(orgId, { data: metrics, timestamp: Date.now() });

    return metrics;
  }

  /**
   * Refresh metrics and emit to connected clients
   */
  async refreshAndEmit(orgId: string): Promise<void> {
    const metrics = await this.getMetrics(orgId, true);
    this.eventsGateway.emitDashboardUpdate(orgId, metrics);
  }

  private async getTfciMetrics(orgId: string): Promise<PhpDashboardMetrics['tfci']> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: assessments, count } = await this.supabase
      .from('php_tfci_assessments')
      .select('overall_score, created_at', { count: 'exact' })
      .eq('org_id', orgId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { count: activeCycles } = await this.supabase
      .from('php_tfci_cycles')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active');

    const avgScore = assessments && assessments.length > 0
      ? assessments.reduce((sum, a) => sum + (a.overall_score || 0), 0) / assessments.length
      : 0;

    // Calculate trend (compare first half to second half)
    const trend = this.calculateTrend(assessments || [], 'overall_score');

    return {
      total_assessments: count || 0,
      avg_score: Number(avgScore.toFixed(2)),
      trend,
      active_cycles: activeCycles || 0,
    };
  }

  private async getNr1Metrics(orgId: string): Promise<PhpDashboardMetrics['nr1']> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: assessments, count } = await this.supabase
      .from('php_nr1_assessments')
      .select('risk_level, created_at', { count: 'exact' })
      .eq('org_id', orgId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const highRiskCount = assessments?.filter(a => (a.risk_level || 0) >= 3).length || 0;
    const avgRisk = assessments && assessments.length > 0
      ? assessments.reduce((sum, a) => sum + (a.risk_level || 0), 0) / assessments.length
      : 0;

    const trend = this.calculateTrend(assessments || [], 'risk_level', true);

    return {
      total_assessments: count || 0,
      high_risk_count: highRiskCount,
      avg_risk_level: Number(avgRisk.toFixed(2)),
      trend,
    };
  }

  private async getCopcMetrics(orgId: string): Promise<PhpDashboardMetrics['copc']> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: assessments, count } = await this.supabase
      .from('php_copc_assessments')
      .select('quality_score, efficiency_score, created_at', { count: 'exact' })
      .eq('org_id', orgId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const avgQuality = assessments && assessments.length > 0
      ? assessments.reduce((sum, a) => sum + (a.quality_score || 0), 0) / assessments.length
      : 0;

    const avgEfficiency = assessments && assessments.length > 0
      ? assessments.reduce((sum, a) => sum + (a.efficiency_score || 0), 0) / assessments.length
      : 0;

    const trend = this.calculateTrend(assessments || [], 'quality_score');

    return {
      total_assessments: count || 0,
      avg_quality_score: Number(avgQuality.toFixed(1)),
      avg_efficiency_score: Number(avgEfficiency.toFixed(1)),
      trend,
    };
  }

  private async getActionPlanMetrics(orgId: string): Promise<PhpDashboardMetrics['action_plans']> {
    const now = new Date().toISOString();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [total, overdue, inProgress, completedThisWeek] = await Promise.all([
      this.supabase
        .from('php_action_plans')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId),
      this.supabase
        .from('php_action_plans')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .neq('status', 'completed')
        .lt('due_date', now),
      this.supabase
        .from('php_action_plans')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'in_progress'),
      this.supabase
        .from('php_action_plans')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'completed')
        .gte('updated_at', weekAgo.toISOString()),
    ]);

    return {
      total: total.count || 0,
      overdue: overdue.count || 0,
      in_progress: inProgress.count || 0,
      completed_this_week: completedThisWeek.count || 0,
    };
  }

  private async getEmployeeMetrics(orgId: string): Promise<PhpDashboardMetrics['employees']> {
    const { count: totalActive } = await this.supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active');

    // Count employees with pending assessments (simplified)
    const { count: pendingAssessments } = await this.supabase
      .from('php_tfci_assessment_participants')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    return {
      total_active: totalActive || 0,
      pending_assessments: pendingAssessments || 0,
    };
  }

  private calculateTrend(
    data: any[],
    field: string,
    invertPositive = false,
  ): 'up' | 'down' | 'stable' {
    if (data.length < 2) return 'stable';

    // Sort by date
    const sorted = [...data].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const avgFirst = firstHalf.reduce((s, a) => s + (a[field] || 0), 0) / (firstHalf.length || 1);
    const avgSecond = secondHalf.reduce((s, a) => s + (a[field] || 0), 0) / (secondHalf.length || 1);

    const diff = avgSecond - avgFirst;
    const threshold = 0.1; // 10% change threshold

    if (Math.abs(diff) < threshold) return 'stable';

    if (invertPositive) {
      // For metrics where lower is better (like risk)
      return diff > 0 ? 'down' : 'up';
    }

    return diff > 0 ? 'up' : 'down';
  }

  /**
   * Get WebSocket connection stats
   */
  getConnectionStats() {
    return this.eventsGateway.getStats();
  }
}
