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
exports.PhpController = void 0;
const common_1 = require("@nestjs/common");
const php_service_1 = require("./php.service");
const activate_php_dto_1 = require("./dto/activate-php.dto");
const swagger_1 = require("@nestjs/swagger");
let PhpController = class PhpController {
    constructor(phpService) {
        this.phpService = phpService;
    }
    async getStatus(orgId, userId) {
        return this.phpService.getStatus(orgId, userId);
    }
    async activate(orgId, userId, dto) {
        return this.phpService.activate(orgId, userId, dto);
    }
    async deactivate(orgId, userId) {
        return this.phpService.deactivate(orgId, userId);
    }
    async updateSettings(orgId, userId, dto) {
        return this.phpService.updateSettings(orgId, userId, dto);
    }
};
exports.PhpController = PhpController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get PHP module activation status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns activation status' }),
    __param(0, (0, common_1.Headers)('x-org-id')),
    __param(1, (0, common_1.Headers)('x-user-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PhpController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('activate'),
    (0, swagger_1.ApiOperation)({ summary: 'Activate PHP module for organization' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Module activated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    __param(0, (0, common_1.Headers)('x-org-id')),
    __param(1, (0, common_1.Headers)('x-user-id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, activate_php_dto_1.ActivatePhpDto]),
    __metadata("design:returntype", Promise)
], PhpController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)('deactivate'),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate PHP module for organization' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Module deactivated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Activation not found' }),
    __param(0, (0, common_1.Headers)('x-org-id')),
    __param(1, (0, common_1.Headers)('x-user-id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PhpController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Patch)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Update PHP module settings' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Settings updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Activation not found' }),
    __param(0, (0, common_1.Headers)('x-org-id')),
    __param(1, (0, common_1.Headers)('x-user-id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, activate_php_dto_1.UpdatePhpSettingsDto]),
    __metadata("design:returntype", Promise)
], PhpController.prototype, "updateSettings", null);
exports.PhpController = PhpController = __decorate([
    (0, swagger_1.ApiTags)('PHP Module'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('php'),
    __metadata("design:paramtypes", [php_service_1.PhpService])
], PhpController);
//# sourceMappingURL=php.controller.js.map