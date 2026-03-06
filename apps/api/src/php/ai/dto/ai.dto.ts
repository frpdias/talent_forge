import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ========== Enums ==========

export enum TimeHorizon {
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  NINETY_DAYS = '90d',
}

export enum PhpModule {
  TFCI = 'tfci',
  NR1 = 'nr1',
  COPC = 'copc',
  INTEGRATED = 'integrated',
}

export enum InsightType {
  ALERT = 'alert',
  RECOMMENDATION = 'recommendation',
  OPPORTUNITY = 'opportunity',
  TREND = 'trend',
}

export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum RiskLevel {
  CRITICAL = 'critical',
  WARNING = 'warning',
  WATCH = 'watch',
  NONE = 'none',
}

// ========== DTOs ==========

export class GenerateInsightsDto {
  @IsUUID()
  org_id: string;

  @IsOptional()
  @IsUUID()
  team_id?: string;

  @IsOptional()
  @IsEnum(PhpModule)
  module?: PhpModule;
}

export class PredictRisksDto {
  @IsUUID()
  org_id: string;

  @IsOptional()
  @IsEnum(TimeHorizon)
  time_horizon?: TimeHorizon;
}

export class RecommendActionsContextDto {
  @IsEnum(PhpModule)
  module: PhpModule;

  @IsOptional()
  @IsString()
  metric?: string;

  @IsOptional()
  @IsNumber()
  current_value?: number;

  @IsOptional()
  @IsUUID()
  team_id?: string;

  @IsOptional()
  @IsUUID()
  user_id?: string;
}

export class RecommendActionsDto {
  @IsUUID()
  org_id: string;

  @ValidateNested()
  @Type(() => RecommendActionsContextDto)
  context: RecommendActionsContextDto;
}

// ========== OpenAI Enhanced DTOs ==========

export class NaturalLanguageQueryDto {
  @IsUUID()
  org_id: string;

  @IsString()
  query: string;

  @IsOptional()
  @IsUUID()
  team_id?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  include_modules?: ('tfci' | 'nr1' | 'copc')[];

  @IsOptional()
  @IsString()
  date_range?: string; // e.g., "last 30 days", "Q1 2026"
}

export class GenerateReportDto {
  @IsUUID()
  org_id: string;

  @IsString()
  report_type: 'summary' | 'detailed' | 'executive' | 'comparison';

  @IsOptional()
  @IsUUID()
  team_id?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(PhpModule, { each: true })
  modules?: PhpModule[];

  @IsOptional()
  @IsString()
  period?: string; // e.g., "last_quarter", "last_month", "ytd"

  @IsOptional()
  @IsString()
  language?: 'pt-BR' | 'en-US';
}

export class TurnoverPredictionDto {
  @IsUUID()
  org_id: string;

  @IsOptional()
  @IsUUID()
  team_id?: string;

  @IsOptional()
  @IsUUID()
  employee_id?: string;

  @IsOptional()
  @IsEnum(TimeHorizon)
  time_horizon?: TimeHorizon;
}

export class PerformanceForecastDto {
  @IsUUID()
  org_id: string;

  @IsOptional()
  @IsUUID()
  team_id?: string;

  @IsOptional()
  @IsEnum(PhpModule)
  module?: PhpModule;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  months_ahead?: number;
}

export class SmartRecommendationsDto {
  @IsUUID()
  org_id: string;

  @IsString()
  goal: string; // e.g., "reduce burnout by 30%", "improve TFCI score"

  @IsOptional()
  @IsUUID()
  team_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  max_recommendations?: number;
}

export class ConversationMessageDto {
  @IsUUID()
  org_id: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  conversation_id?: string;
}

// ========== Response Types ==========

export interface AiInsight {
  type: InsightType;
  severity: Severity;
  module: string;
  title: string;
  description: string;
  actionable_items: string[];
  impact_score: number; // 0-100
  confidence: number; // 0-100
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
