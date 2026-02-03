"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionPlansModule = void 0;
const common_1 = require("@nestjs/common");
const action_plans_controller_1 = require("./action-plans.controller");
const action_plans_service_1 = require("./action-plans.service");
let ActionPlansModule = class ActionPlansModule {
};
exports.ActionPlansModule = ActionPlansModule;
exports.ActionPlansModule = ActionPlansModule = __decorate([
    (0, common_1.Module)({
        controllers: [action_plans_controller_1.ActionPlansController],
        providers: [action_plans_service_1.ActionPlansService],
        exports: [action_plans_service_1.ActionPlansService],
    })
], ActionPlansModule);
//# sourceMappingURL=action-plans.module.js.map