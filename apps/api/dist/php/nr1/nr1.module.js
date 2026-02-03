"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nr1Module = void 0;
const common_1 = require("@nestjs/common");
const nr1_controller_1 = require("./nr1.controller");
const nr1_service_1 = require("./nr1.service");
let Nr1Module = class Nr1Module {
};
exports.Nr1Module = Nr1Module;
exports.Nr1Module = Nr1Module = __decorate([
    (0, common_1.Module)({
        controllers: [nr1_controller_1.Nr1Controller],
        providers: [nr1_service_1.Nr1Service],
        exports: [nr1_service_1.Nr1Service],
    })
], Nr1Module);
//# sourceMappingURL=nr1.module.js.map