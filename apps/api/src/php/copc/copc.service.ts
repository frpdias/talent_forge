import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  CreateCopcMetricDto,
  UpdateCopcMetricDto,
  CreateCopcCatalogDto,
} from './dto/copc-metric.dto';

@Injectable()
export class CopcService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async createMetric(dto: CreateCopcMetricDto, createdBy: string) {
    const { data, error } = await this.supabase
      .from('copc_metrics')
      .insert({
        ...dto,
        created_by: createdBy,
        metric_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async listMetrics(filters: {
    org_id: string;
    team_id?: string;
    user_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) {
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

    if (error) throw new Error(error.message);
    return data;
  }

  async getMetric(id: string) {
    const { data, error } = await this.supabase
      .from('copc_metrics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new NotFoundException('Metric not found');
    return data;
  }

  async updateMetric(id: string, dto: UpdateCopcMetricDto) {
    const { data, error } = await this.supabase
      .from('copc_metrics')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteMetric(id: string) {
    const { error } = await this.supabase
      .from('copc_metrics')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { message: 'Metric deleted successfully' };
  }

  async getDashboard(orgId: string, teamId?: string, period?: string) {
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

    if (error) throw new Error(error.message);

    // Calcular médias gerais
    const summary = this.calculateSummary(data);
    
    // Agrupar por data para trends
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

  async getSummary(orgId: string, teamId?: string) {
    let query = this.supabase
      .from('v_copc_summary')
      .select('*')
      .eq('org_id', orgId);

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

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

  async getTrends(orgId: string, teamId?: string, period?: string) {
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

    if (error) throw new Error(error.message);

    // Agrupar por semana
    const weeklyData = this.groupByWeek(data);

    return {
      org_id: orgId,
      team_id: teamId,
      period,
      trends: {
        quality: this.calculateTrend(weeklyData, 'quality_score'),
        efficiency: this.calculateTrend(weeklyData, 'process_adherence_rate'),
        effectiveness: this.calculateTrend(
          weeklyData,
          'first_call_resolution_rate',
        ),
        cx: this.calculateTrend(weeklyData, 'customer_satisfaction_score'),
        people: this.calculateTrend(weeklyData, 'engagement_score'),
      },
      weekly_data: weeklyData,
    };
  }

  async getCatalog(orgId?: string) {
    let query = this.supabase
      .from('copc_metrics_catalog')
      .select('*')
      .order('category')
      .order('metric_code');

    if (orgId) {
      query = query.or(`org_id.is.null,org_id.eq.${orgId}`);
    } else {
      query = query.is('org_id', null);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    // Agrupar por categoria
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

  async createCatalogMetric(dto: CreateCopcCatalogDto) {
    const { data, error } = await this.supabase
      .from('copc_metrics_catalog')
      .insert(dto)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // ========== Helpers ==========
  private getPeriodDays(period: string): number {
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

  private getDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  private calculateSummary(data: any[]): any {
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
      quality:
        data.reduce((sum, row) => sum + (row.avg_quality || 0), 0) /
        data.length,
      efficiency:
        data.reduce((sum, row) => sum + (row.avg_efficiency || 0), 0) /
        data.length,
      effectiveness:
        data.reduce((sum, row) => sum + (row.avg_effectiveness || 0), 0) /
        data.length,
      cx: data.reduce((sum, row) => sum + (row.avg_cx || 0), 0) / data.length,
      people:
        data.reduce((sum, row) => sum + (100 - (row.avg_absenteeism || 0)), 0) /
        data.length,
      overall:
        data.reduce((sum, row) => sum + (row.avg_copc_score || 0), 0) /
        data.length,
    };
  }

  private calculateCategoryAvg(data: any[], fields: string[]): number {
    if (data.length === 0) return 0;

    const sum = fields.reduce((total, field) => {
      return (
        total + data.reduce((rowSum, row) => rowSum + (row[field] || 0), 0)
      );
    }, 0);

    return sum / (data.length * fields.length);
  }

  private calculateOverallScore(data: any[]): number {
    if (data.length === 0) return 0;

    return (
      data.reduce((sum, row) => sum + (row.avg_copc_score || 0), 0) /
      data.length
    );
  }

  private groupByDate(data: any[]): any[] {
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

    return Object.values(grouped).map((group: any) => ({
      date: group.date,
      quality: this.avg(group.quality),
      efficiency: this.avg(group.efficiency),
      effectiveness: this.avg(group.effectiveness),
      cx: this.avg(group.cx),
      people: this.avg(group.people),
    }));
  }

  private groupByWeek(data: any[]): any[] {
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

    return Object.values(grouped).map((group: any) => ({
      week: group.week,
      start_date: group.start_date,
      quality_score: this.avgField(group.metrics, 'quality_score'),
      process_adherence_rate: this.avgField(
        group.metrics,
        'process_adherence_rate',
      ),
      first_call_resolution_rate: this.avgField(
        group.metrics,
        'first_call_resolution_rate',
      ),
      customer_satisfaction_score: this.avgField(
        group.metrics,
        'customer_satisfaction_score',
      ),
      engagement_score: this.avgField(group.metrics, 'engagement_score'),
      overall_performance_score: this.avgField(
        group.metrics,
        'overall_performance_score',
      ),
    }));
  }

  private calculateTrend(weeklyData: any[], field: string): any {
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

  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  private avg(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private avgField(items: any[], field: string): number {
    const values = items
      .map((item) => item[field])
      .filter((v) => v !== null && v !== undefined);
    return this.avg(values);
  }
}
