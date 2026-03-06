'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Buscar todas as métricas PHP em paralelo
    const [
      // Empresas com PHP ativo
      phpActivationsResult,
      // Ciclos TFCI
      tfciCyclesResult,
      // Avaliações NR-1
      nr1RiskResult,
      nr1SelfResult,
      // Planos de ação
      actionPlansResult,
      actionItemsResult,
      // Uso de IA
      aiUsageResult,
      // COPC metrics
      copcResult,
      // Notificações PHP
      notificationsResult,
    ] = await Promise.all([
      // Empresas com PHP ativo
      supabase
        .from('php_module_activations')
        .select('*', { count: 'exact' })
        .eq('is_active', true),
      
      // Ciclos TFCI (totais e por status)
      supabase
        .from('tfci_cycles')
        .select('id, status, phase, created_at'),
      
      // Avaliações NR-1 (risco)
      supabase
        .from('nr1_risk_assessments')
        .select('id, risk_level, created_at'),
      
      // Auto-avaliações NR-1
      supabase
        .from('nr1_self_assessments')
        .select('id, status, created_at'),
      
      // Planos de ação
      supabase
        .from('php_action_plans')
        .select('id, status, priority, created_at'),
      
      // Itens de ação
      supabase
        .from('php_action_items')
        .select('id, status'),
      
      // Uso de IA (últimos 30 dias)
      supabase
        .from('php_ai_usage')
        .select('id, tokens_used, estimated_cost, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Métricas COPC
      supabase
        .from('copc_metrics')
        .select('id, metric_type, score, created_at')
        .order('created_at', { ascending: false })
        .limit(100),
      
      // Notificações não lidas
      supabase
        .from('php_notifications')
        .select('id, type, is_read')
        .eq('is_read', false),
    ]);

    // Processar dados
    const phpActivations = phpActivationsResult.data || [];
    const tfciCycles = tfciCyclesResult.data || [];
    const nr1RiskAssessments = nr1RiskResult.data || [];
    const nr1SelfAssessments = nr1SelfResult.data || [];
    const actionPlans = actionPlansResult.data || [];
    const actionItems = actionItemsResult.data || [];
    const aiUsage = aiUsageResult.data || [];
    const copcMetrics = copcResult.data || [];
    const notifications = notificationsResult.data || [];

    // Calcular estatísticas TFCI
    const tfciStats = {
      total: tfciCycles.length,
      active: tfciCycles.filter(c => c.status === 'active').length,
      completed: tfciCycles.filter(c => c.status === 'completed').length,
      pending: tfciCycles.filter(c => c.status === 'pending' || c.status === 'draft').length,
      byPhase: {
        selfAssessment: tfciCycles.filter(c => c.phase === 'self_assessment').length,
        peerAssessment: tfciCycles.filter(c => c.phase === 'peer_assessment').length,
        managerAssessment: tfciCycles.filter(c => c.phase === 'manager_assessment').length,
        review: tfciCycles.filter(c => c.phase === 'review').length,
      }
    };

    // Calcular estatísticas NR-1
    const nr1Stats = {
      totalRiskAssessments: nr1RiskAssessments.length,
      totalSelfAssessments: nr1SelfAssessments.length,
      riskLevels: {
        high: nr1RiskAssessments.filter(r => r.risk_level === 'high' || r.risk_level === 'alto').length,
        medium: nr1RiskAssessments.filter(r => r.risk_level === 'medium' || r.risk_level === 'medio').length,
        low: nr1RiskAssessments.filter(r => r.risk_level === 'low' || r.risk_level === 'baixo').length,
      },
      pendingAssessments: nr1SelfAssessments.filter(s => s.status === 'pending').length,
      completedAssessments: nr1SelfAssessments.filter(s => s.status === 'completed').length,
    };

    // Calcular estatísticas de planos de ação
    const actionStats = {
      totalPlans: actionPlans.length,
      activePlans: actionPlans.filter(p => p.status === 'active' || p.status === 'in_progress').length,
      completedPlans: actionPlans.filter(p => p.status === 'completed').length,
      totalItems: actionItems.length,
      completedItems: actionItems.filter(i => i.status === 'completed').length,
      pendingItems: actionItems.filter(i => i.status === 'pending' || i.status === 'in_progress').length,
      byPriority: {
        high: actionPlans.filter(p => p.priority === 'high').length,
        medium: actionPlans.filter(p => p.priority === 'medium').length,
        low: actionPlans.filter(p => p.priority === 'low').length,
      }
    };

    // Calcular estatísticas de uso de IA
    const aiStats = {
      totalRequests: aiUsage.length,
      totalTokens: aiUsage.reduce((sum, u) => sum + (u.tokens_used || 0), 0),
      totalCost: aiUsage.reduce((sum, u) => sum + (u.estimated_cost || 0), 0),
      avgTokensPerRequest: aiUsage.length > 0 
        ? Math.round(aiUsage.reduce((sum, u) => sum + (u.tokens_used || 0), 0) / aiUsage.length)
        : 0,
    };

    // Calcular estatísticas COPC
    const copcStats = {
      totalMetrics: copcMetrics.length,
      avgScore: copcMetrics.length > 0
        ? (copcMetrics.reduce((sum, m) => sum + (m.score || 0), 0) / copcMetrics.length).toFixed(1)
        : '0.0',
      byType: copcMetrics.reduce((acc, m) => {
        acc[m.metric_type] = (acc[m.metric_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    // Notificações pendentes
    const notificationStats = {
      unread: notifications.length,
      byType: notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      success: true,
      data: {
        companiesWithPHP: phpActivations.length,
        phpActivations: phpActivations,
        tfci: tfciStats,
        nr1: nr1Stats,
        actions: actionStats,
        ai: aiStats,
        copc: copcStats,
        notifications: notificationStats,
        lastUpdated: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error fetching PHP metrics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch PHP metrics',
      data: null
    }, { status: 500 });
  }
}
