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
exports.ActionPlanQueryDto = exports.UpdateActionItemDto = exports.CreateActionItemDto = exports.UpdateActionPlanDto = exports.CreateActionPlanDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateActionPlanDto {
}
exports.CreateActionPlanDto = CreateActionPlanDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Organization ID' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateActionPlanDto.prototype, "org_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Team ID (optional)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateActionPlanDto.prototype, "team_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User ID (optional - for individual plans)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateActionPlanDto.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Source that triggered the action plan', enum: ['tfci', 'nr1', 'copc', 'manual', 'ai'] }),
    (0, class_validator_1.IsEnum)(['tfci', 'nr1', 'copc', 'manual', 'ai']),
    __metadata("design:type", String)
], CreateActionPlanDto.prototype, "triggered_by", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Risk level', enum: ['low', 'medium', 'high', 'critical'], default: 'medium' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['low', 'medium', 'high', 'critical']),
    __metadata("design:type", String)
], CreateActionPlanDto.prototype, "risk_level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Action plan title' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateActionPlanDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Detailed description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateActionPlanDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Root cause analysis' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateActionPlanDto.prototype, "root_cause", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'AI-recommended actions (JSON array)' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateActionPlanDto.prototype, "recommended_actions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User ID to assign the plan to' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateActionPlanDto.prototype, "assigned_to", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Priority (1-5, 1 = highest)', minimum: 1, maximum: 5, default: 3 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateActionPlanDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Due date (YYYY-MM-DD)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateActionPlanDto.prototype, "due_date", void 0);
class UpdateActionPlanDto extends (0, swagger_1.PartialType)(CreateActionPlanDto) {
}
exports.UpdateActionPlanDto = UpdateActionPlanDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Status', enum: ['open', 'in_progress', 'completed', 'cancelled'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['open', 'in_progress', 'completed', 'cancelled']),
    __metadata("design:type", String)
], UpdateActionPlanDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Effectiveness score after completion (1-5)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], UpdateActionPlanDto.prototype, "effectiveness_score", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Whether follow-up is required' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateActionPlanDto.prototype, "follow_up_required", void 0);
class CreateActionItemDto {
}
exports.CreateActionItemDto = CreateActionItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Action plan ID' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateActionItemDto.prototype, "action_plan_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Item description' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateActionItemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User ID to assign the item to' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateActionItemDto.prototype, "assigned_to", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Due date (YYYY-MM-DD)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateActionItemDto.prototype, "due_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional notes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateActionItemDto.prototype, "notes", void 0);
class UpdateActionItemDto extends (0, swagger_1.PartialType)(CreateActionItemDto) {
}
exports.UpdateActionItemDto = UpdateActionItemDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Status', enum: ['open', 'in_progress', 'completed', 'cancelled'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['open', 'in_progress', 'completed', 'cancelled']),
    __metadata("design:type", String)
], UpdateActionItemDto.prototype, "status", void 0);
class ActionPlanQueryDto {
}
exports.ActionPlanQueryDto = ActionPlanQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by organization ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ActionPlanQueryDto.prototype, "org_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by team ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ActionPlanQueryDto.prototype, "team_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['open', 'in_progress', 'completed', 'cancelled']),
    __metadata("design:type", String)
], ActionPlanQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by triggered source' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['tfci', 'nr1', 'copc', 'manual', 'ai']),
    __metadata("design:type", String)
], ActionPlanQueryDto.prototype, "triggered_by", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by risk level' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['low', 'medium', 'high', 'critical']),
    __metadata("design:type", String)
], ActionPlanQueryDto.prototype, "risk_level", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by assigned user' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ActionPlanQueryDto.prototype, "assigned_to", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Limit results', default: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], ActionPlanQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Offset for pagination', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ActionPlanQueryDto.prototype, "offset", void 0);
//# sourceMappingURL=action-plan.dto.js.map