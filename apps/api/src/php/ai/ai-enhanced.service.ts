import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import {
  AiInsight,
  RiskPrediction,
  TurnoverRisk,
  PerformanceForecast,
  ConversationResponse,
  UsageTracking,
  PhpModule,
  TimeHorizon,
  Severity,
  RiskLevel,
  InsightType,
} from './dto/ai.dto';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class AiEnhancedService {
  private readonly logger = new Logger(AiEnhancedService.name);
  private readonly supabase: SupabaseClient;
  private readonly openai: OpenAI | null = null;
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly rateLimits = new Map<string, RateLimitEntry>();
  private readonly conversations = new Map<string, OpenAI.Chat.ChatCompletionMessageParam[]>();

  // Rate limiting config
  private readonly RATE_LIMIT_REQUESTS = 50; // per org per hour
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

  // Cache config
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  // Cost tracking (GPT-4 pricing)
  private readonly COST_PER_1K_INPUT_TOKENS = 0.03;
  private readonly COST_PER_1K_OUTPUT_TOKENS = 0.06;

  constructor(private readonly configService: ConfigService) {
    // Initialize Supabase client
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    // Initialize OpenAI client
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
      this.logger.log('OpenAI client initialized successfully');
    } else {
      this.logger.warn('OPENAI_API_KEY not configured - AI features will be limited');
    }
  }

  // ========== Rate Limiting ==========

  private checkRateLimit(orgId: string): boolean {
    const now = Date.now();
    const entry = this.rateLimits.get(orgId);

    if (!entry || now >= entry.resetAt) {
      this.rateLimits.set(orgId, {
        count: 1,
        resetAt: now + this.RATE_LIMIT_WINDOW_MS,
      });
      return true;
    }

    if (entry.count >= this.RATE_LIMIT_REQUESTS) {
      return false;
    }

    entry.count++;
    return true;
  }

  private getRateLimitInfo(orgId: string): { remaining: number; resetAt: Date } {
    const entry = this.rateLimits.get(orgId);
    if (!entry) {
      return {
        remaining: this.RATE_LIMIT_REQUESTS,
        resetAt: new Date(Date.now() + this.RATE_LIMIT_WINDOW_MS),
      };
    }
    return {
      remaining: Math.max(0, this.RATE_LIMIT_REQUESTS - entry.count),
      resetAt: new Date(entry.resetAt),
    };
  }

  // ========== Caching ==========

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl = this.CACHE_TTL_MS): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  // ========== Usage Tracking ==========

  private async trackUsage(
    orgId: string,
    inputTokens: number,
    outputTokens: number,
    feature: string,
  ): Promise<void> {
    const costUsd =
      (inputTokens / 1000) * this.COST_PER_1K_INPUT_TOKENS +
      (outputTokens / 1000) * this.COST_PER_1K_OUTPUT_TOKENS;

    try {
      await this.supabase.from('php_ai_usage').insert({
        org_id: orgId,
        feature,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: costUsd,
        created_at: new Date().toISOString(),
      });

      this.logger.log(
        `AI Usage tracked: org=${orgId}, feature=${feature}, cost=$${costUsd.toFixed(4)}`,
      );
    } catch (error) {
      this.logger.error('Failed to track AI usage', error);
    }
  }

  async getUsageStats(orgId: string, period: 'day' | 'week' | 'month' = 'month'): Promise<{
    total_tokens: number;
    total_cost_usd: number;
    requests_count: number;
    by_feature: Record<string, { tokens: number; cost: number; count: number }>;
  }> {
    const periodDays = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    const since = new Date();
    since.setDate(since.getDate() - periodDays);

    const { data, error } = await this.supabase
      .from('php_ai_usage')
      .select('*')
      .eq('org_id', orgId)
      .gte('created_at', since.toISOString());

    if (error || !data) {
      return {
        total_tokens: 0,
        total_cost_usd: 0,
        requests_count: 0,
        by_feature: {},
      };
    }

    const byFeature: Record<string, { tokens: number; cost: number; count: number }> = {};

    let totalTokens = 0;
    let totalCost = 0;

    for (const row of data) {
      const tokens = (row.input_tokens || 0) + (row.output_tokens || 0);
      totalTokens += tokens;
      totalCost += row.cost_usd || 0;

      if (!byFeature[row.feature]) {
        byFeature[row.feature] = { tokens: 0, cost: 0, count: 0 };
      }
      byFeature[row.feature].tokens += tokens;
      byFeature[row.feature].cost += row.cost_usd || 0;
      byFeature[row.feature].count++;
    }

    return {
      total_tokens: totalTokens,
      total_cost_usd: totalCost,
      requests_count: data.length,
      by_feature: byFeature,
    };
  }

  // ========== Data Fetching ==========

  private async fetchOrgData(orgId: string, teamId?: string): Promise<{
    tfci: any[];
    nr1: any[];
    copc: any[];
    employees: any[];
  }> {
    const cacheKey = `org_data:${orgId}:${teamId || 'all'}`;
    const cached = this.getCached<any>(cacheKey);
    if (cached) return cached;

    // Fetch TFCI assessments
    let tfciQuery = this.supabase
      .from('php_tfci_assessments')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Fetch NR-1 assessments
    let nr1Query = this.supabase
      .from('php_nr1_assessments')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Fetch COPC assessments
    let copcQuery = this.supabase
      .from('php_copc_assessments')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Fetch employees
    let employeesQuery = this.supabase
      .from('employees')
      .select('id, name, email, position, department, hire_date, status')
      .eq('org_id', orgId)
      .eq('status', 'active');

    if (teamId) {
      tfciQuery = tfciQuery.eq('team_id', teamId);
      nr1Query = nr1Query.eq('team_id', teamId);
      copcQuery = copcQuery.eq('team_id', teamId);
    }

    const [tfciResult, nr1Result, copcResult, employeesResult] = await Promise.all([
      tfciQuery,
      nr1Query,
      copcQuery,
      employeesQuery,
    ]);

    const data = {
      tfci: tfciResult.data || [],
      nr1: nr1Result.data || [],
      copc: copcResult.data || [],
      employees: employeesResult.data || [],
    };

    this.setCache(cacheKey, data);
    return data;
  }

  // ========== Natural Language Processing ==========

  async processNaturalLanguageQuery(
    orgId: string,
    query: string,
    teamId?: string,
    includeModules?: ('tfci' | 'nr1' | 'copc')[],
  ): Promise<{
    response: string;
    data?: any;
    suggestions?: string[];
  }> {
    if (!this.checkRateLimit(orgId)) {
      const info = this.getRateLimitInfo(orgId);
      return {
        response: `Limite de requisições atingido. Tente novamente após ${info.resetAt.toLocaleTimeString()}`,
        suggestions: ['Aguarde o reset do rate limit', 'Entre em contato com suporte para aumentar limite'],
      };
    }

    if (!this.openai) {
      return this.processQueryWithoutOpenAI(orgId, query, teamId);
    }

    const orgData = await this.fetchOrgData(orgId, teamId);
    const dataContext = this.buildDataContext(orgData, includeModules);

    const systemPrompt = `Você é um assistente especializado em análise de People Analytics para RH.
Você tem acesso aos seguintes dados da organização:

${dataContext}

Responda em português brasileiro de forma clara e objetiva.
Quando relevante, inclua números específicos e recomendações acionáveis.
Formate a resposta em Markdown quando apropriado.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content || 'Não foi possível processar a consulta.';
      
      await this.trackUsage(
        orgId,
        completion.usage?.prompt_tokens || 0,
        completion.usage?.completion_tokens || 0,
        'natural_language_query',
      );

      return {
        response,
        data: this.extractRelevantData(orgData, query),
        suggestions: this.generateFollowUpSuggestions(query),
      };
    } catch (error) {
      this.logger.error('OpenAI API error', error);
      return this.processQueryWithoutOpenAI(orgId, query, teamId);
    }
  }

  private processQueryWithoutOpenAI(
    orgId: string,
    query: string,
    teamId?: string,
  ): { response: string; suggestions?: string[] } {
    // Fallback simples sem OpenAI
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('tfci') || lowerQuery.includes('desempenho')) {
      return {
        response: '📊 **Resumo TFCI**\n\nPara análise detalhada de desempenho, acesse o módulo TFCI no menu lateral. Lá você encontrará scores individuais e por equipe.',
        suggestions: ['Ver dashboard TFCI', 'Comparar equipes', 'Exportar relatório'],
      };
    }

    if (lowerQuery.includes('nr-1') || lowerQuery.includes('burnout') || lowerQuery.includes('estresse')) {
      return {
        response: '⚠️ **Resumo NR-1**\n\nPara análise de riscos psicossociais, acesse o módulo NR-1. Lá você pode identificar colaboradores em risco e criar planos de ação.',
        suggestions: ['Ver alertas NR-1', 'Identificar riscos críticos', 'Criar plano de ação'],
      };
    }

    if (lowerQuery.includes('copc') || lowerQuery.includes('operacional') || lowerQuery.includes('qualidade')) {
      return {
        response: '📈 **Resumo COPC**\n\nPara métricas operacionais, acesse o módulo COPC. Você pode ver Quality Score, Efficiency e outras métricas de performance.',
        suggestions: ['Ver dashboard COPC', 'Comparar períodos', 'Identificar gaps'],
      };
    }

    return {
      response: '🤖 Para consultas em linguagem natural avançadas, configure a chave da API OpenAI nas variáveis de ambiente. Enquanto isso, você pode acessar os módulos TFCI, NR-1 e COPC pelo menu.',
      suggestions: ['Acessar TFCI', 'Acessar NR-1', 'Acessar COPC', 'Configurar OpenAI'],
    };
  }

  private buildDataContext(
    data: { tfci: any[]; nr1: any[]; copc: any[]; employees: any[] },
    includeModules?: ('tfci' | 'nr1' | 'copc')[],
  ): string {
    const modules = includeModules || ['tfci', 'nr1', 'copc'];
    const parts: string[] = [];

    parts.push(`Total de colaboradores: ${data.employees.length}`);

    if (modules.includes('tfci') && data.tfci.length > 0) {
      const avgScore = data.tfci.reduce((sum, a) => sum + (a.overall_score || 0), 0) / data.tfci.length;
      parts.push(`\n## TFCI (Talent Fit Competency Index)
- Total de avaliações: ${data.tfci.length}
- Score médio: ${avgScore.toFixed(2)}/5
- Última avaliação: ${data.tfci[0]?.created_at || 'N/A'}`);
    }

    if (modules.includes('nr1') && data.nr1.length > 0) {
      const highRisk = data.nr1.filter(a => (a.risk_level || 0) >= 3).length;
      parts.push(`\n## NR-1 (Riscos Psicossociais)
- Total de avaliações: ${data.nr1.length}
- Colaboradores em alto risco: ${highRisk}
- Última avaliação: ${data.nr1[0]?.created_at || 'N/A'}`);
    }

    if (modules.includes('copc') && data.copc.length > 0) {
      const avgQuality = data.copc.reduce((sum, a) => sum + (a.quality_score || 0), 0) / data.copc.length;
      parts.push(`\n## COPC (Performance Operacional)
- Total de avaliações: ${data.copc.length}
- Quality Score médio: ${avgQuality.toFixed(1)}%
- Última avaliação: ${data.copc[0]?.created_at || 'N/A'}`);
    }

    return parts.join('\n');
  }

  private extractRelevantData(data: any, query: string): any {
    // Extrai dados relevantes baseado na query
    const lowerQuery = query.toLowerCase();
    const result: any = {};

    if (lowerQuery.includes('tfci') || lowerQuery.includes('desempenho')) {
      result.tfci_summary = {
        total: data.tfci.length,
        recent: data.tfci.slice(0, 5),
      };
    }

    if (lowerQuery.includes('nr-1') || lowerQuery.includes('risco')) {
      result.nr1_summary = {
        total: data.nr1.length,
        high_risk: data.nr1.filter((a: any) => a.risk_level >= 3).length,
      };
    }

    if (lowerQuery.includes('copc') || lowerQuery.includes('operacional')) {
      result.copc_summary = {
        total: data.copc.length,
        avg_quality: data.copc.reduce((s: number, a: any) => s + (a.quality_score || 0), 0) / (data.copc.length || 1),
      };
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  private generateFollowUpSuggestions(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    const suggestions: string[] = [];

    if (lowerQuery.includes('equipe') || lowerQuery.includes('time')) {
      suggestions.push('Comparar com outras equipes');
      suggestions.push('Ver evolução nos últimos 3 meses');
    }

    if (lowerQuery.includes('risco') || lowerQuery.includes('problema')) {
      suggestions.push('Criar plano de ação');
      suggestions.push('Identificar causas raiz');
    }

    if (suggestions.length === 0) {
      suggestions.push('Ver detalhes por módulo');
      suggestions.push('Exportar relatório completo');
      suggestions.push('Agendar revisão periódica');
    }

    return suggestions;
  }

  // ========== Report Generation ==========

  async generateNarrativeReport(
    orgId: string,
    reportType: 'summary' | 'detailed' | 'executive' | 'comparison',
    teamId?: string,
    modules?: PhpModule[],
    period?: string,
    language: 'pt-BR' | 'en-US' = 'pt-BR',
  ): Promise<{
    title: string;
    content: string;
    sections: Array<{ heading: string; body: string }>;
    recommendations: string[];
    generated_at: string;
  }> {
    if (!this.checkRateLimit(orgId)) {
      throw new Error('Rate limit exceeded');
    }

    const orgData = await this.fetchOrgData(orgId, teamId);
    const dataContext = this.buildDataContext(orgData, modules as any);

    const reportTypeDescriptions = {
      summary: 'Um resumo executivo de 2-3 parágrafos',
      detailed: 'Um relatório detalhado com análise profunda de cada métrica',
      executive: 'Um relatório para C-level focando em impacto de negócio e ROI',
      comparison: 'Uma análise comparativa entre períodos ou equipes',
    };

    if (!this.openai) {
      return this.generateFallbackReport(orgData, reportType, language);
    }

    const systemPrompt = `Você é um especialista em People Analytics gerando relatórios para RH.
Gere um relatório do tipo: ${reportTypeDescriptions[reportType]}

Dados disponíveis:
${dataContext}

Formate em Markdown. Inclua:
1. Resumo executivo
2. Principais métricas
3. Tendências identificadas
4. Recomendações prioritárias

Idioma: ${language === 'pt-BR' ? 'Português Brasileiro' : 'English'}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Gere o relatório ${reportType} para o período ${period || 'atual'}.` },
        ],
        temperature: 0.5,
        max_tokens: 2500,
      });

      const content = completion.choices[0]?.message?.content || '';

      await this.trackUsage(
        orgId,
        completion.usage?.prompt_tokens || 0,
        completion.usage?.completion_tokens || 0,
        'narrative_report',
      );

      // Parse sections from markdown
      const sections = this.parseMarkdownSections(content);
      const recommendations = this.extractRecommendations(content);

      return {
        title: `Relatório ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} - PHP Analytics`,
        content,
        sections,
        recommendations,
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to generate report', error);
      return this.generateFallbackReport(orgData, reportType, language);
    }
  }

  private generateFallbackReport(
    data: any,
    reportType: string,
    language: string,
  ): {
    title: string;
    content: string;
    sections: Array<{ heading: string; body: string }>;
    recommendations: string[];
    generated_at: string;
  } {
    const tfciAvg = data.tfci.length > 0
      ? (data.tfci.reduce((s: number, a: any) => s + (a.overall_score || 0), 0) / data.tfci.length).toFixed(2)
      : 'N/A';

    const nr1HighRisk = data.nr1.filter((a: any) => (a.risk_level || 0) >= 3).length;

    const content = `# Relatório PHP Analytics

