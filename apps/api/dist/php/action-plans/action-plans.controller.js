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
exports.ActionPlansController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const action_plans_service_1 = require("./action-plans.service");
const action_plan_dto_1 = require("./dto/action-plan.dto");
const php_module_guard_1 = require("../guards/php-module.guard");
let ActionPlansController = class ActionPlansController {
    constructor(actionPlansService) {
        this.actionPlansService = actionPlansService;
    }
    async findAll(query) {
        return this.actionPlansService.findAll(query);
    }
    async getStats(orgId) {
        return this.actionPlansService.getStats(orgId);
    }
    async getTopPriority(orgId, limit) {
        return this.actionPlansService.getTopPriority(orgId, limit || 5);
    }
    async findOne(id) {
        return this.actionPlansService.findOne(id);
    }
    async create(dto, req) {
        const userId = req.user?.sub || req.user?.id;
        return this.actionPlansService.create(dto, userId);
    }
    async update(id, dto, req) {
        const userId = req.user?.sub || req.user?.id;
        return this.actionPlansService.update(id, dto, userId);
    }
    async remove(id) {
        await this.actionPlansService.remove(id);
    }
    async findItems(planId) {
        return this.actionPlansService.findItemsByPlan(planId);
    }
    async createItem(planId, dto) {
        dto.action_plan_id = planId;
        return this.actionPlansService.createItem(dto);
    }
    async updateItem(id, dto) {
        return this.actionPlansService.updateItem(id, dto);
    }
    async removeItem(id) {
        await this.actionPlansService.removeItem(id);
    }
};
exports.ActionPlansController = ActionPlansController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all action plans with filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of action plans' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [action_plan_dto_1.ActionPlanQueryDto]),
    __metadata("design:returntype", Promise)
], ActionPlansController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats/:orgId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get action plan statistics for an organization' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Action plan statistics' }),
    __param(0, (0, common_1.Param)('orgId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ActionPlansController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('top-priority/:orgId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get top 5 priority action plans' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Top priority action plans' }),
    __param(0, (0, common_1.Param)('orgId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], ActionPlansController.prototype, "getTopPriority", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get action plan by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Action plan details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Action plan not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ActionPlansController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new action plan' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Action plan created' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [action_plan_dto_1.CreateActionPlanDto, Object]),
    __metadata("design:returntype", Promise)
], ActionPlansController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an action plan' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Action plan updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Action plan not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, action_plan_dto_1.UpdateActionPlanDto, Object]),
    __metadata("design:returntype", Promise)
], ActionPlansController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an action plan' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Action plan deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Action plan not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ActionPlansController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':planId/items'),
    (0, swagger_1.ApiOperation)({ summary: 'List all items for an action plan' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of action items' }),
    __param(0, (0, common_1.Param)('planId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ActionPlansController.prototype, "findItems", null);
__decorate([
    (0, common_1.Post)(':planId/items'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new action item' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Action item created' }),
    __param(0, (0, common_1.Param)('planId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, action_plan_dto_1.CreateActionItemDto]),
    __metadata("design:returntype", Promise)
], ActionPlansController.prototype, "createItem", null);
__decorate([
    (0, common_1.Put)('items/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an action item' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Action item updated' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, action_plan_dto_1.UpdateActionItemDto]),
    __metadata("design:returntype", Promise)
], ActionPlansController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Delete)('items/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an action item' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Action item deleted' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ActionPlansController.prototype, "removeItem", null);
exports.ActionPlansController = ActionPlansController = __decorate([
    (0, swagger_1.ApiTags)('PHP - Action Plans'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/v1/php/action-plans'),
    (0, common_1.UseGuards)(php_module_guard_1.PhpModuleGuard),
    __metadata("design:paramtypes", [action_plans_service_1.ActionPlansService])
], ActionPlansController);
//# sourceMappingURL=action-plans.controller.js.map