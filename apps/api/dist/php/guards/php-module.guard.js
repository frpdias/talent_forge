"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhpModuleGuard = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
let PhpModuleGuard = class PhpModuleGuard {
    constructor() {
        this.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const orgId = request.headers['x-org-id'];
        if (!orgId) {
            throw new common_1.ForbiddenException('Organization ID is required');
        }
        const { data: org, error } = await this.supabase
            .from('organizations')
            .select('php_module_active')
            .eq('id', orgId)
            .single();
        if (error || !org) {
            throw new common_1.ForbiddenException('Organization not found');
        }
        if (!org.php_module_active) {
            throw new common_1.ForbiddenException('PHP module is not activated for this organization');
        }
        return true;
    }
};
exports.PhpModuleGuard = PhpModuleGuard;
exports.PhpModuleGuard = PhpModuleGuard = __decorate([
    (0, common_1.Injectable)()
], PhpModuleGuard);
//# sourceMappingURL=php-module.guard.js.map