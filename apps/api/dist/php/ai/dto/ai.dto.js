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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationMessageDto = exports.SmartRecommendationsDto = exports.PerformanceForecastDto = exports.TurnoverPredictionDto = exports.GenerateReportDto = exports.NaturalLanguageQueryDto = exports.RecommendActionsDto = exports.RecommendActionsContextDto = exports.PredictRisksDto = exports.GenerateInsightsDto = exports.RiskLevel = exports.Severity = exports.InsightType = exports.PhpModule = exports.TimeHorizon = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var TimeHorizon;
(function (TimeHorizon) {
    TimeHorizon["SEVEN_DAYS"] = "7d";
    TimeHorizon["THIRTY_DAYS"] = "30d";
    TimeHorizon["NINETY_DAYS"] = "90d";
})(TimeHorizon || (exports.TimeHorizon = TimeHorizon = {}));
var PhpModule;
(function (PhpModule) {
    PhpModule["TFCI"] = "tfci";
    PhpModule["NR1"] = "nr1";
    PhpModule["COPC"] = "copc";
    PhpModule["INTEGRATED"] = "integrated";
})(PhpModule || (exports.PhpModule = PhpModule = {}));
var InsightType;
(function (InsightType) {
    InsightType["ALERT"] = "alert";
    InsightType["RECOMMENDATION"] = "recommendation";
    InsightType["OPPORTUNITY"] = "opportunity";
    InsightType["TREND"] = "trend";
})(InsightType || (exports.InsightType = InsightType = {}));
var Severity;
(function (Severity) {
    Severity["CRITICAL"] = "critical";
    Severity["HIGH"] = "high";
    Severity["MEDIUM"] = "medium";
    Severity["LOW"] = "low";
})(Severity || (exports.Severity = Severity = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["CRITICAL"] = "critical";
    RiskLevel["WARNING"] = "warning";
    RiskLevel["WATCH"] = "watch";
    RiskLevel["NONE"] = "none";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
class GenerateInsightsDto {
}
exports.GenerateInsightsDto = GenerateInsightsDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GenerateInsightsDto.prototype, "org_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GenerateInsightsDto.prototype, "team_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(PhpModule),
    __metadata("design:type", String)
], GenerateInsightsDto.prototype, "module", void 0);
class PredictRisksDto {
}
exports.PredictRisksDto = PredictRisksDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PredictRisksDto.prototype, "org_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TimeHorizon),
    __metadata("design:type", String)
], PredictRisksDto.prototype, "time_horizon", void 0);
class RecommendActionsContextDto {
}
exports.RecommendActionsContextDto = RecommendActionsContextDto;
__decorate([
    (0, class_validator_1.IsEnum)(PhpModule),
    __metadata("design:type", String)
], RecommendActionsContextDto.prototype, "module", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecommendActionsContextDto.prototype, "metric", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RecommendActionsContextDto.prototype, "current_value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RecommendActionsContextDto.prototype, "team_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RecommendActionsContextDto.prototype, "user_id", void 0);
class RecommendActionsDto {
}
exports.RecommendActionsDto = RecommendActionsDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RecommendActionsDto.prototype, "org_id", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RecommendActionsContextDto),
    __metadata("design:type", RecommendActionsContextDto)
], RecommendActionsDto.prototype, "context", void 0);
class NaturalLanguageQueryDto {
}
exports.NaturalLanguageQueryDto = NaturalLanguageQueryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], NaturalLanguageQueryDto.prototype, "org_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NaturalLanguageQueryDto.prototype, "query", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], NaturalLanguageQueryDto.prototype, "team_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], NaturalLanguageQueryDto.prototype, "include_modules", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NaturalLanguageQueryDto.prototype, "date_range", void 0);
class GenerateReportDto {
}
exports.GenerateReportDto = GenerateReportDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "org_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "report_type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "team_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(PhpModule, { each: true }),
    __metadata("design:type", Array)
], GenerateReportDto.prototype, "modules", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "language", void 0);
class TurnoverPredictionDto {
}
exports.TurnoverPredictionDto = TurnoverPredictionDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TurnoverPredictionDto.prototype, "org_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TurnoverPredictionDto.prototype, "team_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TurnoverPredictionDto.prototype, "employee_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TimeHorizon),
    __metadata("design:type", String)
], TurnoverPredictionDto.prototype, "time_horizon", void 0);
class PerformanceForecastDto {
}
exports.PerformanceForecastDto = PerformanceForecastDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PerformanceForecastDto.prototype, "org_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PerformanceForecastDto.prototype, "team_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(PhpModule),
    __metadata("design:type", String)
], PerformanceForecastDto.prototype, "module", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], PerformanceForecastDto.prototype, "months_ahead", void 0);
class SmartRecommendationsDto {
}
exports.SmartRecommendationsDto = SmartRecommendationsDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SmartRecommendationsDto.prototype, "org_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SmartRecommendationsDto.prototype, "goal", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SmartRecommendationsDto.prototype, "team_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(20),
    __metadata("design:type", Number)
], SmartRecommendationsDto.prototype, "max_recommendations", void 0);
class ConversationMessageDto {
}
exports.ConversationMessageDto = ConversationMessageDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ConversationMessageDto.prototype, "org_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConversationMessageDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConversationMessageDto.prototype, "conversation_id", void 0);
//# sourceMappingURL=ai.dto.js.map