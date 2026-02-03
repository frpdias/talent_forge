import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export interface PhpDashboardMetrics {
    org_id: string;
    tfci: {
        total_assessments: number;
        avg_score: number;
        trend: 'up' | 'down' | 'stable';
        active_cycles: number;
    };
    nr1: {
        total_assessments: number;
        high_risk_count: number;
        avg_risk_level: number;
        trend: 'up' | 'down' | 'stable';
    };
    copc: {
        total_assessments: number;
        avg_quality_score: number;
        avg_efficiency_score: number;
        trend: 'up' | 'down' | 'stable';
    };
    action_plans: {
        total: number;
        overdue: number;
        in_progress: number;
        completed_this_week: number;
    };
    employees: {
        total_active: number;
        pending_assessments: number;
    };
    updated_at: string;
}
export interface PhpNotification {
    id: string;
    org_id: string;
    type: 'alert' | 'info' | 'success' | 'warning';
    category: 'tfci' | 'nr1' | 'copc' | 'action_plan' | 'system';
    title: string;
    message: string;
    action_url?: string;
    created_at: string;
    read: boolean;
}
export interface UserPresence {
    user_id: string;
    user_name: string;
    user_avatar?: string;
    page: string;
    cursor_x?: number;
    cursor_y?: number;
    last_seen: string;
}
export declare class PhpEventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private connectedClients;
    private orgRooms;
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinOrg(client: Socket, data: {
        org_id: string;
        user_id: string;
        user_name: string;
    }): {
        success: boolean;
        users_online: UserPresence[];
        your_socket_id: string;
    };
    handleLeaveOrg(client: Socket, data: {
        org_id: string;
    }): {
        success: boolean;
    };
    handlePageChange(client: Socket, data: {
        page: string;
    }): {
        success: boolean;
    };
    handleCursorMove(client: Socket, data: {
        x: number;
        y: number;
        page: string;
    }): void;
    handleActionLock(client: Socket, data: {
        action_item_id: string;
    }): {
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    };
    handleActionUnlock(client: Socket, data: {
        action_item_id: string;
    }): {
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    };
    handleCommentAdd(client: Socket, data: {
        entity_type: 'action_plan' | 'action_item' | 'assessment';
        entity_id: string;
        content: string;
    }): {
        success: boolean;
        error: string;
        comment?: undefined;
    } | {
        success: boolean;
        comment: {
            id: string;
            entity_type: "assessment" | "action_plan" | "action_item";
            entity_id: string;
            content: string;
            author: {
                user_id: string;
                user_name: string;
            };
            created_at: string;
        };
        error?: undefined;
    };
    handleDashboardSubscribe(client: Socket, data: {
        refresh_interval_ms?: number;
    }): {
        success: boolean;
        error: string;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        error?: undefined;
    };
    handleDashboardUnsubscribe(client: Socket): {
        success: boolean;
    };
    emitDashboardUpdate(orgId: string, metrics: PhpDashboardMetrics): void;
    emitNotification(orgId: string, notification: Omit<PhpNotification, 'id' | 'created_at' | 'read'>): PhpNotification;
    emitAssessmentSubmitted(orgId: string, data: {
        module: 'tfci' | 'nr1' | 'copc';
        assessment_id: string;
        employee_name: string;
        score?: number;
    }): void;
    emitActionPlanUpdate(orgId: string, data: {
        action_plan_id: string;
        action: 'created' | 'updated' | 'completed' | 'deleted';
        title: string;
        updated_by: string;
    }): void;
    emitGoalAchieved(orgId: string, data: {
        goal_type: string;
        goal_name: string;
        achieved_value: number;
        target_value: number;
    }): void;
    private getUsersInOrg;
    getConnectedUsersCount(orgId: string): number;
    getStats(): {
        total_connections: number;
        orgs_active: number;
        connections_by_org: Record<string, number>;
    };
}
