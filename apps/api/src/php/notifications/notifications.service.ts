import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PhpEventsGateway, PhpNotification } from '../events/php-events.gateway';

export interface CreateNotificationDto {
  org_id: string;
  user_id?: string; // If specific to a user
  type: 'alert' | 'info' | 'success' | 'warning';
  category: 'tfci' | 'nr1' | 'copc' | 'action_plan' | 'system';
  title: string;
  message: string;
  action_url?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly supabase: SupabaseClient;

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
   * Create and emit a notification
   */
  async create(dto: CreateNotificationDto): Promise<PhpNotification> {
    // Emit via WebSocket
    const notification = this.eventsGateway.emitNotification(dto.org_id, {
      org_id: dto.org_id,
      type: dto.type,
      category: dto.category,
      title: dto.title,
      message: dto.message,
      action_url: dto.action_url,
    });

    // Persist to database
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
    } catch (error) {
      this.logger.error('Failed to persist notification', error);
    }

    return notification;
  }

  /**
   * Get unread notifications for user/org
   */
  async getUnread(orgId: string, userId?: string, limit = 20): Promise<PhpNotification[]> {
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

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.supabase
      .from('php_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);
  }

  /**
   * Mark all notifications as read for user in org
   */
  async markAllAsRead(orgId: string, userId?: string): Promise<number> {
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

  /**
   * Get notification count (unread)
   */
  async getUnreadCount(orgId: string, userId?: string): Promise<number> {
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

  // ========== Convenience Methods for Common Notifications ==========

  async notifyHighRiskNr1(orgId: string, employeeName: string, assessmentId: string): Promise<void> {
    await this.create({
      org_id: orgId,
      type: 'alert',
      category: 'nr1',
      title: '⚠️ Alto Risco NR-1 Detectado',
      message: `${employeeName} apresentou indicadores de alto risco psicossocial`,
      action_url: `/php/nr1?assessment=${assessmentId}`,
    });
  }

  async notifyLowTfciScore(orgId: string, employeeName: string, score: number): Promise<void> {
    await this.create({
      org_id: orgId,
      type: 'warning',
      category: 'tfci',
      title: '📉 Score TFCI Baixo',
      message: `${employeeName} obteve score ${score.toFixed(1)}/5 na avaliação TFCI`,
      action_url: `/php/tfci/cycles`,
    });
  }

  async notifyActionPlanOverdue(orgId: string, planTitle: string, planId: string): Promise<void> {
    await this.create({
      org_id: orgId,
      type: 'warning',
      category: 'action_plan',
      title: '⏰ Plano de Ação Vencido',
      message: `O plano "${planTitle}" passou da data limite`,
      action_url: `/php/action-plans/${planId}`,
    });
  }

  async notifyActionPlanCompleted(orgId: string, planTitle: string, completedBy: string): Promise<void> {
    await this.create({
      org_id: orgId,
      type: 'success',
      category: 'action_plan',
      title: '✅ Plano de Ação Concluído',
      message: `"${planTitle}" foi concluído por ${completedBy}`,
    });
  }

  async notifyNewAssessmentCycle(orgId: string, cycleName: string, module: string): Promise<void> {
    await this.create({
      org_id: orgId,
      type: 'info',
      category: module as any,
      title: '🔄 Novo Ciclo de Avaliação',
      message: `O ciclo "${cycleName}" foi iniciado`,
      action_url: `/php/${module}/cycles`,
    });
  }

  async notifyGoalAchieved(orgId: string, goalName: string, achievedValue: number, targetValue: number): Promise<void> {
    await this.create({
      org_id: orgId,
      type: 'success',
      category: 'system',
      title: '🏆 Meta Atingida!',
      message: `${goalName}: ${achievedValue}/${targetValue}`,
    });

    // Also emit special goal achievement event
    this.eventsGateway.emitGoalAchieved(orgId, {
      goal_type: 'custom',
      goal_name: goalName,
      achieved_value: achievedValue,
      target_value: targetValue,
    });
  }
}
