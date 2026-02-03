export declare enum TimeHorizon {
    SEVEN_DAYS = "7d",
    THIRTY_DAYS = "30d",
    NINETY_DAYS = "90d"
}
export declare enum PhpModule {
    TFCI = "tfci",
    NR1 = "nr1",
    COPC = "copc",
    INTEGRATED = "integrated"
}
export declare enum InsightType {
    ALERT = "alert",
    RECOMMENDATION = "recommendation",
    OPPORTUNITY = "opportunity",
    TREND = "trend"
}
export declare enum Severity {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export declare enum RiskLevel {
    CRITICAL = "critical",
    WARNING = "warning",
    WATCH = "watch",
    NONE = "none"
}
export declare class GenerateInsightsDto {
    org_id: string;
    team_id?: string;
    module?: PhpModule;
}
export declare class PredictRisksDto {
    org_id: string;
    time_horizon?: TimeHorizon;
}
export declare class RecommendActionsContextDto {
    module: PhpModule;
    metric?: string;
    current_value?: number;
    team_id?: string;
    user_id?: string;
}
export declare class RecommendActionsDto {
    org_id: string;
    context: RecommendActionsContextDto;
}
export declare class NaturalLanguageQueryDto {
    org_id: string;
    query: string;
    team_id?: string;
    include_modules?: ('tfci' | 'nr1' | 'copc')[];
    date_range?: string;
}
export declare class GenerateReportDto {
    org_id: string;
    report_type: 'summary' | 'detailed' | 'executive' | 'comparison';
    team_id?: string;
    modules?: PhpModule[];
    period?: string;
    language?: 'pt-BR' | 'en-US';
}
export declare class TurnoverPredictionDto {
    org_id: string;
    team_id?: string;
    employee_id?: string;
    time_horizon?: TimeHorizon;
}
export declare class PerformanceForecastDto {
    org_id: string;
    team_id?: string;
    module?: PhpModule;
    months_ahead?: number;
}
export declare class SmartRecommendationsDto {
    org_id: string;
    goal: string;
    team_id?: string;
    max_recommendations?: number;
}
export declare class ConversationMessageDto {
    org_id: string;
    message: string;
    conversation_id?: string;
}
export interface AiInsight {
    type: InsightType;
    severity: Severity;
    module: string;
    title: string;
    description: string;
    actionable_items: string[];
    impact_score: number;
    confidence: number;
}
export interface RiskPrediction {
    module: string;
    metric: string;
    current_value: number;
    predicted_value: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    risk_level: RiskLevel;
    time_horizon: TimeHorizon;
    confidence: number;
}
export interface Recommendation {
    title: string;
    description: string;
    priority: number;
    estimated_impact: string;
    implementation_steps: string[];
}
export interface TurnoverRisk {
    employee_id?: string;
    team_id?: string;
    risk_percentage: number;
    risk_factors: string[];
    recommended_interventions: string[];
    confidence: number;
}
export interface PerformanceForecast {
    module: string;
    current_score: number;
    forecasted_scores: Array<{
        month: string;
        predicted_score: number;
        confidence_interval: [number, number];
    }>;
    trend_summary: string;
}
export interface ConversationResponse {
    conversation_id: string;
    response: string;
    suggested_actions?: Array<{
        action: string;
        endpoint: string;
        params: Record<string, unknown>;
    }>;
    data_visualizations?: Array<{
        type: 'chart' | 'table' | 'metric';
        title: string;
        data: unknown;
    }>;
}
export interface UsageTracking {
    org_id: string;
    tokens_used: number;
    cost_usd: number;
    timestamp: Date;
}