## Resumo Executivo

Este relatório apresenta uma visão consolidada dos principais indicadores de People Analytics.

## Métricas Principais

### TFCI - Talent Fit Competency Index
- **Total de avaliações:** ${data.tfci.length}
- **Score médio:** ${tfciAvg}/5

### NR-1 - Riscos Psicossociais
- **Total de avaliações:** ${data.nr1.length}
- **Colaboradores em alto risco:** ${nr1HighRisk}

### COPC - Performance Operacional
- **Total de avaliações:** ${data.copc.length}

## Colaboradores
- **Total ativo:** ${data.employees.length}

## Recomendações

1. Realizar follow-up com colaboradores em alto risco NR-1
2. Implementar plano de desenvolvimento para scores TFCI abaixo de 3.0
3. Revisar métricas COPC quinzenalmente

---
*Relatório gerado automaticamente. Para análises avançadas com IA, configure a API OpenAI.*`;

    return {
      title: `Relatório ${reportType} - PHP Analytics`,
      content,
      sections: [
        { heading: 'Resumo Executivo', body: 'Visão consolidada dos principais indicadores.' },
        { heading: 'TFCI', body: `Score médio: ${tfciAvg}/5` },
        { heading: 'NR-1', body: `${nr1HighRisk} colaboradores em alto risco` },
      ],
      recommendations: [
        'Realizar follow-up com colaboradores em alto risco',
        'Implementar plano de desenvolvimento',
        'Revisar métricas quinzenalmente',
      ],
      generated_at: new Date().toISOString(),
    };
  }

  private parseMarkdownSections(content: string): Array<{ heading: string; body: string }> {
    const sections: Array<{ heading: string; body: string }> = [];
    const lines = content.split('\n');
    let currentHeading = '';
    let currentBody: string[] = [];

    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentHeading) {
          sections.push({ heading: currentHeading, body: currentBody.join('\n').trim() });
        }
        currentHeading = line.replace('## ', '').trim();
        currentBody = [];
      } else if (currentHeading) {
        currentBody.push(line);
      }
    }

    if (currentHeading) {
      sections.push({ heading: currentHeading, body: currentBody.join('\n').trim() });
    }

    return sections;
  }

  private extractRecommendations(content: string): string[] {
    const recommendations: string[] = [];
    const lines = content.split('\n');
    let inRecommendations = false;

    for (const line of lines) {
      if (line.toLowerCase().includes('recomenda') || line.toLowerCase().includes('sugest')) {
        inRecommendations = true;
        continue;
      }
      if (inRecommendations && line.match(/^[-*\d]/)) {
        recommendations.push(line.replace(/^[-*\d.)\s]+/, '').trim());
      }
      if (inRecommendations && line.startsWith('#')) {
        break;
      }
    }

    return recommendations.slice(0, 5);
  }

  // ========== Turnover Prediction ==========

  async predictTurnover(
    orgId: string,
    teamId?: string,
    employeeId?: string,
    timeHorizon: TimeHorizon = TimeHorizon.NINETY_DAYS,
  ): Promise<TurnoverRisk[]> {
    if (!this.checkRateLimit(orgId)) {
      throw new Error('Rate limit exceeded');
    }

    const orgData = await this.fetchOrgData(orgId, teamId);
    const risks: TurnoverRisk[] = [];

    // Para cada colaborador, calcular risco de turnover
    for (const employee of orgData.employees) {
      if (employeeId && employee.id !== employeeId) continue;

      // Buscar dados do colaborador
      const tfciData = orgData.tfci.filter((a: any) => a.employee_id === employee.id);
      const nr1Data = orgData.nr1.filter((a: any) => a.employee_id === employee.id);

      // Calcular fatores de risco
      const riskFactors: string[] = [];
      let riskScore = 0;

      // Fator 1: Score TFCI baixo
      if (tfciData.length > 0) {
        const avgTfci = tfciData.reduce((s: number, a: any) => s + (a.overall_score || 0), 0) / tfciData.length;
        if (avgTfci < 2.5) {
          riskFactors.push('Score TFCI abaixo de 2.5');
          riskScore += 25;
        } else if (avgTfci < 3.0) {
          riskFactors.push('Score TFCI na zona de atenção');
          riskScore += 10;
        }
      }

      // Fator 2: Alto risco NR-1
      if (nr1Data.length > 0) {
        const latestNr1 = nr1Data[0];
        if ((latestNr1.risk_level || 0) >= 3) {
          riskFactors.push('Alto risco psicossocial (NR-1)');
          riskScore += 30;
        } else if ((latestNr1.risk_level || 0) >= 2) {
          riskFactors.push('Risco moderado psicossocial');
          riskScore += 15;
        }
      }

      // Fator 3: Tempo de empresa
      if (employee.hire_date) {
        const months = this.monthsSince(new Date(employee.hire_date));
        if (months < 6) {
          riskFactors.push('Menos de 6 meses na empresa');
          riskScore += 10;
        } else if (months >= 24 && months <= 36) {
          riskFactors.push('Período típico de rotatividade (2-3 anos)');
          riskScore += 15;
        }
      }

      if (riskScore > 0 || employeeId) {
        const interventions = this.generateInterventions(riskFactors);

        risks.push({
          employee_id: employee.id,
          team_id: teamId,
          risk_percentage: Math.min(100, riskScore),
          risk_factors: riskFactors,
          recommended_interventions: interventions,
          confidence: 75, // Modelo simplificado
        });
      }
    }

    return risks.sort((a, b) => b.risk_percentage - a.risk_percentage);
  }

  private monthsSince(date: Date): number {
    const now = new Date();
    return (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
  }

  private generateInterventions(riskFactors: string[]): string[] {
    const interventions: string[] = [];

    if (riskFactors.some(f => f.includes('TFCI'))) {
      interventions.push('Implementar PDI (Plano de Desenvolvimento Individual)');
      interventions.push('Aumentar frequência de 1:1 com gestor');
    }

    if (riskFactors.some(f => f.includes('NR-1') || f.includes('psicossocial'))) {
      interventions.push('Encaminhar para programa de bem-estar');
      interventions.push('Revisar carga de trabalho');
      interventions.push('Considerar realocação temporária');
    }

    if (riskFactors.some(f => f.includes('6 meses'))) {
      interventions.push('Reforçar onboarding e mentoria');
      interventions.push('Check-in de experiência do colaborador');
    }

    if (riskFactors.some(f => f.includes('2-3 anos'))) {
      interventions.push('Discutir plano de carreira');
      interventions.push('Avaliar oportunidades de promoção/movimentação');
    }

    return interventions.length > 0 ? interventions : ['Monitorar e manter acompanhamento regular'];
  }

  // ========== Performance Forecast ==========

  async forecastPerformance(
    orgId: string,
    teamId?: string,
    module?: PhpModule,
    monthsAhead: number = 3,
  ): Promise<PerformanceForecast[]> {
    if (!this.checkRateLimit(orgId)) {
      throw new Error('Rate limit exceeded');
    }

    const orgData = await this.fetchOrgData(orgId, teamId);
    const forecasts: PerformanceForecast[] = [];

    const modules = module ? [module] : [PhpModule.TFCI, PhpModule.NR1, PhpModule.COPC];

    for (const mod of modules) {
      const data = mod === PhpModule.TFCI ? orgData.tfci :
                   mod === PhpModule.NR1 ? orgData.nr1 : orgData.copc;

      if (data.length === 0) continue;

      // Calcular score atual
      const currentScore = this.calculateModuleScore(data, mod);
      
      // Calcular tendência
      const trend = this.calculateTrend(data, mod);

      // Gerar forecast
      const forecastedScores: Array<{
        month: string;
        predicted_score: number;
        confidence_interval: [number, number];
      }> = [];
      const now = new Date();

      for (let i = 1; i <= monthsAhead; i++) {
        const futureDate = new Date(now);
        futureDate.setMonth(futureDate.getMonth() + i);
        
        const predictedScore = Math.max(0, Math.min(
          mod === PhpModule.COPC ? 100 : 5,
          currentScore + (trend * i),
        ));

        forecastedScores.push({
          month: futureDate.toISOString().slice(0, 7),
          predicted_score: Number(predictedScore.toFixed(2)),
          confidence_interval: [
            Number((predictedScore * 0.9).toFixed(2)),
            Number((predictedScore * 1.1).toFixed(2)),
          ] as [number, number],
        });
      }

      const trendSummary = trend > 0.1 ? 'Tendência de melhoria' :
                          trend < -0.1 ? 'Tendência de queda' : 'Estável';

      forecasts.push({
        module: mod,
        current_score: Number(currentScore.toFixed(2)),
        forecasted_scores: forecastedScores,
        trend_summary: trendSummary,
      });
    }

    return forecasts;
  }

  private calculateModuleScore(data: any[], module: PhpModule): number {
    if (data.length === 0) return 0;

    switch (module) {
      case PhpModule.TFCI:
        return data.reduce((s, a) => s + (a.overall_score || 0), 0) / data.length;
      case PhpModule.NR1:
        // NR-1: quanto menor o risk_level, melhor
        const avgRisk = data.reduce((s, a) => s + (a.risk_level || 0), 0) / data.length;
        return 5 - avgRisk; // Inverter para score positivo
      case PhpModule.COPC:
        return data.reduce((s, a) => s + (a.quality_score || 0), 0) / data.length;
      default:
        return 0;
    }
  }

  private calculateTrend(data: any[], module: PhpModule): number {
    if (data.length < 2) return 0;

    // Ordenar por data (mais antigo primeiro)
    const sorted = [...data].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Dividir em duas metades e comparar médias
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const avgFirst = this.calculateModuleScore(firstHalf, module);
    const avgSecond = this.calculateModuleScore(secondHalf, module);

    return avgSecond - avgFirst;
  }

  // ========== Smart Recommendations ==========

  async generateSmartRecommendations(
    orgId: string,
    goal: string,
    teamId?: string,
    maxRecommendations: number = 5,
  ): Promise<{
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
  }> {
    if (!this.checkRateLimit(orgId)) {
      throw new Error('Rate limit exceeded');
    }

    const orgData = await this.fetchOrgData(orgId, teamId);
    const dataContext = this.buildDataContext(orgData);

    if (!this.openai) {
      return this.generateFallbackRecommendations(goal, orgData);
    }

    const systemPrompt = `Você é um consultor especialista em People Analytics e Gestão de Pessoas.
