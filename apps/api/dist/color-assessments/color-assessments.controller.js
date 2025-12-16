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
exports.ColorAssessmentsController = void 0;
const common_1 = require("@nestjs/common");
const color_assessments_service_1 = require("./color-assessments.service");
const dto_1 = require("./dto");
let ColorAssessmentsController = class ColorAssessmentsController {
    constructor(colorAssessmentsService) {
        this.colorAssessmentsService = colorAssessmentsService;
    }
    create(dto, req) {
        const userId = req.user?.sub;
        return this.colorAssessmentsService.create(dto, userId);
    }
    listQuestions(req) {
        const accessToken = req.accessToken;
        return this.colorAssessmentsService.listQuestions(accessToken);
    }
    submit(assessmentId, dto, req) {
        const userId = req.user?.sub;
        const accessToken = req.accessToken;
        return this.colorAssessmentsService.submitResponse(assessmentId, dto, userId, accessToken);
    }
    finalize(assessmentId, req) {
        const userId = req.user?.sub;
        const accessToken = req.accessToken;
        return this.colorAssessmentsService.finalize(assessmentId, userId, accessToken);
    }
    latest(req) {
        const userId = req.user?.sub;
        const accessToken = req.accessToken;
        return this.colorAssessmentsService.latestByUser(userId, accessToken);
    }
};
exports.ColorAssessmentsController = ColorAssessmentsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateColorAssessmentDto, Object]),
    __metadata("design:returntype", void 0)
], ColorAssessmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('questions'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ColorAssessmentsController.prototype, "listQuestions", null);
__decorate([
    (0, common_1.Post)(':id/responses'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SubmitColorResponseDto, Object]),
    __metadata("design:returntype", void 0)
], ColorAssessmentsController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ColorAssessmentsController.prototype, "finalize", null);
__decorate([
    (0, common_1.Get)('latest'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ColorAssessmentsController.prototype, "latest", null);
exports.ColorAssessmentsController = ColorAssessmentsController = __decorate([
    (0, common_1.Controller)('color-assessments'),
    __metadata("design:paramtypes", [color_assessments_service_1.ColorAssessmentsService])
], ColorAssessmentsController);
//# sourceMappingURL=color-assessments.controller.js.map