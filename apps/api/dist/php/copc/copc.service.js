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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopcService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
let CopcService = class CopcService {
    constructor(configService) {
        this.configService = configService;
        this.supabase = (0, supabase_js_1.createClient)(this.configService.get('SUPABASE_URL'), this.configService.get('SUPABASE_SERVICE_ROLE_KEY'));
    }
    async createMetric(dto, createdBy) {
        const { data, error } = await this.supabase
            .from('copc_metrics')
            .insert({
            ...dto,
            created_by: createdBy,
            metric_date: new Date().toISOString().split('T')[0],
        })
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async listMetrics(filters) {
        let query = this.supabase
            .from('copc_metrics')
            .select('*')
            .eq('org_id', filters.org_id)
            .order('metric_date', { ascending: false });
        if (filters.team_id) {
            query = query.eq('team_id', filters.team_id);
        }
        if (filters.user_id) {
            query = query.eq('user_id', filters.user_id);
        }
        if (filters.start_date) {
            query = query.gte('metric_date', filters.start_date);
        }
        if (filters.end_date) {
            query = query.lte('metric_date', filters.end_date);
        }
        if (filters.limit) {
            query = query.limit(filters.limit);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(error.message);
        return data;
    }
    async getMetric(id) {
        const { data, error } = await this.supabase
            .from('copc_metrics')
            .select('*')
            .eq('id', id)
            .single();
        if (error)
            throw new common_1.NotFoundException('Metric not found');
        return data;
    }
    async updateMetric(id, dto) {
        const { data, error } = await this.supabase
            .from('copc_metrics')
            .update(dto)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    async deleteMetric(id) {
        const { error } = await this.supabase
            .from('copc_metrics')
            .delete()
            .eq('id', id);
        if (error)
            throw new Error(error.message);
        return { message: 'Metric deleted successfully' };
    }
    async getDashboard(orgId, teamId, period) {
        const days = this.getPeriodDays(period || '30d');
        const startDate = this.getDaysAgo(days);
        let query = this.supabase
            .from('v_copc_summary')
            .select('*')
            .eq('org_id', orgId)
            .gte('metric_date', startDate);
        if (teamId) {
            query = query.eq('team_id', teamId);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(error.message);
        const summary = this.calculateSummary(data);
        const trends = this.groupByDate(data);
        return {
            org_id: orgId,
            team_id: teamId,
            period,
            summary,
            trends,
            details: data,
        };
    }
    async getSummary(orgId, teamId) {
        let query = this.supabase
            .from('v_copc_summary')
            .select('*')
            .eq('org_id', orgId);
        if (teamId) {
            query = query.eq('team_id', teamId);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(error.message);
        return {
            org_id: orgId,
            team_id: teamId,
            categories: {
                quality: this.calculateCategoryAvg(data, [
                    'avg_quality',
                    'rework_rate',
                ]),
                efficiency: this.calculateCategoryAvg(data, ['avg_efficiency']),
                effectiveness: this.calculateCategoryAvg(data, ['avg_effectiveness']),
                cx: this.calculateCategoryAvg(data, ['avg_cx']),
                people: this.calculateCategoryAvg(data, [
                    'avg_absenteeism',
                    'engagement_score',
                ]),
            },
            overall_score: this.calculateOverallScore(data),
            metrics_count: data.reduce((sum, row) => sum + row.metrics_count, 0),
        };
    }
    async getTrends(orgId, teamId, period) {
        const days = this.getPeriodDays(period || '30d');
        const startDate = this.getDaysAgo(days);
        let query = this.supabase
            .from('copc_metrics')
            .select('*')
            .eq('org_id', orgId)
            .gte('metric_date', startDate)
            .order('metric_date', { ascending: true });
        if (teamId) {
            query = query.eq('team_id', teamId);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(error.message);
        const weeklyData = this.groupByWeek(data);
        return {
            org_id: orgId,
            team_id: teamId,
            period,
            trends: {
                quality: this.calculateTrend(weeklyData, 'quality_score'),
                efficiency: this.calculateTrend(weeklyData, 'process_adherence_rate'),
                effectiveness: this.calculateTrend(weeklyData, 'first_call_resolution_rate'),
                cx: this.calculateTrend(weeklyData, 'customer_satisfaction_score'),
                people: this.calculateTrend(weeklyData, 'engagement_score'),
            },
            weekly_data: weeklyData,
        };
    }
    async getCatalog(orgId) {
        let query = this.supabase
            .from('copc_metrics_catalog')
            .select('*')
            .order('category')
            .order('metric_code');
        if (orgId) {
            query = query.or(`org_id.is.null,org_id.eq.${orgId}`);
        }
        else {
            query = query.is('org_id', null);
        }
        const { data, error } = await query;
        if (error)
            throw new Error(error.message);
        const byCategory = data.reduce((acc, metric) => {
            if (!acc[metric.category]) {
                acc[metric.category] = [];
            }
            acc[metric.category].push(metric);
            return acc;
        }, {});
        return {
            total_metrics: data.length,
            by_category: byCategory,
            metrics: data,
        };
    }
    async createCatalogMetric(dto) {
        const { data, error } = await this.supabase
            .from('copc_metrics_catalog')
            .insert(dto)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return data;
    }
    getPeriodDays(period) {
        switch (period) {
            case '7d':
                return 7;
            case '30d':
                return 30;
            case '90d':
                return 90;
            default:
                return 30;
        }
    }
    getDaysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    }
    calculateSummary(data) {
        if (data.length === 0) {
            return {
                quality: 0,
                efficiency: 0,
                effectiveness: 0,
                cx: 0,
                people: 0,
                overall: 0,
            };
        }
        return {
            quality: data.reduce((sum, row) => sum + (row.avg_quality || 0), 0) /
                data.length,
            efficiency: data.reduce((sum, row) => sum + (row.avg_efficiency || 0), 0) /
                data.length,
            effectiveness: data.reduce((sum, row) => sum + (row.avg_effectiveness || 0), 0) /
                data.length,
            cx: data.reduce((sum, row) => sum + (row.avg_cx || 0), 0) / data.length,
            people: data.reduce((sum, row) => sum + (100 - (row.avg_absenteeism || 0)), 0) /
                data.length,
            overall: data.reduce((sum, row) => sum + (row.avg_copc_score || 0), 0) /
                data.length,
        };
    }
    calculateCategoryAvg(data, fields) {
        if (data.length === 0)
            return 0;
        const sum = fields.reduce((total, field) => {
            return (total + data.reduce((rowSum, row) => rowSum + (row[field] || 0), 0));
        }, 0);
        return sum / (data.length * fields.length);
    }
    calculateOverallScore(data) {
        if (data.length === 0)
            return 0;
        return (data.reduce((sum, row) => sum + (row.avg_copc_score || 0), 0) /
            data.length);
    }
    groupByDate(data) {
        const grouped = data.reduce((acc, row) => {
            const date = row.metric_date;
            if (!acc[date]) {
                acc[date] = {
                    date,
                    quality: [],
                    efficiency: [],
                    effectiveness: [],
                    cx: [],
                    people: [],
                };
            }
            acc[date].quality.push(row.avg_quality);
            acc[date].efficiency.push(row.avg_efficiency);
            acc[date].effectiveness.push(row.avg_effectiveness);
            acc[date].cx.push(row.avg_cx);
            acc[date].people.push(100 - row.avg_absenteeism);
            return acc;
        }, {});
        return Object.values(grouped).map((group) => ({
            date: group.date,
            quality: this.avg(group.quality),
            efficiency: this.avg(group.efficiency),
            effectiveness: this.avg(group.effectiveness),
            cx: this.avg(group.cx),
            people: this.avg(group.people),
        }));
    }
    groupByWeek(data) {
        const grouped = data.reduce((acc, row) => {
            const date = new Date(row.metric_date);
            const week = this.getWeekNumber(date);
            const key = `${date.getFullYear()}-W${week}`;
            if (!acc[key]) {
                acc[key] = {
                    week: key,
                    start_date: this.getMonday(date).toISOString().split('T')[0],
                    metrics: [],
                };
            }
            acc[key].metrics.push(row);
            return acc;
        }, {});
        return Object.values(grouped).map((group) => ({
            week: group.week,
            start_date: group.start_date,
            quality_score: this.avgField(group.metrics, 'quality_score'),
            process_adherence_rate: this.avgField(group.metrics, 'process_adherence_rate'),
            first_call_resolution_rate: this.avgField(group.metrics, 'first_call_resolution_rate'),
            customer_satisfaction_score: this.avgField(group.metrics, 'customer_satisfaction_score'),
            engagement_score: this.avgField(group.metrics, 'engagement_score'),
            overall_performance_score: this.avgField(group.metrics, 'overall_performance_score'),
        }));
    }
    calculateTrend(weeklyData, field) {
        if (weeklyData.length < 2) {
            return { direction: 'stable', change: 0 };
        }
        const recent = weeklyData[weeklyData.length - 1][field] || 0;
        const previous = weeklyData[weeklyData.length - 2][field] || 0;
        const change = recent - previous;
        return {
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
            change: Math.abs(change),
            recent_value: recent,
            previous_value: previous,
        };
    }
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    }
    getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }
    avg(values) {
        if (values.length === 0)
            return 0;
        return values.reduce((sum, v) => sum + v, 0) / values.length;
    }
    avgField(items, field) {
        const values = items
            .map((item) => item[field])
            .filter((v) => v !== null && v !== undefined);
        return this.avg(values);
    }
};
exports.CopcService = CopcService;
exports.CopcService = CopcService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CopcService);
//# sourceMappingURL=copc.service.js.map