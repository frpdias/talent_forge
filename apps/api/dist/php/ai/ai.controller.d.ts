import { AiService } from './ai.service';
import { AiEnhancedService } from './ai-enhanced.service';
import { NaturalLanguageQueryDto, GenerateReportDto, TurnoverPredictionDto, PerformanceForecastDto, SmartRecommendationsDto, ConversationMessageDto, TimeHorizon, PhpModule } from './dto/ai.dto';
export declare class AiController {
    private readonly aiService;
    private readonly aiEnhancedService;
    constructor(aiService: AiService, aiEnhancedService: AiEnhancedService);
    generateInsights(orgId: string, teamId?: string): Promise<{
        org_id: string;
        team_id: string | undefined;
        insights_count: number;
        insights: import("./ai.service").AiInsight[];
        generated_at: string;
    }>;
    predictRisks(orgId: string, timeHorizon?: '7d' | '30d' | '90d'): Promise<{
        org_id: string;
        time_horizon: "30d" | "7d" | "90d";
        predictions_count: number;
        predictions: import("./ai.service").RiskPrediction[];
        generated_at: string;
    }>;
    recommendActions(orgId: string, context: {
        module: 'tfci' | 'nr1' | 'copc';
        metric?: string;
        current_value?: number;
        team_id?: string;
        user_id?: string;
    }): Promise<{
        generated_at: string;
        recommendations: Array<{
            title: string;
            description: string;
            priority: number;
            estimated_impact: string;
            implementation_steps: string[];
        }>;
        org_id: string;
        context: {
            module: "tfci" | "nr1" | "copc";
            metric?: string;
            current_value?: number;
            team_id?: string;
            user_id?: string;
        };
    }>;
    processNaturalLanguageQuery(dto: NaturalLanguageQueryDto): Promise<{
        generated_at: string;
        response: string;
        data?: any;
        suggestions?: string[];
        org_id: string;
        query: string;
    }>;
    generateReport(dto: GenerateReportDto): Promise<{
        title: string;
        content: string;
        sections: Array<{
            heading: string;
            body: string;
        }>;
        recommendations: string[];
        generated_at: string;
        org_id: string;
        report_type: "summary" | "executive" | "detailed" | "comparison";
    }>;
    predictTurnover(dto: TurnoverPredictionDto): Promise<{
        org_id: string;
        time_horizon: TimeHorizon;
        predictions_count: number;
        predictions: import("./dto/ai.dto").TurnoverRisk[];
        generated_at: string;
    }>;
    forecastPerformance(dto: PerformanceForecastDto): Promise<{
        org_id: string;
        months_ahead: number;
        forecasts_count: number;
        forecasts: import("./dto/ai.dto").PerformanceForecast[];
        generated_at: string;
    }>;
    smartRecommendations(dto: SmartRecommendationsDto): Promise<{
        generated_at: string;
        goal: string;
        recommendations: Array<{
            title: string;
            description: string;
            priority: "high" | "medium" | "low";
            estimated_impact: string;
            implementation_steps: string[];
            related_module: PhpModule;
            effort_level: "low" | "medium" | "high";
        }>;
        similar_success_cases?: string[];
        org_id: string;
    }>;
    chat(dto: ConversationMessageDto): Promise<{
        generated_at: string;
        conversation_id: string;
        response: string;
        suggested_actions?: Array<{
            action: string;
            endpoint: string;
            params: Record<string, unknown>;
        }>;
        data_visualizations?: Array<{
            type: "chart" | "table" | "metric";
            title: string;
            data: unknown;
        }>;
        org_id: string;
    }>;
    getUsageStats(orgId: string, period?: 'day' | 'week' | 'month'): Promise<{
        generated_at: string;
        total_tokens: number;
        total_cost_usd: number;
        requests_count: number;
        by_feature: Record<string, {
            tokens: number;
            cost: number;
            count: number;
        }>;
        org_id: string;
        period: "day" | "week" | "month";
    }>;
    checkHealth(): Promise<{
        timestamp: string;
        openai_configured: boolean;
        features_available: string[];
        rate_limit_info: {
            max_requests: number;
            window: string;
        };
        cache_info: {
            ttl_minutes: number;
            entries: number;
        };
        status: string;
        version: string;
    }>;
}
