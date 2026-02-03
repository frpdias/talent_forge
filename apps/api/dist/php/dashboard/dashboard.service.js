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
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
const php_events_gateway_1 = require("../events/php-events.gateway");
let DashboardService = DashboardService_1 = class DashboardService {
    constructor(configService, eventsGateway) {
        this.configService = configService;
        this.eventsGateway = eventsGateway;
        this.logger = new common_1.Logger(DashboardService_1.name);
        this.metricsCache = new Map();
        this.CACHE_TTL_MS = 30 * 1000;
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const supabaseKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && supabaseKey) {
            this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
        }
    }
    async getMetrics(orgId, forceRefresh = false) {
        const cached = this.metricsCache.get(orgId);
        if (!forceRefresh && cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
            return cached.data;
        }
        const [tfci, nr1, copc, actionPlans, employees] = await Promise.all([
            this.getTfciMetrics(orgId),
            this.getNr1Metrics(orgId),
            this.getCopcMetrics(orgId),
            this.getActionPlanMetrics(orgId),
            this.getEmployeeMetrics(orgId),
        ]);
        const metrics = {
            org_id: orgId,
            tfci,
            nr1,
            copc,
            action_plans: actionPlans,
            employees,
            updated_at: new Date().toISOString(),
        };
        this.metricsCache.set(orgId, { data: metrics, timestamp: Date.now() });
        return metrics;
    }
    async refreshAndEmit(orgId) {
        const metrics = await this.getMetrics(orgId, true);
        this.eventsGateway.emitDashboardUpdate(orgId, metrics);
    }
    async getTfciMetrics(orgId) {
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
        const trend = this.calculateTrend(assessments || [], 'overall_score');
        return {
            total_assessments: count || 0,
            avg_score: Number(avgScore.toFixed(2)),
            trend,
            active_cycles: activeCycles || 0,
        };
    }
    async getNr1Metrics(orgId) {
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
    async getCopcMetrics(orgId) {
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
    async getActionPlanMetrics(orgId) {
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
    async getEmployeeMetrics(orgId) {
        const { count: totalActive } = await this.supabase
            .from('employees')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .eq('status', 'active');
        const { count: pendingAssessments } = await this.supabase
            .from('php_tfci_assessment_participants')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending');
        return {
            total_active: totalActive || 0,
            pending_assessments: pendingAssessments || 0,
        };
    }
    calculateTrend(data, field, invertPositive = false) {
        if (data.length < 2)
            return 'stable';
        const sorted = [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const mid = Math.floor(sorted.length / 2);
        const firstHalf = sorted.slice(0, mid);
        const secondHalf = sorted.slice(mid);
        const avgFirst = firstHalf.reduce((s, a) => s + (a[field] || 0), 0) / (firstHalf.length || 1);
        const avgSecond = secondHalf.reduce((s, a) => s + (a[field] || 0), 0) / (secondHalf.length || 1);
        const diff = avgSecond - avgFirst;
        const threshold = 0.1;
        if (Math.abs(diff) < threshold)
            return 'stable';
        if (invertPositive) {
            return diff > 0 ? 'down' : 'up';
        }
        return diff > 0 ? 'up' : 'down';
    }
    getConnectionStats() {
        return this.eventsGateway.getStats();
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        php_events_gateway_1.PhpEventsGateway])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map