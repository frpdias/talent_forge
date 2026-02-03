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
var ActionPlansService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionPlansService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
let ActionPlansService = ActionPlansService_1 = class ActionPlansService {
    constructor() {
        this.logger = new common_1.Logger(ActionPlansService_1.name);
        this.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
    }
    async findAll(query) {
        let queryBuilder = this.supabase
            .from('php_action_plans')
            .select(`
        *,
        items:php_action_items(*)
      `, { count: 'exact' });
        if (query.org_id) {
            queryBuilder = queryBuilder.eq('org_id', query.org_id);
        }
        if (query.team_id) {
            queryBuilder = queryBuilder.eq('team_id', query.team_id);
        }
        if (query.status) {
            queryBuilder = queryBuilder.eq('status', query.status);
        }
        if (query.triggered_by) {
            queryBuilder = queryBuilder.eq('triggered_by', query.triggered_by);
        }
        if (query.risk_level) {
            queryBuilder = queryBuilder.eq('risk_level', query.risk_level);
        }
        if (query.assigned_to) {
            queryBuilder = queryBuilder.eq('assigned_to', query.assigned_to);
        }
        queryBuilder = queryBuilder
            .order('priority', { ascending: true })
            .order('created_at', { ascending: false });
        const limit = query.limit || 50;
        const offset = query.offset || 0;
        queryBuilder = queryBuilder.range(offset, offset + limit - 1);
        const { data, error, count } = await queryBuilder;
        if (error) {
            this.logger.error('Error fetching action plans', error);
            throw error;
        }
        return { data: data || [], count: count || 0 };
    }
    async findOne(id) {
        const { data, error } = await this.supabase
            .from('php_action_plans')
            .select(`
        *,
        items:php_action_items(*)
      `)
            .eq('id', id)
            .single();
        if (error || !data) {
            this.logger.error(`Action plan not found: ${id}`, error);
            throw new common_1.NotFoundException(`Action plan with ID ${id} not found`);
        }
        return data;
    }
    async create(dto, createdBy) {
        const { data, error } = await this.supabase
            .from('php_action_plans')
            .insert({
            ...dto,
            created_by: createdBy,
            status: 'open',
        })
            .select()
            .single();
        if (error) {
            this.logger.error('Error creating action plan', error);
            throw error;
        }
        this.logger.log(`Action plan created: ${data.id} by ${createdBy}`);
        return data;
    }
    async update(id, dto, userId) {
        const updateData = {
            ...dto,
            updated_at: new Date().toISOString(),
        };
        if (dto.status === 'completed' && !updateData.completed_at) {
            updateData.completed_at = new Date().toISOString();
        }
        const { data, error } = await this.supabase
            .from('php_action_plans')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            this.logger.error(`Error updating action plan ${id}`, error);
            throw error;
        }
        this.logger.log(`Action plan updated: ${id} by ${userId}`);
        return data;
    }
    async remove(id) {
        const { error } = await this.supabase
            .from('php_action_plans')
            .delete()
            .eq('id', id);
        if (error) {
            this.logger.error(`Error deleting action plan ${id}`, error);
            throw error;
        }
        this.logger.log(`Action plan deleted: ${id}`);
    }
    async getStats(orgId) {
        const { data, error } = await this.supabase
            .from('php_action_plans')
            .select('id, status, risk_level, triggered_by, due_date, effectiveness_score')
            .eq('org_id', orgId);
        if (error) {
            this.logger.error('Error fetching action plan stats', error);
            throw error;
        }
        const plans = data || [];
        const today = new Date().toISOString().split('T')[0];
        const stats = {
            total: plans.length,
            by_status: {
                open: plans.filter(p => p.status === 'open').length,
                in_progress: plans.filter(p => p.status === 'in_progress').length,
                completed: plans.filter(p => p.status === 'completed').length,
                cancelled: plans.filter(p => p.status === 'cancelled').length,
            },
            by_risk_level: {
                low: plans.filter(p => p.risk_level === 'low').length,
                medium: plans.filter(p => p.risk_level === 'medium').length,
                high: plans.filter(p => p.risk_level === 'high').length,
                critical: plans.filter(p => p.risk_level === 'critical').length,
            },
            by_source: {
                tfci: plans.filter(p => p.triggered_by === 'tfci').length,
                nr1: plans.filter(p => p.triggered_by === 'nr1').length,
                copc: plans.filter(p => p.triggered_by === 'copc').length,
                manual: plans.filter(p => p.triggered_by === 'manual').length,
                ai: plans.filter(p => p.triggered_by === 'ai').length,
            },
            overdue_count: plans.filter(p => p.due_date &&
                p.due_date < today &&
                !['completed', 'cancelled'].includes(p.status)).length,
        };
        const completedWithScore = plans.filter(p => p.status === 'completed' &&
            p.effectiveness_score != null);
        if (completedWithScore.length > 0) {
            stats.avg_effectiveness_score =
                completedWithScore.reduce((sum, p) => sum + p.effectiveness_score, 0) /
                    completedWithScore.length;
        }
        return stats;
    }
    async getTopPriority(orgId, limit = 5) {
        const { data, error } = await this.supabase
            .from('php_action_plans')
            .select(`
        *,
        items:php_action_items(*)
      `)
            .eq('org_id', orgId)
            .in('status', ['open', 'in_progress'])
            .order('priority', { ascending: true })
            .order('risk_level', { ascending: false })
            .limit(limit);
        if (error) {
            this.logger.error('Error fetching top priority plans', error);
            throw error;
        }
        return data || [];
    }
    async findItemsByPlan(planId) {
        const { data, error } = await this.supabase
            .from('php_action_items')
            .select('*')
            .eq('action_plan_id', planId)
            .order('created_at', { ascending: true });
        if (error) {
            this.logger.error(`Error fetching items for plan ${planId}`, error);
            throw error;
        }
        return data || [];
    }
    async createItem(dto) {
        const { data, error } = await this.supabase
            .from('php_action_items')
            .insert({
            ...dto,
            status: 'open',
        })
            .select()
            .single();
        if (error) {
            this.logger.error('Error creating action item', error);
            throw error;
        }
        this.logger.log(`Action item created: ${data.id} for plan ${dto.action_plan_id}`);
        return data;
    }
    async updateItem(id, dto) {
        const updateData = {
            ...dto,
            updated_at: new Date().toISOString(),
        };
        if (dto.status === 'completed' && !updateData.completed_at) {
            updateData.completed_at = new Date().toISOString();
        }
        const { data, error } = await this.supabase
            .from('php_action_items')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            this.logger.error(`Error updating action item ${id}`, error);
            throw error;
        }
        this.logger.log(`Action item updated: ${id}`);
        return data;
    }
    async removeItem(id) {
        const { error } = await this.supabase
            .from('php_action_items')
            .delete()
            .eq('id', id);
        if (error) {
            this.logger.error(`Error deleting action item ${id}`, error);
            throw error;
        }
        this.logger.log(`Action item deleted: ${id}`);
    }
};
exports.ActionPlansService = ActionPlansService;
exports.ActionPlansService = ActionPlansService = ActionPlansService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ActionPlansService);
//# sourceMappingURL=action-plans.service.js.map