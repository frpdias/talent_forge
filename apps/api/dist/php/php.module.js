"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhpModule = void 0;
const common_1 = require("@nestjs/common");
const php_controller_1 = require("./php.controller");
const php_service_1 = require("./php.service");
const php_module_guard_1 = require("./guards/php-module.guard");
const tfci_module_1 = require("./tfci/tfci.module");
const nr1_module_1 = require("./nr1/nr1.module");
const copc_module_1 = require("./copc/copc.module");
const ai_module_1 = require("./ai/ai.module");
const employees_module_1 = require("./employees/employees.module");
const action_plans_module_1 = require("./action-plans/action-plans.module");
const settings_module_1 = require("./settings/settings.module");
const php_events_module_1 = require("./events/php-events.module");
const notifications_module_1 = require("./notifications/notifications.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
let PhpModule = class PhpModule {
};
exports.PhpModule = PhpModule;
exports.PhpModule = PhpModule = __decorate([
    (0, common_1.Module)({
        imports: [
            php_events_module_1.PhpEventsModule,
            tfci_module_1.TfciModule,
            nr1_module_1.Nr1Module,
            copc_module_1.CopcModule,
            ai_module_1.AiModule,
            employees_module_1.EmployeesModule,
            action_plans_module_1.ActionPlansModule,
            settings_module_1.SettingsModule,
            notifications_module_1.NotificationsModule,
            dashboard_module_1.DashboardModule,
        ],
        controllers: [php_controller_1.PhpController],
        providers: [php_service_1.PhpService, php_module_guard_1.PhpModuleGuard],
        exports: [php_service_1.PhpService, php_module_guard_1.PhpModuleGuard],
    })
], PhpModule);
//# sourceMappingURL=php.module.js.map