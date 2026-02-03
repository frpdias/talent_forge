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
exports.TfciController = void 0;
const common_1 = require("@nestjs/common");
const tfci_service_1 = require("./tfci.service");
const tfci_cycle_dto_1 = require("./dto/tfci-cycle.dto");
const php_module_guard_1 = require("../guards/php-module.guard");
const swagger_1 = require("@nestjs/swagger");
let TfciController = class TfciController {
    constructor(tfciService) {
        this.tfciService = tfciService;
    }
    async createCycle(orgId, userId, dto) {
        return this.tfciService.createCycle(orgId, userId, dto);
    }
    async getCycles(orgId) {
        return this.tfciService.getCycles(orgId);
    }
    async getCycleById(orgId, cycleId) {
        return this.tfciService.getCycleById(orgId, cycleId);
    }
    async updateCycle(orgId, cycleId, dto) {
        return this.tfciService.updateCycle(orgId, cycleId, dto);
    }
    async deleteCycle(orgId, cycleId) {
        await this.tfciService.deleteCycle(orgId, cycleId);
        return { message: 'Cycle deleted successfully' };
    }
    async createAssessment(orgId, userId, dto) {
        return this.tfciService.createAssessment(orgId, userId, dto);
    }
    async getAssessmentsByCycle(orgId, cycleId) {
        return this.tfciService.getAssessmentsByCycle(orgId, cycleId);
    }
    async getHeatmapData(orgId, cycleId) {
        return this.tfciService.getHeatmapData(orgId, cycleId);
    }
};
exports.TfciController = TfciController;
__decorate([
    (0, common_1.Post)('cycles'),
    (0, swagger_1.ApiOperation)({ summary: 'Create TFCI evaluation cycle' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Cycle created successfully' }),
    __param(0, (0, common_1.Headers)('x-org-id')),
    __param(1, (0, common_1.Headers)('x-user-id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, tfci_cycle_dto_1.CreateTfciCycleDto]),
    __metadata("design:returntype", Promise)
], TfciController.prototype, "createCycle", null);
__decorate([
    (0, common_1.Get)('cycles'),
    (0, swagger_1.ApiOperation)({ summary: 'List all TFCI cycles' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns all cycles' }),
    __param(0, (0, common_1.Headers)('x-org-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TfciController.prototype, "getCycles", null);
__decorate([
    (0, common_1.Get)('cycles/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get TFCI cycle by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns cycle details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cycle not found' }),
    __param(0, (0, common_1.Headers)('x-org-id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TfciController.prototype, "getCycleById", null);
__decorate([
    (0, common_1.Patch)('cycles/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update TFCI cycle' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cycle updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cycle not found' }),
    __param(0, (0, common_1.Headers)('x-org-id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, tfci_cycle_dto_1.UpdateTfciCycleDto]),
    __metadata("design:returntype", Promise)
], TfciController.prototype, "updateCycle", null);
__decorate([
    (0, common_1.Delete)('cycles/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete TFCI cycle' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Cycle deleted successfully' }),
    __param(0, (0, common_1.Headers)('x-org-id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TfciController.prototype, "deleteCycle", null);
__decorate([
    (0, common_1.Post)('assessments'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit TFCI assessment' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Assessment submitted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    __param(0, (0, common_1.Headers)('x-org-id')),
    __param(1, (0, common_1.Headers)('x-user-id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, tfci_cycle_dto_1.CreateTfciAssessmentDto]),
    __metadata("design:returntype", Promise)
], TfciController.prototype, "createAssessment", null);
__decorate([
    (0, common_1.Get)('cycles/:id/assessments'),
    (0, swagger_1.ApiOperation)({ summary: 'List all assessments in a cycle' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns all assessments' }),
    __param(0, (0, common_1.Headers)('x-org-id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TfciController.prototype, "getAssessmentsByCycle", null);
__decorate([
    (0, common_1.Get)('cycles/:id/heatmap'),
    (0, swagger_1.ApiOperation)({ summary: 'Get TFCI heatmap data for dashboard' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns heatmap data' }),
    __param(0, (0, common_1.Headers)('x-org-id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TfciController.prototype, "getHeatmapData", null);
exports.TfciController = TfciController = __decorate([
    (0, swagger_1.ApiTags)('PHP TFCI'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('php/tfci'),
    (0, common_1.UseGuards)(php_module_guard_1.PhpModuleGuard),
    __metadata("design:paramtypes", [tfci_service_1.TfciService])
], TfciController);
//# sourceMappingURL=tfci.controller.js.map