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
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
let TeamsService = class TeamsService {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async create(userId, dto) {
        const client = this.supabase.getAdminClient();
        const { data: org, error: orgError } = await client
            .from('organizations')
            .select('id')
            .eq('id', dto.organization_id)
            .single();
        if (orgError || !org) {
            throw new common_1.NotFoundException('Organização não encontrada');
        }
        const { data: existing } = await client
            .from('teams')
            .select('id')
            .eq('org_id', dto.organization_id)
            .eq('name', dto.name)
            .maybeSingle();
        if (existing) {
            throw new common_1.ConflictException('Já existe um time com este nome nesta organização');
        }
        if (dto.manager_id) {
            const { data: manager } = await client
                .from('org_members')
                .select('id')
                .eq('org_id', dto.organization_id)
                .eq('user_id', dto.manager_id)
                .eq('status', 'active')
                .maybeSingle();
            if (!manager) {
                throw new common_1.BadRequestException('Gestor deve ser membro ativo da organização');
            }
        }
        const { data, error } = await client
            .from('teams')
            .insert({
            org_id: dto.organization_id,
            name: dto.name,
            description: dto.description || null,
            manager_id: dto.manager_id || null,
            member_count: 0,
        })
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Erro ao criar time: ${error.message}`);
        }
        return data;
    }
    async findAll(orgId, options) {
        const client = this.supabase.getAdminClient();
        const page = options?.page || 1;
        const limit = options?.limit || 20;
        const offset = (page - 1) * limit;
        let query = client
            .from('teams')
            .select('*', { count: 'exact' })
            .eq('org_id', orgId)
            .order('name', { ascending: true });
        if (options?.search) {
            query = query.ilike('name', `%${options.search}%`);
        }
        const { data, error, count } = await query.range(offset, offset + limit - 1);
        if (error) {
            throw new common_1.BadRequestException(`Erro ao listar times: ${error.message}`);
        }
        return { data: data || [], total: count || 0 };
    }
    async findOne(orgId, teamId) {
        const client = this.supabase.getAdminClient();
        const { data: team, error: teamError } = await client
            .from('teams')
            .select('*')
            .eq('id', teamId)
            .eq('org_id', orgId)
            .single();
        if (teamError || !team) {
            throw new common_1.NotFoundException('Time não encontrado');
        }
        const { data: members, error: membersError } = await client
            .from('team_members')
            .select('*')
            .eq('team_id', teamId)
            .order('joined_at', { ascending: true });
        if (membersError) {
            throw new common_1.BadRequestException(`Erro ao buscar membros: ${membersError.message}`);
        }
        let membersWithUsers = members || [];
        if (members && members.length > 0) {
            const userIds = members.map(m => m.user_id);
            const { data: users } = await client
                .from('user_profiles')
                .select('id, email, full_name, avatar_url')
                .in('id', userIds);
            if (users) {
                const userMap = new Map(users.map(u => [u.id, u]));
                membersWithUsers = members.map(m => ({
                    ...m,
                    user: userMap.get(m.user_id) ? {
                        id: userMap.get(m.user_id).id,
                        email: userMap.get(m.user_id).email,
                        raw_user_meta_data: {
                            full_name: userMap.get(m.user_id).full_name,
                            avatar_url: userMap.get(m.user_id).avatar_url,
                        },
                    } : undefined,
                }));
            }
        }
        let manager = undefined;
        if (team.manager_id) {
            const { data: managerData } = await client
                .from('user_profiles')
                .select('id, email, full_name')
                .eq('id', team.manager_id)
                .single();
            if (managerData) {
                manager = {
                    id: managerData.id,
                    email: managerData.email,
                    raw_user_meta_data: {
                        full_name: managerData.full_name,
                    },
                };
            }
        }
        return {
            ...team,
            members: membersWithUsers,
            manager,
        };
    }
    async update(orgId, teamId, dto) {
        const client = this.supabase.getAdminClient();
        const { data: existing, error: existError } = await client
            .from('teams')
            .select('id, org_id')
            .eq('id', teamId)
            .eq('org_id', orgId)
            .single();
        if (existError || !existing) {
            throw new common_1.NotFoundException('Time não encontrado');
        }
        if (dto.name) {
            const { data: duplicate } = await client
                .from('teams')
                .select('id')
                .eq('org_id', orgId)
                .eq('name', dto.name)
                .neq('id', teamId)
                .maybeSingle();
            if (duplicate) {
                throw new common_1.ConflictException('Já existe um time com este nome nesta organização');
            }
        }
        if (dto.manager_id) {
            const { data: manager } = await client
                .from('org_members')
                .select('id')
                .eq('org_id', orgId)
                .eq('user_id', dto.manager_id)
                .eq('status', 'active')
                .maybeSingle();
            if (!manager) {
                throw new common_1.BadRequestException('Gestor deve ser membro ativo da organização');
            }
        }
        const updateData = { updated_at: new Date().toISOString() };
        if (dto.name !== undefined)
            updateData.name = dto.name;
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.manager_id !== undefined)
            updateData.manager_id = dto.manager_id;
        const { data, error } = await client
            .from('teams')
            .update(updateData)
            .eq('id', teamId)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Erro ao atualizar time: ${error.message}`);
        }
        return data;
    }
    async remove(orgId, teamId) {
        const client = this.supabase.getAdminClient();
        const { data: existing, error: existError } = await client
            .from('teams')
            .select('id, member_count')
            .eq('id', teamId)
            .eq('org_id', orgId)
            .single();
        if (existError || !existing) {
            throw new common_1.NotFoundException('Time não encontrado');
        }
        if (existing.member_count > 0) {
            console.log(`Removendo time ${teamId} com ${existing.member_count} membros`);
        }
        const { error } = await client
            .from('teams')
            .delete()
            .eq('id', teamId);
        if (error) {
            throw new common_1.BadRequestException(`Erro ao remover time: ${error.message}`);
        }
    }
    async addMember(orgId, teamId, dto) {
        const client = this.supabase.getAdminClient();
        const { data: team, error: teamError } = await client
            .from('teams')
            .select('id, org_id, member_count')
            .eq('id', teamId)
            .eq('org_id', orgId)
            .single();
        if (teamError || !team) {
            throw new common_1.NotFoundException('Time não encontrado');
        }
        const { data: orgMember } = await client
            .from('org_members')
            .select('id')
            .eq('org_id', orgId)
            .eq('user_id', dto.user_id)
            .eq('status', 'active')
            .maybeSingle();
        if (!orgMember) {
            throw new common_1.BadRequestException('Usuário deve ser membro ativo da organização');
        }
        const { data: existingMember } = await client
            .from('team_members')
            .select('id')
            .eq('team_id', teamId)
            .eq('user_id', dto.user_id)
            .maybeSingle();
        if (existingMember) {
            throw new common_1.ConflictException('Usuário já é membro deste time');
        }
        const { data, error } = await client
            .from('team_members')
            .insert({
            team_id: teamId,
            user_id: dto.user_id,
            role_in_team: dto.role_in_team || 'member',
        })
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(`Erro ao adicionar membro: ${error.message}`);
        }
        await client
            .from('teams')
            .update({ member_count: team.member_count + 1, updated_at: new Date().toISOString() })
            .eq('id', teamId);
        return data;
    }
    async removeMember(orgId, teamId, userId) {
        const client = this.supabase.getAdminClient();
        const { data: team, error: teamError } = await client
            .from('teams')
            .select('id, org_id, member_count')
            .eq('id', teamId)
            .eq('org_id', orgId)
            .single();
        if (teamError || !team) {
            throw new common_1.NotFoundException('Time não encontrado');
        }
        const { data: member } = await client
            .from('team_members')
            .select('id')
            .eq('team_id', teamId)
            .eq('user_id', userId)
            .maybeSingle();
        if (!member) {
            throw new common_1.NotFoundException('Usuário não é membro deste time');
        }
        const { error } = await client
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('user_id', userId);
        if (error) {
            throw new common_1.BadRequestException(`Erro ao remover membro: ${error.message}`);
        }
        await client
            .from('teams')
            .update({
            member_count: Math.max(0, team.member_count - 1),
            updated_at: new Date().toISOString()
        })
            .eq('id', teamId);
    }
    async updateMemberRole(orgId, teamId, userId, role) {
        const client = this.supabase.getAdminClient();
        const { data: team, error: teamError } = await client
            .from('teams')
            .select('id')
            .eq('id', teamId)
            .eq('org_id', orgId)
            .single();
        if (teamError || !team) {
            throw new common_1.NotFoundException('Time não encontrado');
        }
        const { data, error } = await client
            .from('team_members')
            .update({ role_in_team: role })
            .eq('team_id', teamId)
            .eq('user_id', userId)
            .select()
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Membro não encontrado neste time');
        }
        return data;
    }
    async getAvailableMembers(orgId, teamId) {
        const client = this.supabase.getAdminClient();
        const { data: orgMembers } = await client
            .from('org_members')
            .select('user_id')
            .eq('org_id', orgId)
            .eq('status', 'active');
        if (!orgMembers || orgMembers.length === 0) {
            return [];
        }
        const { data: teamMembers } = await client
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamId);
        const teamMemberIds = new Set((teamMembers || []).map(m => m.user_id));
        const availableIds = orgMembers
            .filter(m => !teamMemberIds.has(m.user_id))
            .map(m => m.user_id);
        if (availableIds.length === 0) {
            return [];
        }
        const { data: users } = await client
            .from('user_profiles')
            .select('id, email, full_name, avatar_url')
            .in('id', availableIds);
        return users || [];
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], TeamsService);
//# sourceMappingURL=teams.service.js.map