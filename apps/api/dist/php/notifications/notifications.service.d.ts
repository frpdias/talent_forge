import { ConfigService } from '@nestjs/config';
import { PhpEventsGateway, PhpNotification } from '../events/php-events.gateway';
export interface CreateNotificationDto {
    org_id: string;
    user_id?: string;
    type: 'alert' | 'info' | 'success' | 'warning';
    category: 'tfci' | 'nr1' | 'copc' | 'action_plan' | 'system';
    title: string;
    message: string;
    action_url?: string;
    metadata?: Record<string, unknown>;
}
export declare class NotificationsService {
    private readonly configService;
    private readonly eventsGateway;
    private readonly logger;
    private readonly supabase;
    constructor(configService: ConfigService, eventsGateway: PhpEventsGateway);
    create(dto: CreateNotificationDto): Promise<PhpNotification>;
    getUnread(orgId: string, userId?: string, limit?: number): Promise<PhpNotification[]>;
    markAsRead(notificationId: string): Promise<void>;
    markAllAsRead(orgId: string, userId?: string): Promise<number>;
    getUnreadCount(orgId: string, userId?: string): Promise<number>;
    notifyHighRiskNr1(orgId: string, employeeName: string, assessmentId: string): Promise<void>;
    notifyLowTfciScore(orgId: string, employeeName: string, score: number): Promise<void>;
    notifyActionPlanOverdue(orgId: string, planTitle: string, planId: string): Promise<void>;
    notifyActionPlanCompleted(orgId: string, planTitle: string, completedBy: string): Promise<void>;
    notifyNewAssessmentCycle(orgId: string, cycleName: string, module: string): Promise<void>;
    notifyGoalAchieved(orgId: string, goalName: string, achievedValue: number, targetValue: number): Promise<void>;
}
