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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const ai_service_1 = require("./ai.service");
const ai_enhanced_service_1 = require("./ai-enhanced.service");
const php_module_guard_1 = require("../guards/php-module.guard");
const ai_dto_1 = require("./dto/ai.dto");
let AiController = class AiController {
    constructor(aiService, aiEnhancedService) {
        this.aiService = aiService;
        this.aiEnhancedService = aiEnhancedService;
    }
    async generateInsights(orgId, teamId) {
        const insights = await this.aiService.generateInsights(orgId, teamId);
        return {
            org_id: orgId,
            team_id: teamId,
            insights_count: insights.length,
            insights,
            generated_at: new Date().toISOString(),
        };
    }
    async predictRisks(orgId, timeHorizon) {
        const predictions = await this.aiService.predictRisks(orgId, timeHorizon || '30d');
        return {
            org_id: orgId,
            time_horizon: timeHorizon || '30d',
            predictions_count: predictions.length,
            predictions,
            generated_at: new Date().toISOString(),
        };
    }
    async recommendActions(orgId, context) {
        const result = await this.aiService.recommendActions(orgId, context);
        return {
            org_id: orgId,
            context,
            ...result,
            generated_at: new Date().toISOString(),
        };
    }
    async processNaturalLanguageQuery(dto) {
        try {
            const result = await this.aiEnhancedService.processNaturalLanguageQuery(dto.org_id, dto.query, dto.team_id, dto.include_modules);
            return {
                org_id: dto.org_id,
                query: dto.query,
                ...result,
                generated_at: new Date().toISOString(),
            };
        }
        catch (error) {
            if (error.message === 'Rate limit exceeded') {
                throw new common_1.HttpException('Rate limit exceeded', common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            throw error;
        }
    }
    async generateReport(dto) {
        try {
            const result = await this.aiEnhancedService.generateNarrativeReport(dto.org_id, dto.report_type, dto.team_id, dto.modules, dto.period, dto.language);
            return {
                org_id: dto.org_id,
                report_type: dto.report_type,
                ...result,
            };
        }
        catch (error) {
            if (error.message === 'Rate limit exceeded') {
                throw new common_1.HttpException('Rate limit exceeded', common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            throw error;
        }
    }
    async predictTurnover(dto) {
        try {
            const predictions = await this.aiEnhancedService.predictTurnover(dto.org_id, dto.team_id, dto.employee_id, dto.time_horizon || ai_dto_1.TimeHorizon.NINETY_DAYS);
            return {
                org_id: dto.org_id,
                time_horizon: dto.time_horizon || ai_dto_1.TimeHorizon.NINETY_DAYS,
                predictions_count: predictions.length,
                predictions,
                generated_at: new Date().toISOString(),
            };
        }
        catch (error) {
            if (error.message === 'Rate limit exceeded') {
                throw new common_1.HttpException('Rate limit exceeded', common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            throw error;
        }
    }
    async forecastPerformance(dto) {
        try {
            const forecasts = await this.aiEnhancedService.forecastPerformance(dto.org_id, dto.team_id, dto.module, dto.months_ahead);
            return {
                org_id: dto.org_id,
                months_ahead: dto.months_ahead || 3,
                forecasts_count: forecasts.length,
                forecasts,
                generated_at: new Date().toISOString(),
            };
        }
        catch (error) {
            if (error.message === 'Rate limit exceeded') {
                throw new common_1.HttpException('Rate limit exceeded', common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            throw error;
        }
    }
    async smartRecommendations(dto) {
        try {
            const result = await this.aiEnhancedService.generateSmartRecommendations(dto.org_id, dto.goal, dto.team_id, dto.max_recommendations);
            return {
                org_id: dto.org_id,
                ...result,
                generated_at: new Date().toISOString(),
            };
        }
        catch (error) {
            if (error.message === 'Rate limit exceeded') {
                throw new common_1.HttpException('Rate limit exceeded', common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            throw error;
        }
    }
    async chat(dto) {
        const result = await this.aiEnhancedService.chat(dto.org_id, dto.message, dto.conversation_id);
        return {
            org_id: dto.org_id,
            ...result,
            generated_at: new Date().toISOString(),
        };
    }
    async getUsageStats(orgId, period) {
        const stats = await this.aiEnhancedService.getUsageStats(orgId, period);
        return {
            org_id: orgId,
            period: period || 'month',
            ...stats,
            generated_at: new Date().toISOString(),
        };
    }
    async checkHealth() {
        const status = this.aiEnhancedService.getAiStatus();
        return {
            status: 'operational',
            version: '2.0.0',
            ...status,
            timestamp: new Date().toISOString(),
        };
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('generate-insights'),
    __param(0, (0, common_1.Body)('org_id')),
    __param(1, (0, common_1.Body)('team_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateInsights", null);
__decorate([
    (0, common_1.Post)('predict-risks'),
    __param(0, (0, common_1.Body)('org_id')),
    __param(1, (0, common_1.Body)('time_horizon')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "predictRisks", null);
__decorate([
    (0, common_1.Post)('recommend-actions'),
    __param(0, (0, common_1.Body)('org_id')),
    __param(1, (0, common_1.Body)('context')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "recommendActions", null);
__decorate([
    (0, common_1.Post)('query'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_dto_1.NaturalLanguageQueryDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "processNaturalLanguageQuery", null);
__decorate([
    (0, common_1.Post)('report'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_dto_1.GenerateReportDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateReport", null);
__decorate([
    (0, common_1.Post)('predict-turnover'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_dto_1.TurnoverPredictionDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "predictTurnover", null);
__decorate([
    (0, common_1.Post)('forecast-performance'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_dto_1.PerformanceForecastDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "forecastPerformance", null);
__decorate([
    (0, common_1.Post)('smart-recommendations'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_dto_1.SmartRecommendationsDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "smartRecommendations", null);
__decorate([
    (0, common_1.Post)('chat'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_dto_1.ConversationMessageDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "chat", null);
__decorate([
    (0, common_1.Get)('usage'),
    __param(0, (0, common_1.Query)('org_id')),
    __param(1, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getUsageStats", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiController.prototype, "checkHealth", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('php/ai'),
    (0, common_1.UseGuards)(php_module_guard_1.PhpModuleGuard),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        ai_enhanced_service_1.AiEnhancedService])
], AiController);
//# sourceMappingURL=ai.controller.js.map