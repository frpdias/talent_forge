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
exports.UpdateOrganizationDto = exports.CreateOrganizationDto = exports.OrgSize = exports.OrgType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var OrgType;
(function (OrgType) {
    OrgType["HEADHUNTER"] = "headhunter";
    OrgType["COMPANY"] = "company";
})(OrgType || (exports.OrgType = OrgType = {}));
var OrgSize;
(function (OrgSize) {
    OrgSize["MICRO"] = "micro";
    OrgSize["SMALL"] = "small";
    OrgSize["MEDIUM"] = "medium";
    OrgSize["LARGE"] = "large";
    OrgSize["ENTERPRISE"] = "enterprise";
})(OrgSize || (exports.OrgSize = OrgSize = {}));
class CreateOrganizationDto {
}
exports.CreateOrganizationDto = CreateOrganizationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Organization name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: OrgType, description: 'Organization type' }),
    (0, class_validator_1.IsEnum)(OrgType),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "orgType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'CNPJ da empresa' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "cnpj", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Setor/indústria' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "industry", void 0);
class UpdateOrganizationDto {
}
exports.UpdateOrganizationDto = UpdateOrganizationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Organization name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'CNPJ da empresa' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "cnpj", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Setor/indústria' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "industry", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: OrgSize, description: 'Porte da empresa' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(OrgSize),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "size", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Email de contato' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Telefone de contato' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Website' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "website", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Endereço' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Cidade' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Estado (UF)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'CEP' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "zipCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Descrição da empresa' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL do logo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "logoUrl", void 0);
//# sourceMappingURL=index.js.map