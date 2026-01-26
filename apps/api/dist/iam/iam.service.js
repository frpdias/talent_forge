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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IamService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const crypto_1 = __importDefault(require("crypto"));
let IamService = class IamService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async listTenants(userId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('org_members')
            .select('role, status, organizations!org_members_org_id_fkey(id, name, status, plan_id, created_at, updated_at)')
            .eq('user_id', userId);
        if (error)
            throw error;
        return (data || []).map((row) => ({
            tenant: row.organizations,
            role: row.role,
            status: row.status,
        }));
    }
    async createTenant(dto, userId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data: tenant, error } = await supabase
            .from('organizations')
            .insert({
            name: dto.name,
            plan_id: dto.planId || null,
        })
            .select()
            .single();
        if (error)
            throw error;
        const { error: memberError } = await supabase.from('org_members').insert({
            org_id: tenant.id,
            user_id: userId,
            role: 'admin',
            status: 'active',
        });
        if (memberError)
            throw memberError;
        return tenant;
    }
    async getTenant(tenantId, userId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data: membership } = await supabase
            .from('org_members')
            .select('role')
            .eq('org_id', tenantId)
            .eq('user_id', userId)
            .maybeSingle();
        if (!membership) {
            throw new common_1.NotFoundException('Tenant not found or access denied');
        }
        const { data: tenant, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', tenantId)
            .single();
        if (error || !tenant)
            throw new common_1.NotFoundException('Tenant not found');
        return { tenant, role: membership.role };
    }
    async addTenantUser(tenantId, dto, userId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data: membership } = await supabase
            .from('org_members')
            .select('role')
            .eq('org_id', tenantId)
            .eq('user_id', userId)
            .maybeSingle();
        if (!membership || !['admin', 'manager'].includes(membership.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const { data, error } = await supabase
            .from('org_members')
            .upsert({
            org_id: tenantId,
            user_id: dto.userId,
            role: dto.role || 'member',
            status: 'active',
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateTenantUser(tenantId, targetUserId, dto, userId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data: membership } = await supabase
            .from('org_members')
            .select('role')
            .eq('org_id', tenantId)
            .eq('user_id', userId)
            .maybeSingle();
        if (!membership || !['admin', 'manager'].includes(membership.role)) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const { data, error } = await supabase
            .from('org_members')
            .update({
            role: dto.role,
            status: dto.status,
        })
            .eq('org_id', tenantId)
            .eq('user_id', targetUserId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async listRoles() {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase.from('roles').select('*');
        if (error)
            throw error;
        return data;
    }
    async createRole(dto) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('roles')
            .insert({
            name: dto.name,
            scope: dto.scope || 'tenant',
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async listPermissions() {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase.from('permissions').select('*');
        if (error)
            throw error;
        return data;
    }
    async createPermission(dto) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('permissions')
            .insert({
            action: dto.action,
            resource: dto.resource,
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async createPolicy(dto) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('policies')
            .insert({
            effect: dto.effect || 'allow',
            conditions: dto.conditions,
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async listAuditLogs(tenantId) {
        const supabase = this.supabaseService.getAdminClient();
        let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
        if (tenantId)
            query = query.eq('tenant_id', tenantId);
        const { data, error } = await query;
        if (error)
            throw error;
        return data;
    }
    async listSecurityEvents(tenantId) {
        const supabase = this.supabaseService.getAdminClient();
        let query = supabase.from('security_events').select('*').order('created_at', { ascending: false }).limit(200);
        if (tenantId)
            query = query.eq('tenant_id', tenantId);
        const { data, error } = await query;
        if (error)
            throw error;
        return data;
    }
    async createApiKey(dto) {
        const supabase = this.supabaseService.getAdminClient();
        const rawKey = crypto_1.default.randomBytes(32).toString('hex');
        const keyHash = crypto_1.default.createHash('sha256').update(rawKey).digest('hex');
        const { data, error } = await supabase
            .from('api_keys')
            .insert({
            tenant_id: dto.tenantId,
            key_hash: keyHash,
            scopes: dto.scopes || [],
            expires_at: dto.expiresAt || null,
        })
            .select('id, tenant_id, scopes, expires_at, created_at')
            .single();
        if (error)
            throw error;
        return {
            apiKey: rawKey,
            record: data,
        };
    }
    async deleteApiKey(id) {
        const supabase = this.supabaseService.getAdminClient();
        const { error } = await supabase.from('api_keys').delete().eq('id', id);
        if (error)
            throw error;
        return { deleted: true };
    }
};
exports.IamService = IamService;
exports.IamService = IamService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], IamService);
//# sourceMappingURL=iam.service.js.map