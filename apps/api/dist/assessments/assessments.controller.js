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
exports.AssessmentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const assessments_service_1 = require("./assessments.service");
const dto_1 = require("./dto");
const org_guard_1 = require("../auth/guards/org.guard");
const org_decorator_1 = require("../auth/decorators/org.decorator");
const public_decorator_1 = require("../auth/decorators/public.decorator");
let AssessmentsController = class AssessmentsController {
    assessmentsService;
    constructor(assessmentsService) {
        this.assessmentsService = assessmentsService;
    }
    create(dto, orgId) {
        return this.assessmentsService.create(dto, orgId);
    }
    findOne(id, orgId) {
        return this.assessmentsService.findOne(id, orgId);
    }
    findByCandidateId(candidateId, orgId) {
        return this.assessmentsService.findByCandidateId(candidateId, orgId);
    }
    getQuestions(id) {
        return this.assessmentsService.getAssessmentQuestions(id);
    }
    submit(id, dto) {
        return this.assessmentsService.submitAssessment(id, dto);
    }
};
exports.AssessmentsController = AssessmentsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiHeader)({
        name: 'x-org-id',
        required: true,
        description: 'Organization ID',
    }),
    (0, common_1.UseGuards)(org_guard_1.OrgGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new assessment for a candidate' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, org_decorator_1.OrgId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateAssessmentDto, String]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiHeader)({
        name: 'x-org-id',
        required: true,
        description: 'Organization ID',
    }),
    (0, common_1.UseGuards)(org_guard_1.OrgGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get assessment by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, org_decorator_1.OrgId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('candidate/:candidateId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiHeader)({
        name: 'x-org-id',
        required: true,
        description: 'Organization ID',
    }),
    (0, common_1.UseGuards)(org_guard_1.OrgGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get all assessments for a candidate' }),
    __param(0, (0, common_1.Param)('candidateId')),
    __param(1, (0, org_decorator_1.OrgId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "findByCandidateId", null);
__decorate([
    (0, common_1.Get)('take/:id'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get assessment questions (public endpoint for candidates)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "getQuestions", null);
__decorate([
    (0, common_1.Post)('take/:id'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Submit assessment answers (public endpoint for candidates)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SubmitAssessmentDto]),
    __metadata("design:returntype", void 0)
], AssessmentsController.prototype, "submit", null);
exports.AssessmentsController = AssessmentsController = __decorate([
    (0, swagger_1.ApiTags)('Assessments'),
    (0, common_1.Controller)('assessments'),
    __metadata("design:paramtypes", [assessments_service_1.AssessmentsService])
], AssessmentsController);
//# sourceMappingURL=assessments.controller.js.map