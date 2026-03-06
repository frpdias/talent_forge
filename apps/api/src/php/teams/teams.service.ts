// apps/api/src/php/teams/teams.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateTeamDto, UpdateTeamDto, AddTeamMemberDto } from './dto';

export interface Team {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role_in_team: 'member' | 'lead' | 'coordinator';
  joined_at: string;
  employee?: {
    id: string;
    full_name: string;
    position: string | null;
    department: string | null;
    manager_id: string | null;
  };
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
  manager?: {
    id: string;
    full_name: string;
    position: string | null;
  };
}

export interface EmployeeForTeam {
  id: string;
  full_name: string;
  position: string | null;
  department: string | null;
  manager_id: string | null;
  user_id: string | null;
  manager?: {
    id: string;
    full_name: string;
  };
}

@Injectable()
export class TeamsService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Criar novo time
   */
  async create(userId: string, dto: CreateTeamDto): Promise<Team> {
    const client = this.supabase.getAdminClient();

    // Validar que a organização existe
    const { data: org, error: orgError } = await client
      .from('organizations')
      .select('id')
      .eq('id', dto.organization_id)
      .single();

    if (orgError || !org) {
      throw new NotFoundException('Organização não encontrada');
    }

    // Verificar nome duplicado na org
    const { data: existing } = await client
      .from('teams')
      .select('id')
      .eq('org_id', dto.organization_id)
      .eq('name', dto.name)
      .maybeSingle();

    if (existing) {
      throw new ConflictException('Já existe um time com este nome nesta organização');
    }

    // Se manager_id foi fornecido, validar que é um funcionário (employee) da org
    if (dto.manager_id) {
      const { data: manager } = await client
        .from('employees')
        .select('id')
        .eq('organization_id', dto.organization_id)
        .eq('id', dto.manager_id)
        .eq('status', 'active')
        .maybeSingle();

      if (!manager) {
        throw new BadRequestException('Gestor deve ser um funcionário ativo da organização');
      }
    }

    // Criar time
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
      throw new BadRequestException(`Erro ao criar time: ${error.message}`);
    }

    return data;
  }

  /**
   * Listar times de uma organização
   */
  async findAll(orgId: string, options?: { search?: string; page?: number; limit?: number }): Promise<{ data: Team[]; total: number }> {
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
      throw new BadRequestException(`Erro ao listar times: ${error.message}`);
    }

    return { data: data || [], total: count || 0 };
  }

  /**
   * Buscar time por ID com membros
   */
  async findOne(orgId: string, teamId: string): Promise<TeamWithMembers> {
    const client = this.supabase.getAdminClient();

    // Buscar time
    const { data: team, error: teamError } = await client
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .eq('org_id', orgId)
      .single();

    if (teamError || !team) {
      throw new NotFoundException('Time não encontrado');
    }

    // Buscar membros
    const { data: members, error: membersError } = await client
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true });

    if (membersError) {
      throw new BadRequestException(`Erro ao buscar membros: ${membersError.message}`);
    }

    // Se há membros, buscar dados dos funcionários
    let membersWithEmployees: TeamMember[] = members || [];
    if (members && members.length > 0) {
      const userIds = members.map(m => m.user_id);
      // Buscar funcionários que têm user_id correspondente aos membros do time
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

    // Buscar dados do gestor se existir (manager_id é um employee.id)
    let manager: { id: string; full_name: string; position: string | null } | undefined = undefined;
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

  /**
   * Atualizar time
   */
  async update(orgId: string, teamId: string, dto: UpdateTeamDto): Promise<Team> {
    const client = this.supabase.getAdminClient();

    // Verificar se time existe
    const { data: existing, error: existError } = await client
      .from('teams')
      .select('id, org_id')
      .eq('id', teamId)
      .eq('org_id', orgId)
      .single();

    if (existError || !existing) {
      throw new NotFoundException('Time não encontrado');
    }

    // Se está alterando o nome, verificar duplicidade
    if (dto.name) {
      const { data: duplicate } = await client
        .from('teams')
        .select('id')
        .eq('org_id', orgId)
        .eq('name', dto.name)
        .neq('id', teamId)
        .maybeSingle();

      if (duplicate) {
        throw new ConflictException('Já existe um time com este nome nesta organização');
      }
    }

    // Se está definindo manager, validar que é um funcionário
    if (dto.manager_id) {
      const { data: manager } = await client
        .from('employees')
        .select('id')
        .eq('organization_id', orgId)
        .eq('id', dto.manager_id)
        .eq('status', 'active')
        .maybeSingle();

      if (!manager) {
        throw new BadRequestException('Gestor deve ser um funcionário ativo da organização');
      }
    }

    // Atualizar
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.manager_id !== undefined) updateData.manager_id = dto.manager_id;

    const { data, error } = await client
      .from('teams')
      .update(updateData)
      .eq('id', teamId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Erro ao atualizar time: ${error.message}`);
    }

    return data;
  }

  /**
   * Remover time
   */
  async remove(orgId: string, teamId: string): Promise<void> {
    const client = this.supabase.getAdminClient();

    // Verificar se time existe
    const { data: existing, error: existError } = await client
      .from('teams')
      .select('id, member_count')
      .eq('id', teamId)
      .eq('org_id', orgId)
      .single();

    if (existError || !existing) {
      throw new NotFoundException('Time não encontrado');
    }

    // Avisar se há membros (cascade vai remover)
    if (existing.member_count > 0) {
      console.log(`Removendo time ${teamId} com ${existing.member_count} membros`);
    }

    const { error } = await client
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) {
      throw new BadRequestException(`Erro ao remover time: ${error.message}`);
    }
  }

  /**
   * Adicionar funcionário ao time (via employee_id)
   */
  async addMember(orgId: string, teamId: string, dto: AddTeamMemberDto): Promise<TeamMember> {
    const client = this.supabase.getAdminClient();

    // Verificar se time existe e pertence à org
    const { data: team, error: teamError } = await client
      .from('teams')
      .select('id, org_id, member_count')
      .eq('id', teamId)
      .eq('org_id', orgId)
      .single();

    if (teamError || !team) {
      throw new NotFoundException('Time não encontrado');
    }

    // dto.user_id é o employee_id - buscar o funcionário
    const { data: employee } = await client
      .from('employees')
      .select('id, user_id, full_name, position, department, manager_id')
      .eq('organization_id', orgId)
      .eq('id', dto.user_id) // user_id do DTO é na verdade employee_id
      .eq('status', 'active')
      .maybeSingle();

    if (!employee) {
      throw new BadRequestException('Funcionário não encontrado ou inativo');
    }

    // Usar employee.user_id se existir, senão usar employee.id como identificador
    const memberUserId = employee.user_id || employee.id;

    // Verificar se já é membro do time
    const { data: existingMember } = await client
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', memberUserId)
      .maybeSingle();

    if (existingMember) {
      throw new ConflictException('Funcionário já é membro deste time');
    }

    // Adicionar membro
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
      throw new BadRequestException(`Erro ao adicionar membro: ${error.message}`);
    }

    // Atualizar contagem de membros
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

  /**
   * Remover membro do time (por employee_id ou user_id)
   */
  async removeMember(orgId: string, teamId: string, memberId: string): Promise<void> {
    const client = this.supabase.getAdminClient();

    // Verificar se time existe e pertence à org
    const { data: team, error: teamError } = await client
      .from('teams')
      .select('id, org_id, member_count')
      .eq('id', teamId)
      .eq('org_id', orgId)
      .single();

    if (teamError || !team) {
      throw new NotFoundException('Time não encontrado');
    }

    // memberId pode ser employee.id ou employee.user_id
    // Primeiro, tentar encontrar o membro diretamente por user_id
    let { data: member } = await client
      .from('team_members')
      .select('id, user_id')
      .eq('team_id', teamId)
      .eq('user_id', memberId)
      .maybeSingle();

    if (!member) {
      // Tentar buscar pelo employee_id
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
      throw new NotFoundException('Membro não encontrado neste time');
    }

    // Remover
    const { error } = await client
      .from('team_members')
      .delete()
      .eq('id', member.id);

    if (error) {
      throw new BadRequestException(`Erro ao remover membro: ${error.message}`);
    }

    // Atualizar contagem de membros
    await client
      .from('teams')
      .update({ 
        member_count: Math.max(0, team.member_count - 1), 
        updated_at: new Date().toISOString() 
      })
      .eq('id', teamId);
  }

  /**
   * Atualizar papel do membro no time (por employee_id ou user_id)
   */
  async updateMemberRole(orgId: string, teamId: string, memberId: string, role: 'member' | 'lead' | 'coordinator'): Promise<TeamMember> {
    const client = this.supabase.getAdminClient();

    // Verificar se time existe e pertence à org
    const { data: team, error: teamError } = await client
      .from('teams')
      .select('id')
      .eq('id', teamId)
      .eq('org_id', orgId)
      .single();

    if (teamError || !team) {
      throw new NotFoundException('Time não encontrado');
    }

    // Tentar encontrar o membro por user_id ou via employee_id
    let targetUserId = memberId;
    
    // Verificar se é um employee_id
    const { data: employee } = await client
      .from('employees')
      .select('user_id')
      .eq('id', memberId)
      .maybeSingle();

    if (employee?.user_id) {
      targetUserId = employee.user_id;
    }

    // Atualizar papel
    const { data, error } = await client
      .from('team_members')
      .update({ role_in_team: role })
      .eq('team_id', teamId)
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException('Membro não encontrado neste time');
    }

    return data;
  }

  /**
   * Listar funcionários disponíveis para adicionar ao time (com hierarquia)
   */
  async getAvailableMembers(orgId: string, teamId: string): Promise<EmployeeForTeam[]> {
    const client = this.supabase.getAdminClient();

    // Buscar todos funcionários ativos da organização
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

    // Buscar membros já no time
    const { data: teamMembers } = await client
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId);

    const teamMemberUserIds = new Set((teamMembers || []).map(m => m.user_id));

    // Filtrar funcionários que não estão no time
    // Um funcionário está no time se seu user_id ou seu id está em team_members.user_id
    const availableEmployees = employees.filter(emp => {
      const inTeamByUserId = emp.user_id && teamMemberUserIds.has(emp.user_id);
      const inTeamByEmpId = teamMemberUserIds.has(emp.id);
      return !inTeamByUserId && !inTeamByEmpId;
    });

    return availableEmployees.map(emp => {
      // manager pode ser um array ou objeto único dependendo da relação
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

  /**
   * Listar funcionários da organização com estrutura hierárquica (para overview)
   */
  async getOrganizationHierarchy(orgId: string): Promise<EmployeeForTeam[]> {
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
      throw new BadRequestException(`Erro ao buscar hierarquia: ${error.message}`);
    }

    return (employees || []).map(emp => {
      // manager pode ser um array ou objeto único dependendo da relação
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
}
