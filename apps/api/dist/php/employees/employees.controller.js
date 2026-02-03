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
exports.EmployeesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const employees_service_1 = require("./employees.service");
const dto_1 = require("./dto");
const org_guard_1 = require("../../auth/guards/org.guard");
const org_decorator_1 = require("../../auth/decorators/org.decorator");
const current_user_decorator_1 = require("../../auth/decorators/current-user.decorator");
let EmployeesController = class EmployeesController {
    constructor(employeesService) {
        this.employeesService = employeesService;
    }
    create(orgId, userId, createEmployeeDto) {
        return this.employeesService.create(userId, createEmployeeDto);
    }
    async importCSV(orgId, userId, file, organizationId) {
        if (!file) {
            throw new common_1.BadRequestException('Arquivo CSV é obrigatório');
        }
        if (!organizationId) {
            throw new common_1.BadRequestException('organization_id é obrigatório');
        }
        return this.employeesService.importFromCSV(userId, organizationId, file.buffer);
    }
    findAll(orgId, userId, organizationId, status, department, managerId, search) {
        return this.employeesService.findAll(userId, {
            organization_id: organizationId,
            status,
            department,
            manager_id: managerId,
            search,
        });
    }
    getHierarchy(orgId, userId, organizationId) {
        return this.employeesService.getHierarchy(userId, organizationId);
    }
    getHierarchyLevels(orgId, organizationId) {
        return this.employeesService.getHierarchyLevels(organizationId);
    }
    getValidManagers(orgId, organizationId, level) {
        if (!level) {
            throw new common_1.BadRequestException('Query param "level" é obrigatório');
        }
        return this.employeesService.getValidManagers(level, organizationId);
    }
    getHierarchyConfig(orgId, organizationId) {
        return this.employeesService.getHierarchyConfig(organizationId);
    }
    findOne(orgId, userId, id) {
        return this.employeesService.findOne(userId, id);
    }
    update(orgId, userId, id, updateEmployeeDto) {
        return this.employeesService.update(userId, id, updateEmployeeDto);
    }
    remove(orgId, userId, id) {
        return this.employeesService.remove(userId, id);
    }
};
exports.EmployeesController = EmployeesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar novo funcionário' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Funcionário criado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos ou CPF duplicado' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Organização não encontrada' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.CreateEmployeeDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Importar funcionários via CSV' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Importação concluída' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Arquivo inválido ou erros de validação' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Body)('organization_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, String]),
    __metadata("design:returntype", Promise)
], EmployeesController.prototype, "importCSV", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar funcionários com filtros' }),
    (0, swagger_1.ApiQuery)({ name: 'organization_id', required: false, description: 'Filtrar por organização' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['active', 'inactive', 'terminated'] }),
    (0, swagger_1.ApiQuery)({ name: 'department', required: false, description: 'Filtrar por departamento' }),
    (0, swagger_1.ApiQuery)({ name: 'manager_id', required: false, description: 'Filtrar por gestor' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: 'Buscar por nome ou CPF' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de funcionários' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Query)('organization_id')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('department')),
    __param(5, (0, common_1.Query)('manager_id')),
    __param(6, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('hierarchy/:organizationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter hierarquia/organograma da organização' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Árvore hierárquica de funcionários' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Param)('organizationId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "getHierarchy", null);
__decorate([
    (0, common_1.Get)('hierarchy-levels/:organizationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar níveis hierárquicos (N1-N11)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de níveis hierárquicos' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, common_1.Param)('organizationId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "getHierarchyLevels", null);
__decorate([
    (0, common_1.Get)('valid-managers/:organizationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar gestores válidos para um nível hierárquico' }),
    (0, swagger_1.ApiQuery)({ name: 'level', required: true, example: 'N5', description: 'Nível hierárquico (N1-N11)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de gestores válidos' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, common_1.Param)('organizationId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)('level')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "getValidManagers", null);
__decorate([
    (0, common_1.Get)('hierarchy-config/:organizationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter configuração completa de hierarquia (JSONB)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Configuração de hierarquia completa' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, common_1.Param)('organizationId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "getHierarchyConfig", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar funcionário por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dados do funcionário' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Funcionário não encontrado' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar funcionário' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Funcionário atualizado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Funcionário não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, dto_1.UpdateEmployeeDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Deletar funcionário' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Funcionário deletado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Funcionário não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Não é possível deletar (tem subordinados ativos)' }),
    __param(0, (0, org_decorator_1.OrgId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('sub')),
    __param(2, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "remove", null);
exports.EmployeesController = EmployeesController = __decorate([
    (0, swagger_1.ApiTags)('PHP Module - Employees'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiHeader)({ name: 'x-org-id', required: true, description: 'Organization ID' }),
    (0, common_1.UseGuards)(org_guard_1.OrgGuard),
    (0, common_1.Controller)('php/employees'),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService])
], EmployeesController);
//# sourceMappingURL=employees.controller.js.map