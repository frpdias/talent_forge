import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  AddTenantUserDto,
  CreateApiKeyDto,
  CreatePermissionDto,
  CreatePolicyDto,
  CreateRoleDto,
  CreateTenantDto,
  UpdateTenantUserDto,
} from './dto';
import crypto from 'crypto';

@Injectable()
export class IamService {
  constructor(private supabaseService: SupabaseService) {}

  async listTenants(userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Após consolidação: tenant_users → org_members, tenants → organizations
    const { data, error } = await supabase
      .from('org_members')
      .select('role, status, organizations!org_members_org_id_fkey(id, name, status, plan_id, created_at, updated_at)')
      .eq('user_id', userId);

    if (error) throw error;

    return (data || []).map((row: any) => ({
      tenant: row.organizations,
      role: row.role,
      status: row.status,
    }));
  }

  async createTenant(dto: CreateTenantDto, userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Após consolidação: tenants → organizations
    const { data: tenant, error } = await supabase
      .from('organizations')
      .insert({
        name: dto.name,
        plan_id: dto.planId || null,
      })
      .select()
      .single();

    if (error) throw error;

    // tenant_users → org_members
    const { error: memberError } = await supabase.from('org_members').insert({
      org_id: tenant.id,
      user_id: userId,
      role: 'admin', // owner → admin após consolidação
      status: 'active',
    });

    if (memberError) throw memberError;

    return tenant;
  }

  async getTenant(tenantId: string, userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Após consolidação: tenant_users → org_members
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', tenantId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership) {
      throw new NotFoundException('Tenant not found or access denied');
    }

    // tenants → organizations
    const { data: tenant, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error || !tenant) throw new NotFoundException('Tenant not found');

    return { tenant, role: membership.role };
  }

  async addTenantUser(tenantId: string, dto: AddTenantUserDto, userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Após consolidação: tenant_users → org_members
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', tenantId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership || !['admin', 'manager'].includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
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

    if (error) throw error;

    return data;
  }

  async updateTenantUser(tenantId: string, targetUserId: string, dto: UpdateTenantUserDto, userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    // Após consolidação: tenant_users → org_members
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', tenantId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership || !['admin', 'manager'].includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
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

    if (error) throw error;

    return data;
  }

  async listRoles() {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase.from('roles').select('*');
    if (error) throw error;
    return data;
  }

  async createRole(dto: CreateRoleDto) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('roles')
      .insert({
        name: dto.name,
        scope: dto.scope || 'tenant',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async listPermissions() {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase.from('permissions').select('*');
    if (error) throw error;
    return data;
  }

  async createPermission(dto: CreatePermissionDto) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('permissions')
      .insert({
        action: dto.action,
        resource: dto.resource,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async createPolicy(dto: CreatePolicyDto) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('policies')
      .insert({
        effect: dto.effect || 'allow',
        conditions: dto.conditions,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async listAuditLogs(tenantId?: string) {
    const supabase = this.supabaseService.getAdminClient();
    let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async listSecurityEvents(tenantId?: string) {
    const supabase = this.supabaseService.getAdminClient();
    let query = supabase.from('security_events').select('*').order('created_at', { ascending: false }).limit(200);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async createApiKey(dto: CreateApiKeyDto) {
    const supabase = this.supabaseService.getAdminClient();
    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

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

    if (error) throw error;

    return {
      apiKey: rawKey,
      record: data,
    };
  }

  async deleteApiKey(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { error } = await supabase.from('api_keys').delete().eq('id', id);
    if (error) throw error;
    return { deleted: true };
  }
}
