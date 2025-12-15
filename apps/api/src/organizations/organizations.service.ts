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

    // Check membership
    const { data: member } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', id)
      .eq('user_id', userId)
      .single();

    if (!member) {
      throw new NotFoundException('Organization not found or access denied');
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Organization not found');
    }

    return {
      ...this.mapToResponse(data),
      role: member.role,
    };
  }

  async update(id: string, dto: UpdateOrganizationDto, userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Check admin role
    const { data: member } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', id)
      .eq('user_id', userId)
      .single();

    if (!member || member.role !== 'admin') {
      throw new NotFoundException(
        'Organization not found or insufficient permissions',
      );
    }

    const { data, error } = await supabase
      .from('organizations')
      .update({
        name: dto.name,
        updated_at: new Date().toISOString(),
      })
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

    // Check membership before exposing member list
    const { data: membership } = await supabase
      .from('org_members')
      .select('id')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
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
      createdAt: org.created_at,
      updatedAt: org.updated_at,
    };
  }
}
