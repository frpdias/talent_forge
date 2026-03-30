'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, AlertCircle, UserPlus, FileText, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'application' | 'assessment' | 'message' | 'system' | 'feature';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
}

// Notificações locais de novidades (sem banco de dados)
const LOCAL_FEATURE_NOTIFICATIONS: Omit<Notification, 'read'>[] = [
  {
    id: 'feature_publisher_channels_2026-03-30',
    type: 'feature',
    title: '🚀 Publicação em múltiplos canais',
    message: 'Configure Gupy e Vagas.com em Configurações → Canais de Publicação e publique vagas automaticamente.',
    created_at: '2026-03-30T10:00:00.000Z',
    action_url: '/dashboard/settings/channels',
  },
];

function getLocalNotifications(): Notification[] {
  return LOCAL_FEATURE_NOTIFICATIONS.map((n) => ({
    ...n,
    read: !!localStorage.getItem(`tf_notif_read_${n.id}`),
  }));
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    let channelRef: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Carregar notificações do banco
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        // Mesclar notificações locais (novidades) + banco
        const local = getLocalNotifications();
        const db: Notification[] = data || [];
        const merged = [...local, ...db];

        setNotifications(merged);
        setUnreadCount(merged.filter((n) => !n.read).length);

        // Realtime filtrado por user_id
        channelRef = supabase
          .channel(`notifications:${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const newNotification = payload.new as Notification;
              setNotifications((prev) => [newNotification, ...prev]);
              setUnreadCount((prev) => prev + 1);

              // Notificação nativa do navegador
              if ('Notification' in window && Notification.permission === 'granted') {
                new window.Notification(newNotification.title, {
                  body: newNotification.message,
                  icon: '/logo.png',
                });
              }
            }
          )
          .subscribe();

        // Solicitar permissão para notificações nativas
        if ('Notification' in window && Notification.permission === 'default') {
          window.Notification.requestPermission();
        }
      } finally {
        setLoading(false);
      }
    }

    init();

    return () => {
      if (channelRef) supabase.removeChannel(channelRef);
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    const isLocal = LOCAL_FEATURE_NOTIFICATIONS.some((n) => n.id === notificationId);
    if (isLocal) {
      localStorage.setItem(`tf_notif_read_${notificationId}`, '1');
    } else {
      await supabaseRef.current
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabaseRef.current.auth.getUser();
    if (!user) return;

    // Marcar locais como lidas
    LOCAL_FEATURE_NOTIFICATIONS.forEach((n) => {
      localStorage.setItem(`tf_notif_read_${n.id}`, '1');
    });

    // Marcar do banco
    await supabaseRef.current
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case 'assessment':
        return <FileText className="w-5 h-5 text-green-600" />;
      case 'message':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'feature':
        return <Sparkles className="w-5 h-5 text-[#10B981]" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-150 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Notificações</h3>
                <p className="text-xs text-gray-500">
                  {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  Carregando...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                        if (notification.action_url) {
                          window.location.href = notification.action_url;
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        <div className="shrink-0 mt-1">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm text-gray-900">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Ver todas as notificações
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
