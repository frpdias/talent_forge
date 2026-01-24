import { SupabaseService } from '../supabase/supabase.service';
import { CreateCandidateFromInviteDto, CreateCandidateAccountFromInviteDto, CreateInviteLinkDto } from './dto';
export declare class InviteLinksService {
    private supabaseService;
    constructor(supabaseService: SupabaseService);
    private generateToken;
    createInviteLink(orgId: string, userId: string, dto: CreateInviteLinkDto): Promise<{
        id: any;
        orgId: any;
        token: any;
        expiresAt: any;
        maxUses: any;
        usesCount: any;
        isActive: any;
    }>;
    validateInviteToken(token: string): Promise<{
        valid: boolean;
        reason: string;
        orgId?: undefined;
        orgName?: undefined;
        expiresAt?: undefined;
        maxUses?: undefined;
        usesCount?: undefined;
        token?: undefined;
    } | {
        valid: boolean;
        orgId: string;
        orgName: string | null;
        expiresAt: string | null;
        maxUses: number | null;
        usesCount: number;
        token: string;
        reason?: undefined;
    }>;
    createCandidateFromInvite(token: string, dto: CreateCandidateFromInviteDto): Promise<{
        id: any;
        orgId: any;
        fullName: any;
        email: any;
        createdAt: any;
    }>;
    createCandidateAccountFromInvite(token: string, dto: CreateCandidateAccountFromInviteDto): Promise<{
        id: any;
        userId: string;
        orgId: any;
        fullName: any;
        email: any;
        createdAt: any;
    }>;
}
