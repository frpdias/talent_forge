'use client';

import React from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import type { PhpNotification } from '@/hooks/use-php-realtime';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ====================
// Types
// ====================
interface NotificationBellProps {
  notifications: PhpNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick?: (notification: PhpNotification) => void;
}

// ====================
// Category Icons
// ====================
const categoryIcons: Record<string, string> = {
  tfci: '📊',
  nr1: '⚠️',
  copc: '📈',
  action_plan: '📋',
  system: '🔔',
};

// ====================
// Type Colors
// ====================
const typeColors: Record<string, { bg: string; border: string; dot: string }> = {
  alert: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  success: { bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
};

// ====================
// Component
// ====================
export function NotificationBell({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: PhpNotification) => {
    onNotificationClick?.(notification);
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    onMarkAsRead(notification.id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[480px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Notificações</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  onMarkAllAsRead();
                  setIsOpen(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <CheckCheck className="h-4 w-4" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notification) => {
                  const colors = typeColors[notification.type] || typeColors.info;
                  
                  return (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${colors.bg} border-l-4 ${colors.border}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Category Icon */}
                        <span className="text-lg">
                          {categoryIcons[notification.category] || '🔔'}
                        </span>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(notification.id);
                              }}
                              className="p-1 hover:bg-gray-200 rounded-full flex-shrink-0"
                              title="Marcar como lida"
                            >
                              <X className="h-3.5 w-3.5 text-gray-400" />
                            </button>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                            
                            {notification.actionUrl && (
                              <span className="text-xs text-blue-600">Ver detalhes →</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ====================
// User Presence Avatars
// ====================
interface UserPresenceAvatarsProps {
  users: Array<{
    userId: string;
    name: string;
    avatar?: string;
    page?: string;
  }>;
  currentUserId: string;
  maxVisible?: number;
}

export function UserPresenceAvatars({
  users,
  currentUserId,
  maxVisible = 5,
}: UserPresenceAvatarsProps) {
  const otherUsers = users.filter(u => u.userId !== currentUserId);
  const visibleUsers = otherUsers.slice(0, maxVisible);
  const hiddenCount = Math.max(0, otherUsers.length - maxVisible);

  if (otherUsers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center -space-x-2">
      {visibleUsers.map((user) => (
        <div
          key={user.userId}
          className="relative group"
          title={user.name}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-8 w-8 rounded-full border-2 border-white ring-2 ring-green-400"
            />
          ) : (
            <div className="h-8 w-8 rounded-full border-2 border-white ring-2 ring-green-400 bg-gray-200 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                {user.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Online indicator */}
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-white rounded-full" />
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            {user.name}
            {user.page && <span className="text-gray-400 ml-1">• {user.page}</span>}
          </div>
        </div>
      ))}
      
      {hiddenCount > 0 && (
        <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-600">+{hiddenCount}</span>
        </div>
      )}
    </div>
  );
}

// ====================
// Connection Status
// ====================
interface ConnectionStatusProps {
  isConnected: boolean;
  onReconnect?: () => void;
}

export function ConnectionStatus({ isConnected, onReconnect }: ConnectionStatusProps) {
  if (isConnected) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        <span className="hidden sm:inline">Conectado</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 bg-red-500 rounded-full" />
      <span className="text-sm text-gray-500 hidden sm:inline">Desconectado</span>
      {onReconnect && (
        <button
          onClick={onReconnect}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          Reconectar
        </button>
      )}
    </div>
  );
}
