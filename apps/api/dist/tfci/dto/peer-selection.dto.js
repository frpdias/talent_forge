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
exports.GenerateAssessmentsResultDto = exports.GenerateRandomSelectionsDto = exports.PeerSelectionResultDto = exports.EligiblePeerDto = exports.PeerSelectionQuotaDto = exports.RegisterPeerSelectionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RegisterPeerSelectionDto {
}
exports.RegisterPeerSelectionDto = RegisterPeerSelectionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do funcionário selecionado como par' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterPeerSelectionDto.prototype, "selectedPeerId", void 0);
class PeerSelectionQuotaDto {
}
exports.PeerSelectionQuotaDto = PeerSelectionQuotaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Número total de pares elegíveis' }),
    __metadata("design:type", Number)
], PeerSelectionQuotaDto.prototype, "peerCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Quantidade de pares que deve escolher' }),
    __metadata("design:type", Number)
], PeerSelectionQuotaDto.prototype, "quota", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Quantos já foram escolhidos manualmente' }),
    __metadata("design:type", Number)
], PeerSelectionQuotaDto.prototype, "manualCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Quantos ainda faltam escolher' }),
    __metadata("design:type", Number)
], PeerSelectionQuotaDto.prototype, "remaining", void 0);
class EligiblePeerDto {
}
exports.EligiblePeerDto = EligiblePeerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do par' }),
    __metadata("design:type", String)
], EligiblePeerDto.prototype, "peerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nome do par' }),
    __metadata("design:type", String)
], EligiblePeerDto.prototype, "peerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email do par', required: false }),
    __metadata("design:type", Object)
], EligiblePeerDto.prototype, "peerEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cargo do par' }),
    __metadata("design:type", String)
], EligiblePeerDto.prototype, "peerPosition", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Departamento do par', required: false }),
    __metadata("design:type", Object)
], EligiblePeerDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nível hierárquico do par', required: false }),
    __metadata("design:type", Object)
], EligiblePeerDto.prototype, "hierarchyLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Quantas vezes foi escolhido neste ciclo' }),
    __metadata("design:type", Number)
], EligiblePeerDto.prototype, "timesChosen", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Pode ser escolhido (limite < 2)' }),
    __metadata("design:type", Boolean)
], EligiblePeerDto.prototype, "canBeChosen", void 0);
class PeerSelectionResultDto {
}
exports.PeerSelectionResultDto = PeerSelectionResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Operação bem-sucedida' }),
    __metadata("design:type", Boolean)
], PeerSelectionResultDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Mensagem de retorno' }),
    __metadata("design:type", String)
], PeerSelectionResultDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Erro (se houver)', required: false }),
    __metadata("design:type", String)
], PeerSelectionResultDto.prototype, "error", void 0);
class GenerateRandomSelectionsDto {
}
exports.GenerateRandomSelectionsDto = GenerateRandomSelectionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total de sorteios gerados' }),
    __metadata("design:type", Number)
], GenerateRandomSelectionsDto.prototype, "totalGenerated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Mensagem de sucesso' }),
    __metadata("design:type", String)
], GenerateRandomSelectionsDto.prototype, "message", void 0);
class GenerateAssessmentsResultDto {
}
exports.GenerateAssessmentsResultDto = GenerateAssessmentsResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Avaliações hierárquicas geradas' }),
    __metadata("design:type", Number)
], GenerateAssessmentsResultDto.prototype, "hierarchicalAssessments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Avaliações de pares geradas' }),
    __metadata("design:type", Number)
], GenerateAssessmentsResultDto.prototype, "peerAssessments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total de avaliações' }),
    __metadata("design:type", Number)
], GenerateAssessmentsResultDto.prototype, "totalAssessments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Mensagem de sucesso' }),
    __metadata("design:type", String)
], GenerateAssessmentsResultDto.prototype, "message", void 0);
//# sourceMappingURL=peer-selection.dto.js.map