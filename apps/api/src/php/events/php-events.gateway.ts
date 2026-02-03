import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

// ========== Types ==========

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

interface ConnectedClient {
  socket_id: string;
  user_id: string;
  user_name: string;
  org_id: string;
  page: string;
  joined_at: Date;
}

// ========== Gateway ==========

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/php',
  transports: ['websocket', 'polling'],
})
@Injectable()
export class PhpEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PhpEventsGateway.name);
  private connectedClients = new Map<string, ConnectedClient>();
  private orgRooms = new Map<string, Set<string>>(); // org_id -> socket_ids

  // ========== Lifecycle ==========

  afterInit(server: Server) {
    this.logger.log('PHP WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      // Remove from org room
      const orgRoom = this.orgRooms.get(clientInfo.org_id);
      if (orgRoom) {
        orgRoom.delete(client.id);
        if (orgRoom.size === 0) {
          this.orgRooms.delete(clientInfo.org_id);
        }
      }

      // Notify others in org about user leaving
      this.server.to(`org:${clientInfo.org_id}`).emit('user:left', {
        user_id: clientInfo.user_id,
        user_name: clientInfo.user_name,
      });

      this.connectedClients.delete(client.id);
      this.logger.log(`Client disconnected: ${client.id} (${clientInfo.user_name})`);
    }
  }

  // ========== Authentication & Room Joining ==========

  @SubscribeMessage('join:org')
  handleJoinOrg(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { org_id: string; user_id: string; user_name: string },
  ) {
    const { org_id, user_id, user_name } = data;

    // Join org room
    client.join(`org:${org_id}`);

    // Track client
    this.connectedClients.set(client.id, {
      socket_id: client.id,
      user_id,
      user_name,
      org_id,
      page: 'dashboard',
      joined_at: new Date(),
    });

    // Track org room
    if (!this.orgRooms.has(org_id)) {
      this.orgRooms.set(org_id, new Set());
    }
    this.orgRooms.get(org_id)!.add(client.id);

    // Notify others
    client.to(`org:${org_id}`).emit('user:joined', {
      user_id,
      user_name,
      joined_at: new Date().toISOString(),
    });

    // Return current users in org
    const usersInOrg = this.getUsersInOrg(org_id);

    this.logger.log(`User ${user_name} joined org ${org_id}`);

    return {
      success: true,
      users_online: usersInOrg,
      your_socket_id: client.id,
    };
  }

  @SubscribeMessage('leave:org')
  handleLeaveOrg(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { org_id: string },
  ) {
    client.leave(`org:${data.org_id}`);
    this.logger.log(`Client ${client.id} left org ${data.org_id}`);
    return { success: true };
  }

  // ========== Page Tracking (Collaborative) ==========

  @SubscribeMessage('page:change')
  handlePageChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { page: string },
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      clientInfo.page = data.page;

      // Notify others in org
      this.server.to(`org:${clientInfo.org_id}`).emit('user:page_changed', {
        user_id: clientInfo.user_id,
        user_name: clientInfo.user_name,
        page: data.page,
      });
    }
    return { success: true };
  }

  @SubscribeMessage('cursor:move')
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { x: number; y: number; page: string },
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      // Broadcast to same org (except sender)
      client.to(`org:${clientInfo.org_id}`).emit('cursor:update', {
        user_id: clientInfo.user_id,
        user_name: clientInfo.user_name,
        x: data.x,
        y: data.y,
        page: data.page,
      });
    }
  }

  // ========== Action Item Locking ==========

  @SubscribeMessage('action:lock')
  handleActionLock(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { action_item_id: string },
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) return { success: false, error: 'Not authenticated' };

    // Broadcast lock to org
    this.server.to(`org:${clientInfo.org_id}`).emit('action:locked', {
      action_item_id: data.action_item_id,
      locked_by: {
        user_id: clientInfo.user_id,
        user_name: clientInfo.user_name,
      },
      locked_at: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('action:unlock')
  handleActionUnlock(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { action_item_id: string },
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) return { success: false, error: 'Not authenticated' };

    // Broadcast unlock to org
    this.server.to(`org:${clientInfo.org_id}`).emit('action:unlocked', {
      action_item_id: data.action_item_id,
    });

    return { success: true };
  }

  // ========== Comments (Real-time) ==========

  @SubscribeMessage('comment:add')
  handleCommentAdd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      entity_type: 'action_plan' | 'action_item' | 'assessment';
      entity_id: string;
      content: string;
    },
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) return { success: false, error: 'Not authenticated' };

    const comment = {
      id: `comment_${Date.now()}`,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      content: data.content,
      author: {
        user_id: clientInfo.user_id,
        user_name: clientInfo.user_name,
      },
      created_at: new Date().toISOString(),
    };

    // Broadcast to org
    this.server.to(`org:${clientInfo.org_id}`).emit('comment:new', comment);

    return { success: true, comment };
  }

  // ========== Dashboard Subscription ==========

  @SubscribeMessage('dashboard:subscribe')
  handleDashboardSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { refresh_interval_ms?: number },
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) return { success: false, error: 'Not authenticated' };

    // Join dashboard-specific room
    client.join(`dashboard:${clientInfo.org_id}`);

    this.logger.log(`Client ${client.id} subscribed to dashboard updates`);

    return { 
      success: true,
      message: 'Subscribed to dashboard updates',
    };
  }

  @SubscribeMessage('dashboard:unsubscribe')
  handleDashboardUnsubscribe(@ConnectedSocket() client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      client.leave(`dashboard:${clientInfo.org_id}`);
    }
    return { success: true };
  }

  // ========== Server-side Emit Methods (called by services) ==========

  /**
   * Emit updated dashboard metrics to all subscribers in an org
   */
  emitDashboardUpdate(orgId: string, metrics: PhpDashboardMetrics) {
    this.server.to(`dashboard:${orgId}`).emit('dashboard:update', {
      metrics,
      updated_at: new Date().toISOString(),
    });
    this.logger.debug(`Dashboard update emitted to org ${orgId}`);
  }

  /**
   * Emit a notification to all users in an org
   */
  emitNotification(orgId: string, notification: Omit<PhpNotification, 'id' | 'created_at' | 'read'>) {
    const fullNotification: PhpNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      created_at: new Date().toISOString(),
      read: false,
    };

    this.server.to(`org:${orgId}`).emit('notification', fullNotification);
    this.logger.log(`Notification emitted to org ${orgId}: ${notification.title}`);

    return fullNotification;
  }

  /**
   * Emit when a new assessment is submitted
   */
  emitAssessmentSubmitted(orgId: string, data: {
    module: 'tfci' | 'nr1' | 'copc';
    assessment_id: string;
    employee_name: string;
    score?: number;
  }) {
    this.server.to(`org:${orgId}`).emit('assessment:submitted', {
      ...data,
      submitted_at: new Date().toISOString(),
    });

    // Also emit notification if critical
    if (data.module === 'nr1' && data.score && data.score >= 3) {
      this.emitNotification(orgId, {
        org_id: orgId,
        type: 'alert',
        category: 'nr1',
        title: '⚠️ Alto Risco NR-1 Detectado',
        message: `${data.employee_name} apresentou score de alto risco na avaliação NR-1`,
        action_url: `/php/nr1?assessment=${data.assessment_id}`,
      });
    }
  }

  /**
   * Emit when an action plan status changes
   */
  emitActionPlanUpdate(orgId: string, data: {
    action_plan_id: string;
    action: 'created' | 'updated' | 'completed' | 'deleted';
    title: string;
    updated_by: string;
  }) {
    this.server.to(`org:${orgId}`).emit('action_plan:update', {
      ...data,
      updated_at: new Date().toISOString(),
    });

    if (data.action === 'completed') {
      this.emitNotification(orgId, {
        org_id: orgId,
        type: 'success',
        category: 'action_plan',
        title: '🎉 Plano de Ação Concluído',
        message: `"${data.title}" foi marcado como concluído por ${data.updated_by}`,
        action_url: `/php/action-plans/${data.action_plan_id}`,
      });
    }
  }

  /**
   * Emit when a goal/target is achieved
   */
  emitGoalAchieved(orgId: string, data: {
    goal_type: string;
    goal_name: string;
    achieved_value: number;
    target_value: number;
  }) {
    this.server.to(`org:${orgId}`).emit('goal:achieved', {
      ...data,
      achieved_at: new Date().toISOString(),
    });

    this.emitNotification(orgId, {
      org_id: orgId,
      type: 'success',
      category: 'system',
      title: '🏆 Meta Atingida!',
      message: `${data.goal_name}: ${data.achieved_value}/${data.target_value}`,
    });
  }

  // ========== Utility Methods ==========

  private getUsersInOrg(orgId: string): UserPresence[] {
    const users: UserPresence[] = [];
    const socketIds = this.orgRooms.get(orgId);
    
    if (socketIds) {
      for (const socketId of socketIds) {
        const client = this.connectedClients.get(socketId);
        if (client) {
          users.push({
            user_id: client.user_id,
            user_name: client.user_name,
            page: client.page,
            last_seen: new Date().toISOString(),
          });
        }
      }
    }

    return users;
  }

  getConnectedUsersCount(orgId: string): number {
    return this.orgRooms.get(orgId)?.size || 0;
  }

  getStats(): {
    total_connections: number;
    orgs_active: number;
    connections_by_org: Record<string, number>;
  } {
    const connectionsByOrg: Record<string, number> = {};
    
    for (const [orgId, sockets] of this.orgRooms) {
      connectionsByOrg[orgId] = sockets.size;
    }

    return {
      total_connections: this.connectedClients.size,
      orgs_active: this.orgRooms.size,
      connections_by_org: connectionsByOrg,
    };
  }
}
