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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitAssessmentDto = exports.AssessmentAnswerDto = exports.CreateAssessmentDto = exports.AssessmentKind = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
var AssessmentKind;
(function (AssessmentKind) {
    AssessmentKind["BEHAVIORAL_V1"] = "behavioral_v1";
})(AssessmentKind || (exports.AssessmentKind = AssessmentKind = {}));
class CreateAssessmentDto {
    candidateId;
    jobId;
    assessmentKind;
}
exports.CreateAssessmentDto = CreateAssessmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Candidate ID' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAssessmentDto.prototype, "candidateId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Job ID (optional, links assessment to application)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAssessmentDto.prototype, "jobId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: AssessmentKind,
        default: AssessmentKind.BEHAVIORAL_V1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(AssessmentKind),
    __metadata("design:type", String)
], CreateAssessmentDto.prototype, "assessmentKind", void 0);
class AssessmentAnswerDto {
    questionId;
    value;
}
exports.AssessmentAnswerDto = AssessmentAnswerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Question ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssessmentAnswerDto.prototype, "questionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Answer value (1-5 scale)' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AssessmentAnswerDto.prototype, "value", void 0);
class SubmitAssessmentDto {
    answers;
}
exports.SubmitAssessmentDto = SubmitAssessmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [AssessmentAnswerDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AssessmentAnswerDto),
    __metadata("design:type", Array)
], SubmitAssessmentDto.prototype, "answers", void 0);
//# sourceMappingURL=index.js.map