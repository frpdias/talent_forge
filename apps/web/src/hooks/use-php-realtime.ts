'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

// ====================
// Types
// ====================
export interface PhpNotification {
  id: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  category: 'tfci' | 'nr1' | 'copc' | 'action_plan' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  createdAt: string;
}

export interface PhpDashboardMetrics {
  tfci: {
    averageScore: number;
    completionRate: number;
    totalAssessments: number;
    pendingAssessments: number;
    trend: number;
  };
  nr1: {
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    totalRisks: number;
    criticalRisks: number;
    trend: number;
  };
  copc: {
    averageScore: number;
    minScore: number;
    maxScore: number;
    belowMinimum: number;
    trend: number;
  };
  actionPlans: {
    total: number;
    active: number;
    completed: number;
    overdue: number;
    completionRate: number;
    trend: number;
  };
  employees: {
    total: number;
    assessed: number;
    assessmentCoverage: number;
    byDepartment: Record<string, number>;
  };
  lastUpdated: string;
}

export interface UserPresence {
  userId: string;
  name: string;
  avatar?: string;
  page?: string;
  joinedAt: string;
}

export interface CursorPosition {
  userId: string;
  name: string;
  x: number;
  y: number;
  color: string;
}

export interface ActionLock {
  entityType: string;
  entityId: string;
  lockedBy: string;
  lockedByName: string;
  lockedAt: string;
}

export interface RealtimeComment {
  id: string;
  userId: string;
  userName: string;
  entityType: string;
  entityId: string;
  content: string;
  createdAt: string;
}

// ====================
// Hook Options
// ====================
interface UsePhpRealtimeOptions {
  orgId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  autoConnect?: boolean;
  enableNotificationToasts?: boolean;
  enableCursors?: boolean;
}

// ====================
// Hook State
// ====================
interface RealtimeState {
  isConnected: boolean;
  users: UserPresence[];
  cursors: Map<string, CursorPosition>;
  locks: Map<string, ActionLock>;
  dashboardMetrics: PhpDashboardMetrics | null;
  notifications: PhpNotification[];
  unreadCount: number;
}

// ====================
// Hook Return
// ====================
interface UsePhpRealtimeReturn extends RealtimeState {
  // Connection
  connect: () => void;
  disconnect: () => void;
  
  // Page tracking
  setCurrentPage: (page: string) => void;
  
  // Cursors
  updateCursor: (x: number, y: number) => void;
  
  // Locking
  lockAction: (entityType: string, entityId: string) => void;
  unlockAction: (entityType: string, entityId: string) => void;
  isLocked: (entityType: string, entityId: string) => boolean;
  getLockedBy: (entityType: string, entityId: string) => ActionLock | undefined;
  
  // Comments
  addComment: (entityType: string, entityId: string, content: string) => void;
  
  // Dashboard
  subscribeToDashboard: () => void;
  unsubscribeFromDashboard: () => void;
  
  // Notifications
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

// ====================
// API Base URL
// ====================
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }
  return 'http://localhost:3001';
};

