import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

export interface JwtPayload {
  sub: string;
  email?: string;
  aud?: string;
  role?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  async validateToken(token: string): Promise<JwtPayload | null> {
    try {
      const supabase = this.supabaseService.getClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return null;
      }

      return {
        sub: user.id,
        email: user.email,
        aud: user.aud,
        role: user.role,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
      };
    } catch {
      return null;
    }
  }

  async getUserOrganizations(userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('org_members')
      .select(
        `
        org_id,
        role,
        organizations (
          id,
          name,
          org_type,
          slug
        )
      `,
      )
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return data;
  }

  async isOrgMember(userId: string, orgId: string): Promise<boolean> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('org_members')
      .select('id')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  }

  async getOrgMemberRole(
    userId: string,
    orgId: string,
  ): Promise<string | null> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('org_members')
      .select('role')
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.role;
  }
}
