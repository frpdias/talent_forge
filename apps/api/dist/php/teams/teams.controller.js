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
exports.TeamsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const teams_service_1 = require("./teams.service");
const dto_1 = require("./dto");
const org_guard_1 = require("../../auth/guards/org.guard");
const org_decorator_1 = require("../../auth/decorators/org.decorator");
const current_user_decorator_1 = require("../../auth/decorators/current-user.decorator");
let TeamsController = class TeamsController {
    constructor(teamsService) {
        this.teamsService = teamsService;
    }
    create(orgId, userId, createTeamDto) {
        return this.teamsService.create(userId, createTeamDto);
    }
    findAll(orgId, search, page, limit) {
        return this.teamsService.findAll(orgId, {
            search,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }
    findOne(orgId, id) {
        return this.teamsService.findOne(orgId, id);
    }
    update(orgId, id, updateTeamDto) {
        return this.teamsService.update(orgId, id, updateTeamDto);
    }
    remove(orgId, id) {
        return this.teamsService.remove(orgId, id);
    }
    addMember(orgId, id, addMemberDto) {
        return this.teamsService.addMember(orgId, id, addMemberDto);
    }
    removeMember(orgId, id, memberId) {
        return this.teamsService.removeMember(orgId, id, memberId);
    }
    updateMemberRole(orgId, id, memberId, role) {
        return this.teamsService.updateMemberRole(orgId, id, memberId, role);
    }
    getAvailableMembers(orgId, id) {
        return this.teamsService.getAvailableMembers(orgId, id);
    }
    getOrganizationHierarchy(orgId) {
        return this.teamsService.getOrganizationHierarchy(orgId);
    }
};
exports.TeamsController = TeamsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar novo time' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Time criado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Nome duplicado na organização' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.CreateTeamDto]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar times da organização' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de times' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: 'Buscar por nome' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Página (default: 1)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Itens por página (default: 20)' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar time por ID com membros' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Detalhes do time' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time não encontrado' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID do time' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar time' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time atualizado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Nome duplicado na organização' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID do time' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateTeamDto]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remover time' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time removido' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time não encontrado' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID do time' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Adicionar funcionário ao time' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Funcionário adicionado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Funcionário já é membro do time' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID do time' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.AddTeamMemberDto]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)(':id/members/:memberId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remover funcionário do time' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Funcionário removido' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time ou funcionário não encontrado' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID do time' }),
    (0, swagger_1.ApiParam)({ name: 'memberId', description: 'ID do funcionário (employee_id)' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)('memberId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Patch)(':id/members/:memberId/role'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar papel do funcionário no time' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Papel atualizado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time ou funcionário não encontrado' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID do time' }),
    (0, swagger_1.ApiParam)({ name: 'memberId', description: 'ID do funcionário (employee_id)' }),
    (0, swagger_1.ApiQuery)({ name: 'role', required: true, enum: ['member', 'lead', 'coordinator'] }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)('memberId', common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "updateMemberRole", null);
__decorate([
    (0, common_1.Get)(':id/available-members'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar funcionários disponíveis para adicionar ao time' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de funcionários disponíveis' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Time não encontrado' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'ID do time' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "getAvailableMembers", null);
__decorate([
    (0, common_1.Get)('hierarchy'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter hierarquia de funcionários da organização' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Hierarquia de funcionários' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "getOrganizationHierarchy", null);
exports.TeamsController = TeamsController = __decorate([
    (0, swagger_1.ApiTags)('PHP Module - Teams'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiHeader)({ name: 'x-org-id', required: true, description: 'Organization ID' }),
    (0, common_1.UseGuards)(org_guard_1.OrgGuard),
    (0, common_1.Controller)('php/teams'),
    __metadata("design:paramtypes", [teams_service_1.TeamsService])
], TeamsController);
//# sourceMappingURL=teams.controller.js.map