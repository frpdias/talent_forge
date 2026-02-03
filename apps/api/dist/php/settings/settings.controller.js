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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const settings_service_1 = require("./settings.service");
const settings_dto_1 = require("./dto/settings.dto");
const php_module_guard_1 = require("../guards/php-module.guard");
let SettingsController = class SettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    async getSettings(orgId) {
        return this.settingsService.getSettings(orgId);
    }
    async updateSettings(orgId, settings, req) {
        const userId = req.user?.sub || req.user?.id;
        return this.settingsService.updateSettings(orgId, settings, userId);
    }
    async resetSettings(orgId, req) {
        const userId = req.user?.sub || req.user?.id;
        return this.settingsService.resetSettings(orgId, userId);
    }
    async testWebhook(body) {
        return this.settingsService.testWebhook(body.url);
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)(':orgId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get PHP module settings for an organization' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'PHP module settings' }),
    __param(0, (0, common_1.Param)('orgId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Put)(':orgId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update PHP module settings for an organization' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated settings' }),
    __param(0, (0, common_1.Param)('orgId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, settings_dto_1.PhpSettingsDto, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Post)(':orgId/reset'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reset settings to defaults' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Settings reset to defaults' }),
    __param(0, (0, common_1.Param)('orgId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "resetSettings", null);
__decorate([
    (0, common_1.Post)('test-webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Test a webhook URL' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook test result' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "testWebhook", null);
exports.SettingsController = SettingsController = __decorate([
    (0, swagger_1.ApiTags)('PHP - Settings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/v1/php/settings'),
    (0, common_1.UseGuards)(php_module_guard_1.PhpModuleGuard),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map