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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AiEnhancedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiEnhancedService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
const openai_1 = __importDefault(require("openai"));
const ai_dto_1 = require("./dto/ai.dto");
let AiEnhancedService = AiEnhancedService_1 = class AiEnhancedService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(AiEnhancedService_1.name);
        this.openai = null;
        this.cache = new Map();
        this.rateLimits = new Map();
        this.conversations = new Map();
        this.RATE_LIMIT_REQUESTS = 50;
        this.RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
        this.CACHE_TTL_MS = 5 * 60 * 1000;
        this.COST_PER_1K_INPUT_TOKENS = 0.03;
        this.COST_PER_1K_OUTPUT_TOKENS = 0.06;
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const supabaseKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
        if (supabaseUrl && supabaseKey) {
            this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
        }
        const openaiKey = this.configService.get('OPENAI_API_KEY');
        if (openaiKey) {
            this.openai = new openai_1.default({ apiKey: openaiKey });
            this.logger.log('OpenAI client initialized successfully');
        }
        else {
            this.logger.warn('OPENAI_API_KEY not configured - AI features will be limited');
        }
    }
    checkRateLimit(orgId) {
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
    getRateLimitInfo(orgId) {
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
    getCached(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.timestamp + entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    setCache(key, data, ttl = this.CACHE_TTL_MS) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }
    async trackUsage(orgId, inputTokens, outputTokens, feature) {
        const costUsd = (inputTokens / 1000) * this.COST_PER_1K_INPUT_TOKENS +
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
            this.logger.log(`AI Usage tracked: org=${orgId}, feature=${feature}, cost=$${costUsd.toFixed(4)}`);
        }
        catch (error) {
            this.logger.error('Failed to track AI usage', error);
        }
    }
    async getUsageStats(orgId, period = 'month') {
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
        const byFeature = {};
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
    async fetchOrgData(orgId, teamId) {
        const cacheKey = `org_data:${orgId}:${teamId || 'all'}`;
        const cached = this.getCached(cacheKey);
        if (cached)
            return cached;
        let tfciQuery = this.supabase
            .from('php_tfci_assessments')
            .select('*')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false })
            .limit(100);
        let nr1Query = this.supabase
            .from('php_nr1_assessments')
            .select('*')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false })
            .limit(100);
        let copcQuery = this.supabase
            .from('php_copc_assessments')
            .select('*')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false })
            .limit(100);
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
    async processNaturalLanguageQuery(orgId, query, teamId, includeModules) {
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
            await this.trackUsage(orgId, completion.usage?.prompt_tokens || 0, completion.usage?.completion_tokens || 0, 'natural_language_query');
            return {
                response,
                data: this.extractRelevantData(orgData, query),
                suggestions: this.generateFollowUpSuggestions(query),
            };
        }
        catch (error) {
            this.logger.error('OpenAI API error', error);
            return this.processQueryWithoutOpenAI(orgId, query, teamId);
        }
    }
    processQueryWithoutOpenAI(orgId, query, teamId) {
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
    buildDataContext(data, includeModules) {
        const modules = includeModules || ['tfci', 'nr1', 'copc'];
        const parts = [];
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
    extractRelevantData(data, query) {
        const lowerQuery = query.toLowerCase();
        const result = {};
        if (lowerQuery.includes('tfci') || lowerQuery.includes('desempenho')) {
            result.tfci_summary = {
                total: data.tfci.length,
                recent: data.tfci.slice(0, 5),
            };
        }
        if (lowerQuery.includes('nr-1') || lowerQuery.includes('risco')) {
            result.nr1_summary = {
                total: data.nr1.length,
                high_risk: data.nr1.filter((a) => a.risk_level >= 3).length,
            };
        }
        if (lowerQuery.includes('copc') || lowerQuery.includes('operacional')) {
            result.copc_summary = {
                total: data.copc.length,
                avg_quality: data.copc.reduce((s, a) => s + (a.quality_score || 0), 0) / (data.copc.length || 1),
            };
        }
        return Object.keys(result).length > 0 ? result : null;
    }
    generateFollowUpSuggestions(query) {
        const lowerQuery = query.toLowerCase();
        const suggestions = [];
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
    async generateNarrativeReport(orgId, reportType, teamId, modules, period, language = 'pt-BR') {
        if (!this.checkRateLimit(orgId)) {
            throw new Error('Rate limit exceeded');
        }
        const orgData = await this.fetchOrgData(orgId, teamId);
        const dataContext = this.buildDataContext(orgData, modules);
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
            await this.trackUsage(orgId, completion.usage?.prompt_tokens || 0, completion.usage?.completion_tokens || 0, 'narrative_report');
            const sections = this.parseMarkdownSections(content);
            const recommendations = this.extractRecommendations(content);
            return {
                title: `Relatório ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} - PHP Analytics`,
                content,
                sections,
                recommendations,
                generated_at: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error('Failed to generate report', error);
            return this.generateFallbackReport(orgData, reportType, language);
        }
    }
    generateFallbackReport(data, reportType, language) {
        const tfciAvg = data.tfci.length > 0
            ? (data.tfci.reduce((s, a) => s + (a.overall_score || 0), 0) / data.tfci.length).toFixed(2)
            : 'N/A';
        const nr1HighRisk = data.nr1.filter((a) => (a.risk_level || 0) >= 3).length;
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
    parseMarkdownSections(content) {
        const sections = [];
        const lines = content.split('\n');
        let currentHeading = '';
        let currentBody = [];
        for (const line of lines) {
            if (line.startsWith('## ')) {
                if (currentHeading) {
                    sections.push({ heading: currentHeading, body: currentBody.join('\n').trim() });
                }
                currentHeading = line.replace('## ', '').trim();
                currentBody = [];
            }
            else if (currentHeading) {
                currentBody.push(line);
            }
        }
        if (currentHeading) {
            sections.push({ heading: currentHeading, body: currentBody.join('\n').trim() });
        }
        return sections;
    }
    extractRecommendations(content) {
        const recommendations = [];
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
    async predictTurnover(orgId, teamId, employeeId, timeHorizon = ai_dto_1.TimeHorizon.NINETY_DAYS) {
        if (!this.checkRateLimit(orgId)) {
            throw new Error('Rate limit exceeded');
        }
        const orgData = await this.fetchOrgData(orgId, teamId);
        const risks = [];
        for (const employee of orgData.employees) {
            if (employeeId && employee.id !== employeeId)
                continue;
            const tfciData = orgData.tfci.filter((a) => a.employee_id === employee.id);
            const nr1Data = orgData.nr1.filter((a) => a.employee_id === employee.id);
            const riskFactors = [];
            let riskScore = 0;
            if (tfciData.length > 0) {
                const avgTfci = tfciData.reduce((s, a) => s + (a.overall_score || 0), 0) / tfciData.length;
                if (avgTfci < 2.5) {
                    riskFactors.push('Score TFCI abaixo de 2.5');
                    riskScore += 25;
                }
                else if (avgTfci < 3.0) {
                    riskFactors.push('Score TFCI na zona de atenção');
                    riskScore += 10;
                }
            }
            if (nr1Data.length > 0) {
                const latestNr1 = nr1Data[0];
                if ((latestNr1.risk_level || 0) >= 3) {
                    riskFactors.push('Alto risco psicossocial (NR-1)');
                    riskScore += 30;
                }
                else if ((latestNr1.risk_level || 0) >= 2) {
                    riskFactors.push('Risco moderado psicossocial');
                    riskScore += 15;
                }
            }
            if (employee.hire_date) {
                const months = this.monthsSince(new Date(employee.hire_date));
                if (months < 6) {
                    riskFactors.push('Menos de 6 meses na empresa');
                    riskScore += 10;
                }
                else if (months >= 24 && months <= 36) {
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
                    confidence: 75,
                });
            }
        }
        return risks.sort((a, b) => b.risk_percentage - a.risk_percentage);
    }
    monthsSince(date) {
        const now = new Date();
        return (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    }
    generateInterventions(riskFactors) {
        const interventions = [];
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
    async forecastPerformance(orgId, teamId, module, monthsAhead = 3) {
        if (!this.checkRateLimit(orgId)) {
            throw new Error('Rate limit exceeded');
        }
        const orgData = await this.fetchOrgData(orgId, teamId);
        const forecasts = [];
        const modules = module ? [module] : [ai_dto_1.PhpModule.TFCI, ai_dto_1.PhpModule.NR1, ai_dto_1.PhpModule.COPC];
        for (const mod of modules) {
            const data = mod === ai_dto_1.PhpModule.TFCI ? orgData.tfci :
                mod === ai_dto_1.PhpModule.NR1 ? orgData.nr1 : orgData.copc;
            if (data.length === 0)
                continue;
            const currentScore = this.calculateModuleScore(data, mod);
            const trend = this.calculateTrend(data, mod);
            const forecastedScores = [];
            const now = new Date();
            for (let i = 1; i <= monthsAhead; i++) {
                const futureDate = new Date(now);
                futureDate.setMonth(futureDate.getMonth() + i);
                const predictedScore = Math.max(0, Math.min(mod === ai_dto_1.PhpModule.COPC ? 100 : 5, currentScore + (trend * i)));
                forecastedScores.push({
                    month: futureDate.toISOString().slice(0, 7),
                    predicted_score: Number(predictedScore.toFixed(2)),
                    confidence_interval: [
                        Number((predictedScore * 0.9).toFixed(2)),
                        Number((predictedScore * 1.1).toFixed(2)),
                    ],
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
    calculateModuleScore(data, module) {
        if (data.length === 0)
            return 0;
        switch (module) {
            case ai_dto_1.PhpModule.TFCI:
                return data.reduce((s, a) => s + (a.overall_score || 0), 0) / data.length;
            case ai_dto_1.PhpModule.NR1:
                const avgRisk = data.reduce((s, a) => s + (a.risk_level || 0), 0) / data.length;
                return 5 - avgRisk;
            case ai_dto_1.PhpModule.COPC:
                return data.reduce((s, a) => s + (a.quality_score || 0), 0) / data.length;
            default:
                return 0;
        }
    }
    calculateTrend(data, module) {
        if (data.length < 2)
            return 0;
        const sorted = [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const mid = Math.floor(sorted.length / 2);
        const firstHalf = sorted.slice(0, mid);
        const secondHalf = sorted.slice(mid);
        const avgFirst = this.calculateModuleScore(firstHalf, module);
        const avgSecond = this.calculateModuleScore(secondHalf, module);
        return avgSecond - avgFirst;
    }
    async generateSmartRecommendations(orgId, goal, teamId, maxRecommendations = 5) {
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
            await this.trackUsage(orgId, completion.usage?.prompt_tokens || 0, completion.usage?.completion_tokens || 0, 'smart_recommendations');
            let recommendations = [];
            try {
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    recommendations = JSON.parse(jsonMatch[0]);
                }
            }
            catch {
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
        }
        catch (error) {
            this.logger.error('Failed to generate recommendations', error);
            return this.generateFallbackRecommendations(goal, orgData);
        }
    }
    generateFallbackRecommendations(goal, data) {
        const lowerGoal = goal.toLowerCase();
        const recommendations = [];
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
                related_module: ai_dto_1.PhpModule.NR1,
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
                related_module: ai_dto_1.PhpModule.TFCI,
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
                related_module: ai_dto_1.PhpModule.COPC,
                effort_level: 'low',
            });
        }
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
                related_module: ai_dto_1.PhpModule.INTEGRATED,
                effort_level: 'low',
            });
        }
        return { goal, recommendations };
    }
    async chat(orgId, message, conversationId) {
        if (!this.checkRateLimit(orgId)) {
            return {
                conversation_id: conversationId || this.generateConversationId(),
                response: 'Limite de requisições atingido. Tente novamente em alguns minutos.',
            };
        }
        const convId = conversationId || this.generateConversationId();
        let messages = this.conversations.get(convId) || [];
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
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000,
            });
            const response = completion.choices[0]?.message?.content || 'Não entendi. Pode reformular?';
            messages.push({ role: 'assistant', content: response });
            this.conversations.set(convId, messages);
            await this.trackUsage(orgId, completion.usage?.prompt_tokens || 0, completion.usage?.completion_tokens || 0, 'chat');
            return {
                conversation_id: convId,
                response,
                suggested_actions: this.extractSuggestedActions(response),
            };
        }
        catch (error) {
            this.logger.error('Chat error', error);
            return {
                conversation_id: convId,
                response: 'Desculpe, ocorreu um erro. Tente novamente.',
            };
        }
    }
    generateConversationId() {
        return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    extractSuggestedActions(response) {
        const actions = [];
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
    getAiStatus() {
        const featuresAvailable = [
            'insights_generation',
            'risk_prediction',
            'action_recommendations',
        ];
        if (this.openai) {
            featuresAvailable.push('natural_language_queries', 'narrative_reports', 'turnover_prediction', 'performance_forecast', 'smart_recommendations', 'conversational_ai');
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
};
exports.AiEnhancedService = AiEnhancedService;
exports.AiEnhancedService = AiEnhancedService = AiEnhancedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiEnhancedService);
//# sourceMappingURL=ai-enhanced.service.js.map