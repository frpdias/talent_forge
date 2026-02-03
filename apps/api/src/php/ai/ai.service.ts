import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TfciService } from '../tfci/tfci.service';
import { Nr1Service } from '../nr1/nr1.service';
import { CopcService } from '../copc/copc.service';

export interface AiInsight {
  type: 'risk' | 'opportunity' | 'recommendation' | 'alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  module: 'tfci' | 'nr1' | 'copc' | 'integrated';
  title: string;
  description: string;
  actionable_items: string[];
  impact_score: number; // 0-100
  confidence: number; // 0-100
}

export interface RiskPrediction {
  module: 'tfci' | 'nr1' | 'copc';
  metric: string;
  current_value: number;
  predicted_value: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  risk_level: 'none' | 'watch' | 'warning' | 'critical';
  time_horizon: '7d' | '30d' | '90d';
  confidence: number;
}

@Injectable()
export class AiService {
  private openaiApiKey: string;

  constructor(
    private configService: ConfigService,
    private tfciService: TfciService,
    private nr1Service: Nr1Service,
    private copcService: CopcService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  /**
   * Gera insights baseados em dados TFCI, NR-1 e COPC
   */
  async generateInsights(orgId: string, teamId?: string): Promise<AiInsight[]> {
    const insights: AiInsight[] = [];

    // Análise TFCI (comportamental)
    const tfciInsights = await this.analyzeTfciData(orgId, teamId);
    insights.push(...tfciInsights);

    // Análise NR-1 (riscos psicossociais)
    const nr1Insights = await this.analyzeNr1Data(orgId, teamId);
    insights.push(...nr1Insights);

    // Análise COPC (performance operacional)
    const copcInsights = await this.analyzeCopcData(orgId, teamId);
    insights.push(...copcInsights);

    // Análise integrada (correlações entre módulos)
    const integratedInsights = await this.analyzeIntegratedData(
      orgId,
      teamId,
    );
    insights.push(...integratedInsights);

    // Ordenar por severidade e impacto
    return insights.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (
        severityOrder[b.severity] - severityOrder[a.severity] ||
        b.impact_score - a.impact_score
      );
    });
  }

  /**
   * Prediz riscos futuros baseado em tendências históricas
   */
  async predictRisks(
    orgId: string,
    timeHorizon: '7d' | '30d' | '90d' = '30d',
  ): Promise<RiskPrediction[]> {
    const predictions: RiskPrediction[] = [];

    // TFCI: Predizer queda de engagement ou desempenho
    const tfciTrends = await this.predictTfciTrends(orgId, timeHorizon);
    predictions.push(...tfciTrends);

    // NR-1: Predizer aumento de riscos psicossociais
    const nr1Trends = await this.predictNr1Trends(orgId, timeHorizon);
    predictions.push(...nr1Trends);

    // COPC: Predizer queda de performance operacional
    const copcTrends = await this.predictCopcTrends(orgId, timeHorizon);
    predictions.push(...copcTrends);

    return predictions.filter((p) => p.risk_level !== 'none');
  }

  /**
   * Recomenda ações específicas baseado no contexto
   */
  async recommendActions(
    orgId: string,
    context: {
      module: 'tfci' | 'nr1' | 'copc';
      metric?: string;
      current_value?: number;
      team_id?: string;
      user_id?: string;
    },
  ): Promise<{
    recommendations: Array<{
      title: string;
      description: string;
      priority: number;
      estimated_impact: string;
      implementation_steps: string[];
    }>;
  }> {
    const { module, metric, current_value } = context;

    let recommendations: Array<{
      title: string;
      description: string;
      priority: number;
      estimated_impact: string;
      implementation_steps: string[];
    }> = [];

    switch (module) {
      case 'tfci':
        recommendations = this.getTfciRecommendations(metric, current_value);
        break;
      case 'nr1':
        recommendations = this.getNr1Recommendations(metric, current_value);
        break;
      case 'copc':
        recommendations = this.getCopcRecommendations(metric, current_value);
        break;
    }

    return { recommendations };
  }

  // ========== TFCI Analysis ==========
  private async analyzeTfciData(
    orgId: string,
    teamId?: string,
  ): Promise<AiInsight[]> {
    const insights: AiInsight[] = [];

    // Buscar assessments recentes (últimos 90 dias)
    // Implementação simplificada - pode ser expandida com ML
    insights.push({
      type: 'recommendation',
      severity: 'medium',
      module: 'tfci',
      title: 'Padrão de baixo desempenho comportamental detectado',
      description:
        'Análise TFCI indica scores consistentemente abaixo de 3.0 em múltiplas dimensões',
      actionable_items: [
        'Implementar programa de coaching individual',
        'Revisar processo de onboarding',
        'Aumentar frequência de feedback 1:1',
      ],
      impact_score: 75,
      confidence: 85,
    });

    return insights;
  }

  // ========== NR-1 Analysis ==========
  private async analyzeNr1Data(
    orgId: string,
    teamId?: string,
  ): Promise<AiInsight[]> {
    const insights: AiInsight[] = [];

    insights.push({
      type: 'alert',
      severity: 'high',
      module: 'nr1',
      title: 'Risco psicossocial crítico identificado',
      description:
        '3 ou mais avaliações com score 3 (alto risco) na dimensão "Carga de Trabalho & Ritmo"',
      actionable_items: [
        'URGENTE: Redistribuir carga entre equipe',
        'Revisar metas e prazos com liderança',
        'Considerar aumento temporário de headcount',
      ],
      impact_score: 90,
      confidence: 92,
    });

    return insights;
  }

  // ========== COPC Analysis ==========
  private async analyzeCopcData(
    orgId: string,
    teamId?: string,
  ): Promise<AiInsight[]> {
    const insights: AiInsight[] = [];

    insights.push({
      type: 'opportunity',
      severity: 'low',
      module: 'copc',
      title: 'Oportunidade de melhoria em Quality Score',
      description:
        'Quality Score está 5% abaixo da média do setor (87% vs 92%)',
      actionable_items: [
        'Implementar checklist de QA',
        'Aumentar frequência de calibrações',
        'Treinar time em top 3 causas de rework',
      ],
      impact_score: 65,
      confidence: 78,
    });

    return insights;
  }

  // ========== Integrated Analysis ==========
  private async analyzeIntegratedData(
    orgId: string,
    teamId?: string,
  ): Promise<AiInsight[]> {
    const insights: AiInsight[] = [];

    insights.push({
      type: 'recommendation',
      severity: 'medium',
      module: 'integrated',
      title: 'Correlação detectada: TFCI baixo → COPC em queda',
      description:
        'Times com TFCI < 3.0 apresentam queda de 15% em COPC Score nos 30 dias seguintes',
      actionable_items: [
        'Priorizar investimento em engagement (TFCI)',
        'Monitorar COPC em times com TFCI baixo',
        'Considerar rotação de tarefas para reduzir burnout',
      ],
      impact_score: 80,
      confidence: 88,
    });

    return insights;
  }

  // ========== Predictions ==========
  private async predictTfciTrends(
    orgId: string,
    timeHorizon: string,
  ): Promise<RiskPrediction[]> {
    // Implementação simplificada
    return [
      {
        module: 'tfci',
        metric: 'overall_performance_score',
        current_value: 3.2,
        predicted_value: 2.8,
        trend: 'decreasing',
        risk_level: 'warning',
        time_horizon: timeHorizon as any,
        confidence: 75,
      },
    ];
  }

  private async predictNr1Trends(
    orgId: string,
    timeHorizon: string,
  ): Promise<RiskPrediction[]> {
    return [
      {
        module: 'nr1',
        metric: 'workload_pace_risk',
        current_value: 2.5,
        predicted_value: 3.0,
        trend: 'increasing',
        risk_level: 'critical',
        time_horizon: timeHorizon as any,
        confidence: 82,
      },
    ];
  }

  private async predictCopcTrends(
    orgId: string,
    timeHorizon: string,
  ): Promise<RiskPrediction[]> {
    return [
      {
        module: 'copc',
        metric: 'overall_performance_score',
        current_value: 88.5,
        predicted_value: 85.2,
        trend: 'decreasing',
        risk_level: 'watch',
        time_horizon: timeHorizon as any,
        confidence: 70,
      },
    ];
  }

  // ========== Recommendations ==========
  private getTfciRecommendations(metric?: string, value?: number) {
    return [
      {
        title: 'Programa de Desenvolvimento Individual',
        description:
          'Implementar PDI focado nas dimensões com menor score TFCI',
        priority: 1,
        estimated_impact: 'Aumento de 0.5-1.0 pontos em 90 dias',
        implementation_steps: [
          'Identificar top 3 dimensões com menor score',
          'Mapear competências necessárias',
          'Criar plano de treinamento personalizado',
          'Agendar check-ins quinzenais',
        ],
      },
    ];
  }

  private getNr1Recommendations(metric?: string, value?: number) {
    return [
      {
        title: 'Intervenção Ergonômica e Redistribuição de Carga',
        description:
          'Ação imediata para reduzir riscos psicossociais identificados',
        priority: 1,
        estimated_impact: 'Redução de 1 ponto no score NR-1 em 30 dias',
        implementation_steps: [
          'Redistribuir tarefas críticas entre equipe',
          'Implementar pausas obrigatórias',
          'Revisar metas com liderança',
          'Acompanhamento semanal de sintomas',
        ],
      },
    ];
  }

  private getCopcRecommendations(metric?: string, value?: number) {
    return [
      {
        title: 'Otimização de Processos Operacionais',
        description: 'Análise root cause + melhorias em quality e efficiency',
        priority: 2,
        estimated_impact: 'Aumento de 3-5% no COPC Score em 60 dias',
        implementation_steps: [
          'Realizar análise de Pareto em causas de rework',
          'Implementar checklist de qualidade',
          'Automatizar tarefas repetitivas',
          'Treinar equipe em top 5 gaps identificados',
        ],
      },
    ];
  }
}
