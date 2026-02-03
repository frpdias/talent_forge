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
exports.CopcController = void 0;
const common_1 = require("@nestjs/common");
const copc_service_1 = require("./copc.service");
const copc_metric_dto_1 = require("./dto/copc-metric.dto");
const php_module_guard_1 = require("../guards/php-module.guard");
let CopcController = class CopcController {
    constructor(copcService) {
        this.copcService = copcService;
    }
    async createMetric(dto, req) {
        return this.copcService.createMetric(dto, req.user.id);
    }
    async listMetrics(orgId, teamId, userId, startDate, endDate, limit) {
        return this.copcService.listMetrics({
            org_id: orgId,
            team_id: teamId,
            user_id: userId,
            start_date: startDate,
            end_date: endDate,
            limit: limit ? parseInt(limit) : 50,
        });
    }
    async getMetric(id) {
        return this.copcService.getMetric(id);
    }
    async updateMetric(id, dto) {
        return this.copcService.updateMetric(id, dto);
    }
    async deleteMetric(id) {
        return this.copcService.deleteMetric(id);
    }
    async getDashboard(orgId, teamId, period) {
        return this.copcService.getDashboard(orgId, teamId, period || '30d');
    }
    async getSummary(orgId, teamId) {
        return this.copcService.getSummary(orgId, teamId);
    }
    async getTrends(orgId, teamId, period) {
        return this.copcService.getTrends(orgId, teamId, period || '90d');
    }
    async getCatalog(orgId) {
        return this.copcService.getCatalog(orgId);
    }
    async createCatalogMetric(dto) {
        return this.copcService.createCatalogMetric(dto);
    }
};
exports.CopcController = CopcController;
__decorate([
    (0, common_1.Post)('metrics'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [copc_metric_dto_1.CreateCopcMetricDto, Object]),
    __metadata("design:returntype", Promise)
], CopcController.prototype, "createMetric", null);
__decorate([
    (0, common_1.Get)('metrics'),
    __param(0, (0, common_1.Query)('org_id')),
    __param(1, (0, common_1.Query)('team_id')),
    __param(2, (0, common_1.Query)('user_id')),
    __param(3, (0, common_1.Query)('start_date')),
    __param(4, (0, common_1.Query)('end_date')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CopcController.prototype, "listMetrics", null);
__decorate([
    (0, common_1.Get)('metrics/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CopcController.prototype, "getMetric", null);
__decorate([
    (0, common_1.Put)('metrics/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, copc_metric_dto_1.UpdateCopcMetricDto]),
    __metadata("design:returntype", Promise)
], CopcController.prototype, "updateMetric", null);
__decorate([
    (0, common_1.Delete)('metrics/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CopcController.prototype, "deleteMetric", null);
__decorate([
    (0, common_1.Get)('dashboard/:org_id'),
    __param(0, (0, common_1.Param)('org_id')),
    __param(1, (0, common_1.Query)('team_id')),
    __param(2, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CopcController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('summary/:org_id'),
    __param(0, (0, common_1.Param)('org_id')),
    __param(1, (0, common_1.Query)('team_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CopcController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('trends/:org_id'),
    __param(0, (0, common_1.Param)('org_id')),
    __param(1, (0, common_1.Query)('team_id')),
    __param(2, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CopcController.prototype, "getTrends", null);
__decorate([
    (0, common_1.Get)('catalog'),
    __param(0, (0, common_1.Query)('org_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CopcController.prototype, "getCatalog", null);
__decorate([
    (0, common_1.Post)('catalog'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [copc_metric_dto_1.CreateCopcCatalogDto]),
    __metadata("design:returntype", Promise)
], CopcController.prototype, "createCatalogMetric", null);
exports.CopcController = CopcController = __decorate([
    (0, common_1.Controller)('php/copc'),
    (0, common_1.UseGuards)(php_module_guard_1.PhpModuleGuard),
    __metadata("design:paramtypes", [copc_service_1.CopcService])
], CopcController);
//# sourceMappingURL=copc.controller.js.map