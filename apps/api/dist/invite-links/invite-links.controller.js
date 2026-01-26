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
exports.InviteLinksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const invite_links_service_1 = require("./invite-links.service");
const dto_1 = require("./dto");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const org_guard_1 = require("../auth/guards/org.guard");
const org_decorator_1 = require("../auth/decorators/org.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let InviteLinksController = class InviteLinksController {
    constructor(inviteLinksService) {
        this.inviteLinksService = inviteLinksService;
    }
    create(dto, orgId, orgRole, user) {
        if (!['owner', 'admin', 'manager', 'recruiter'].includes(orgRole)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        return this.inviteLinksService.createInviteLink(orgId, user.sub, dto);
    }
    validate(token) {
        return this.inviteLinksService.validateInviteToken(token);
    }
    createCandidate(token, dto) {
        return this.inviteLinksService.createCandidateFromInvite(token, dto);
    }
    registerCandidate(token, dto) {
        return this.inviteLinksService.createCandidateAccountFromInvite(token, dto);
    }
};
exports.InviteLinksController = InviteLinksController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiHeader)({ name: 'x-org-id', required: true, description: 'Organization ID' }),
    (0, common_1.UseGuards)(org_guard_1.OrgGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Create a candidate invite link' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, org_decorator_1.OrgId)()),
    __param(2, (0, org_decorator_1.OrgRole)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateInviteLinkDto, String, String, Object]),
    __metadata("design:returntype", void 0)
], InviteLinksController.prototype, "create", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':token'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate candidate invite token' }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InviteLinksController.prototype, "validate", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(':token/candidates'),
    (0, swagger_1.ApiOperation)({ summary: 'Create candidate from invite token' }),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateCandidateFromInviteDto]),
    __metadata("design:returntype", void 0)
], InviteLinksController.prototype, "createCandidate", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(':token/register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register candidate account from invite token' }),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateCandidateAccountFromInviteDto]),
    __metadata("design:returntype", void 0)
], InviteLinksController.prototype, "registerCandidate", null);
exports.InviteLinksController = InviteLinksController = __decorate([
    (0, swagger_1.ApiTags)('Invite Links'),
    (0, common_1.Controller)('invite-links'),
    __metadata("design:paramtypes", [invite_links_service_1.InviteLinksService])
], InviteLinksController);
//# sourceMappingURL=invite-links.controller.js.map