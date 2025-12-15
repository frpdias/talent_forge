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
exports.JobsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jobs_service_1 = require("./jobs.service");
const dto_1 = require("./dto");
const org_guard_1 = require("../auth/guards/org.guard");
const org_decorator_1 = require("../auth/decorators/org.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let JobsController = class JobsController {
    constructor(jobsService) {
        this.jobsService = jobsService;
    }
    create(dto, orgId, user) {
        return this.jobsService.create(dto, orgId, user.sub);
    }
    findAll(orgId, status, search) {
        return this.jobsService.findAll(orgId, { status, search });
    }
    findOne(id, orgId) {
        return this.jobsService.findOne(id, orgId);
    }
    update(id, dto, orgId) {
        return this.jobsService.update(id, dto, orgId);
    }
    delete(id, orgId) {
        return this.jobsService.delete(id, orgId);
    }
    createStage(jobId, dto, orgId) {
        return this.jobsService.createStage(jobId, dto, orgId);
    }
    updateStage(jobId, stageId, dto, orgId) {
        return this.jobsService.updateStage(jobId, stageId, dto, orgId);
    }
    deleteStage(jobId, stageId, orgId) {
        return this.jobsService.deleteStage(jobId, stageId, orgId);
    }
};
exports.JobsController = JobsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new job posting' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, org_decorator_1.OrgId)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateJobDto, String, Object]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all jobs for the organization' }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        enum: ['open', 'on_hold', 'closed'],
    }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get job by ID with pipeline stages' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, org_decorator_1.OrgId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update job posting' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, org_decorator_1.OrgId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateJobDto, String]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete job posting' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, org_decorator_1.OrgId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/stages'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a pipeline stage to job' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, org_decorator_1.OrgId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreatePipelineStageDto, String]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "createStage", null);
__decorate([
    (0, common_1.Patch)(':id/stages/:stageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update pipeline stage' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('stageId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, org_decorator_1.OrgId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdatePipelineStageDto, String]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "updateStage", null);
__decorate([
    (0, common_1.Delete)(':id/stages/:stageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete pipeline stage' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('stageId')),
    __param(2, (0, org_decorator_1.OrgId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "deleteStage", null);
exports.JobsController = JobsController = __decorate([
    (0, swagger_1.ApiTags)('Jobs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiHeader)({ name: 'x-org-id', required: true, description: 'Organization ID' }),
    (0, common_1.UseGuards)(org_guard_1.OrgGuard),
    (0, common_1.Controller)('jobs'),
    __metadata("design:paramtypes", [jobs_service_1.JobsService])
], JobsController);
//# sourceMappingURL=jobs.controller.js.map