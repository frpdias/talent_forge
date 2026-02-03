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
exports.Nr1Controller = void 0;
const common_1 = require("@nestjs/common");
const nr1_service_1 = require("./nr1.service");
const nr1_assessment_dto_1 = require("./dto/nr1-assessment.dto");
const php_module_guard_1 = require("../guards/php-module.guard");
let Nr1Controller = class Nr1Controller {
    constructor(nr1Service) {
        this.nr1Service = nr1Service;
    }
    async createAssessment(dto, req) {
        return this.nr1Service.createAssessment(dto, req.user.id);
    }
    async listAssessments(orgId, teamId, userId, limit) {
        return this.nr1Service.listAssessments({
            org_id: orgId,
            team_id: teamId,
            user_id: userId,
            limit: limit ? parseInt(limit) : 50,
        });
    }
    async getAssessment(id) {
        return this.nr1Service.getAssessment(id);
    }
    async updateAssessment(id, dto) {
        return this.nr1Service.updateAssessment(id, dto);
    }
    async deleteAssessment(id) {
        return this.nr1Service.deleteAssessment(id);
    }
    async getRiskMatrix(orgId, teamId) {
        return this.nr1Service.getRiskMatrix(orgId, teamId);
    }
    async getComplianceReport(orgId) {
        return this.nr1Service.getComplianceReport(orgId);
    }
    async generateActionPlans(body, req) {
        return this.nr1Service.generateActionPlans(body.org_id, body.min_risk_level || 3, req.user.id);
    }
    async createSelfAssessment(dto, req) {
        return this.nr1Service.createSelfAssessment(dto, req.user.id);
    }
    async listSelfAssessments(orgId, employeeId, limit) {
        return this.nr1Service.listSelfAssessments({
            org_id: orgId,
            employee_id: employeeId,
            limit: limit ? parseInt(limit) : 50,
        });
    }
    async getSelfAssessment(id) {
        return this.nr1Service.getSelfAssessment(id);
    }
    async getComparativeAnalysis(orgId, employeeId) {
        return this.nr1Service.getComparativeAnalysis(orgId, employeeId);
    }
    async createInvitation(body, req) {
        return this.nr1Service.createInvitations(body, req.user.id);
    }
    async listInvitations(orgId, status) {
        return this.nr1Service.listInvitations(orgId, status);
    }
    async getInvitation(id) {
        return this.nr1Service.getInvitation(id);
    }
    async getInvitationByToken(token) {
        return this.nr1Service.getInvitationByToken(token);
    }
    async resendInvitation(id) {
        return this.nr1Service.resendInvitation(id);
    }
    async cancelInvitation(id) {
        return this.nr1Service.cancelInvitation(id);
    }
};
exports.Nr1Controller = Nr1Controller;
__decorate([
    (0, common_1.Post)('assessments'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [nr1_assessment_dto_1.CreateNr1AssessmentDto, Object]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "createAssessment", null);
__decorate([
    (0, common_1.Get)('assessments'),
    __param(0, (0, common_1.Query)('org_id')),
    __param(1, (0, common_1.Query)('team_id')),
    __param(2, (0, common_1.Query)('user_id')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "listAssessments", null);
__decorate([
    (0, common_1.Get)('assessments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "getAssessment", null);
__decorate([
    (0, common_1.Put)('assessments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, nr1_assessment_dto_1.UpdateNr1AssessmentDto]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "updateAssessment", null);
__decorate([
    (0, common_1.Delete)('assessments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "deleteAssessment", null);
__decorate([
    (0, common_1.Get)('risk-matrix/:org_id'),
    __param(0, (0, common_1.Param)('org_id')),
    __param(1, (0, common_1.Query)('team_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "getRiskMatrix", null);
__decorate([
    (0, common_1.Get)('compliance-report/:org_id'),
    __param(0, (0, common_1.Param)('org_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "getComplianceReport", null);
__decorate([
    (0, common_1.Post)('action-plans'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "generateActionPlans", null);
__decorate([
    (0, common_1.Post)('self-assessments'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "createSelfAssessment", null);
__decorate([
    (0, common_1.Get)('self-assessments'),
    __param(0, (0, common_1.Query)('org_id')),
    __param(1, (0, common_1.Query)('employee_id')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "listSelfAssessments", null);
__decorate([
    (0, common_1.Get)('self-assessments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "getSelfAssessment", null);
__decorate([
    (0, common_1.Get)('comparative-analysis/:org_id'),
    __param(0, (0, common_1.Param)('org_id')),
    __param(1, (0, common_1.Query)('employee_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "getComparativeAnalysis", null);
__decorate([
    (0, common_1.Post)('invitations'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "createInvitation", null);
__decorate([
    (0, common_1.Get)('invitations'),
    __param(0, (0, common_1.Query)('org_id')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "listInvitations", null);
__decorate([
    (0, common_1.Get)('invitations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "getInvitation", null);
__decorate([
    (0, common_1.Get)('invitations/token/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "getInvitationByToken", null);
__decorate([
    (0, common_1.Post)('invitations/:id/resend'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "resendInvitation", null);
__decorate([
    (0, common_1.Delete)('invitations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], Nr1Controller.prototype, "cancelInvitation", null);
exports.Nr1Controller = Nr1Controller = __decorate([
    (0, common_1.Controller)('php/nr1'),
    (0, common_1.UseGuards)(php_module_guard_1.PhpModuleGuard),
    __metadata("design:paramtypes", [nr1_service_1.Nr1Service])
], Nr1Controller);
//# sourceMappingURL=nr1.controller.js.map