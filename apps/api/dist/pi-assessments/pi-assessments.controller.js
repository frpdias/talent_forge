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
exports.PiAssessmentsController = void 0;
const common_1 = require("@nestjs/common");
const pi_assessments_service_1 = require("./pi-assessments.service");
const dto_1 = require("./dto");
let PiAssessmentsController = class PiAssessmentsController {
    constructor(piAssessmentsService) {
        this.piAssessmentsService = piAssessmentsService;
    }
    create(dto, req) {
        const userId = req.user?.sub;
        return this.piAssessmentsService.create(dto, userId);
    }
    listDescriptors(req) {
        const accessToken = req.accessToken;
        return this.piAssessmentsService.listDescriptors(accessToken);
    }
    listSituational(req) {
        const accessToken = req.accessToken;
        return this.piAssessmentsService.listSituationalQuestions(accessToken);
    }
    submitDescriptor(assessmentId, dto, req) {
        const userId = req.user?.sub;
        const accessToken = req.accessToken;
        return this.piAssessmentsService.submitDescriptor(assessmentId, dto, userId, accessToken);
    }
    submitSituational(assessmentId, dto, req) {
        const userId = req.user?.sub;
        const accessToken = req.accessToken;
        return this.piAssessmentsService.submitSituational(assessmentId, dto, userId, accessToken);
    }
    finalize(assessmentId, req) {
        const userId = req.user?.sub;
        const accessToken = req.accessToken;
        return this.piAssessmentsService.finalize(assessmentId, userId, accessToken);
    }
    latest(req) {
        const userId = req.user?.sub;
        const accessToken = req.accessToken;
        return this.piAssessmentsService.latestByUser(userId, accessToken);
    }
};
exports.PiAssessmentsController = PiAssessmentsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreatePiAssessmentDto, Object]),
    __metadata("design:returntype", void 0)
], PiAssessmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('descriptors'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PiAssessmentsController.prototype, "listDescriptors", null);
__decorate([
    (0, common_1.Get)('questions'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PiAssessmentsController.prototype, "listSituational", null);
__decorate([
    (0, common_1.Post)(':id/responses/descriptor'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SubmitPiDescriptorDto, Object]),
    __metadata("design:returntype", void 0)
], PiAssessmentsController.prototype, "submitDescriptor", null);
__decorate([
    (0, common_1.Post)(':id/responses/situational'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SubmitPiSituationalDto, Object]),
    __metadata("design:returntype", void 0)
], PiAssessmentsController.prototype, "submitSituational", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PiAssessmentsController.prototype, "finalize", null);
__decorate([
    (0, common_1.Get)('latest'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PiAssessmentsController.prototype, "latest", null);
exports.PiAssessmentsController = PiAssessmentsController = __decorate([
    (0, common_1.Controller)('pi-assessments'),
    __metadata("design:paramtypes", [pi_assessments_service_1.PiAssessmentsService])
], PiAssessmentsController);
//# sourceMappingURL=pi-assessments.controller.js.map