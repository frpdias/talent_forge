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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const auth_service_1 = require("../auth.service");
const public_decorator_1 = require("../decorators/public.decorator");
let OrgGuard = class OrgGuard {
    authService;
    reflector;
    constructor(authService, reflector) {
        this.authService = authService;
        this.reflector = reflector;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const orgId = request.headers['x-org-id'];
        const userId = request.user?.sub;
        if (!orgId) {
            throw new common_1.ForbiddenException('x-org-id header is required');
        }
        if (!userId) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const isMember = await this.authService.isOrgMember(userId, orgId);
        if (!isMember) {
            throw new common_1.ForbiddenException('User is not a member of this organization');
        }
        const role = await this.authService.getOrgMemberRole(userId, orgId);
        request.orgId = orgId;
        request.orgRole = role;
        return true;
    }
};
exports.OrgGuard = OrgGuard;
exports.OrgGuard = OrgGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        core_1.Reflector])
], OrgGuard);
//# sourceMappingURL=org.guard.js.map