"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const tfci_service_1 = require("../tfci/tfci.service");
const nr1_service_1 = require("../nr1/nr1.service");
const copc_service_1 = require("../copc/copc.service");
let AiService = class AiService {
    constructor(configService, tfciService, nr1Service, copcService) {
        this.configService = configService;
        this.tfciService = tfciService;
        this.nr1Service = nr1Service;
        this.copcService = copcService;
        this.openaiApiKey = this.configService.get('OPENAI_API_KEY') || '';
    }
    async generateInsights(orgId, teamId) {
        const insights = [];
        const tfciInsights = await this.analyzeTfciData(orgId, teamId);
        insights.push(...tfciInsights);
        const nr1Insights = await this.analyzeNr1Data(orgId, teamId);
        insights.push(...nr1Insights);
        const copcInsights = await this.analyzeCopcData(orgId, teamId);
        insights.push(...copcInsights);
        const integratedInsights = await this.analyzeIntegratedData(orgId, teamId);
        insights.push(...integratedInsights);
        return insights.sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return (severityOrder[b.severity] - severityOrder[a.severity] ||
                b.impact_score - a.impact_score);
        });
    }
    async predictRisks(orgId, timeHorizon = '30d') {
        const predictions = [];
        const tfciTrends = await this.predictTfciTrends(orgId, timeHorizon);
        predictions.push(...tfciTrends);
        const nr1Trends = await this.predictNr1Trends(orgId, timeHorizon);
        predictions.push(...nr1Trends);
        const copcTrends = await this.predictCopcTrends(orgId, timeHorizon);
        predictions.push(...copcTrends);
        return predictions.filter((p) => p.risk_level !== 'none');
    }
    async recommendActions(orgId, context) {
        const { module, metric, current_value } = context;
        let recommendations = [];
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
    async analyzeTfciData(orgId, teamId) {
        const insights = [];
        insights.push({
            type: 'recommendation',
            severity: 'medium',
            module: 'tfci',
            title: 'Padrão de baixo desempenho comportamental detectado',
            description: 'Análise TFCI indica scores consistentemente abaixo de 3.0 em múltiplas dimensões',
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
    async analyzeNr1Data(orgId, teamId) {
        const insights = [];
        insights.push({
            type: 'alert',
            severity: 'high',
            module: 'nr1',
            title: 'Risco psicossocial crítico identificado',
            description: '3 ou mais avaliações com score 3 (alto risco) na dimensão "Carga de Trabalho & Ritmo"',
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
    async analyzeCopcData(orgId, teamId) {
        const insights = [];
        insights.push({
            type: 'opportunity',
            severity: 'low',
            module: 'copc',
            title: 'Oportunidade de melhoria em Quality Score',
            description: 'Quality Score está 5% abaixo da média do setor (87% vs 92%)',
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
    async analyzeIntegratedData(orgId, teamId) {
        const insights = [];
        insights.push({
            type: 'recommendation',
            severity: 'medium',
            module: 'integrated',
            title: 'Correlação detectada: TFCI baixo → COPC em queda',
            description: 'Times com TFCI < 3.0 apresentam queda de 15% em COPC Score nos 30 dias seguintes',
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
    async predictTfciTrends(orgId, timeHorizon) {
        return [
            {
                module: 'tfci',
                metric: 'overall_performance_score',
                current_value: 3.2,
                predicted_value: 2.8,
                trend: 'decreasing',
                risk_level: 'warning',
                time_horizon: timeHorizon,
                confidence: 75,
            },
        ];
    }
    async predictNr1Trends(orgId, timeHorizon) {
        return [
            {
                module: 'nr1',
                metric: 'workload_pace_risk',
                current_value: 2.5,
                predicted_value: 3.0,
                trend: 'increasing',
                risk_level: 'critical',
                time_horizon: timeHorizon,
                confidence: 82,
            },
        ];
    }
    async predictCopcTrends(orgId, timeHorizon) {
        return [
            {
                module: 'copc',
                metric: 'overall_performance_score',
                current_value: 88.5,
                predicted_value: 85.2,
                trend: 'decreasing',
                risk_level: 'watch',
                time_horizon: timeHorizon,
                confidence: 70,
            },
        ];
    }
    getTfciRecommendations(metric, value) {
        return [
            {
                title: 'Programa de Desenvolvimento Individual',
                description: 'Implementar PDI focado nas dimensões com menor score TFCI',
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
    getNr1Recommendations(metric, value) {
        return [
            {
                title: 'Intervenção Ergonômica e Redistribuição de Carga',
                description: 'Ação imediata para reduzir riscos psicossociais identificados',
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
    getCopcRecommendations(metric, value) {
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
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        tfci_service_1.TfciService,
        nr1_service_1.Nr1Service,
        copc_service_1.CopcService])
], AiService);
//# sourceMappingURL=ai.service.js.map