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
export declare class AuthService {
    private supabaseService;
    private configService;
    constructor(supabaseService: SupabaseService, configService: ConfigService);
    validateToken(token: string): Promise<JwtPayload | null>;
    getUserOrganizations(userId: string): Promise<{
        org_id: any;
        role: any;
        organizations: {
            id: any;
            name: any;
            org_type: any;
            slug: any;
        }[];
    }[]>;
    isOrgMember(userId: string, orgId: string): Promise<boolean>;
    getOrgMemberRole(userId: string, orgId: string): Promise<string | null>;
    getGoogleCalendarAuthUrl(userId: string): Promise<{
        url: string;
    }>;
    handleGoogleCalendarCallback(code: string, state: string): Promise<{
        connected: boolean;
        email: string | null;
    }>;
    getGoogleCalendarStatus(userId: string): Promise<{
        connected: boolean;
        email?: undefined;
    } | {
        connected: boolean;
        email: any;
    }>;
    disconnectGoogleCalendar(userId: string): Promise<{
        connected: boolean;
    }>;
}
