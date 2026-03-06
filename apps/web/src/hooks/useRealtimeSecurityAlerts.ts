import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook para notificações em tempo real de eventos de segurança
 * Prioridade: P2
 * 
 * Usa Supabase Realtime para receber eventos críticos/altos
 * e exibir notificações instantâneas para admins
 */
export function useRealtimeSecurityAlerts() {
  useEffect(() => {
    const supabase = createClient();
    
    // Canal para eventos de segurança
    const securityChannel = supabase
      .channel('security-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events',
          filter: 'severity=in.(critical,high)'
        },
        (payload) => {
          const event = payload.new as {
            id: string;
            type: string;
            severity: 'critical' | 'high';
            details: Record<string, any>;
            created_at: string;
          };

          // Notificação nativa do navegador
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🚨 Alerta de Segurança', {
              body: `${event.severity === 'critical' ? 'CRÍTICO' : 'ALTO'}: ${event.type}`,
              icon: '/favicon.ico',
              tag: event.id,
              requireInteraction: event.severity === 'critical',
            });
          }

          // Alerta sonoro para eventos críticos
          if (event.severity === 'critical') {
            const audio = new Audio('/sounds/alert.mp3');
            audio.play().catch(() => {
              // Silently fail if audio can't play
            });
          }

          // Console log para debug
          console.warn('🚨 Security Alert:', event);
        }
      )
      .subscribe();

    // Solicitar permissão de notificações
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup
    return () => {
      supabase.removeChannel(securityChannel);
    };
  }, []);
}

/**
 * Hook para notificações de audit logs em tempo real
 * Monitora ações específicas para admins
 */
export function useRealtimeAuditAlerts(actions: string[] = []) {
  useEffect(() => {
    if (actions.length === 0) return;

    const supabase = createClient();
    
    const auditChannel = supabase
      .channel('audit-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          const log = payload.new as {
            id: string;
            action: string;
            resource: string;
            actor_id: string;
            metadata: Record<string, any>;
          };

          // Filtrar apenas ações importantes
          if (actions.includes(log.action)) {
            console.info('📝 Audit Log:', log);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(auditChannel);
    };
  }, [actions]);
}

/**
 * Hook para notificações de atividade de usuários
 * Útil para dashboards em tempo real
 */
export function useRealtimeUserActivity(userId?: string) {
  useEffect(() => {
    const supabase = createClient();
    
    const activityChannel = supabase
      .channel('user-activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activity',
          filter: userId ? `user_id=eq.${userId}` : undefined
        },
        (payload) => {
          const activity = payload.new as {
            id: string;
            user_id: string;
            action: string;
            resource: string;
            created_at: string;
          };

          // Callback para atualizar estado do dashboard
          console.debug('👤 User Activity:', activity);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activityChannel);
    };
  }, [userId]);
}