Baseado nos dados organizacionais, gere recomendações para atingir o objetivo: "${goal}"

Dados disponíveis:
${dataContext}

Para cada recomendação, forneça em JSON:
- title: título curto e acionável
- description: descrição detalhada
- priority: "high", "medium" ou "low"
- estimated_impact: impacto esperado mensurável
- implementation_steps: array com 3-5 passos de implementação
- related_module: "tfci", "nr1" ou "copc"
- effort_level: "low", "medium" ou "high"

Retorne um array JSON com ${maxRecommendations} recomendações.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Gere ${maxRecommendations} recomendações priorizadas para: ${goal}` },
        ],
        temperature: 0.6,
        max_tokens: 2000,
      });

      const content = completion.choices[0]?.message?.content || '[]';

      await this.trackUsage(
        orgId,
        completion.usage?.prompt_tokens || 0,
        completion.usage?.completion_tokens || 0,
        'smart_recommendations',
      );

      // Parse JSON response
      let recommendations = [];
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          recommendations = JSON.parse(jsonMatch[0]);
        }
      } catch {
        this.logger.warn('Failed to parse recommendations JSON');
        return this.generateFallbackRecommendations(goal, orgData);
      }

      return {
        goal,
        recommendations: recommendations.slice(0, maxRecommendations),
        similar_success_cases: [
          'Empresa X reduziu burnout em 35% com programa similar',
          'Equipe Y aumentou TFCI em 0.8 pontos após implementação',
        ],
      };
    } catch (error) {
      this.logger.error('Failed to generate recommendations', error);
      return this.generateFallbackRecommendations(goal, orgData);
    }
  }

  private generateFallbackRecommendations(goal: string, data: any): {
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
  } {
    const lowerGoal = goal.toLowerCase();
    const recommendations: any[] = [];

    if (lowerGoal.includes('burnout') || lowerGoal.includes('estresse')) {
      recommendations.push({
        title: 'Programa de Bem-Estar Corporativo',
        description: 'Implementar iniciativas focadas em saúde mental e equilíbrio trabalho-vida',
        priority: 'high',
        estimated_impact: 'Redução de 20-30% em indicadores de estresse',
        implementation_steps: [
          'Mapear colaboradores em risco via NR-1',
          'Contratar parceiro de saúde mental',
          'Lançar programa piloto em equipe crítica',
          'Medir resultados após 30 dias',
        ],
        related_module: PhpModule.NR1,
        effort_level: 'medium',
      });
    }

    if (lowerGoal.includes('desempenho') || lowerGoal.includes('tfci') || lowerGoal.includes('performance')) {
      recommendations.push({
        title: 'Programa de Desenvolvimento Individual (PDI)',
        description: 'Criar planos personalizados baseados em gaps identificados no TFCI',
        priority: 'high',
        estimated_impact: 'Aumento de 0.5-1.0 pontos no TFCI em 90 dias',
        implementation_steps: [
          'Identificar top 10 colaboradores com menor score',
          'Mapear competências prioritárias',
          'Desenhar PDI personalizado',
          'Acompanhar progresso semanalmente',
        ],
        related_module: PhpModule.TFCI,
        effort_level: 'medium',
      });
    }

    if (lowerGoal.includes('qualidade') || lowerGoal.includes('copc')) {
      recommendations.push({
        title: 'Otimização de Processos Operacionais',
        description: 'Análise root cause e implementação de melhorias em quality score',
        priority: 'medium',
        estimated_impact: 'Aumento de 3-5% no Quality Score em 60 dias',
        implementation_steps: [
          'Realizar análise Pareto das causas de rework',
          'Implementar checklist de qualidade',
          'Treinar equipe em gaps identificados',
          'Monitorar métricas semanalmente',
        ],
        related_module: PhpModule.COPC,
        effort_level: 'low',
      });
    }

    // Recomendação genérica se nenhuma específica
    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Diagnóstico Integrado PHP',
        description: 'Realizar análise cruzada dos módulos TFCI, NR-1 e COPC',
        priority: 'medium',
        estimated_impact: 'Identificação de correlações e oportunidades de melhoria',
        implementation_steps: [
          'Exportar dados dos 3 módulos',
          'Identificar padrões e correlações',
          'Priorizar ações por impacto',
          'Criar plano de ação integrado',
        ],
        related_module: PhpModule.INTEGRATED,
        effort_level: 'low',
      });
    }

    return { goal, recommendations };
  }

  // ========== Conversational AI ==========

  async chat(
    orgId: string,
    message: string,
    conversationId?: string,
  ): Promise<ConversationResponse> {
    if (!this.checkRateLimit(orgId)) {
      return {
        conversation_id: conversationId || this.generateConversationId(),
        response: 'Limite de requisições atingido. Tente novamente em alguns minutos.',
      };
    }

    const convId = conversationId || this.generateConversationId();
    let messages = this.conversations.get(convId) || [];

    // Se nova conversa, adicionar contexto do sistema
    if (messages.length === 0) {
      const orgData = await this.fetchOrgData(orgId);
      const dataContext = this.buildDataContext(orgData);

      messages.push({
        role: 'system',
        content: `Você é um assistente de People Analytics para a plataforma TalentForge.
