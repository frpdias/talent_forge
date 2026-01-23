import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/security/threats
 * Retorna métricas de ameaças e atividades suspeitas nas últimas 24h
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar métricas de ameaças nas últimas 24h
    const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
    
    const metrics = {
      totalEvents: 0,
      criticalEvents: 0,
      failedLogins: 0,
      suspiciousActivity: 0,
      blockedIPs: 0,
      highPriorityEvents: 0,
    };

    try {
      // Total de eventos de segurança (24h)
      const { count: totalEvents } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo);

      metrics.totalEvents = totalEvents || 0;

      // Eventos críticos
      const { count: criticalEvents } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'critical')
        .gte('created_at', oneDayAgo);

      metrics.criticalEvents = criticalEvents || 0;

      // Eventos de alta prioridade (high + critical)
      const { count: highPriorityEvents } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .in('severity', ['high', 'critical'])
        .gte('created_at', oneDayAgo);

      metrics.highPriorityEvents = highPriorityEvents || 0;

    } catch (error) {
      console.error('Erro ao buscar eventos de segurança:', error);
    }

    try {
      // Logins falhos (audit_logs)
      const { count: failedLogins } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'login_failed')
        .gte('created_at', oneDayAgo);

      metrics.failedLogins = failedLogins || 0;

    } catch (error) {
      console.error('Erro ao buscar logins falhos:', error);
      // Fallback: estimar baseado em security_events
      try {
        const { count } = await supabase
          .from('security_events')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'failed_login')
          .gte('created_at', oneDayAgo);
        
        metrics.failedLogins = count || 0;
      } catch (e) {
        metrics.failedLogins = 0;
      }
    }

    try {
      // Atividades suspeitas
      const { count: suspiciousActivity } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'suspicious_activity')
        .gte('created_at', oneDayAgo);

      metrics.suspiciousActivity = suspiciousActivity || 0;

    } catch (error) {
      console.error('Erro ao buscar atividades suspeitas:', error);
    }

    try {
      // IPs bloqueados ativos
      const { count: blockedIPs } = await supabase
        .from('blocked_ips')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .or(`blocked_until.is.null,blocked_until.gt.${new Date().toISOString()}`);

      metrics.blockedIPs = blockedIPs || 0;

    } catch (error) {
      console.error('Erro ao buscar IPs bloqueados:', error);
      metrics.blockedIPs = 0;
    }

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Erro no endpoint /api/admin/security/threats:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao buscar métricas de ameaças',
        success: false,
      },
      { status: 500 }
    );
  }
}
