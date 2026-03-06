import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { AiEnhancedService } from './ai-enhanced.service';
import { PhpModuleGuard } from '../guards/php-module.guard';
import {
  GenerateInsightsDto,
  PredictRisksDto,
  RecommendActionsDto,
  NaturalLanguageQueryDto,
  GenerateReportDto,
  TurnoverPredictionDto,
  PerformanceForecastDto,
  SmartRecommendationsDto,
  ConversationMessageDto,
  TimeHorizon,
  PhpModule,
} from './dto/ai.dto';

@Controller('php/ai')
@UseGuards(PhpModuleGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly aiEnhancedService: AiEnhancedService,
  ) {}

  // ========== Legacy Endpoints ==========

  /**
   * POST /php/ai/generate-insights
   * Gera insights automáticos baseado em dados PHP
   */
  @Post('generate-insights')
  async generateInsights(
    @Body('org_id') orgId: string,
    @Body('team_id') teamId?: string,
  ) {
    const insights = await this.aiService.generateInsights(orgId, teamId);
    return {
      org_id: orgId,
      team_id: teamId,
      insights_count: insights.length,
      insights,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * POST /php/ai/predict-risks
   * Prediz riscos futuros baseado em tendências
   */
  @Post('predict-risks')
  async predictRisks(
    @Body('org_id') orgId: string,
    @Body('time_horizon') timeHorizon?: '7d' | '30d' | '90d',
  ) {
    const predictions = await this.aiService.predictRisks(
      orgId,
      timeHorizon || '30d',
    );
    return {
      org_id: orgId,
      time_horizon: timeHorizon || '30d',
      predictions_count: predictions.length,
      predictions,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * POST /php/ai/recommend-actions
   * Recomenda ações específicas baseado no contexto
   */
  @Post('recommend-actions')
  async recommendActions(
    @Body('org_id') orgId: string,
    @Body('context')
    context: {
      module: 'tfci' | 'nr1' | 'copc';
      metric?: string;
      current_value?: number;
      team_id?: string;
      user_id?: string;
    },
  ) {
    const result = await this.aiService.recommendActions(orgId, context);
    return {
      org_id: orgId,
      context,
      ...result,
      generated_at: new Date().toISOString(),
    };
  }

  // ========== OpenAI Enhanced Endpoints ==========

  /**
   * POST /php/ai/query
   * Processa consulta em linguagem natural
   */
  @Post('query')
  async processNaturalLanguageQuery(@Body() dto: NaturalLanguageQueryDto) {
    try {
      const result = await this.aiEnhancedService.processNaturalLanguageQuery(
        dto.org_id,
        dto.query,
        dto.team_id,
        dto.include_modules,
      );
      return {
        org_id: dto.org_id,
        query: dto.query,
        ...result,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      if (error.message === 'Rate limit exceeded') {
        throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
      throw error;
    }
  }

  /**
   * POST /php/ai/report
   * Gera relatório narrativo
   */
  @Post('report')
  async generateReport(@Body() dto: GenerateReportDto) {
    try {
      const result = await this.aiEnhancedService.generateNarrativeReport(
        dto.org_id,
        dto.report_type,
        dto.team_id,
        dto.modules,
        dto.period,
        dto.language,
      );
      return {
        org_id: dto.org_id,
        report_type: dto.report_type,
        ...result,
      };
    } catch (error) {
      if (error.message === 'Rate limit exceeded') {
        throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
      throw error;
    }
  }

  /**
   * POST /php/ai/predict-turnover
   * Prediz risco de turnover por colaborador/equipe
   */
  @Post('predict-turnover')
  async predictTurnover(@Body() dto: TurnoverPredictionDto) {
    try {
      const predictions = await this.aiEnhancedService.predictTurnover(
        dto.org_id,
        dto.team_id,
        dto.employee_id,
        dto.time_horizon || TimeHorizon.NINETY_DAYS,
      );
      return {
        org_id: dto.org_id,
        time_horizon: dto.time_horizon || TimeHorizon.NINETY_DAYS,
        predictions_count: predictions.length,
        predictions,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      if (error.message === 'Rate limit exceeded') {
        throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
      throw error;
    }
  }

  /**
   * POST /php/ai/forecast-performance
   * Previsão de performance futura
   */
  @Post('forecast-performance')
  async forecastPerformance(@Body() dto: PerformanceForecastDto) {
    try {
      const forecasts = await this.aiEnhancedService.forecastPerformance(
        dto.org_id,
        dto.team_id,
        dto.module,
        dto.months_ahead,
      );
      return {
        org_id: dto.org_id,
        months_ahead: dto.months_ahead || 3,
        forecasts_count: forecasts.length,
        forecasts,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      if (error.message === 'Rate limit exceeded') {
        throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
      throw error;
    }
  }

  /**
   * POST /php/ai/smart-recommendations
   * Gera recomendações inteligentes para um objetivo
   */
  @Post('smart-recommendations')
  async smartRecommendations(@Body() dto: SmartRecommendationsDto) {
    try {
      const result = await this.aiEnhancedService.generateSmartRecommendations(
        dto.org_id,
        dto.goal,
        dto.team_id,
        dto.max_recommendations,
      );
      return {
        org_id: dto.org_id,
        ...result,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      if (error.message === 'Rate limit exceeded') {
        throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }
      throw error;
    }
  }

  /**
   * POST /php/ai/chat
   * Conversa interativa com IA
   */
  @Post('chat')
  async chat(@Body() dto: ConversationMessageDto) {
    const result = await this.aiEnhancedService.chat(
      dto.org_id,
      dto.message,
      dto.conversation_id,
    );
    return {
      org_id: dto.org_id,
      ...result,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * GET /php/ai/usage
   * Estatísticas de uso da API
   */
  @Get('usage')
  async getUsageStats(
    @Query('org_id') orgId: string,
    @Query('period') period?: 'day' | 'week' | 'month',
  ) {
    const stats = await this.aiEnhancedService.getUsageStats(orgId, period);
    return {
      org_id: orgId,
      period: period || 'month',
      ...stats,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * GET /php/ai/health
   * Verifica status da integração AI
   */
  @Get('health')
  async checkHealth() {
    const status = this.aiEnhancedService.getAiStatus();
    return {
      status: 'operational',
      version: '2.0.0',
      ...status,
      timestamp: new Date().toISOString(),
    };
  }
}