Você ajuda gestores de RH a entender métricas, identificar problemas e tomar decisões.

Dados da organização:
${dataContext}

Responda de forma concisa e acionável. Use markdown quando apropriado.
Sugira próximos passos quando relevante.`,
      });
    }

    messages.push({ role: 'user', content: message });

    if (!this.openai) {
      const fallbackResponse = this.processQueryWithoutOpenAI(orgId, message);
      return {
        conversation_id: convId,
        response: fallbackResponse.response,
        suggested_actions: fallbackResponse.suggestions?.map(s => ({
          action: s,
          endpoint: '',
          params: {},
        })),
      };
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content || 'Não entendi. Pode reformular?';

      messages.push({ role: 'assistant', content: response });
      this.conversations.set(convId, messages);

      await this.trackUsage(
        orgId,
        completion.usage?.prompt_tokens || 0,
        completion.usage?.completion_tokens || 0,
        'chat',
      );

      return {
        conversation_id: convId,
        response,
        suggested_actions: this.extractSuggestedActions(response),
      };
    } catch (error) {
      this.logger.error('Chat error', error);
      return {
        conversation_id: convId,
        response: 'Desculpe, ocorreu um erro. Tente novamente.',
      };
    }
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractSuggestedActions(response: string): Array<{
    action: string;
    endpoint: string;
    params: Record<string, unknown>;
  }> {
    const actions: Array<{ action: string; endpoint: string; params: Record<string, unknown> }> = [];

    if (response.toLowerCase().includes('plano de ação') || response.toLowerCase().includes('action plan')) {
      actions.push({
        action: 'Criar Plano de Ação',
        endpoint: '/php/action-plans',
        params: {},
      });
    }

    if (response.toLowerCase().includes('relatório') || response.toLowerCase().includes('report')) {
      actions.push({
        action: 'Gerar Relatório',
        endpoint: '/php/ai/report',
        params: { report_type: 'summary' },
      });
    }

    if (response.toLowerCase().includes('tfci')) {
      actions.push({
        action: 'Ver Dashboard TFCI',
        endpoint: '/php/tfci',
        params: {},
      });
    }

    return actions;
  }

  // ========== Status Check ==========

  getAiStatus(): {
    openai_configured: boolean;
    features_available: string[];
    rate_limit_info: { max_requests: number; window: string };
    cache_info: { ttl_minutes: number; entries: number };
  } {
    const featuresAvailable = [
      'insights_generation',
      'risk_prediction',
      'action_recommendations',
    ];

    if (this.openai) {
      featuresAvailable.push(
        'natural_language_queries',
        'narrative_reports',
        'turnover_prediction',
        'performance_forecast',
        'smart_recommendations',
        'conversational_ai',
      );
    }

    return {
      openai_configured: !!this.openai,
      features_available: featuresAvailable,
      rate_limit_info: {
        max_requests: this.RATE_LIMIT_REQUESTS,
        window: '1 hour',
      },
      cache_info: {
        ttl_minutes: this.CACHE_TTL_MS / 60000,
        entries: this.cache.size,
      },
    };
  }
}
