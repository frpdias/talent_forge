import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { PhpModuleGuard } from '../guards/php-module.guard';

@Controller('php/ai')
@UseGuards(PhpModuleGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

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

  /**
   * GET /php/ai/health
   * Verifica status da integração AI
   */
  @Get('health')
  async checkHealth() {
    return {
      status: 'operational',
      version: '1.0.0',
      features: {
        insights_generation: true,
        risk_prediction: true,
        action_recommendations: true,
        openai_integration: false, // TODO: implementar
      },
      timestamp: new Date().toISOString(),
    };
  }
}
