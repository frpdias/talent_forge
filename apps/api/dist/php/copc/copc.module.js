"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopcModule = void 0;
const common_1 = require("@nestjs/common");
const copc_controller_1 = require("./copc.controller");
const copc_service_1 = require("./copc.service");
let CopcModule = class CopcModule {
};
exports.CopcModule = CopcModule;
exports.CopcModule = CopcModule = __decorate([
    (0, common_1.Module)({
        controllers: [copc_controller_1.CopcController],
        providers: [copc_service_1.CopcService],
        exports: [copc_service_1.CopcService],
    })
], CopcModule);
//# sourceMappingURL=copc.module.js.map