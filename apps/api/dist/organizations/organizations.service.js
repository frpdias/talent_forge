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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let OrganizationsService = class OrganizationsService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async create(dto, userId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({
            name: dto.name,
            org_type: dto.orgType,
        })
            .select()
            .single();
        if (orgError) {
            throw orgError;
        }
        const { error: memberError } = await supabase.from('org_members').insert({
            org_id: org.id,
            user_id: userId,
            role: 'admin',
        });
        if (memberError) {
            throw memberError;
        }
        return this.mapToResponse(org);
    }
    async findAll(userId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('org_members')
            .select(`
        role,
        organizations (
          id,
          name,
          org_type,
          slug,
          created_at,
          updated_at
        )
      `)
            .eq('user_id', userId);
        if (error) {
            throw error;
        }
        return data.map((item) => ({
            ...this.mapToResponse(item.organizations),
            role: item.role,
        }));
    }
    async findOne(id, userId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Organization not found');
        }
        const { data: member } = await supabase
            .from('org_members')
            .select('role')
            .eq('org_id', id)
            .eq('user_id', userId)
            .single();
        if (member) {
            return {
                ...this.mapToResponse(data),
                role: member.role,
            };
        }
        if (data.parent_org_id) {
            const { data: parentMember } = await supabase
                .from('org_members')
                .select('role')
                .eq('org_id', data.parent_org_id)
                .eq('user_id', userId)
                .single();
            if (parentMember) {
                return {
                    ...this.mapToResponse(data),
                    role: 'recruiter',
                };
            }
        }
        throw new common_1.NotFoundException('Organization not found or access denied');
    }
    async update(id, dto, userId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data: org } = await supabase
            .from('organizations')
            .select('parent_org_id')
            .eq('id', id)
            .single();
        if (!org) {
            throw new common_1.NotFoundException('Organization not found');
        }
        const { data: member } = await supabase
            .from('org_members')
            .select('role')
            .eq('org_id', id)
            .eq('user_id', userId)
            .single();
        let hasPermission = member?.role === 'admin';
        if (!hasPermission && org.parent_org_id) {
            const { data: parentMember } = await supabase
                .from('org_members')
                .select('role')
                .eq('org_id', org.parent_org_id)
                .eq('user_id', userId)
                .single();
            hasPermission = !!parentMember;
        }
        if (!hasPermission) {
            throw new common_1.NotFoundException('Organization not found or insufficient permissions');
        }
        const updateData = {
            updated_at: new Date().toISOString(),
        };
        if (dto.name !== undefined)
            updateData.name = dto.name;
        if (dto.cnpj !== undefined)
            updateData.cnpj = dto.cnpj;
        if (dto.industry !== undefined)
            updateData.industry = dto.industry;
        if (dto.size !== undefined)
            updateData.size = dto.size;
        if (dto.email !== undefined)
            updateData.email = dto.email;
        if (dto.phone !== undefined)
            updateData.phone = dto.phone;
        if (dto.website !== undefined)
            updateData.website = dto.website;
        if (dto.address !== undefined)
            updateData.address = dto.address;
        if (dto.city !== undefined)
            updateData.city = dto.city;
        if (dto.state !== undefined)
            updateData.state = dto.state;
        if (dto.zipCode !== undefined)
            updateData.zip_code = dto.zipCode;
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.logoUrl !== undefined)
            updateData.logo_url = dto.logoUrl;
        const { data, error } = await supabase
            .from('organizations')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            throw error;
        }
        return this.mapToResponse(data);
    }
    async getMembers(orgId, userId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data: org } = await supabase
            .from('organizations')
            .select('parent_org_id')
            .eq('id', orgId)
            .single();
        const { data: membership } = await supabase
            .from('org_members')
            .select('id')
            .eq('org_id', orgId)
            .eq('user_id', userId)
            .single();
        let hasAccess = !!membership;
        if (!hasAccess && org?.parent_org_id) {
            const { data: parentMembership } = await supabase
                .from('org_members')
                .select('id')
                .eq('org_id', org.parent_org_id)
                .eq('user_id', userId)
                .single();
            hasAccess = !!parentMembership;
        }
        if (!hasAccess) {
            throw new common_1.ForbiddenException('User is not a member of this organization');
        }
        const { data, error } = await supabase
            .from('org_members')
            .select('*')
            .eq('org_id', orgId);
        if (error) {
            throw error;
        }
        return data;
    }
    async addMember(orgId, userId, role) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('org_members')
            .insert({
            org_id: orgId,
            user_id: userId,
            role,
        })
            .select()
            .single();
        if (error) {
            throw error;
        }
        return data;
    }
    mapToResponse(org) {
        return {
            id: org.id,
            name: org.name,
            orgType: org.org_type,
            slug: org.slug,
            cnpj: org.cnpj,
            industry: org.industry,
            size: org.size,
            email: org.email,
            phone: org.phone,
            website: org.website,
            address: org.address,
            city: org.city,
            state: org.state,
            zipCode: org.zip_code,
            description: org.description,
            logoUrl: org.logo_url,
            parentOrgId: org.parent_org_id,
            createdAt: org.created_at,
            updatedAt: org.updated_at,
        };
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map