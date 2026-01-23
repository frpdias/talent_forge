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
exports.IamController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const iam_service_1 = require("./iam.service");
const dto_1 = require("./dto");
let IamController = class IamController {
    constructor(iamService) {
        this.iamService = iamService;
    }
    listTenants(user) {
        return this.iamService.listTenants(user.sub);
    }
    createTenant(dto, user) {
        return this.iamService.createTenant(dto, user.sub);
    }
    getTenant(tenantId, user) {
        return this.iamService.getTenant(tenantId, user.sub);
    }
    addTenantUser(tenantId, dto, user) {
        return this.iamService.addTenantUser(tenantId, dto, user.sub);
    }
    updateTenantUser(tenantId, targetUserId, dto, user) {
        return this.iamService.updateTenantUser(tenantId, targetUserId, dto, user.sub);
    }
    listRoles() {
        return this.iamService.listRoles();
    }
    createRole(dto) {
        return this.iamService.createRole(dto);
    }
    listPermissions() {
        return this.iamService.listPermissions();
    }
    createPermission(dto) {
        return this.iamService.createPermission(dto);
    }
    createPolicy(dto) {
        return this.iamService.createPolicy(dto);
    }
    listAuditLogs(tenantId) {
        return this.iamService.listAuditLogs(tenantId);
    }
    listSecurityEvents(tenantId) {
        return this.iamService.listSecurityEvents(tenantId);
    }
    createApiKey(dto) {
        return this.iamService.createApiKey(dto);
    }
    deleteApiKey(id) {
        return this.iamService.deleteApiKey(id);
    }
};
exports.IamController = IamController;
__decorate([
    (0, common_1.Get)('tenants'),
    (0, swagger_1.ApiOperation)({ summary: 'List tenants for current user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IamController.prototype, "listTenants", null);
__decorate([
    (0, common_1.Post)('tenants'),
    (0, swagger_1.ApiOperation)({ summary: 'Create tenant' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateTenantDto, Object]),
    __metadata("design:returntype", void 0)
], IamController.prototype, "createTenant", null);
__decorate([
    (0, common_1.Get)('tenants/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tenant by id' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IamController.prototype, "getTenant", null);
__decorate([
    (0, common_1.Post)('tenants/:id/users'),
    (0, swagger_1.ApiOperation)({ summary: 'Add user to tenant' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AddTenantUserDto, Object]),
    __metadata("design:returntype", void 0)
], IamController.prototype, "addTenantUser", null);
__decorate([
    (0, common_1.Patch)('tenants/:id/users/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update tenant user' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateTenantUserDto, Object]),
    __metadata("design:returntype", void 0)
], IamController.prototype, "updateTenantUser", null);
__decorate([
    (0, common_1.Get)('roles'),
    (0, swagger_1.ApiOperation)({ summary: 'List roles' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IamController.prototype, "listRoles", null);
__decorate([
    (0, common_1.Post)('roles'),
    (0, swagger_1.ApiOperation)({ summary: 'Create role' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateRoleDto]),
    __metadata("design:returntype", void 0)
], IamController.prototype, "createRole", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, swagger_1.ApiOperation)({ summary: 'List permissions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IamController.prototype, "listPermissions", null);
__decorate([
    (0, common_1.Post)('permissions'),
    (0, swagger_1.ApiOperation)({ summary: 'Create permission' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreatePermissionDto]),
    __metadata("design:returntype", void 0)
], IamController.prototype, "createPermission", null);
__decorate([
    (0, common_1.Post)('policies'),
    (0, swagger_1.ApiOperation)({ summary: 'Create policy' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreatePolicyDto]),
    __metadata("design:returntype", void 0)
], IamController.prototype, "createPolicy", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, swagger_1.ApiOperation)({ summary: 'List audit logs' }),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IamController.prototype, "listAuditLogs", null);
__decorate([
    (0, common_1.Get)('security-events'),
    (0, swagger_1.ApiOperation)({ summary: 'List security events' }),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IamController.prototype, "listSecurityEvents", null);
__decorate([
    (0, common_1.Post)('api-keys'),
    (0, swagger_1.ApiOperation)({ summary: 'Create API key' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateApiKeyDto]),
    __metadata("design:returntype", void 0)
], IamController.prototype, "createApiKey", null);
__decorate([
    (0, common_1.Delete)('api-keys/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete API key' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IamController.prototype, "deleteApiKey", null);
exports.IamController = IamController = __decorate([
    (0, swagger_1.ApiTags)('IAM'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [iam_service_1.IamService])
], IamController);
//# sourceMappingURL=iam.controller.js.map