"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhpService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
let PhpService = class PhpService {
    constructor() {
        this.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    }
    async getStatus(orgId, userId) {
        const { data: member } = await this.supabase
            .from('org_members')
            .select('role')
            .eq('org_id', orgId)
            .eq('user_id', userId)
            .single();
        if (!member || !['admin', 'owner'].includes(member.role)) {
            throw new common_1.BadRequestException('Insufficient permissions');
        }
        const { data: activation } = await this.supabase
            .from('php_module_activations')
            .select('is_active, activation_plan, activated_at')
            .eq('org_id', orgId)
            .single();
        if (!activation) {
            return {
                is_active: false,
                activation_plan: 'full',
                activated_at: null,
            };
        }
        return {
            is_active: activation.is_active,
            activation_plan: activation.activation_plan,
            activated_at: activation.activated_at,
        };
    }
    async activate(orgId, userId, dto) {
        const { data: member } = await this.supabase
            .from('org_members')
            .select('role')
            .eq('org_id', orgId)
            .eq('user_id', userId)
            .single();
        if (!member || !['admin', 'owner'].includes(member.role)) {
            throw new common_1.BadRequestException('Insufficient permissions');
        }
        const { data: existing } = await this.supabase
            .from('php_module_activations')
            .select('*')
            .eq('org_id', orgId)
            .single();
        if (existing) {
            const { data, error } = await this.supabase
                .from('php_module_activations')
                .update({
                is_active: true,
                activated_at: new Date().toISOString(),
                deactivated_at: null,
                activated_by: userId,
                activation_plan: dto.activation_plan,
                settings: dto.settings || existing.settings,
            })
                .eq('org_id', orgId)
                .select()
                .single();
            if (error) {
                throw new common_1.BadRequestException(`Failed to activate: ${error.message}`);
            }
            return data;
        }
        const { data, error } = await this.supabase
            .from('php_module_activations')
            .insert({
            org_id: orgId,
            is_active: true,
            activated_at: new Date().toISOString(),
            activated_by: userId,
            activation_plan: dto.activation_plan,
            settings: dto.settings || {},
        })
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Failed to activate: ${error.message}`);
        }
        return data;
    }
    async deactivate(orgId, userId) {
        const { data: member } = await this.supabase
            .from('org_members')
            .select('role')
            .eq('org_id', orgId)
            .eq('user_id', userId)
            .single();
        if (!member || !['admin', 'owner'].includes(member.role)) {
            throw new common_1.BadRequestException('Insufficient permissions');
        }
        const { data, error } = await this.supabase
            .from('php_module_activations')
            .update({
            is_active: false,
            deactivated_at: new Date().toISOString(),
        })
            .eq('org_id', orgId)
            .select()
            .single();
        if (error) {
            throw new common_1.NotFoundException(`Activation not found: ${error.message}`);
        }
        return data;
    }
    async updateSettings(orgId, userId, dto) {
        const { data: member } = await this.supabase
            .from('org_members')
            .select('role')
            .eq('org_id', orgId)
            .eq('user_id', userId)
            .single();
        if (!member || !['admin', 'owner'].includes(member.role)) {
            throw new common_1.BadRequestException('Insufficient permissions');
        }
        const { data, error } = await this.supabase
            .from('php_module_activations')
            .update({
            settings: dto.settings,
        })
            .eq('org_id', orgId)
            .select()
            .single();
        if (error) {
            throw new common_1.NotFoundException(`Activation not found: ${error.message}`);
        }
        return data;
    }
};
exports.PhpService = PhpService;
exports.PhpService = PhpService = __decorate([
    (0, common_1.Injectable)()
], PhpService);
//# sourceMappingURL=php.service.js.map