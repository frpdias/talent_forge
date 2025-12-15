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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_service_1 = require("../supabase/supabase.service");
let AuthService = class AuthService {
    supabaseService;
    configService;
    constructor(supabaseService, configService) {
        this.supabaseService = supabaseService;
        this.configService = configService;
    }
    async validateToken(token) {
        try {
            const supabase = this.supabaseService.getClient();
            const { data: { user }, error, } = await supabase.auth.getUser(token);
            if (error || !user) {
                return null;
            }
            return {
                sub: user.id,
                email: user.email,
                aud: user.aud,
                role: user.role,
                app_metadata: user.app_metadata,
                user_metadata: user.user_metadata,
            };
        }
        catch {
            return null;
        }
    }
    async getUserOrganizations(userId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('org_members')
            .select(`
        org_id,
        role,
        organizations (
          id,
          name,
          org_type,
          slug
        )
      `)
            .eq('user_id', userId);
        if (error) {
            throw error;
        }
        return data;
    }
    async isOrgMember(userId, orgId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('org_members')
            .select('id')
            .eq('user_id', userId)
            .eq('org_id', orgId)
            .single();
        if (error || !data) {
            return false;
        }
        return true;
    }
    async getOrgMemberRole(userId, orgId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('org_members')
            .select('role')
            .eq('user_id', userId)
            .eq('org_id', orgId)
            .single();
        if (error || !data) {
            return null;
        }
        return data.role;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map