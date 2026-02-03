"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhpEventsModule = void 0;
const common_1 = require("@nestjs/common");
const php_events_gateway_1 = require("./php-events.gateway");
let PhpEventsModule = class PhpEventsModule {
};
exports.PhpEventsModule = PhpEventsModule;
exports.PhpEventsModule = PhpEventsModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [php_events_gateway_1.PhpEventsGateway],
        exports: [php_events_gateway_1.PhpEventsGateway],
    })
], PhpEventsModule);
//# sourceMappingURL=php-events.module.js.map