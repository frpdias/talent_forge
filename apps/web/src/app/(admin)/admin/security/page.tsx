'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Lock, Eye, Activity, Clock, Globe, Terminal, RefreshCw, TrendingUp, Server, Database } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SecurityEvent {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: any;
  created_at: string;
}

interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  highEvents: number;
  failedLogins: number;
  suspiciousActivities: number;
  blockedIPs: number;
  lastScan: Date;
}

interface SecurityCheck {
  id: string;
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  category: string;
  details?: string;
}

interface SecurityScore {
  value: number;
  status: 'pass' | 'warning' | 'fail';
  breakdown: {
    pass: number;
    warning: number;
    fail: number;
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
  }>;
}

export default function SecurityDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    criticalEvents: 0,
    highEvents: 0,
    failedLogins: 0,
    suspiciousActivities: 0,
    blockedIPs: 0,
    lastScan: new Date(),
  });
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);
  const [securityScore, setSecurityScore] = useState<SecurityScore>({
    value: 0,
    status: 'warning',
    breakdown: { pass: 0, warning: 0, fail: 0 },
    recommendations: [],
  });

  useEffect(() => {
    fetchSecurityData();
    
    // Update every 10 seconds
    const interval = setInterval(() => {
      fetchSecurityData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  async function fetchSecurityData() {
    try {
      const supabase = createClient();

      // Fetch em paralelo: events, checks, score, threats
      const [eventsResponse, checksResponse, scoreResponse, threatsResponse] = await Promise.all([
        supabase
          .from('security_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
        fetch('/api/admin/security/checks'),
        fetch('/api/admin/security/score'),
        fetch('/api/admin/security/threats'),
      ]);

      // Process events
      if (!eventsResponse.error) {
        setRecentEvents(eventsResponse.data || []);
      }

      // Process threats metrics
      if (threatsResponse.ok) {
        const threatsData = await threatsResponse.json();
        if (threatsData.success && threatsData.metrics) {
          setMetrics({
            totalEvents: threatsData.metrics.totalEvents,
            criticalEvents: threatsData.metrics.criticalEvents,
            highEvents: threatsData.metrics.highPriorityEvents,
            failedLogins: threatsData.metrics.failedLogins,
            suspiciousActivities: threatsData.metrics.suspiciousActivity,
            blockedIPs: threatsData.metrics.blockedIPs,
            lastScan: new Date(),
          });
        }
      }

      // Process security checks
      if (checksResponse.ok) {
        const checksData = await checksResponse.json();
        if (checksData.success && checksData.checks) {
          setSecurityChecks(checksData.checks);
        }
      }

      // Process security score
      if (scoreResponse.ok) {
        const scoreData = await scoreResponse.json();
        if (scoreData.success && scoreData.score) {
          setSecurityScore(scoreData.score);
        }
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'critical':
        return 'text-[#EF4444] bg-[#EF4444]/10';
      case 'high':
        return 'text-[#F59E0B] bg-[#F59E0B]/10';
      case 'medium':
        return 'text-[#3B82F6] bg-[#3B82F6]/10';
      case 'low':
        return 'text-[#10B981] bg-[#10B981]/10';
      default:
        return 'text-[#666666] bg-[#FAFAF8]';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pass':
        return 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20';
      case 'warning':
        return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20';
      case 'fail':
        return 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20';
      default:
        return 'text-[#666666] bg-[#FAFAF8] border-[#E5E5DC]';
    }
  }

  function formatTimeAgo(date: string): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return new Date(date).toLocaleDateString('pt-BR');
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#141042] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#141042] flex items-center">
            <Shield className="w-6 h-6 mr-3 text-[#10B981]" />
            Centro de Segurança
          </h2>
          <p className="text-sm sm:text-base text-[#666666] mt-1">
            Monitoramento em tempo real de segurança e conformidade
          </p>
        </div>
        <button
          onClick={fetchSecurityData}
          className="flex items-center space-x-2 px-4 py-2 bg-[#141042] text-white rounded-lg hover:bg-[#141042]/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* Security Score */}
      <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#141042]">Score de Segurança</h3>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#666666]" />
            <span className="text-sm text-[#666666]">
              Última verificação: {metrics.lastScan.toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-8">
          <div className="relative">
            <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center ${
              securityScore.status === 'pass' ? 'border-[#10B981]' :
              securityScore.status === 'warning' ? 'border-[#F59E0B]' :
              'border-[#EF4444]'
            }`}>
              <div className="text-center">
                <p className={`text-4xl font-bold ${
                  securityScore.status === 'pass' ? 'text-[#10B981]' :
                  securityScore.status === 'warning' ? 'text-[#F59E0B]' :
                  'text-[#EF4444]'
                }`}>
                  {securityScore.value}
                </p>
                <p className="text-xs text-[#666666]">/ 100</p>
              </div>
            </div>
            <div className={`absolute -right-2 -top-2 w-12 h-12 rounded-full flex items-center justify-center ${
              securityScore.status === 'pass' ? 'bg-[#10B981]' :
              securityScore.status === 'warning' ? 'bg-[#F59E0B]' :
              'bg-[#EF4444]'
            }`}>
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 bg-[#FAFAF8] rounded-lg">
            <p className="text-2xl font-bold text-[#10B981]">
              {securityScore.breakdown.pass}
            </p>
            <p className="text-xs text-[#666666] mt-1">Passando</p>
          </div>
          <div className="text-center p-3 bg-[#FAFAF8] rounded-lg">
            <p className="text-2xl font-bold text-[#F59E0B]">
              {securityScore.breakdown.warning}
            </p>
            <p className="text-xs text-[#666666] mt-1">Avisos</p>
          </div>
          <div className="text-center p-3 bg-[#FAFAF8] rounded-lg">
            <p className="text-2xl font-bold text-[#EF4444]">
              {securityScore.breakdown.fail}
            </p>
            <p className="text-xs text-[#666666] mt-1">Falhando</p>
          </div>
          <div className="text-center p-3 bg-[#FAFAF8] rounded-lg">
            <p className="text-2xl font-bold text-[#141042]">
              {securityScore.breakdown.pass + securityScore.breakdown.warning + securityScore.breakdown.fail}
            </p>
            <p className="text-xs text-[#666666] mt-1">Total</p>
          </div>
        </div>
      </div>

      {/* Threat Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[
          { label: 'Eventos (24h)', value: metrics.totalEvents, icon: Activity, color: '#3B82F6' },
          { label: 'Críticos', value: metrics.criticalEvents, icon: AlertTriangle, color: '#EF4444' },
          { label: 'Logins Falhos', value: metrics.failedLogins, icon: Lock, color: '#F59E0B' },
          { label: 'Suspeitos', value: metrics.suspiciousActivities, icon: Eye, color: '#8B5CF6' },
          { label: 'IPs Bloqueados', value: metrics.blockedIPs, icon: Globe, color: '#666666' },
          { label: 'Alta Prioridade', value: metrics.highEvents, icon: TrendingUp, color: '#F59E0B' },
        ].map((metric, i) => (
          <div key={i} className="bg-white border border-[#E5E5DC] rounded-lg sm:rounded-xl p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <metric.icon className="w-5 h-5" style={{ color: metric.color }} />
              <span 
                className="text-2xl font-bold" 
                style={{ color: metric.value > 0 ? metric.color : '#666666' }}
              >
                {metric.value}
              </span>
            </div>
            <p className="text-sm text-[#666666]">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Security Checks */}
      <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-[#141042] mb-4">Verificações de Segurança</h3>
        
        <div className="space-y-3">
          {securityChecks.map((check, i) => (
            <div
              key={i}
              className={`flex items-start justify-between p-4 rounded-lg border ${getStatusColor(check.status)}`}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-1">
                  <h4 className="font-semibold text-[#141042]">{check.name}</h4>
                  <span className="text-xs px-2 py-0.5 bg-white/50 rounded">
                    {check.category}
                  </span>
                </div>
                <p className="text-sm text-[#666666]">{check.message}</p>
              </div>
              <div className="ml-4">
                {check.status === 'pass' && <Shield className="w-5 h-5 text-[#10B981]" />}
                {check.status === 'warning' && <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />}
                {check.status === 'fail' && <AlertTriangle className="w-5 h-5 text-[#EF4444]" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Security Events */}
      <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#141042]">Eventos Recentes</h3>
          <Terminal className="w-5 h-5 text-[#666666]" />
        </div>

        {recentEvents.length === 0 ? (
          <div className="text-center py-8 text-[#666666]">
            <Shield className="w-12 h-12 mx-auto mb-2 text-[#10B981]" />
            <p>Nenhum evento de segurança registrado</p>
            <p className="text-sm mt-1">Sistema operando normalmente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start justify-between p-4 bg-[#FAFAF8] rounded-lg hover:bg-[#F5F5F0] transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${getSeverityColor(event.severity)}`}>
                      {event.severity.toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-[#141042]">
                      {event.type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-[#666666]">
                    {JSON.stringify(event.details).substring(0, 100)}...
                  </p>
                </div>
                <span className="text-xs text-[#999] ml-4 whitespace-nowrap">
                  {formatTimeAgo(event.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Protection Recommendations */}
      <div className="bg-white border border-[#E5E5DC] rounded-xl sm:rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-[#141042] mb-4 flex items-center">
          <Lock className="w-5 h-5 mr-2" />
          Recomendações de Proteção
        </h3>
        
        {securityScore.recommendations.length === 0 ? (
          <div className="text-center py-8 text-[#666666]">
            <Shield className="w-12 h-12 mx-auto mb-2 text-[#10B981]" />
            <p>Excelente! Nenhuma recomendação crítica</p>
            <p className="text-sm mt-1">Todas as verificações passaram</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {securityScore.recommendations.map((rec, i) => (
              <div key={i} className="bg-[#FAFAF8] border border-[#E5E5DC] rounded-lg p-4 hover:bg-[#F5F5F0] transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <Lock className="w-5 h-5 text-[#141042]" />
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    rec.priority === 'high' 
                      ? 'bg-[#EF4444] text-white' 
                      : rec.priority === 'medium'
                      ? 'bg-[#F59E0B] text-white'
                      : 'bg-[#3B82F6] text-white'
                  }`}>
                    {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>
                <h4 className="font-semibold text-[#141042] mb-1">{rec.title}</h4>
                <p className="text-sm text-[#666666]">{rec.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
