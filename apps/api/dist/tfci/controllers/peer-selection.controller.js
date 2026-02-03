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
exports.PeerSelectionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const peer_selection_service_1 = require("../services/peer-selection.service");
const peer_selection_dto_1 = require("../dto/peer-selection.dto");
let PeerSelectionController = class PeerSelectionController {
    constructor(peerSelectionService) {
        this.peerSelectionService = peerSelectionService;
    }
    async getQuota(cycleId, employeeId, organizationId) {
        return this.peerSelectionService.getPeerSelectionQuota(cycleId, employeeId, organizationId);
    }
    async getEligiblePeers(cycleId, employeeId, organizationId) {
        return this.peerSelectionService.getEligiblePeers(cycleId, employeeId, organizationId);
    }
    async registerSelection(cycleId, selectorId, dto) {
        return this.peerSelectionService.registerPeerSelection(cycleId, selectorId, dto.selectedPeerId);
    }
    async generateRandomSelections(cycleId, organizationId) {
        return this.peerSelectionService.generateRandomSelections(cycleId, organizationId);
    }
    async generateAssessments(cycleId, organizationId) {
        return this.peerSelectionService.generateCycleAssessments(cycleId, organizationId);
    }
};
exports.PeerSelectionController = PeerSelectionController;
__decorate([
    (0, common_1.Get)('quota'),
    (0, swagger_1.ApiOperation)({
        summary: 'Obter quota de seleção de pares',
        description: 'Calcula quantos pares o funcionário deve escolher baseado na quantidade de colegas elegíveis',
    }),
    (0, swagger_1.ApiParam)({ name: 'cycleId', description: 'ID do ciclo TFCI' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Quota calculada com sucesso',
        type: peer_selection_dto_1.PeerSelectionQuotaDto,
    }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, common_1.Query)('employeeId')),
    __param(2, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PeerSelectionController.prototype, "getQuota", null);
__decorate([
    (0, common_1.Get)('eligible-peers'),
    (0, swagger_1.ApiOperation)({
        summary: 'Listar pares elegíveis',
        description: 'Lista todos os colegas que podem ser escolhidos como pares, com contagem de quantas vezes já foram escolhidos',
    }),
    (0, swagger_1.ApiParam)({ name: 'cycleId', description: 'ID do ciclo TFCI' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lista de pares elegíveis',
        type: [peer_selection_dto_1.EligiblePeerDto],
    }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, common_1.Query)('employeeId')),
    __param(2, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PeerSelectionController.prototype, "getEligiblePeers", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Registrar escolha manual de par',
        description: 'Registra a escolha de um colega como par. Respeitando o limite de 2 escolhas por pessoa no mesmo ciclo',
    }),
    (0, swagger_1.ApiParam)({ name: 'cycleId', description: 'ID do ciclo TFCI' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Escolha registrada com sucesso',
        type: peer_selection_dto_1.PeerSelectionResultDto,
    }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, common_1.Query)('employeeId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, peer_selection_dto_1.RegisterPeerSelectionDto]),
    __metadata("design:returntype", Promise)
], PeerSelectionController.prototype, "registerSelection", null);
__decorate([
    (0, common_1.Post)('generate-random'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Gerar sorteios aleatórios',
        description: 'Completa as escolhas de todos os funcionários com sorteios aleatórios (outra metade não escolhida manualmente)',
    }),
    (0, swagger_1.ApiParam)({ name: 'cycleId', description: 'ID do ciclo TFCI' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Sorteios gerados com sucesso',
        type: peer_selection_dto_1.GenerateRandomSelectionsDto,
    }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PeerSelectionController.prototype, "generateRandomSelections", null);
__decorate([
    (0, common_1.Post)('generate-assessments'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Gerar todas as avaliações do ciclo',
        description: 'Gera avaliações hierárquicas (gestor↔subordinados) + avaliações de pares baseadas nas escolhas',
    }),
    (0, swagger_1.ApiParam)({ name: 'cycleId', description: 'ID do ciclo TFCI' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Avaliações geradas com sucesso',
        type: peer_selection_dto_1.GenerateAssessmentsResultDto,
    }),
    __param(0, (0, common_1.Param)('cycleId')),
    __param(1, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PeerSelectionController.prototype, "generateAssessments", null);
exports.PeerSelectionController = PeerSelectionController = __decorate([
    (0, swagger_1.ApiTags)('TFCI - Seleção de Pares'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tfci/cycles/:cycleId/peer-selection'),
    __metadata("design:paramtypes", [peer_selection_service_1.PeerSelectionService])
], PeerSelectionController);
//# sourceMappingURL=peer-selection.controller.js.map