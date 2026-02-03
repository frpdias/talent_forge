import { ConfigService } from '@nestjs/config';
import { TurnoverRisk, PerformanceForecast, ConversationResponse, PhpModule, TimeHorizon } from './dto/ai.dto';
export declare class AiEnhancedService {
    private readonly configService;
    private readonly logger;
    private readonly supabase;
    private readonly openai;
    private readonly cache;
    private readonly rateLimits;
    private readonly conversations;
    private readonly RATE_LIMIT_REQUESTS;
    private readonly RATE_LIMIT_WINDOW_MS;
    private readonly CACHE_TTL_MS;
    private readonly COST_PER_1K_INPUT_TOKENS;
    private readonly COST_PER_1K_OUTPUT_TOKENS;
    constructor(configService: ConfigService);
    private checkRateLimit;
    private getRateLimitInfo;
    private getCached;
    private setCache;
    private trackUsage;
    getUsageStats(orgId: string, period?: 'day' | 'week' | 'month'): Promise<{
        total_tokens: number;
        total_cost_usd: number;
        requests_count: number;
        by_feature: Record<string, {
            tokens: number;
            cost: number;
            count: number;
        }>;
    }>;
    private fetchOrgData;
    processNaturalLanguageQuery(orgId: string, query: string, teamId?: string, includeModules?: ('tfci' | 'nr1' | 'copc')[]): Promise<{
        response: string;
        data?: any;
        suggestions?: string[];
    }>;
    private processQueryWithoutOpenAI;
    private buildDataContext;
    private extractRelevantData;
    private generateFollowUpSuggestions;
    generateNarrativeReport(orgId: string, reportType: 'summary' | 'detailed' | 'executive' | 'comparison', teamId?: string, modules?: PhpModule[], period?: string, language?: 'pt-BR' | 'en-US'): Promise<{
        title: string;
        content: string;
        sections: Array<{
            heading: string;
            body: string;
        }>;
        recommendations: string[];
        generated_at: string;
    }>;
    private generateFallbackReport;
    private parseMarkdownSections;
    private extractRecommendations;
    predictTurnover(orgId: string, teamId?: string, employeeId?: string, timeHorizon?: TimeHorizon): Promise<TurnoverRisk[]>;
    private monthsSince;
    private generateInterventions;
    forecastPerformance(orgId: string, teamId?: string, module?: PhpModule, monthsAhead?: number): Promise<PerformanceForecast[]>;
    private calculateModuleScore;
    private calculateTrend;
    generateSmartRecommendations(orgId: string, goal: string, teamId?: string, maxRecommendations?: number): Promise<{
        goal: string;
        recommendations: Array<{
            title: string;
            description: string;
            priority: 'high' | 'medium' | 'low';
            estimated_impact: string;
            implementation_steps: string[];
            related_module: PhpModule;
            effort_level: 'low' | 'medium' | 'high';
        }>;
        similar_success_cases?: string[];
    }>;
    private generateFallbackRecommendations;
    chat(orgId: string, message: string, conversationId?: string): Promise<ConversationResponse>;
    private generateConversationId;
    private extractSuggestedActions;
    getAiStatus(): {
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
    };
}
