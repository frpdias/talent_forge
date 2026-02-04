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
  user?: {
    id: string;
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
  manager?: {
    id: string;
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
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

    // Se manager_id foi fornecido, validar que é membro da org
    if (dto.manager_id) {
      const { data: manager } = await client
        .from('org_members')
        .select('id')
        .eq('org_id', dto.organization_id)
        .eq('user_id', dto.manager_id)
        .eq('status', 'active')
        .maybeSingle();

      if (!manager) {
        throw new BadRequestException('Gestor deve ser membro ativo da organização');
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

    // Se há membros, buscar dados dos usuários
    let membersWithUsers: TeamMember[] = members || [];
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
            id: userMap.get(m.user_id)!.id,
            email: userMap.get(m.user_id)!.email,
            raw_user_meta_data: {
              full_name: userMap.get(m.user_id)!.full_name,
              avatar_url: userMap.get(m.user_id)!.avatar_url,
            },
          } : undefined,
        }));
      }
    }

    // Buscar dados do gestor se existir
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

    // Se está definindo manager, validar
    if (dto.manager_id) {
      const { data: manager } = await client
        .from('org_members')
        .select('id')
        .eq('org_id', orgId)
        .eq('user_id', dto.manager_id)
        .eq('status', 'active')
        .maybeSingle();

      if (!manager) {
        throw new BadRequestException('Gestor deve ser membro ativo da organização');
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
   * Adicionar membro ao time
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

    // Verificar se usuário é membro da org
    const { data: orgMember } = await client
      .from('org_members')
      .select('id')
      .eq('org_id', orgId)
      .eq('user_id', dto.user_id)
      .eq('status', 'active')
      .maybeSingle();

    if (!orgMember) {
      throw new BadRequestException('Usuário deve ser membro ativo da organização');
    }

    // Verificar se já é membro do time
    const { data: existingMember } = await client
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', dto.user_id)
      .maybeSingle();

    if (existingMember) {
      throw new ConflictException('Usuário já é membro deste time');
    }

    // Adicionar membro
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
      throw new BadRequestException(`Erro ao adicionar membro: ${error.message}`);
    }

    // Atualizar contagem de membros
    await client
      .from('teams')
      .update({ member_count: team.member_count + 1, updated_at: new Date().toISOString() })
      .eq('id', teamId);

    return data;
  }

  /**
   * Remover membro do time
   */
  async removeMember(orgId: string, teamId: string, userId: string): Promise<void> {
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

    // Verificar se é membro do time
    const { data: member } = await client
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!member) {
      throw new NotFoundException('Usuário não é membro deste time');
    }

    // Remover
    const { error } = await client
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

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
   * Atualizar papel do membro no time
   */
  async updateMemberRole(orgId: string, teamId: string, userId: string, role: 'member' | 'lead' | 'coordinator'): Promise<TeamMember> {
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

    // Atualizar papel
    const { data, error } = await client
      .from('team_members')
      .update({ role_in_team: role })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException('Membro não encontrado neste time');
    }

    return data;
  }

  /**
   * Listar membros disponíveis para adicionar (que não estão no time)
   */
  async getAvailableMembers(orgId: string, teamId: string): Promise<any[]> {
    const client = this.supabase.getAdminClient();

    // Buscar todos membros da org
    const { data: orgMembers } = await client
      .from('org_members')
      .select('user_id')
      .eq('org_id', orgId)
      .eq('status', 'active');

    if (!orgMembers || orgMembers.length === 0) {
      return [];
    }

    // Buscar membros já no time
    const { data: teamMembers } = await client
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId);

    const teamMemberIds = new Set((teamMembers || []).map(m => m.user_id));

    // Filtrar membros disponíveis
    const availableIds = orgMembers
      .filter(m => !teamMemberIds.has(m.user_id))
      .map(m => m.user_id);

    if (availableIds.length === 0) {
      return [];
    }

    // Buscar dados dos usuários disponíveis
    const { data: users } = await client
      .from('user_profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', availableIds);

    return users || [];
  }
}
