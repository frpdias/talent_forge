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
exports.UpdatePipelineStageDto = exports.CreatePipelineStageDto = exports.UpdateJobDto = exports.CreateJobDto = exports.JobStatus = exports.SeniorityLevel = exports.EmploymentType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var EmploymentType;
(function (EmploymentType) {
    EmploymentType["FULL_TIME"] = "full_time";
    EmploymentType["PART_TIME"] = "part_time";
    EmploymentType["CONTRACT"] = "contract";
    EmploymentType["INTERNSHIP"] = "internship";
    EmploymentType["FREELANCE"] = "freelance";
})(EmploymentType || (exports.EmploymentType = EmploymentType = {}));
var SeniorityLevel;
(function (SeniorityLevel) {
    SeniorityLevel["JUNIOR"] = "junior";
    SeniorityLevel["MID"] = "mid";
    SeniorityLevel["SENIOR"] = "senior";
    SeniorityLevel["LEAD"] = "lead";
    SeniorityLevel["DIRECTOR"] = "director";
    SeniorityLevel["EXECUTIVE"] = "executive";
})(SeniorityLevel || (exports.SeniorityLevel = SeniorityLevel = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["OPEN"] = "open";
    JobStatus["ON_HOLD"] = "on_hold";
    JobStatus["CLOSED"] = "closed";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
class CreateJobDto {
}
exports.CreateJobDto = CreateJobDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Job title' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Job description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Job location' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateJobDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Minimum salary' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateJobDto.prototype, "salaryMin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Maximum salary' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateJobDto.prototype, "salaryMax", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: EmploymentType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(EmploymentType),
    __metadata("design:type", String)
], CreateJobDto.prototype, "employmentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: SeniorityLevel }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SeniorityLevel),
    __metadata("design:type", String)
], CreateJobDto.prototype, "seniority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: JobStatus, default: JobStatus.OPEN }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(JobStatus),
    __metadata("design:type", String)
], CreateJobDto.prototype, "status", void 0);
class UpdateJobDto {
}
exports.UpdateJobDto = UpdateJobDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Job title' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateJobDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Job description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateJobDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Job location' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateJobDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Minimum salary' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateJobDto.prototype, "salaryMin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Maximum salary' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateJobDto.prototype, "salaryMax", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: EmploymentType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(EmploymentType),
    __metadata("design:type", String)
], UpdateJobDto.prototype, "employmentType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: SeniorityLevel }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SeniorityLevel),
    __metadata("design:type", String)
], UpdateJobDto.prototype, "seniority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: JobStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(JobStatus),
    __metadata("design:type", String)
], UpdateJobDto.prototype, "status", void 0);
class CreatePipelineStageDto {
}
exports.CreatePipelineStageDto = CreatePipelineStageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Stage name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePipelineStageDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Stage position (order)' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePipelineStageDto.prototype, "position", void 0);
class UpdatePipelineStageDto {
}
exports.UpdatePipelineStageDto = UpdatePipelineStageDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Stage name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePipelineStageDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Stage position (order)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdatePipelineStageDto.prototype, "position", void 0);
//# sourceMappingURL=index.js.map