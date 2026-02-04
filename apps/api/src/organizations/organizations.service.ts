import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';

@Injectable()
export class OrganizationsService {
  constructor(private supabaseService: SupabaseService) {}

  async create(dto: CreateOrganizationDto, userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Create organization
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

    // Add creator as admin
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

  async findAll(userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('org_members')
      .select(
        `
        role,
        organizations (
          id,
          name,
          org_type,
          slug,
          created_at,
          updated_at
        )
      `,
      )
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return data.map((item: any) => ({
      ...this.mapToResponse(item.organizations),
      role: item.role,
    }));
  }

  async findOne(id: string, userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Buscar a organização primeiro
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Organization not found');
    }

    // Check membership direta
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

    // Se não é membro direto, verificar se é recrutador da org pai (parent_org_id)
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
          role: 'recruiter', // Recrutador tem acesso às empresas filhas
        };
      }
    }

    throw new NotFoundException('Organization not found or access denied');
  }

  async update(id: string, dto: UpdateOrganizationDto, userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Buscar a organização primeiro
    const { data: org } = await supabase
      .from('organizations')
      .select('parent_org_id')
      .eq('id', id)
      .single();

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Check admin role direto
    const { data: member } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', id)
      .eq('user_id', userId)
      .single();

    let hasPermission = member?.role === 'admin';

    // Se não é admin direto, verificar se é membro da org pai
    if (!hasPermission && org.parent_org_id) {
      const { data: parentMember } = await supabase
        .from('org_members')
        .select('role')
        .eq('org_id', org.parent_org_id)
        .eq('user_id', userId)
        .single();

      hasPermission = !!parentMember; // Recrutador pode editar empresas filhas
    }

    if (!hasPermission) {
      throw new NotFoundException(
        'Organization not found or insufficient permissions',
      );
    }

    // Build update object - only include fields that are provided
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.cnpj !== undefined) updateData.cnpj = dto.cnpj;
    if (dto.industry !== undefined) updateData.industry = dto.industry;
    if (dto.size !== undefined) updateData.size = dto.size;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.website !== undefined) updateData.website = dto.website;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (dto.zipCode !== undefined) updateData.zip_code = dto.zipCode;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.logoUrl !== undefined) updateData.logo_url = dto.logoUrl;

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

  async getMembers(orgId: string, userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Buscar a organização primeiro
    const { data: org } = await supabase
      .from('organizations')
      .select('parent_org_id')
      .eq('id', orgId)
      .single();

    // Check membership direto
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .single();

    let hasAccess = !!membership;

    // Se não é membro direto, verificar se é membro da org pai
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
      throw new ForbiddenException('User is not a member of this organization');
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

  async addMember(orgId: string, userId: string, role: string) {
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

  private mapToResponse(org: any) {
    return {
      id: org.id,
      name: org.name,
      orgType: org.org_type,
      slug: org.slug,
      // Campos corporativos
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
      // Timestamps
      createdAt: org.created_at,
      updatedAt: org.updated_at,
    };
  }
}