// ====================
// Main Hook
// ====================
export function usePhpRealtime(options: UsePhpRealtimeOptions): UsePhpRealtimeReturn {
  const {
    orgId,
    userId,
    userName,
    userAvatar,
    autoConnect = true,
    enableNotificationToasts = true,
    enableCursors = false,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    users: [],
    cursors: new Map(),
    locks: new Map(),
    dashboardMetrics: null,
    notifications: [],
    unreadCount: 0,
  });

  // ====================
  // Socket Connection
  // ====================
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(`${getApiUrl()}/php`, {
      transports: ['websocket', 'polling'] as string[],
      query: {
        userId,
        userName,
        userAvatar,
        orgId,
      },
    });

    socket.on('connect', () => {
      console.log('[PhpRealtime] Connected');
      setState(prev => ({ ...prev, isConnected: true }));
      
      // Join org room
      socket.emit('join:org', { orgId, userId, name: userName, avatar: userAvatar });
    });

    socket.on('disconnect', () => {
      console.log('[PhpRealtime] Disconnected');
      setState(prev => ({ ...prev, isConnected: false }));
    });

    socket.on('connect_error', (error) => {
      console.error('[PhpRealtime] Connection error:', error);
    });

    // User events
    socket.on('user:joined', (user: UserPresence) => {
      setState(prev => ({
        ...prev,
        users: [...prev.users.filter(u => u.userId !== user.userId), user],
      }));
      
      if (enableNotificationToasts && user.userId !== userId) {
        toast.info(`${user.name} entrou`);
      }
    });

    socket.on('user:left', ({ userId: leftUserId }: { userId: string }) => {
      setState(prev => ({
        ...prev,
        users: prev.users.filter(u => u.userId !== leftUserId),
        cursors: new Map([...prev.cursors].filter(([key]) => key !== leftUserId)),
      }));
    });

    socket.on('user:page_changed', ({ userId: changedUserId, page }: { userId: string; page: string }) => {
      setState(prev => ({
        ...prev,
        users: prev.users.map(u => 
          u.userId === changedUserId ? { ...u, page } : u
        ),
      }));
    });

    // Cursor events
    if (enableCursors) {
      socket.on('cursor:update', (cursor: CursorPosition) => {
        if (cursor.userId === userId) return;
        
        setState(prev => ({
          ...prev,
          cursors: new Map(prev.cursors).set(cursor.userId, cursor),
        }));
      });
    }

    // Lock events
    socket.on('action:locked', (lock: ActionLock) => {
      const key = `${lock.entityType}:${lock.entityId}`;
      setState(prev => ({
        ...prev,
        locks: new Map(prev.locks).set(key, lock),
      }));
    });

    socket.on('action:unlocked', ({ entityType, entityId }: { entityType: string; entityId: string }) => {
      const key = `${entityType}:${entityId}`;
      setState(prev => {
        const newLocks = new Map(prev.locks);
        newLocks.delete(key);
        return { ...prev, locks: newLocks };
      });
    });

    // Comment events
    socket.on('comment:new', (comment: RealtimeComment) => {
      if (enableNotificationToasts && comment.userId !== userId) {
        toast.info(`${comment.userName} comentou`);
      }
    });

    // Dashboard events
    socket.on('dashboard:update', (metrics: PhpDashboardMetrics) => {
      setState(prev => ({ ...prev, dashboardMetrics: metrics }));
    });

    // Notification events
    socket.on('notification', (notification: PhpNotification) => {
      setState(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications].slice(0, 50),
        unreadCount: prev.unreadCount + 1,
      }));

      if (enableNotificationToasts) {
        const toastFn = {
          alert: toast.error,
          warning: toast.warning,
          success: toast.success,
          info: toast.info,
        }[notification.type] || toast;

        toastFn(notification.title, {
          description: notification.message,
          action: notification.actionUrl
            ? {
                label: 'Ver',
                onClick: () => window.location.href = notification.actionUrl!,
              }
            : undefined,
        });
      }
    });

    // Assessment and action plan events
    socket.on('assessment:submitted', ({ employeeId, employeeName }: { employeeId: string; employeeName: string }) => {
      if (enableNotificationToasts) {
        toast.success(`Avaliação concluída`, {
          description: `${employeeName} completou uma avaliação`,
        });
      }
    });

    socket.on('action_plan:update', ({ planId, status, title }: { planId: string; status: string; title: string }) => {
      if (enableNotificationToasts) {
        toast.info(`Plano de ação atualizado`, {
          description: `${title} - ${status}`,
        });
      }
    });

    socket.on('goal:achieved', ({ employeeName, goalType }: { employeeName: string; goalType: string }) => {
      if (enableNotificationToasts) {
        toast.success(`🎯 Meta alcançada!`, {
          description: `${employeeName} atingiu meta de ${goalType}`,
        });
      }
    });

    socketRef.current = socket;
  }, [orgId, userId, userName, userAvatar, enableNotificationToasts, enableCursors]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave:org', { orgId });
      socketRef.current.disconnect();
      socketRef.current = null;
      setState(prev => ({
        ...prev,
        isConnected: false,
        users: [],
        cursors: new Map(),
        locks: new Map(),
      }));
    }
  }, [orgId]);

  // ====================
  // Page Tracking
  // ====================
  const setCurrentPage = useCallback((page: string) => {
    socketRef.current?.emit('page:change', { page });
  }, []);

  // ====================
  // Cursor Tracking
  // ====================
  const updateCursor = useCallback((x: number, y: number) => {
    if (!enableCursors) return;
    socketRef.current?.emit('cursor:move', { x, y });
  }, [enableCursors]);

  // ====================
  // Locking
  // ====================
  const lockAction = useCallback((entityType: string, entityId: string) => {
    socketRef.current?.emit('action:lock', { entityType, entityId });
  }, []);

  const unlockAction = useCallback((entityType: string, entityId: string) => {
    socketRef.current?.emit('action:unlock', { entityType, entityId });
  }, []);

  const isLocked = useCallback((entityType: string, entityId: string) => {
    const key = `${entityType}:${entityId}`;
    return state.locks.has(key);
  }, [state.locks]);

  const getLockedBy = useCallback((entityType: string, entityId: string) => {
    const key = `${entityType}:${entityId}`;
    return state.locks.get(key);
  }, [state.locks]);

  // ====================
  // Comments
  // ====================
  const addComment = useCallback((entityType: string, entityId: string, content: string) => {
    socketRef.current?.emit('comment:add', { entityType, entityId, content });
  }, []);

  // ====================
  // Dashboard
  // ====================
  const subscribeToDashboard = useCallback(() => {
    socketRef.current?.emit('dashboard:subscribe');
  }, []);

  const unsubscribeFromDashboard = useCallback(() => {
    socketRef.current?.emit('dashboard:unsubscribe');
  }, []);

  // ====================
  // Notifications
  // ====================
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await fetch(`${getApiUrl()}/api/v1/php/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== notificationId),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    } catch (error) {
      console.error('[PhpRealtime] Failed to mark notification as read:', error);
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await fetch(`${getApiUrl()}/api/v1/php/notifications/${orgId}/read-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      setState(prev => ({
        ...prev,
        notifications: [],
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('[PhpRealtime] Failed to mark all notifications as read:', error);
    }
  }, [orgId]);

  // ====================
  // Auto-connect Effect
  // ====================
  useEffect(() => {
    if (autoConnect && orgId && userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, orgId, userId, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    setCurrentPage,
    updateCursor,
    lockAction,
    unlockAction,
    isLocked,
    getLockedBy,
    addComment,
    subscribeToDashboard,
    unsubscribeFromDashboard,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };
}
