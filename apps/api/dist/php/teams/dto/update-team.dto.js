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
exports.UpdateTeamDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateTeamDto {
}
exports.UpdateTeamDto = UpdateTeamDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nome do time', example: 'Equipe de Vendas B2B' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2, { message: 'Nome deve ter no mínimo 2 caracteres' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Nome deve ter no máximo 100 caracteres' }),
    __metadata("design:type", String)
], UpdateTeamDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Descrição do time', example: 'Equipe responsável por vendas B2B' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500, { message: 'Descrição deve ter no máximo 500 caracteres' }),
    __metadata("design:type", String)
], UpdateTeamDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID do gestor do time', example: '550e8400-e29b-41d4-a716-446655440001' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'manager_id deve ser um UUID válido' }),
    __metadata("design:type", Object)
], UpdateTeamDto.prototype, "manager_id", void 0);
//# sourceMappingURL=update-team.dto.js.map