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
exports.UpdateApplicationStageDto = exports.CreateApplicationDto = exports.ApplicationStatus = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["APPLIED"] = "applied";
    ApplicationStatus["IN_PROCESS"] = "in_process";
    ApplicationStatus["HIRED"] = "hired";
    ApplicationStatus["REJECTED"] = "rejected";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
class CreateApplicationDto {
}
exports.CreateApplicationDto = CreateApplicationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Job ID' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateApplicationDto.prototype, "jobId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Candidate ID' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateApplicationDto.prototype, "candidateId", void 0);
class UpdateApplicationStageDto {
}
exports.UpdateApplicationStageDto = UpdateApplicationStageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target stage ID' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateApplicationStageDto.prototype, "toStageId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ApplicationStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ApplicationStatus),
    __metadata("design:type", String)
], UpdateApplicationStageDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Note about the stage change' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateApplicationStageDto.prototype, "note", void 0);
//# sourceMappingURL=index.js.map