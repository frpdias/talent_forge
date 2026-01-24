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
exports.InviteLinksService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const supabase_service_1 = require("../supabase/supabase.service");
let InviteLinksService = class InviteLinksService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    generateToken() {
        return (0, crypto_1.randomBytes)(24).toString('base64url');
    }
    async createInviteLink(orgId, userId, dto) {
        const supabase = this.supabaseService.getAdminClient();
        const token = this.generateToken();
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        const maxUses = 1;
        const { data, error } = await supabase
            .from('candidate_invite_links')
            .insert({
            org_id: orgId,
            created_by: userId,
            token,
            expires_at: expiresAt,
            max_uses: maxUses,
        })
            .select('id, org_id, token, expires_at, max_uses, uses_count, is_active')
            .single();
        if (error) {
            throw error;
        }
        return {
            id: data.id,
            orgId: data.org_id,
            token: data.token,
            expiresAt: data.expires_at,
            maxUses: data.max_uses,
            usesCount: data.uses_count,
            isActive: data.is_active,
        };
    }
    async validateInviteToken(token) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('candidate_invite_links')
            .select('id, org_id, created_by, token, expires_at, max_uses, uses_count, is_active, organizations (id, name)')
            .eq('token', token)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Invite link not found');
        }
        const record = data;
        const now = new Date();
        if (!record.is_active) {
            return { valid: false, reason: 'inactive' };
        }
        if (record.expires_at && new Date(record.expires_at) < now) {
            return { valid: false, reason: 'expired' };
        }
        const maxUses = record.max_uses ?? 1;
        if (record.uses_count >= maxUses) {
            return { valid: false, reason: 'max_uses' };
        }
        const orgName = record.organizations?.[0]?.name || null;
        return {
            valid: true,
            orgId: record.org_id,
            orgName,
            expiresAt: record.expires_at,
            maxUses: record.max_uses,
            usesCount: record.uses_count,
            token: record.token,
        };
    }
    async createCandidateFromInvite(token, dto) {
        const supabase = this.supabaseService.getAdminClient();
        const validation = await this.validateInviteToken(token);
        if (!validation.valid) {
            throw new common_1.BadRequestException(`Invite token invalid: ${validation.reason}`);
        }
        const { data: linkData, error: linkError } = await supabase
            .from('candidate_invite_links')
            .select('id, org_id, created_by, max_uses, uses_count')
            .eq('token', token)
            .single();
        if (linkError || !linkData) {
            throw new common_1.NotFoundException('Invite link not found');
        }
        const { data: candidate, error } = await supabase
            .from('candidates')
            .insert({
            owner_org_id: linkData.org_id,
            full_name: dto.fullName,
            email: dto.email,
            phone: dto.phone,
            location: dto.location,
            current_title: dto.currentTitle,
            linkedin_url: dto.linkedinUrl,
            salary_expectation: dto.salaryExpectation,
            availability_date: dto.availabilityDate,
            tags: dto.tags || [],
            created_by: linkData.created_by,
        })
            .select()
            .single();
        if (error) {
            throw error;
        }
        const newCount = (linkData.uses_count || 0) + 1;
        const maxUses = linkData.max_uses ?? 1;
        const shouldDeactivate = newCount >= maxUses;
        await supabase
            .from('candidate_invite_links')
            .update({
            uses_count: newCount,
            is_active: shouldDeactivate ? false : true,
        })
            .eq('id', linkData.id);
        return {
            id: candidate.id,
            orgId: candidate.owner_org_id,
            fullName: candidate.full_name,
            email: candidate.email,
            createdAt: candidate.created_at,
        };
    }
    async createCandidateAccountFromInvite(token, dto) {
        const supabase = this.supabaseService.getAdminClient();
        const validation = await this.validateInviteToken(token);
        if (!validation.valid) {
            throw new common_1.BadRequestException(`Invite token invalid: ${validation.reason}`);
        }
        const { data: linkData, error: linkError } = await supabase
            .from('candidate_invite_links')
            .select('id, org_id, created_by, max_uses, uses_count')
            .eq('token', token)
            .single();
        if (linkError || !linkData) {
            throw new common_1.NotFoundException('Invite link not found');
        }
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: dto.email,
            password: dto.password,
            email_confirm: true,
            user_metadata: {
                user_type: 'candidate',
                full_name: dto.fullName,
            },
        });
        if (authError || !authData?.user) {
            throw new common_1.BadRequestException(authError?.message || 'Failed to create user');
        }
        const { data: candidate, error } = await supabase
            .from('candidates')
            .insert({
            owner_org_id: linkData.org_id,
            user_id: authData.user.id,
            full_name: dto.fullName,
            email: dto.email,
            created_by: linkData.created_by,
        })
            .select()
            .single();
        if (error) {
            throw error;
        }
        const newCount = (linkData.uses_count || 0) + 1;
        const maxUses = linkData.max_uses ?? 1;
        const shouldDeactivate = newCount >= maxUses;
        await supabase
            .from('candidate_invite_links')
            .update({
            uses_count: newCount,
            is_active: shouldDeactivate ? false : true,
        })
            .eq('id', linkData.id);
        return {
            id: candidate.id,
            userId: authData.user.id,
            orgId: candidate.owner_org_id,
            fullName: candidate.full_name,
            email: candidate.email,
            createdAt: candidate.created_at,
        };
    }
};
exports.InviteLinksService = InviteLinksService;
exports.InviteLinksService = InviteLinksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], InviteLinksService);
//# sourceMappingURL=invite-links.service.js.map