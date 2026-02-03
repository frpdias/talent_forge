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
exports.UpdatePhpSettingsDto = exports.PhpSettingsDto = exports.NotificationSettingsDto = exports.AlertThresholdsDto = exports.PhpWeightsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class PhpWeightsDto {
}
exports.PhpWeightsDto = PhpWeightsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'TFCI weight (0-100)', default: 30 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], PhpWeightsDto.prototype, "tfci", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'NR-1 weight (0-100)', default: 40 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], PhpWeightsDto.prototype, "nr1", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'COPC weight (0-100)', default: 30 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], PhpWeightsDto.prototype, "copc", void 0);
class AlertThresholdsDto {
}
exports.AlertThresholdsDto = AlertThresholdsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Burnout risk threshold (NR-1 carga + COPC pessoas)', default: 2.5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(3),
    __metadata("design:type", Number)
], AlertThresholdsDto.prototype, "burnout_risk", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Conflict threshold (NR-1 conflitos + TFCI colaboração)', default: 2.0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(3),
    __metadata("design:type", Number)
], AlertThresholdsDto.prototype, "conflict_latent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sudden drop threshold (COPC quality drop %)', default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(5),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], AlertThresholdsDto.prototype, "sudden_drop_percent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Absenteeism abnormal threshold (%)', default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(30),
    __metadata("design:type", Number)
], AlertThresholdsDto.prototype, "absenteeism_abnormal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'PHP Score critical threshold', default: 60 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], AlertThresholdsDto.prototype, "php_score_critical", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'PHP Score warning threshold', default: 80 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], AlertThresholdsDto.prototype, "php_score_warning", void 0);
class NotificationSettingsDto {
}
exports.NotificationSettingsDto = NotificationSettingsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enable email notifications', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationSettingsDto.prototype, "email_enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Email recipients for alerts' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], NotificationSettingsDto.prototype, "email_recipients", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enable webhook notifications', default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationSettingsDto.prototype, "webhook_enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Webhook URL for notifications' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], NotificationSettingsDto.prototype, "webhook_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notify on critical alerts only', default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationSettingsDto.prototype, "critical_only", void 0);
class PhpSettingsDto {
}
exports.PhpSettingsDto = PhpSettingsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'PHP Score weights' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PhpWeightsDto),
    __metadata("design:type", PhpWeightsDto)
], PhpSettingsDto.prototype, "weights", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Alert thresholds' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AlertThresholdsDto),
    __metadata("design:type", AlertThresholdsDto)
], PhpSettingsDto.prototype, "thresholds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notification settings' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => NotificationSettingsDto),
    __metadata("design:type", NotificationSettingsDto)
], PhpSettingsDto.prototype, "notifications", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enable AI recommendations', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PhpSettingsDto.prototype, "ai_recommendations_enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enable automatic action plan creation', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PhpSettingsDto.prototype, "auto_action_plans_enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Days to consider overdue for action plans', default: 30 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(365),
    __metadata("design:type", Number)
], PhpSettingsDto.prototype, "action_plan_overdue_days", void 0);
class UpdatePhpSettingsDto {
}
exports.UpdatePhpSettingsDto = UpdatePhpSettingsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Organization ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePhpSettingsDto.prototype, "org_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Settings to update' }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PhpSettingsDto),
    __metadata("design:type", PhpSettingsDto)
], UpdatePhpSettingsDto.prototype, "settings", void 0);
//# sourceMappingURL=settings.dto.js.map