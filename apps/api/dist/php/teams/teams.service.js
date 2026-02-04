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
                .from('employees')
                .select('id')
                .eq('organization_id', dto.organization_id)
                .eq('id', dto.manager_id)
                .eq('status', 'active')
                .maybeSingle();
            if (!manager) {
                throw new common_1.BadRequestException('Gestor deve ser um funcionário ativo da organização');
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
        let membersWithEmployees = members || [];
        if (members && members.length > 0) {
            const userIds = members.map(m => m.user_id);
            const { data: employees } = await client
                .from('employees')
                .select('id, full_name, position, department, manager_id, user_id')
                .eq('organization_id', orgId)
                .in('user_id', userIds);
            if (employees) {
                const employeeMap = new Map(employees.map(e => [e.user_id, e]));
                membersWithEmployees = members.map(m => ({
                    ...m,
                    employee: employeeMap.get(m.user_id) || undefined,
                }));
            }
        }
        let manager = undefined;
        if (team.manager_id) {
            const { data: managerData } = await client
                .from('employees')
                .select('id, full_name, position')
                .eq('id', team.manager_id)
                .single();
            if (managerData) {
                manager = {
                    id: managerData.id,
                    full_name: managerData.full_name,
                    position: managerData.position,
                };
            }
        }
        return {
            ...team,
            members: membersWithEmployees,
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
                .from('employees')
                .select('id')
                .eq('organization_id', orgId)
                .eq('id', dto.manager_id)
                .eq('status', 'active')
                .maybeSingle();
            if (!manager) {
                throw new common_1.BadRequestException('Gestor deve ser um funcionário ativo da organização');
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
        const { data: employee } = await client
            .from('employees')
            .select('id, user_id, full_name, position, department, manager_id')
            .eq('organization_id', orgId)
            .eq('id', dto.user_id)
            .eq('status', 'active')
            .maybeSingle();
        if (!employee) {
            throw new common_1.BadRequestException('Funcionário não encontrado ou inativo');
        }
        const memberUserId = employee.user_id || employee.id;
        const { data: existingMember } = await client
            .from('team_members')
            .select('id')
            .eq('team_id', teamId)
            .eq('user_id', memberUserId)
            .maybeSingle();
        if (existingMember) {
            throw new common_1.ConflictException('Funcionário já é membro deste time');
        }
        const { data, error } = await client
            .from('team_members')
            .insert({
            team_id: teamId,
            user_id: memberUserId,
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
        return {
            ...data,
            employee: {
                id: employee.id,
                full_name: employee.full_name,
                position: employee.position,
                department: employee.department,
                manager_id: employee.manager_id,
            },
        };
    }
    async removeMember(orgId, teamId, memberId) {
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
        let { data: member } = await client
            .from('team_members')
            .select('id, user_id')
            .eq('team_id', teamId)
            .eq('user_id', memberId)
            .maybeSingle();
        if (!member) {
            const { data: employee } = await client
                .from('employees')
                .select('user_id')
                .eq('id', memberId)
                .maybeSingle();
            if (employee?.user_id) {
                const result = await client
                    .from('team_members')
                    .select('id, user_id')
                    .eq('team_id', teamId)
                    .eq('user_id', employee.user_id)
                    .maybeSingle();
                member = result.data;
            }
        }
        if (!member) {
            throw new common_1.NotFoundException('Membro não encontrado neste time');
        }
        const { error } = await client
            .from('team_members')
            .delete()
            .eq('id', member.id);
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
    async updateMemberRole(orgId, teamId, memberId, role) {
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
        let targetUserId = memberId;
        const { data: employee } = await client
            .from('employees')
            .select('user_id')
            .eq('id', memberId)
            .maybeSingle();
        if (employee?.user_id) {
            targetUserId = employee.user_id;
        }
        const { data, error } = await client
            .from('team_members')
            .update({ role_in_team: role })
            .eq('team_id', teamId)
            .eq('user_id', targetUserId)
            .select()
            .single();
        if (error || !data) {
            throw new common_1.NotFoundException('Membro não encontrado neste time');
        }
        return data;
    }
    async getAvailableMembers(orgId, teamId) {
        const client = this.supabase.getAdminClient();
        const { data: employees } = await client
            .from('employees')
            .select(`
        id,
        full_name,
        position,
        department,
        manager_id,
        user_id,
        manager:manager_id(id, full_name)
      `)
            .eq('organization_id', orgId)
            .eq('status', 'active')
            .order('full_name', { ascending: true });
        if (!employees || employees.length === 0) {
            return [];
        }
        const { data: teamMembers } = await client
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamId);
        const teamMemberUserIds = new Set((teamMembers || []).map(m => m.user_id));
        const availableEmployees = employees.filter(emp => {
            const inTeamByUserId = emp.user_id && teamMemberUserIds.has(emp.user_id);
            const inTeamByEmpId = teamMemberUserIds.has(emp.id);
            return !inTeamByUserId && !inTeamByEmpId;
        });
        return availableEmployees.map(emp => {
            const managerData = Array.isArray(emp.manager) ? emp.manager[0] : emp.manager;
            return {
                id: emp.id,
                full_name: emp.full_name,
                position: emp.position,
                department: emp.department,
                manager_id: emp.manager_id,
                user_id: emp.user_id,
                manager: managerData ? { id: managerData.id, full_name: managerData.full_name } : undefined,
            };
        });
    }
    async getOrganizationHierarchy(orgId) {
        const client = this.supabase.getAdminClient();
        const { data: employees, error } = await client
            .from('employees')
            .select(`
        id,
        full_name,
        position,
        department,
        manager_id,
        user_id,
        manager:manager_id(id, full_name)
      `)
            .eq('organization_id', orgId)
            .eq('status', 'active')
            .order('full_name', { ascending: true });
        if (error) {
            throw new common_1.BadRequestException(`Erro ao buscar hierarquia: ${error.message}`);
        }
        return (employees || []).map(emp => {
            const managerData = Array.isArray(emp.manager) ? emp.manager[0] : emp.manager;
            return {
                id: emp.id,
                full_name: emp.full_name,
                position: emp.position,
                department: emp.department,
                manager_id: emp.manager_id,
                user_id: emp.user_id,
                manager: managerData ? { id: managerData.id, full_name: managerData.full_name } : undefined,
            };
        });
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], TeamsService);
//# sourceMappingURL=teams.service.js.map