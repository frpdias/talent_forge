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
exports.CandidatesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const candidates_service_1 = require("./candidates.service");
const dto_1 = require("./dto");
const org_guard_1 = require("../auth/guards/org.guard");
const org_decorator_1 = require("../auth/decorators/org.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let CandidatesController = class CandidatesController {
    constructor(candidatesService) {
        this.candidatesService = candidatesService;
    }
    create(dto, orgId, user) {
        return this.candidatesService.create(dto, orgId, user.sub);
    }
    findAll(orgId, search, tag) {
        return this.candidatesService.findAll(orgId, { search, tag });
    }
    findOne(id, orgId) {
        return this.candidatesService.findOne(id, orgId);
    }
    update(id, dto, orgId) {
        return this.candidatesService.update(id, dto, orgId);
    }
    delete(id, orgId) {
        return this.candidatesService.delete(id, orgId);
    }
    createNote(candidateId, dto, orgId, user) {
        return this.candidatesService.createNote(candidateId, dto, orgId, user.sub);
    }
    getNotes(candidateId, orgId) {
        return this.candidatesService.getNotes(candidateId, orgId);
    }
};
exports.CandidatesController = CandidatesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new candidate' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, org_decorator_1.OrgId)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateCandidateDto, String, Object]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all candidates for the organization' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'tag', required: false }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('tag')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get candidate by ID with notes and assessments' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, org_decorator_1.OrgId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update candidate' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, org_decorator_1.OrgId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateCandidateDto, String]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete candidate' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, org_decorator_1.OrgId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/notes'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a note to candidate' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, org_decorator_1.OrgId)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateCandidateNoteDto, String, Object]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "createNote", null);
__decorate([
    (0, common_1.Get)(':id/notes'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all notes for a candidate' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, org_decorator_1.OrgId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CandidatesController.prototype, "getNotes", null);
exports.CandidatesController = CandidatesController = __decorate([
    (0, swagger_1.ApiTags)('Candidates'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiHeader)({ name: 'x-org-id', required: true, description: 'Organization ID' }),
    (0, common_1.UseGuards)(org_guard_1.OrgGuard),
    (0, common_1.Controller)('candidates'),
    __metadata("design:paramtypes", [candidates_service_1.CandidatesService])
], CandidatesController);
//# sourceMappingURL=candidates.controller.js.map