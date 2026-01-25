import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { randomBytes } from 'crypto';

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

  async getGoogleCalendarAuthUrl(userId: string) {
    const clientId = this.configService.get<string>('GOOGLE_CALENDAR_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GOOGLE_CALENDAR_REDIRECT_URL');

    if (!clientId || !redirectUri) {
      throw new BadRequestException('Google Calendar credentials not configured');
    }

    const supabase = this.supabaseService.getAdminClient();
    const state = randomBytes(16).toString('hex');

    const { error } = await supabase
      .from('user_profiles')
      .update({ google_calendar_state: state })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
      state,
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    };
  }

  async handleGoogleCalendarCallback(code: string, state: string) {
    const clientId = this.configService.get<string>('GOOGLE_CALENDAR_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CALENDAR_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_CALENDAR_REDIRECT_URL');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Google Calendar credentials not configured');
    }

    const supabase = this.supabaseService.getAdminClient();

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, google_calendar_refresh_token')
      .eq('google_calendar_state', state)
      .single();

    if (profileError || !profile) {
      throw new BadRequestException('Invalid OAuth state');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      throw new BadRequestException(`Google token error: ${errorBody}`);
    }

    const tokenData: any = await tokenResponse.json();
    const accessToken = tokenData.access_token || null;
    const refreshToken = tokenData.refresh_token || profile.google_calendar_refresh_token || null;
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    let calendarEmail: string | null = null;
    if (accessToken) {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userInfoResponse.ok) {
        const info = await userInfoResponse.json();
        calendarEmail = info.email || null;
      }
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        google_calendar_refresh_token: refreshToken,
        google_calendar_access_token: accessToken,
        google_calendar_token_expires_at: expiresAt,
        google_calendar_email: calendarEmail,
        google_calendar_connected: Boolean(refreshToken || accessToken),
        google_calendar_connected_at: new Date().toISOString(),
        google_calendar_state: null,
      })
      .eq('id', profile.id);

    if (updateError) {
      throw updateError;
    }

    return { connected: true, email: calendarEmail };
  }

  async getGoogleCalendarStatus(userId: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('google_calendar_connected, google_calendar_email')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { connected: false };
    }

    return {
      connected: Boolean(data.google_calendar_connected),
      email: data.google_calendar_email || null,
    };
  }

  async disconnectGoogleCalendar(userId: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { error } = await supabase
      .from('user_profiles')
      .update({
        google_calendar_refresh_token: null,
        google_calendar_access_token: null,
        google_calendar_token_expires_at: null,
        google_calendar_email: null,
        google_calendar_connected: false,
        google_calendar_connected_at: null,
        google_calendar_state: null,
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { connected: false };
  }
}
