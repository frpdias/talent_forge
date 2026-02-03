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
    impact_score: number;
    confidence: number;
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
export declare class AiService {
    private configService;
    private tfciService;
    private nr1Service;
    private copcService;
    private openaiApiKey;
    constructor(configService: ConfigService, tfciService: TfciService, nr1Service: Nr1Service, copcService: CopcService);
    generateInsights(orgId: string, teamId?: string): Promise<AiInsight[]>;
    predictRisks(orgId: string, timeHorizon?: '7d' | '30d' | '90d'): Promise<RiskPrediction[]>;
    recommendActions(orgId: string, context: {
        module: 'tfci' | 'nr1' | 'copc';
        metric?: string;
        current_value?: number;
        team_id?: string;
        user_id?: string;
    }): Promise<{
        recommendations: Array<{
            title: string;
            description: string;
            priority: number;
            estimated_impact: string;
            implementation_steps: string[];
        }>;
    }>;
    private analyzeTfciData;
    private analyzeNr1Data;
    private analyzeCopcData;
    private analyzeIntegratedData;
    private predictTfciTrends;
    private predictNr1Trends;
    private predictCopcTrends;
    private getTfciRecommendations;
    private getNr1Recommendations;
    private getCopcRecommendations;
}
