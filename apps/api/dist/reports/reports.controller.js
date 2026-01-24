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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("./reports.service");
const org_guard_1 = require("../auth/guards/org.guard");
const org_decorator_1 = require("../auth/decorators/org.decorator");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    getDashboard(orgId) {
        return this.reportsService.getDashboardStats(orgId);
    }
    getPipelineReport(orgId, jobId) {
        return this.reportsService.getPipelineReport(orgId, jobId);
    }
    getAssessmentsReport(orgId, jobId) {
        return this.reportsService.getAssessmentsReport(orgId, jobId);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('pipelines'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pipeline report for jobs' }),
    (0, swagger_1.ApiQuery)({ name: 'jobId', required: false }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, common_1.Query)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getPipelineReport", null);
__decorate([
    (0, common_1.Get)('assessments'),
    (0, swagger_1.ApiOperation)({ summary: 'Get assessments report' }),
    (0, swagger_1.ApiQuery)({ name: 'jobId', required: false }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, common_1.Query)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getAssessmentsReport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('Reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiHeader)({ name: 'x-org-id', required: true, description: 'Organization ID' }),
    (0, common_1.UseGuards)(org_guard_1.OrgGuard),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map