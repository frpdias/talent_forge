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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
const php_events_gateway_1 = require("../events/php-events.gateway");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(configService, eventsGateway) {
        this.configService = configService;
        this.eventsGateway = eventsGateway;
        this.logger = new common_1.Logger(NotificationsService_1.name);
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const supabaseKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && supabaseKey) {
            this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
        }
    }
    async create(dto) {
        const notification = this.eventsGateway.emitNotification(dto.org_id, {
            org_id: dto.org_id,
            type: dto.type,
            category: dto.category,
            title: dto.title,
            message: dto.message,
            action_url: dto.action_url,
        });
        try {
            await this.supabase.from('php_notifications').insert({
                id: notification.id,
                org_id: dto.org_id,
                user_id: dto.user_id,
                type: dto.type,
                category: dto.category,
                title: dto.title,
                message: dto.message,
                action_url: dto.action_url,
                metadata: dto.metadata || {},
                read: false,
                created_at: notification.created_at,
            });
        }
        catch (error) {
            this.logger.error('Failed to persist notification', error);
        }
        return notification;
    }
    async getUnread(orgId, userId, limit = 20) {
        let query = this.supabase
            .from('php_notifications')
            .select('*')
            .eq('org_id', orgId)
            .eq('read', false)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (userId) {
            query = query.or(`user_id.eq.${userId},user_id.is.null`);
        }
        const { data, error } = await query;
        if (error) {
            this.logger.error('Failed to fetch notifications', error);
            return [];
        }
        return (data || []).map(row => ({
            id: row.id,
            org_id: row.org_id,
            type: row.type,
            category: row.category,
            title: row.title,
            message: row.message,
            action_url: row.action_url,
            created_at: row.created_at,
            read: row.read,
        }));
    }
    async markAsRead(notificationId) {
        await this.supabase
            .from('php_notifications')
            .update({ read: true, read_at: new Date().toISOString() })
            .eq('id', notificationId);
    }
    async markAllAsRead(orgId, userId) {
        let query = this.supabase
            .from('php_notifications')
            .update({ read: true, read_at: new Date().toISOString() })
            .eq('org_id', orgId)
            .eq('read', false);
        if (userId) {
            query = query.or(`user_id.eq.${userId},user_id.is.null`);
        }
        const { count } = await query;
        return count || 0;
    }
    async getUnreadCount(orgId, userId) {
        let query = this.supabase
            .from('php_notifications')
            .select('id', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .eq('read', false);
        if (userId) {
            query = query.or(`user_id.eq.${userId},user_id.is.null`);
        }
        const { count } = await query;
        return count || 0;
    }
    async notifyHighRiskNr1(orgId, employeeName, assessmentId) {
        await this.create({
            org_id: orgId,
            type: 'alert',
            category: 'nr1',
            title: '⚠️ Alto Risco NR-1 Detectado',
            message: `${employeeName} apresentou indicadores de alto risco psicossocial`,
            action_url: `/php/nr1?assessment=${assessmentId}`,
        });
    }
    async notifyLowTfciScore(orgId, employeeName, score) {
        await this.create({
            org_id: orgId,
            type: 'warning',
            category: 'tfci',
            title: '📉 Score TFCI Baixo',
            message: `${employeeName} obteve score ${score.toFixed(1)}/5 na avaliação TFCI`,
            action_url: `/php/tfci/cycles`,
        });
    }
    async notifyActionPlanOverdue(orgId, planTitle, planId) {
        await this.create({
            org_id: orgId,
            type: 'warning',
            category: 'action_plan',
            title: '⏰ Plano de Ação Vencido',
            message: `O plano "${planTitle}" passou da data limite`,
            action_url: `/php/action-plans/${planId}`,
        });
    }
    async notifyActionPlanCompleted(orgId, planTitle, completedBy) {
        await this.create({
            org_id: orgId,
            type: 'success',
            category: 'action_plan',
            title: '✅ Plano de Ação Concluído',
            message: `"${planTitle}" foi concluído por ${completedBy}`,
        });
    }
    async notifyNewAssessmentCycle(orgId, cycleName, module) {
        await this.create({
            org_id: orgId,
            type: 'info',
            category: module,
            title: '🔄 Novo Ciclo de Avaliação',
            message: `O ciclo "${cycleName}" foi iniciado`,
            action_url: `/php/${module}/cycles`,
        });
    }
    async notifyGoalAchieved(orgId, goalName, achievedValue, targetValue) {
        await this.create({
            org_id: orgId,
            type: 'success',
            category: 'system',
            title: '🏆 Meta Atingida!',
            message: `${goalName}: ${achievedValue}/${targetValue}`,
        });
        this.eventsGateway.emitGoalAchieved(orgId, {
            goal_type: 'custom',
            goal_name: goalName,
            achieved_value: achievedValue,
            target_value: targetValue,
        });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        php_events_gateway_1.PhpEventsGateway])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map