import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(orgId: string, userId?: string, limit?: number): Promise<{
        org_id: string;
        count: number;
        notifications: import("../events/php-events.gateway").PhpNotification[];
    }>;
    getUnreadCount(orgId: string, userId?: string): Promise<{
        org_id: string;
        unread_count: number;
    }>;
    markAsRead(notificationId: string): Promise<{
        success: boolean;
    }>;
    markAllAsRead(orgId: string, userId?: string): Promise<{
        success: boolean;
        marked_count: number;
    }>;
}
