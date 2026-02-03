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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dashboard_service_1 = require("./dashboard.service");
const php_module_guard_1 = require("../guards/php-module.guard");
let DashboardController = class DashboardController {
    constructor(dashboardService) {
        this.dashboardService = dashboardService;
    }
    async getMetrics(orgId, forceRefresh) {
        const metrics = await this.dashboardService.getMetrics(orgId, forceRefresh === 'true');
        return metrics;
    }
    async refreshMetrics(orgId) {
        await this.dashboardService.refreshAndEmit(orgId);
        return { success: true, message: 'Metrics refreshed and emitted' };
    }
    async getConnectionStats() {
        const stats = this.dashboardService.getConnectionStats();
        return {
            ...stats,
            timestamp: new Date().toISOString(),
        };
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)(':orgId/metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard metrics for organization' }),
    __param(0, (0, common_1.Param)('orgId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('force_refresh')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Post)(':orgId/refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Force refresh and emit metrics to connected clients' }),
    __param(0, (0, common_1.Param)('orgId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "refreshMetrics", null);
__decorate([
    (0, common_1.Get)('stats/connections'),
    (0, swagger_1.ApiOperation)({ summary: 'Get WebSocket connection statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getConnectionStats", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('PHP - Dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/v1/php/dashboard'),
    (0, common_1.UseGuards)(php_module_guard_1.PhpModuleGuard),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map