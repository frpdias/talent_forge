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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_service_1 = require("../supabase/supabase.service");
const crypto_1 = require("crypto");
let AuthService = class AuthService {
    constructor(supabaseService, configService) {
        this.supabaseService = supabaseService;
        this.configService = configService;
    }
    async validateToken(token) {
        try {
            const supabase = this.supabaseService.getClient();
            const { data: { user }, error, } = await supabase.auth.getUser(token);
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
        }
        catch {
            return null;
        }
    }
    async getUserOrganizations(userId) {
        const supabase = this.supabaseService.getAdminClient();
        const { data, error } = await supabase
            .from('org_members')
            .select(`
        org_id,
        role,
        organizations (
          id,
          name,
          org_type,
          slug
        )
      `)
            .eq('user_id', userId);
        if (error) {
            throw error;
        }
        return data;
    }
    async isOrgMember(userId, orgId) {
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
    async getOrgMemberRole(userId, orgId) {
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
    async getGoogleCalendarAuthUrl(userId) {
        const clientId = this.configService.get('GOOGLE_CALENDAR_CLIENT_ID');
        const redirectUri = this.configService.get('GOOGLE_CALENDAR_REDIRECT_URL');
        if (!clientId || !redirectUri) {
            throw new common_1.BadRequestException('Google Calendar credentials not configured');
        }
        const supabase = this.supabaseService.getAdminClient();
        const state = (0, crypto_1.randomBytes)(16).toString('hex');
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
    async handleGoogleCalendarCallback(code, state) {
        const clientId = this.configService.get('GOOGLE_CALENDAR_CLIENT_ID');
        const clientSecret = this.configService.get('GOOGLE_CALENDAR_CLIENT_SECRET');
        const redirectUri = this.configService.get('GOOGLE_CALENDAR_REDIRECT_URL');
        if (!clientId || !clientSecret || !redirectUri) {
            throw new common_1.BadRequestException('Google Calendar credentials not configured');
        }
        const supabase = this.supabaseService.getAdminClient();
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('id, google_calendar_refresh_token')
            .eq('google_calendar_state', state)
            .single();
        if (profileError || !profile) {
            throw new common_1.BadRequestException('Invalid OAuth state');
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
            throw new common_1.BadRequestException(`Google token error: ${errorBody}`);
        }
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token || null;
        const refreshToken = tokenData.refresh_token || profile.google_calendar_refresh_token || null;
        const expiresAt = tokenData.expires_in
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null;
        let calendarEmail = null;
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
    async getGoogleCalendarStatus(userId) {
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
    async disconnectGoogleCalendar(userId) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map