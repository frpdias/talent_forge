"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteLinksModule = void 0;
const common_1 = require("@nestjs/common");
const invite_links_controller_1 = require("./invite-links.controller");
const invite_links_service_1 = require("./invite-links.service");
const supabase_module_1 = require("../supabase/supabase.module");
const auth_module_1 = require("../auth/auth.module");
let InviteLinksModule = class InviteLinksModule {
};
exports.InviteLinksModule = InviteLinksModule;
exports.InviteLinksModule = InviteLinksModule = __decorate([
    (0, common_1.Module)({
        imports: [supabase_module_1.SupabaseModule, auth_module_1.AuthModule],
        controllers: [invite_links_controller_1.InviteLinksController],
        providers: [invite_links_service_1.InviteLinksService],
        exports: [invite_links_service_1.InviteLinksService],
    })
], InviteLinksModule);
//# sourceMappingURL=invite-links.module.js.map